import React, { useState, useEffect } from 'react';
import { 
  Flower2, 
  ImageIcon, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { storeService } from '../../lib/storeService';
import { Product, Banner, UserProfile } from '../../types';
import DataTable from '../../components/DataTable';
import { formatPrice } from '../../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubProducts = storeService.subscribe<Product>('products', (data) => setProducts(data));
    const unsubBanners = storeService.subscribe<Banner>('banners', (data) => setBanners(data));
    const unsubUsers = storeService.subscribe<UserProfile>('users', (data) => {
      setUsers(data);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubBanners();
      unsubUsers();
    };
  }, []);

  const stats = [
    { title: 'Total Produtos', value: products.length, icon: <Flower2 size={24} />, delta: '+4%', isPositive: true },
    { title: 'Banners Ativos', value: banners.filter(b => b.active).length, icon: <ImageIcon size={24} />, delta: '0%', isPositive: true },
    { title: 'Vendas (Est.)', value: 'R$ 1.250,00', icon: <TrendingUp size={24} />, delta: '-12%', isPositive: false },
    { title: 'Administradores', value: users.length, icon: <Users size={24} />, delta: '+1', isPositive: true },
  ];

  const columns: any[] = [
    { 
      header: 'Produto', 
      accessorKey: 'name',
      cell: (val: string, item: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
            <img src={item.imageUrl} alt={val} className="w-full h-full object-cover" />
          </div>
          <div className="font-bold text-gray-900">{val}</div>
        </div>
      ),
      groupable: true
    },
    { 
      header: 'Preço', 
      accessorKey: 'price',
      cell: (val: number) => <span className="font-mono font-bold text-pink-600">{formatPrice(val)}</span>
    },
    { 
      header: 'Status', 
      accessorKey: 'active',
      cell: (val: boolean) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {val ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
    { 
      header: 'Slug', 
      accessorKey: 'slug',
      cell: (val: string) => <span className="text-xs text-gray-400">/{val}</span> 
    }
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 italic">Visão Geral</h1>
          <p className="text-gray-500">Bem-vindo de volta ao painel de controle.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95">
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl hover:border-pink-100 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-full -mr-12 -mt-12 group-hover:bg-pink-100 transition-colors" />
            
            <div className="flex justify-between items-start mb-6 relative">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-900 group-hover:bg-white group-hover:text-pink-500 transition-all shadow-sm">
                {stat.icon}
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                stat.isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
              )}>
                {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.delta}
              </div>
            </div>
            
            <div className="relative">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-3xl font-serif font-bold text-gray-900">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10">
        <DataTable 
          title="Produtos Recentes"
          data={products.slice(0, 5)}
          columns={columns}
          isLoading={loading}
        />
      </div>
    </div>
  );
}

import { cn } from '../../lib/utils';
