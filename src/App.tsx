import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { localAuth } from './lib/localAuth';
import { CartProvider } from './hooks/useCart';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import CustomerAuth from './pages/CustomerAuth';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/Login';
import Products from './pages/admin/Products';
import Banners from './pages/admin/Banners';
import Users from './pages/admin/Users';
import AuditLogs from './pages/admin/AuditLogs';
import AdminSettings from './pages/admin/Settings';
import AdminOrders from './pages/admin/Orders';
import AdminReviews from './pages/admin/Reviews';
import AdminLayout from './components/layout/AdminLayout';
import PublicLayout from './components/layout/PublicLayout';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthenticated(localAuth.isAuthenticated());

    const onStorage = () => setAuthenticated(localAuth.isAuthenticated());
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-change', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-change', onStorage);
    };
  }, []);

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/produto/:slug" element={<ProductDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/conta" element={<CustomerAuth />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={authenticated ? <Navigate to="/admin" /> : <AdminLogin onLogin={() => setAuthenticated(true)} />} />
          <Route path="/admin" element={authenticated ? <AdminLayout onLogout={() => setAuthenticated(false)} /> : <Navigate to="/admin/login" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="produtos" element={<Products />} />
            <Route path="banners" element={<Banners />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="avaliacoes" element={<AdminReviews />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="auditoria" element={<AuditLogs />} />
            <Route path="configuracoes" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
