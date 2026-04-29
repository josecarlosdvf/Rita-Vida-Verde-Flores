import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowDownWideNarrow } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { storeService } from '../lib/storeService';
import { Product, Settings } from '../types';

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const unsubscribeProducts = storeService.subscribe<Product>('products', (data) => {
      const activeOnes = data.filter(p => p.active);
      setProducts(activeOnes);
      setFilteredProducts(activeOnes);
    });
    
    const unsubscribeSettings = storeService.subscribe<Settings>('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    let result = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // @ts-ignore
      result.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    }

    setFilteredProducts(result);
  }, [searchTerm, products, sortBy]);

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[#fcf9f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-20">
          <span className="text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-4 block">Loja Online</span>
          <h1 className="text-5xl md:text-6xl font-serif text-primary-dark leading-tight">Nossa <span className="italic">Coleção</span></h1>
          <p className="text-gray-500 max-w-xl mt-6 leading-relaxed font-serif italic text-lg">
            Explore nossa seleção exclusiva de flores frescas, arranjos artesanais e plantas ornamentais para todas as ocasiões.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-8 mb-16 items-center justify-between border-b border-gray-100 pb-12">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nome ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none shadow-sm transition-all text-gray-700 font-medium"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-gray-100 shadow-sm transition-all focus-within:border-primary">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ordenar</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-primary-dark cursor-pointer uppercase tracking-widest"
              >
                <option value="newest">Lançamentos</option>
                <option value="price-low">Menor Preço</option>
                <option value="price-high">Maior Preço</option>
              </select>
            </div>
            
            <button className="flex items-center gap-3 px-8 py-3 bg-white border border-gray-100 rounded-full shadow-sm text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-primary-dark hover:border-primary transition-all">
              <SlidersHorizontal size={14} />
              Filtros
            </button>
          </div>
        </div>

        {/* Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-20">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} settings={settings} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40">
            <div className="inline-flex p-8 rounded-full bg-white border border-gray-100 text-gray-200 mb-8 shadow-sm">
              <Search size={48} />
            </div>
            <h3 className="text-2xl font-serif text-primary-dark mb-3 italic">Nenhum resultado encontrado</h3>
            <p className="text-gray-400 mb-10 font-medium tracking-wide">Tente ajustar sua busca ou termos de pesquisa.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSortBy('newest'); }}
              className="px-10 py-4 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
            >
              Reiniciar Coleção
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
