import React, { useState, useEffect } from 'react';
import BannerCarousel from '../components/BannerCarousel';
import ProductCard from '../components/ProductCard';
import { storeService } from '../lib/storeService';
import { Product, Settings } from '../types';
import { Flower2, Truck, Leaf, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    // Top 4 featured products
    const unsubscribeProducts = storeService.subscribe<Product>('products', (data) => {
      setProducts(data.filter(p => p.active).slice(0, 4));
    });
    
    const unsubscribeSettings = storeService.subscribe<Settings>('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSettings();
    };
  }, []);

  const features = [
    { icon: <Flower2 size={32} />, title: 'Frescor Garantido', desc: 'Flores colhidas diariamente para maior durabilidade.' },
    { icon: <Truck size={32} />, title: 'Entrega Rápida', desc: 'Entregamos no mesmo dia para toda a região metropolitana.' },
    { icon: <Leaf size={32} />, title: 'Arranjos Premium', desc: 'Designs exclusivos criados por floristas especialistas.' },
    { icon: <ShieldCheck size={32} />, title: 'Compra Segura', desc: 'Seu pedido garantido do plantio até a sua porta.' },
  ];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <BannerCarousel />

      {/* Features */}
      <section className="py-24 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {features.map((f, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex p-5 rounded-full text-primary mb-6 transition-all duration-500 bg-[#fcf9f7] border border-gray-100 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20">
                  {f.icon}
                </div>
                <h3 className="text-lg font-serif italic text-primary-dark mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-[#fcf9f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-3 block">Recomendados</span>
              <h2 className="text-4xl md:text-5xl font-serif text-primary-dark">Destaques da <span className="italic">Semana</span></h2>
            </div>
            <Link to="/catalogo" className="group text-primary font-bold text-xs uppercase tracking-[0.2em] border-b-2 border-primary/20 hover:border-primary transition-all pb-1 flex items-center gap-2">
              Ver catálogo completo
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} settings={settings} />
            ))}
          </div>
          
          {products.length === 0 && (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 italic font-serif">Nossos floristas estão preparando novidades...</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#fcf9f7] hidden lg:block" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 relative">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1519336367661-eba9c1dfa5a9?auto=format&fit=crop&q=80&w=800" 
                  alt="Nossa boutique"
                  className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100"
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary rounded-full flex flex-col items-center justify-center text-white text-center p-4 shadow-2xl hidden md:flex border-8 border-white">
                <span className="text-4xl font-serif italic mb-1">28+</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">Anos de Histórias</span>
              </div>
            </div>
            <div className="lg:w-1/2">
              <span className="text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-4 block">Manifesto de Elegância</span>
              <h2 className="text-4xl md:text-6xl font-serif text-primary-dark mb-8 leading-[1.2]">
                Cultivando a <span className="italic">beleza</span> em cada detalhe.
              </h2>
              <p className="text-gray-600 text-lg mb-10 leading-relaxed font-serif italic">
                "Nascemos do amor pelas flores e do desejo de levar frescor para a vida das pessoas. Nossa curadoria é rigorosa: cada pétala é selecionada para garantir um presente impecável."
              </p>
              <div className="flex flex-wrap gap-12 mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-primary border border-gray-100">
                    <Leaf size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">100% Orgânico</h4>
                    <p className="text-xs text-gray-400 font-medium">Cultivo Sustentável</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-primary border border-gray-100">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Qualidade Premium</h4>
                    <p className="text-xs text-gray-400 font-medium">Inspeção Rigorosa</p>
                  </div>
                </div>
              </div>
              <Link to="/catalogo" className="inline-block px-12 py-5 bg-primary-dark text-white rounded-full text-xs font-bold tracking-[0.3em] uppercase hover:bg-black transition-all shadow-2xl shadow-black/20">
                Explore a Coleção
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-24 bg-[#fcf9f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center">
              <span className="text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-4 block">Boutique & Atelier</span>
              <h2 className="text-4xl font-serif text-primary-dark mb-12">Entre em <span className="italic">Contato</span></h2>
              
              <div className="space-y-12">
                <div className="flex gap-6">
                  <div className="text-primary mt-1"><Flower2 size={24} /></div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Visite-nos</h4>
                    <p className="text-gray-900 font-serif italic text-xl">
                      {settings?.address || 'Av. das Flores, 1234 - Jardim Botânico\nSão Paulo, SP'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="text-primary mt-1"><Truck size={24} /></div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Conversar agora</h4>
                    <p className="text-primary-dark font-serif italic text-3xl">
                      {settings?.whatsappNumber || '(11) 98765-4321'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 h-[500px] lg:h-auto">
              {settings?.googleMapsEmbed ? (
                <div dangerouslySetInnerHTML={{ __html: settings.googleMapsEmbed }} className="w-full h-full grayscale-[50%] hover:grayscale-0 transition-all duration-1000" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center italic text-gray-300 font-serif">
                  Mapa em manutenção...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
