import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from './lib/firebase';
import { CartProvider } from './hooks/useCart';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
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

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/produto/:slug" element={<ProductDetails />} />
            <Route path="/checkout" element={<Checkout />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={user ? <Navigate to="/admin" /> : <AdminLogin />} />
          <Route path="/admin" element={user ? <AdminLayout /> : <Navigate to="/admin/login" />}>
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
