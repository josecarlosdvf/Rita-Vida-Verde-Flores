import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { storeService } from '../lib/storeService';
import { Product, Settings } from '../types';
import { cn } from '../lib/utils';

function normalizeCategory(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const unsubscribeProducts = storeService.subscribe<Product>('products', (data) => {
      setProducts(data.filter(p => p.active));
    });
    
    const unsubscribeSettings = storeService.subscribe<Settings>('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSettings();
    };
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return cats as string[];
  }, [products]);

  useEffect(() => {
    const urlCategory = searchParams.get('cat');
    if (!urlCategory) {
      setActiveCategory('all');
      return;
    }

    const matchedCategory = categories.find((category) => normalizeCategory(category) === normalizeCategory(urlCategory));
    setActiveCategory(matchedCategory || 'all');
  }, [searchParams, categories]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || normalizeCategory(p.category || '') === normalizeCategory(activeCategory);
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else result.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
      return tb - ta;
    });

    return result;
  }, [products, searchTerm, activeCategory, sortBy]);

  const hasActiveFilters = searchTerm || activeCategory !== 'all';

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[#fcf9f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <span className="text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-4 block">Loja Online</span>
          <h1 className="text-5xl md:text-6xl font-serif text-primary-dark leading-tight">Nossa <span className="italic">Coleção</span></h1>
          <p className="text-gray-500 max-w-xl mt-4 leading-relaxed font-serif italic text-lg">
            Explore nossa seleção exclusiva de flores frescas, arranjos artesanais e plantas ornamentais.
          </p>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nome ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-13 pr-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none shadow-sm transition-all text-gray-700 font-medium"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-5 py-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Ordenar por</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-primary-dark cursor-pointer uppercase tracking-widest"
            >
              <option value="newest">Lançamentos</option>
              <option value="price-low">Menor Preço</option>
              <option value="price-high">Maior Preço</option>
              <option value="rating">Mais Avaliados</option>
            </select>
          </div>
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('cat');
                  return next;
                });
              }}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                activeCategory === 'all'
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-primary hover:text-primary'
              )}
            >
              Todos ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('cat', normalizeCategory(cat));
                    return next;
                  });
                }}
                className={cn(
                  "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                  activeCategory === cat
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-primary hover:text-primary'
                )}
              >
                {cat} ({products.filter(p => p.category === cat).length})
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <p className="text-sm text-gray-400 font-medium">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('all');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('cat');
                  return next;
                });
              }}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
            >
              <X size={12} />
              Limpar filtros
            </button>
          )}
        </div>

        {/* Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-16">
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
            <p className="text-gray-400 mb-10 font-medium tracking-wide">Tente ajustar sua busca ou filtros.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('all');
                setSortBy('newest');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('cat');
                  return next;
                });
              }}
              className="px-10 py-4 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
            >
              Reiniciar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
