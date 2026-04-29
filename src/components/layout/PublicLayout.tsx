import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { storeService } from '../../lib/storeService';
import { Settings, SystemStatus } from '../../types';
import { AlertCircle } from 'lucide-react';

export default function PublicLayout() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const unsubscribe = storeService.subscribe<Settings>('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
    });
    return unsubscribe;
  }, []);

  if (settings?.status === SystemStatus.MAINTENANCE) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="inline-flex p-6 bg-yellow-100 rounded-full text-yellow-600 mb-4">
            <AlertCircle size={48} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 italic">Estamos em Manutenção</h1>
          <p className="text-gray-600 leading-relaxed">
            {settings.maintenanceMessage || 'Estamos preparando novidades para você. Voltamos em breve!'}
          </p>
          <div className="pt-8 border-t border-yellow-100">
            <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">
              {settings.companyName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
