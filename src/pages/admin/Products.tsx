import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink,
  X,
  Loader2,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Tag
} from 'lucide-react';
import { storeService } from '../../lib/storeService';
import { Product } from '../../types';
import { formatPrice, generateSlug, cn } from '../../lib/utils';
import DataTable from '../../components/DataTable';
import { useDropzone } from 'react-dropzone';

const MAX_IMAGE_DIMENSION = 1600;
const MAX_IMAGE_SIZE_BYTES = 1_600_000;

function estimateDataUrlSize(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.ceil((base64.length * 3) / 4);
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
    image.src = dataUrl;
  });
}

async function compressImageDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) return dataUrl;
  if (estimateDataUrlSize(dataUrl) <= MAX_IMAGE_SIZE_BYTES) return dataUrl;

  const image = await loadImage(dataUrl);
  const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return dataUrl;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.86;
  let compressed = canvas.toDataURL('image/jpeg', quality);

  while (estimateDataUrlSize(compressed) > MAX_IMAGE_SIZE_BYTES && quality > 0.45) {
    quality -= 0.08;
    compressed = canvas.toDataURL('image/jpeg', quality);
  }

  return compressed;
}

export default function Products() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    active: true,
    slug: '',
    discountPercent: null as number | null,
    discountPrice: null as number | null,
  });
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [promoMode, setPromoMode] = useState<'none' | 'percent' | 'price'>('none');
  const [newCategory, setNewCategory] = useState('');
  const [lastAutoOpenedId, setLastAutoOpenedId] = useState<string | null>(null);

  const defaultCategories = ['Plantas', 'Arranjos', 'Buquês', 'Rosas', 'Suculentas', 'Orquídeas', 'Presentes'];

  const availableCategories = useMemo(() => {
    const fromProducts = products.map((item) => item.category).filter(Boolean) as string[];
    return Array.from(new Set([...defaultCategories, ...fromProducts])).sort((a, b) => a.localeCompare(b));
  }, [products]);

  useEffect(() => {
    return storeService.subscribe<Product>('products', (data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const openEditor = (item: Product) => {
    setEditingProduct(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      active: item.active,
      slug: item.slug,
      category: item.category || '',
      discountPercent: item.discountPercent ?? null,
      discountPrice: item.discountPrice ?? null,
    });
    setNewCategory('');
    setPromoMode(item.discountPercent ? 'percent' : item.discountPrice ? 'price' : 'none');
    setIsModalOpen(true);
  };

  useEffect(() => {
    const editId = new URLSearchParams(location.search).get('edit');
    if (!editId || !products.length || editId === lastAutoOpenedId) return;
    const target = products.find((item) => item.id === editId);
    if (target) {
      openEditor(target);
      setLastAutoOpenedId(editId);
    }
  }, [location.search, products, lastAutoOpenedId]);

  const resetForm = () => {
    setFormData({ name: '', description: '', price: 0, imageUrl: '', active: true, slug: '', category: '', discountPercent: null, discountPrice: null });
    setEditingProduct(null);
    setPromoMode('none');
    setNewCategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const imageUrl = formData.imageUrl
        ? await compressImageDataUrl(formData.imageUrl)
        : '';
      const finalDiscount = promoMode === 'percent'
        ? { discountPercent: formData.discountPercent, discountPrice: null }
        : promoMode === 'price'
        ? { discountPercent: null, discountPrice: formData.discountPrice }
        : { discountPercent: null, discountPrice: null };
      const data = { ...formData, imageUrl, ...finalDiscount, slug: formData.slug || generateSlug(formData.name) };
      if (editingProduct) {
        await storeService.update('products', editingProduct.id, data);
      } else {
        await storeService.create('products', data);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await storeService.delete('products', id);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const imageUrl = await compressImageDataUrl(reader.result as string);
      setFormData((prev) => ({ ...prev, imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false 
  } as any);

  const handleGenerateText = async () => {
    if (!formData.name.trim()) return alert('Preencha o nome do produto primeiro.');
    setGeneratingText(true);
    try {
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('floricultura_token')}`,
        },
        body: JSON.stringify({ productName: formData.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar texto');
      setFormData(prev => ({
        ...prev,
        description: data.description || prev.description,
        slug: data.slug || prev.slug,
      }));
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar texto com IA');
    } finally {
      setGeneratingText(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.name.trim()) return alert('Preencha o nome do produto primeiro.');
    setGeneratingImage(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('floricultura_token')}`,
        },
        body: JSON.stringify({ productName: formData.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar imagem');
      const imageUrl = await compressImageDataUrl(data.imageData);
      setFormData(prev => ({ ...prev, imageUrl }));
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar imagem com IA');
    } finally {
      setGeneratingImage(false);
    }
  };

  const columns: any[] = [
    { 
      header: 'Produto', 
      accessorKey: 'name',
      cell: (val: string, item: Product) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 shadow-sm">
            <img src={item.imageUrl} alt={val} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-gray-900">{val}</div>
            <div className="text-xs text-gray-400 font-mono">/{item.slug}</div>
          </div>
        </div>
      ),
      groupable: true
    },
    { 
      header: 'Preço', 
      accessorKey: 'price',
      cell: (val: number, item: Product) => {
        const pct = item.discountPercent;
        const dp = item.discountPrice;
        if (pct && pct > 0) {
          const final = val * (1 - pct / 100);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="line-through text-xs text-gray-400 font-mono">{formatPrice(val)}</span>
              <span className="font-mono font-bold text-red-600">{formatPrice(final)}</span>
              <span className="inline-flex w-fit px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">-{pct}%</span>
            </div>
          );
        }
        if (dp && dp > 0 && dp < val) {
          const calc = Math.round((1 - dp / val) * 100);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="line-through text-xs text-gray-400 font-mono">{formatPrice(val)}</span>
              <span className="font-mono font-bold text-red-600">{formatPrice(dp)}</span>
              <span className="inline-flex w-fit px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">-{calc}%</span>
            </div>
          );
        }
        return <span className="font-mono font-bold text-gray-900">{formatPrice(val)}</span>;
      }
    },
    { 
      header: 'Status', 
      accessorKey: 'active',
      cell: (val: boolean) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {val ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
    { 
      header: 'Ações', 
      accessorKey: 'id',
      cell: (val: string, item: Product) => (
        <div className="flex justify-end gap-2">
          <Link to={`/produto/${item.slug}`} target="_blank" className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors">
            <ExternalLink size={18} />
          </Link>
          <button 
            onClick={() => { 
              setEditingProduct(item); 
              openEditor(item);
            }}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => handleDelete(val)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 italic">Gerenciar Produtos</h1>
          <p className="text-gray-500">Adicione, edite ou remova flores e arranjos do seu catálogo.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <DataTable 
        title="Todos os Produtos"
        data={products}
        columns={columns}
        isLoading={loading}
      />

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-serif font-bold text-gray-900 italic">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Nome do Produto</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Preço (R$)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Categoria</label>
                    <div className="flex gap-2">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '__new__') {
                            setNewCategory('');
                            return;
                          }
                          setFormData({ ...formData, category: value });
                        }}
                        className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="">Selecione uma categoria</option>
                        {availableCategories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                        <option value="__new__">Adicionar nova categoria...</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Nova categoria"
                        className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCategory.trim()) return;
                          setFormData({ ...formData, category: newCategory.trim() });
                          setNewCategory('');
                        }}
                        className="px-4 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Link Amigável (Slug)</label>
                      <button
                        type="button"
                        onClick={handleGenerateText}
                        disabled={generatingText || !formData.name.trim()}
                        title={!formData.name.trim() ? 'Preencha o nome do produto primeiro' : 'Gerar slug e descrição com IA'}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {generatingText ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {generatingText ? 'Gerando...' : 'Gerar com IA'}
                      </button>
                    </div>
                    <input 
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                      placeholder="ex: rosa-vermelha-premium"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Imagem do Produto</label>
                      <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60"
                      >
                        {generatingImage ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {generatingImage ? 'Gerando...' : 'Gerar com IA'}
                      </button>
                    </div>
                    <div 
                      {...getRootProps()} 
                      className={cn(
                        "aspect-square border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all p-4 group",
                        formData.imageUrl ? "border-pink-500 bg-pink-50/10" : "border-gray-200 hover:border-pink-400 hover:bg-pink-50/30"
                      )}
                    >
                      <input {...getInputProps()} />
                      {generatingImage ? (
                        <div className="flex flex-col items-center gap-3 text-violet-500">
                          <Loader2 size={40} className="animate-spin" />
                          <p className="text-xs font-bold uppercase tracking-widest">Gerando com Gemini...</p>
                        </div>
                      ) : formData.imageUrl ? (
                        <div className="relative w-full h-full">
                          <img src={formData.imageUrl} className="w-full h-full object-cover rounded-2xl" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <Upload className="text-white" size={32} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-4 group-hover:text-pink-500 group-hover:bg-white transition-all">
                            <ImageIcon size={32} />
                          </div>
                          <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest">Arraste ou clique para enviar</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Descrição</label>
                <textarea 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                />
              </div>

              <div className="space-y-4 p-5 border-2 border-dashed border-orange-200 rounded-2xl bg-orange-50/40">
                <div className="flex items-center gap-3">
                  <Tag size={16} className="text-orange-500" />
                  <span className="text-sm font-bold text-gray-700">Promoção / Desconto</span>
                  <div className="flex gap-2 ml-auto flex-wrap justify-end">
                    {(['none', 'percent', 'price'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPromoMode(mode)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors',
                          promoMode === mode ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                        )}
                      >
                        {mode === 'none' ? 'Sem promoção' : mode === 'percent' ? '% Desconto' : 'Preço final'}
                      </button>
                    ))}
                  </div>
                </div>

                {promoMode === 'percent' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600">Percentual de desconto (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={formData.discountPercent ?? ''}
                        onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || null, discountPrice: null })}
                        placeholder="ex: 15"
                        className="w-full px-5 py-4 bg-white border border-orange-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div className="p-4 bg-white border border-green-200 rounded-2xl">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Preço promocional</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatPrice(formData.price * (1 - ((formData.discountPercent ?? 0) / 100)))}
                      </p>
                    </div>
                  </div>
                )}

                {promoMode === 'price' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600">Preço promocional (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discountPrice ?? ''}
                        onChange={(e) => setFormData({ ...formData, discountPrice: parseFloat(e.target.value) || null, discountPercent: null })}
                        placeholder="ex: 89.90"
                        className="w-full px-5 py-4 bg-white border border-orange-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div className="p-4 bg-white border border-green-200 rounded-2xl">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Desconto calculado</p>
                      <p className="text-lg font-bold text-green-700">
                        {formData.discountPrice && formData.discountPrice < formData.price
                          ? `${Math.round((1 - formData.discountPrice / formData.price) * 100)}% OFF`
                          : 'Defina um valor menor que o preço original'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div 
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                    formData.active ? "bg-green-500" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    formData.active ? "left-7" : "left-1"
                  )} />
                </div>
                <span className="text-sm font-bold text-gray-700">Produto Visível no Site</span>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-grow py-5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-5 border-2 border-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
