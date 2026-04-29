import React from 'react';
import { Phone, ShoppingBag, Star, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, Settings } from '../types';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';
import { useCart } from '../hooks/useCart';

interface ProductCardProps {
  product: Product;
  settings?: Settings | null;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, settings }) => {
  const { addToCart } = useCart();
  
  const whatsappUrl = `https://wa.me/${settings?.whatsappNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá, tenho interesse no produto: ${product.name}\nPreço: ${formatPrice(product.price)}`
  )}`;

  const isNew = product.createdAt && (Date.now() - new Date(product.createdAt as any).getTime()) < 1000 * 60 * 60 * 24 * 14;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group cursor-pointer"
    >
      {/* Image container */}
      <div className="aspect-[4/5] bg-[#fdfaf8] rounded-3xl mb-5 relative overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-gray-100">
        <Link to={`/produto/${product.slug}`} className="absolute inset-0 block">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
          />
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        {(product.discountPercent || product.discountPrice) && (() => {
          const pct = product.discountPercent
            ? product.discountPercent
            : product.discountPrice && product.price > product.discountPrice
              ? Math.round((1 - product.discountPrice / product.price) * 100)
              : null;
          return pct ? (
            <div className="absolute top-0 right-0 overflow-hidden w-28 h-28 pointer-events-none z-20">
              <div className="absolute top-5 right-[-26px] w-[132px] bg-gradient-to-r from-red-500 to-orange-500 text-white text-center text-[10px] font-black uppercase tracking-wide shadow-lg rotate-45 py-1.5">
                -{pct}% OFF
              </div>
            </div>
          ) : null;
        })()}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">

          {product.featured && (
            <span className="px-3 py-1 bg-primary text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-md">
              Destaque
            </span>
          )}
          {isNew && !product.featured && (
            <span className="px-3 py-1 bg-accent text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-md">
              Novo
            </span>
          )}
          {product.category && (
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-primary text-[9px] font-bold uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1">
              <Tag size={9} />
              {product.category}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-400">
          <button 
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-xl text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest active:scale-95"
            title="Adicionar ao Carrinho"
          >
            <ShoppingBag size={14} />
            Carrinho
          </button>
          
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all active:scale-95"
            title="Comprar via WhatsApp"
          >
            <Phone size={16} />
          </a>
        </div>
      </div>
      
      {/* Info */}
      <Link to={`/produto/${product.slug}`} className="block px-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="font-serif italic text-primary-dark text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</h4>
          {(product.discountPercent || product.discountPrice) ? (() => {
            const finalPrice = product.discountPercent
              ? product.price * (1 - product.discountPercent / 100)
              : product.discountPrice!;
            return (
              <div className="flex flex-col items-end shrink-0">
                <span className="line-through text-gray-400 text-xs">{formatPrice(product.price)}</span>
                <span className="text-red-600 font-bold text-base">{formatPrice(finalPrice)}</span>
              </div>
            );
          })() : (
            <p className="text-primary font-bold text-base shrink-0">{formatPrice(product.price)}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          {product.rating && product.rating > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex text-accent">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={10} fill={s <= Math.round(product.rating!) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {product.rating.toFixed(1)} {product.reviewsCount ? `(${product.reviewsCount})` : ''}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-300 font-medium italic">Sem avaliações</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
