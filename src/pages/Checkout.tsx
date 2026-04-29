import React, { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { formatPrice, cn } from '../lib/utils';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storeService } from '../lib/storeService';
import { Settings, OrderStatus } from '../types';

interface ViaCepResult {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export default function Checkout() {
  const { cart, totalItems, totalPrice, updateQuantity, updateObservation, removeFromCart, clearCart } = useCart();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cepError, setCepError] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<ViaCepResult | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cep: '',
    number: '',
    complement: ''
  });

  useEffect(() => {
    const unsubscribe = storeService.subscribe<Settings>('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
    });
    return unsubscribe;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'cep') {
      setFormData(prev => ({ ...prev, cep: formatCep(value) }));
      setCepError('');
      setResolvedAddress(null);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resolveCep = async (): Promise<ViaCepResult | null> => {
    const cep = onlyDigits(formData.cep);
    if (cep.length !== 8) {
      setCepError('CEP inválido. Informe 8 dígitos.');
      setResolvedAddress(null);
      return null;
    }

    setLoadingCep(true);
    setCepError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!res.ok || data.erro) {
        setCepError('CEP não encontrado no ViaCEP.');
        setResolvedAddress(null);
        return null;
      }
      setResolvedAddress(data as ViaCepResult);
      return data as ViaCepResult;
    } catch {
      setCepError('Não foi possível validar o CEP agora. Tente novamente.');
      setResolvedAddress(null);
      return null;
    } finally {
      setLoadingCep(false);
    }
  };

  const buildAddressText = (address: ViaCepResult) => {
    const base = `${address.logradouro || ''}, ${formData.number || 's/n'} - ${address.bairro || ''}, ${address.localidade || ''}/${address.uf || ''}, CEP ${formData.cep}`;
    return formData.complement?.trim() ? `${base} (Compl.: ${formData.complement.trim()})` : base;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const addressData = resolvedAddress ?? await resolveCep();
    if (!addressData) return;

    const addressText = buildAddressText(addressData);

    setLoading(true);
    try {
      const orderData = {
        customerName: formData.name,
        customerPhone: '',
        customerAddress: addressText,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          observation: item.observation?.trim() || undefined,
        })),
        total: totalPrice,
        status: OrderStatus.PENDING,
      };

      const newOrder = await storeService.create('orders', orderData);
      const orderId = typeof newOrder === 'string' ? newOrder : (newOrder as any)?.id || 'NOVO';
      
      const itemsList = cart
        .map(item => `- ${item.quantity}x ${item.name} (${formatPrice(item.price)})${item.observation?.trim() ? `\n  Obs: ${item.observation.trim()}` : ''}`)
        .join('\n');

      const includeAdminLink = settings?.includeOrderLinkInWhatsapp ?? true;
      const managementLine = includeAdminLink
        ? `\n\nAcompanhar no painel: ${window.location.origin}/admin/pedidos`
        : '';

      const message = `Olá! Me chamo ${formData.name} e gostaria de fazer este pedido 😊\n\nItens escolhidos:\n${itemsList}\n\nEntrega para:\n${addressText}\n\nTotal estimado: ${formatPrice(totalPrice)}\nRef. pedido: #${String(orderId).slice(-6).toUpperCase()}${managementLine}`;
      
      const whatsappUrl = `https://wa.me/${settings?.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      setSuccess(true);
      clearCart();
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error(error);
      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="pt-40 pb-20 bg-[#fcf9f7] min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-8 border border-green-100 shadow-xl shadow-green-500/10">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-serif text-primary-dark mb-4">Pedido Enviado!</h2>
        <p className="text-gray-500 max-w-md text-center font-serif italic mb-10">
          Obrigado por escolher a Floresça. Seu pedido foi recebido e estamos preparando tudo com muito carinho.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/catalogo" className="px-10 py-4 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-dark transition-all">
            Continuar Compras
          </Link>
          <Link to="/" className="px-10 py-4 border border-gray-100 bg-white text-gray-500 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-[#fcf9f7] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <span className="text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-4 block">Finalizar compra</span>
          <h1 className="text-5xl font-serif text-primary-dark leading-tight">Carrinho de <span className="italic">Flores</span></h1>
        </div>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-8">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-6 sm:p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-8">
                  <div className="w-32 h-40 overflow-hidden rounded-[30px] shadow-lg shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-2xl font-serif text-primary-dark mb-2">{item.name}</h3>
                    <p className="text-primary font-serif italic text-xl mb-6">{formatPrice(item.price)}</p>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-6">
                      <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-100">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-primary transition-all shadow-sm"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-primary-dark">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-primary transition-all shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="mt-5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Observações do item</label>
                      <textarea
                        rows={2}
                        value={item.observation || ''}
                        onChange={(e) => updateObservation(item.id, e.target.value)}
                        placeholder="Ex: sem laço, cartão com mensagem curta, embalar para presente..."
                        className="w-full max-w-xl px-5 py-3 bg-gray-50 border border-transparent rounded-3xl focus:bg-white focus:border-primary/20 outline-none transition-all text-sm font-medium resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase font-bold text-gray-300 tracking-widest mb-1">Subtotal</p>
                    <p className="text-2xl font-serif italic text-primary-dark">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Form */}
            <div className="lg:col-span-4">
              <div className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-2xl sticky top-32">
                <h3 className="text-2xl font-serif text-primary-dark mb-10 italic">Resumo do Pedido</h3>
                
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 uppercase font-bold tracking-widest">Subtotal</span>
                    <span className="font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 uppercase font-bold tracking-widest">Entrega</span>
                    <span className="text-accent text-[10px] font-bold uppercase tracking-widest">Sob consulta</span>
                  </div>
                  <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-gray-900 font-bold uppercase tracking-widest">Total</span>
                    <span className="text-3xl font-serif italic text-primary-dark">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Nome Completo</label>
                      <input 
                        required
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-full focus:bg-white focus:border-primary/20 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4 mb-2 block">CEP</label>
                      <input 
                        required
                        type="text" 
                        name="cep"
                        value={formData.cep}
                        onChange={handleInputChange}
                        onBlur={resolveCep}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-full focus:bg-white focus:border-primary/20 outline-none transition-all text-sm font-medium"
                        placeholder="00000-000"
                      />
                      {loadingCep && <p className="text-[10px] text-gray-400 mt-2 ml-4 uppercase tracking-widest font-bold">Validando CEP...</p>}
                      {cepError && <p className="text-xs text-red-500 mt-2 ml-4">{cepError}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Número</label>
                      <input
                        required
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-full focus:bg-white focus:border-primary/20 outline-none transition-all text-sm font-medium"
                        placeholder="Ex: 123"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Complemento (opcional)</label>
                      <input
                        type="text"
                        name="complement"
                        value={formData.complement}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-full focus:bg-white focus:border-primary/20 outline-none transition-all text-sm font-medium"
                        placeholder="Apartamento, bloco, ponto de referência..."
                      />
                    </div>

                    {resolvedAddress && (
                      <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2">Endereço encontrado</p>
                        <p className="text-sm text-green-800">
                          {resolvedAddress.logradouro}, {resolvedAddress.bairro}, {resolvedAddress.localidade}/{resolvedAddress.uf}
                        </p>
                      </div>
                    )}
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full py-5 bg-primary text-white rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        Enviar via WhatsApp
                        <ShoppingBag size={18} />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold leading-relaxed px-4">
                    Ao confirmar, você será redirecionado para o WhatsApp da boutique para alinhar a entrega.
                  </p>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-100 mb-10 border border-gray-50 shadow-sm">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-3xl font-serif text-primary-dark mb-4">Seu carrinho está vazio</h2>
            <p className="text-gray-400 font-serif italic mb-10">Que tal escolher um arranjo especial hoje?</p>
            <Link to="/catalogo" className="px-12 py-5 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-[0.3em] hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">
              Explorar Coleção
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
