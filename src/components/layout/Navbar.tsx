import { Flower, Menu, X, Phone, ShoppingCart, UserRound, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { storeService } from '../../lib/storeService';
import { Settings } from '../../types';
import { useCart } from '../../hooks/useCart';
import { customerAuth } from '../../lib/customerAuth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [customer, setCustomer] = useState(customerAuth.getUser());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Subscribe to settings
    const unsubscribe = storeService.subscribe<Settings>('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const syncCustomer = () => setCustomer(customerAuth.getUser());
    window.addEventListener('storage', syncCustomer);
    window.addEventListener('customer-auth-change', syncCustomer);
    return () => {
      window.removeEventListener('storage', syncCustomer);
      window.removeEventListener('customer-auth-change', syncCustomer);
    };
  }, []);

  const navLinks = [
    { name: 'Início', href: '/' },
    { name: 'Catálogo', href: '/catalogo' },
    { name: 'Sobre Nós', href: '/#sobre' },
    { name: 'Contato', href: '/#contato' },
  ];

  const { totalItems } = useCart();

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <Flower size={18} />
            </div>
            <span className={cn(
              "text-lg font-serif italic tracking-tight transition-colors",
              scrolled ? "text-primary-dark" : "text-primary-dark md:text-white"
            )}>
              {settings?.companyName || 'Floresça'}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-8 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "transition-all duration-200 border-b-2 pb-1",
                    scrolled 
                      ? "text-gray-500 border-transparent hover:text-primary hover:border-primary" 
                      : "text-gray-700 md:text-white/80 border-transparent md:hover:text-white md:hover:border-white"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-6">
              {customer ? (
                <button
                  type="button"
                  onClick={() => customerAuth.clearSession()}
                  className={cn(
                    'flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors',
                    scrolled ? 'text-gray-600 hover:text-primary' : 'text-gray-700 md:text-white/80 md:hover:text-white'
                  )}
                >
                  <LogOut size={16} />
                  {customer.name.split(' ')[0]}
                </button>
              ) : (
                <Link
                  to="/conta"
                  className={cn(
                    'flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors',
                    scrolled ? 'text-gray-600 hover:text-primary' : 'text-gray-700 md:text-white/80 md:hover:text-white'
                  )}
                >
                  <UserRound size={16} />
                  Entrar
                </Link>
              )}

              <Link to="/checkout" className={cn(
                "relative transition-colors",
                scrolled ? "text-gray-600 hover:text-primary" : "text-gray-700 md:text-white/80 md:hover:text-white"
              )}>
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </Link>

              {settings?.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-primary text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                >
                  Contato
                </a>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link to="/conta" className="relative p-2 text-gray-700 hover:text-primary transition-colors">
              <UserRound size={22} />
            </Link>
            <Link to="/checkout" className="relative p-2 text-gray-700 hover:text-primary transition-colors">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 hover:text-primary transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 text-base font-medium text-gray-700 border-b border-gray-50 hover:bg-pink-50 hover:text-pink-500"
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/conta"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-4 text-base font-medium text-gray-700 border-b border-gray-50 hover:bg-pink-50 hover:text-pink-500"
            >
              {customer ? `Minha conta: ${customer.name.split(' ')[0]}` : 'Entrar / Cadastrar'}
            </Link>
            {settings?.whatsappNumber && (
              <div className="mt-4 px-3">
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-green-500 text-white rounded-xl font-medium"
                >
                  <Phone size={20} />
                  Fale Conosco agora
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
