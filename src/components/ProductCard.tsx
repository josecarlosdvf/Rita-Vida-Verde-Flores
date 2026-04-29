import React from 'react';
import { Phone, ArrowRight, ShoppingBag, Star } from 'lucide-react';
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
    `Olá, tenho interesse no produto: ${product.name}\nPreço: ${formatPrice(product.price)}\nImagem: ${product.imageUrl}`
  )}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group cursor-pointer"
    >
      <div className="aspect-[4/5] bg-[#fdfaf8] rounded-3xl mb-6 relative overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100">
        <Link to={`/produto/${product.slug}`} className="absolute inset-0">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        </Link>
        
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
          <button 
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl text-primary hover:bg-primary hover:text-white transition-all transform active:scale-95"
            title="Adicionar ao Carrinho"
          >
            <ShoppingBag size={18} />
          </button>
          
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl text-accent hover:bg-accent hover:text-white transition-all transform active:scale-95"
            title="Comprar via WhatsApp"
          >
            <Phone size={18} />
          </a>
        </div>
      </div>
      
      <Link to={`/produto/${product.slug}`} className="block text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h4 className="font-serif italic text-primary-dark text-xl">{product.name}</h4>
          <p className="text-primary font-bold">{formatPrice(product.price)}</p>
        </div>
        
        {product.rating && product.rating > 0 && (
          <div className="flex items-center gap-1 text-accent">
            <Star size={10} fill="currentColor" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{product.rating.toFixed(1)}</span>
          </div>
        )}
      </Link>
    </motion.div>
  );
};

export default ProductCard;
