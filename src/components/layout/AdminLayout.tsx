import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Flower2, 
  Image as ImageIcon, 
  Settings as SettingsIcon, 
  LogOut, 
  User, 
  History,
  Menu,
  X,
  ExternalLink,
  ShoppingBag,
  Star
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../../lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../../types';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setProfile({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
        }
      }
    }
    fetchProfile();
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin' },
    { name: 'Produtos', icon: <Flower2 size={20} />, path: '/admin/produtos' },
    { name: 'Pedidos', icon: <ShoppingBag size={20} />, path: '/admin/pedidos' },
    { name: 'Avaliações', icon: <Star size={20} />, path: '/admin/avaliacoes' },
    { name: 'Banners', icon: <ImageIcon size={20} />, path: '/admin/banners' },
    { name: 'Usuários', icon: <User size={20} />, path: '/admin/usuarios' },
    { name: 'Auditoria', icon: <History size={20} />, path: '/admin/auditoria' },
    { name: 'Configurações', icon: <SettingsIcon size={20} />, path: '/admin/configuracoes' },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#fcf9f7] text-[#333] flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#2d3a2e] flex flex-col text-white/90 transition-transform duration-300 transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#a8c69f] flex items-center justify-center">
              <span className="text-[#2d3a2e] text-xs font-bold uppercase">{profile?.companyName?.charAt(0) || 'F'}</span>
            </div>
            <h1 className="text-lg font-serif italic tracking-tight text-white">Floresça Admin</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  location.pathname === item.path 
                    ? "bg-white/10 text-white" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-6 text-[10px] text-white/30 border-t border-white/10 uppercase tracking-widest font-bold">
            SISTEMA FLORICULTURA v1.2
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <span className="hidden md:inline text-[10px] uppercase tracking-widest text-gray-400 font-bold">Painel de Controle</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <p className="text-xs font-bold text-gray-900">{profile?.name || 'Administrador'}</p>
              <p className="text-[10px] text-gray-400 font-medium">{auth.currentUser?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair do Sistema"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
