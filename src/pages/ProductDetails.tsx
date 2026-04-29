import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, ChevronLeft, Calendar, ShieldCheck, Heart, Share2, Star, Send, Loader2, ShoppingBag } from 'lucide-react';
import { storeService } from '../lib/storeService';
import { Product, Settings, Review } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { useCart } from '../hooks/useCart';

export default function ProductDetails() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const products = await storeService.list<Product>('products');
        const productData = products.find(p => p.slug === slug && p.active);
        if (productData) {
          setProduct(productData);
          fetchReviews(productData.id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchReviews(productId: string) {
      const allReviews = await storeService.list<Review>('reviews');
      const reviewsData = allReviews.filter(r => r.productId === productId && r.approved);
      setReviews(reviewsData);

      if (reviewsData.length > 0) {
        const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
        setAvgRating(sum / reviewsData.length);
        setTotalReviews(reviewsData.length);
      }
    }

    const unsubscribeSettings = storeService.subscribe<Settings>('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
    });

    fetchProduct();
    return unsubscribeSettings;
  }, [slug]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !customerName || !comment) return;

    setSubmittingReview(true);
    try {
      const reviewData = {
        productId: product.id,
        productName: product.name,
        customerName,
        rating,
        comment,
        approved: false,
      };

      await storeService.create('reviews', reviewData);
      
      // Notify admin via WhatsApp (Open link)
      const message = `🌸 *Nova Avaliação Recebida!*\n\n*Produto:* ${product.name}\n*Cliente:* ${customerName}\n*Nota:* ${rating} ⭐\n*Comentário:* ${comment}\n\nModerar aqui: ${window.location.origin}/admin/avaliacoes`;
      const whatsappUrl = `https://wa.me/${settings?.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      alert('Sua avaliação foi enviada e está aguardando aprovação! Obrigado pelo feedback.');
      window.open(whatsappUrl, '_blank');
      
      setCustomerName('');
      setComment('');
      setRating(5);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="pt-40 pb-20 flex justify-center bg-[#fcf9f7] min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!product) return (
    <div className="pt-40 pb-20 text-center bg-[#fcf9f7] min-h-screen">
      <h2 className="text-2xl font-serif text-primary-dark mb-4">Produto não encontrado</h2>
      <Link to="/catalogo" className="text-primary hover:underline font-medium">Voltar ao catálogo</Link>
    </div>
  );

  const whatsappUrl = `https://wa.me/${settings?.whatsappNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá, tenho interesse no produto: ${product.name}\nPreço: ${formatPrice(product.price)}`
  )}`;

  return (
    <div className="pt-32 pb-24 bg-[#fcf9f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-12 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
          <Link to="/" className="hover:text-primary transition-colors">Início</Link>
          <span className="text-gray-200">/</span>
          <Link to="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link>
          <span className="text-gray-200">/</span>
          <span className="text-primary-dark truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
          {/* Gallery */}
          <div className="relative group">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </div>
            {(product.discountPercent || product.discountPrice) && (() => {
              const pct = product.discountPercent
                ? product.discountPercent
                : product.discountPrice && product.price > product.discountPrice
                  ? Math.round((1 - product.discountPrice / product.price) * 100)
                  : null;
              return pct ? (
                <div className="absolute top-0 right-0 overflow-hidden w-36 h-36 pointer-events-none z-20">
                  <div className="absolute top-7 right-[-32px] w-[168px] bg-gradient-to-r from-red-500 to-orange-500 text-white text-center text-xs font-black uppercase tracking-wide shadow-xl rotate-45 py-2">
                    -{pct}% OFF
                  </div>
                </div>
              ) : null;
            })()}
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              <button className="p-3 bg-white/90 backdrop-blur-md rounded-full text-accent hover:bg-white shadow-xl transition-all hover:scale-110 active:scale-95">
                <Heart size={20} />
              </button>
              <button className="p-3 bg-white/90 backdrop-blur-md rounded-full text-gray-700 hover:bg-white shadow-xl transition-all hover:scale-110 active:scale-95">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-4 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/10">
                  Pronta Entrega
                </span>
                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5 text-accent">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold">{avgRating.toFixed(1)}</span>
                    <span className="text-gray-400 text-[10px] font-medium uppercase tracking-widest">({totalReviews} avaliações)</span>
                  </div>
                )}
              </div>
              
              <h1 className="text-5xl md:text-6xl font-serif text-primary-dark mb-6 leading-tight">
                {product.name}
              </h1>
              
              {(product.discountPercent || product.discountPrice) ? (() => {
                const finalPrice = product.discountPercent
                  ? product.price * (1 - product.discountPercent / 100)
                  : product.discountPrice!;
                const pct = product.discountPercent
                  ?? Math.round((1 - product.discountPrice! / product.price) * 100);
                return (
                  <div className="flex flex-wrap items-baseline gap-4 mb-10">
                    <span className="text-4xl font-serif italic text-red-600">{formatPrice(finalPrice)}</span>
                    <span className="line-through text-2xl text-gray-400 font-serif">{formatPrice(product.price)}</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-black">-{pct}% OFF</span>
                  </div>
                );
              })() : (
                <p className="text-4xl font-serif italic text-primary mb-10">{formatPrice(product.price)}</p>
              )}
              
              <div className="prose prose-stone text-gray-600 text-lg leading-relaxed mb-12 max-w-none font-serif italic">
                {product.description}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className="p-8 bg-white border border-gray-100 rounded-3xl flex items-center gap-5 shadow-sm">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-primary-dark text-xs uppercase tracking-widest">Entrega Hoje</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Pedidos até 14h</p>
                </div>
              </div>
              <div className="p-8 bg-white border border-gray-100 rounded-3xl flex items-center gap-5 shadow-sm">
                <div className="w-12 h-12 bg-accent/5 rounded-2xl flex items-center justify-center text-accent">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-primary-dark text-xs uppercase tracking-widest">Garantia Premium</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Qualidade Floresça</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => addToCart(product)}
                className="flex-grow flex items-center justify-center gap-3 py-5 bg-primary text-white rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 active:scale-95"
              >
                <ShoppingBag size={18} />
                Adicionar ao Carrinho
              </button>
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-white border border-gray-100 text-gray-700 rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
              >
                <Phone size={18} className="text-primary" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 border-t border-gray-100 pt-32">
          <div className="lg:col-span-1">
            <span className="text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-4 block">Feedback</span>
            <h2 className="text-4xl font-serif text-primary-dark mb-8 leading-tight">Voz de quem <br /><span className="italic">Floresce</span></h2>
            
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-50 mb-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl font-serif text-primary-dark">{avgRating.toFixed(1)}</div>
                <div>
                  <div className="flex text-accent gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={16} fill={s <= Math.round(avgRating) ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Média de {totalReviews} notas</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <h3 className="text-lg font-serif italic text-primary-dark">Deixe seu comentário</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Seu nome completo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                />
                <div className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-2xl">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Sua Nota:</span>
                  {[1,2,3,4,5].map(s => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => setRating(s)}
                      className={cn("transition-all active:scale-90", rating >= s ? "text-accent" : "text-gray-200")}
                    >
                      <Star size={20} fill={rating >= s ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  placeholder="Conte sua experiência com este arranjo..."
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={submittingReview}
                className="w-full flex items-center justify-center gap-3 py-4 bg-primary-dark text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10 disabled:opacity-50"
              >
                {submittingReview ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Enviar Avaliação
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-primary-dark">{r.customerName}</h4>
                        <div className="flex text-accent gap-0.5 mt-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={12} fill={s <= r.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                        {r.createdAt?.toDate().toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed font-serif italic">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-50">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                  <Star size={32} />
                </div>
                <p className="font-serif italic text-lg text-gray-400">Seja o primeiro a avaliar este arranjo exclusivo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
