import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storeService } from '../lib/storeService';
import { Banner } from '../types';
import { cn } from '../lib/utils';

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = storeService.subscribe<Banner>('banners', (data) => {
      const activeBanners = data
        .filter(b => b.active)
        .sort((a, b) => a.order - b.order);
      setBanners(activeBanners);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const next = () => setCurrentIndex((currentIndex + 1) % banners.length);
  const prev = () => setCurrentIndex((currentIndex - 1 + banners.length) % banners.length);

  if (banners.length === 0) return null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#fdf2f2]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Subtle Side Background as Design HTML */}
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[#e8f0e6] opacity-30 flex items-center justify-center italic text-[12vw] text-primary/10 pointer-events-none select-none font-serif">
            FLORES
          </div>

          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-20000 scale-105 opacity-60"
            style={{ backgroundImage: `url(${banners[currentIndex].imageUrl})` }}
          />
          
          <div className="absolute inset-0 flex items-center px-10 md:px-20 lg:px-32">
            <div className="max-w-2xl relative z-10">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-accent text-sm font-bold tracking-[0.3em] uppercase mb-4 block"
              >
                Coleção Primavera
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-primary-dark text-6xl md:text-8xl font-serif mb-6 leading-[1.1]"
              >
                Floresça com <br />
                <span className="italic">Elegância</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-gray-600 text-lg md:text-xl max-w-lg mb-10 leading-relaxed"
              >
                Arranjos exclusivos feitos à mão com as flores mais frescas da estação.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Link 
                  to="/catalogo" 
                  className="inline-block px-10 py-4 bg-primary text-white rounded-full text-sm font-bold tracking-widest uppercase shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all transform hover:-translate-y-1"
                >
                  Ver Catálogo
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors hidden md:block"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors hidden md:block"
          >
            <ChevronRight size={32} />
          </button>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-12 h-1 rounded-full transition-all duration-500",
                  currentIndex === idx ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
