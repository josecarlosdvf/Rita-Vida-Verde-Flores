import { Instagram, Facebook, Phone, Mail, MapPin, Flower2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { storeService } from '../../lib/storeService';
import { Settings } from '../../types';

export default function Footer() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const unsubscribe = storeService.subscribe<Settings>('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
    });
    return unsubscribe;
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-dark text-white/70 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 text-white mb-8">
              <Flower2 className="text-accent" size={32} />
              <span className="text-2xl font-serif italic tracking-tight">
                {settings?.companyName || 'Floresça'}
              </span>
            </div>
            <p className="text-sm leading-[1.8] font-medium mb-8">
              Curadoria de flores e plantas com foco em design minimalista e elegância natural. Transformando sentimentos em formas e aromas.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-all">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-[0.3em] mb-8">Explorar</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="/" className="hover:text-accent transition-colors">Início</a></li>
              <li><a href="/catalogo" className="hover:text-accent transition-colors">Catálogo</a></li>
              <li><a href="/#sobre" className="hover:text-accent transition-colors">Nossa História</a></li>
              <li><a href="/#contato" className="hover:text-accent transition-colors">Onde Estamos</a></li>
            </ul>
          </div>

          {/* Services/Categories */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-[0.3em] mb-8">Coleções</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="/catalogo?cat=presente" className="hover:text-accent transition-colors">Presentes</a></li>
              <li><a href="/catalogo?cat=casamento" className="hover:text-accent transition-colors">Eventos</a></li>
              <li><a href="/catalogo?cat=decoracao" className="hover:text-accent transition-colors">Decoração</a></li>
              <li><a href="/catalogo?cat=plantas" className="hover:text-accent transition-colors">Plantas Vivas</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-[0.3em] mb-8">Contato</h4>
            <ul className="space-y-6 text-sm font-medium">
              {settings?.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="text-accent shrink-0" size={18} />
                  <span>{settings.address}</span>
                </li>
              )}
              {settings?.whatsappNumber && (
                <li className="flex items-center gap-3">
                  <Phone className="text-accent shrink-0" size={18} />
                  <span>{settings.whatsappNumber}</span>
                </li>
              )}
              <li className="flex items-center gap-3">
                <Mail className="text-accent shrink-0" size={18} />
                <span>contato@{settings?.companyName?.toLowerCase().replace(/\s/g, '') || 'floresca'}.com.br</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
          <p>© {currentYear} {settings?.companyName || 'Floresça'} Boutique. Handcrafted with passion.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
