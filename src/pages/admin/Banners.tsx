import { useState, useEffect } from 'react';
import { storeService } from '../../lib/storeService';
import { Banner } from '../../types';
import DataTable from '../../components/DataTable';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return storeService.subscribe<Banner>('banners', (data) => {
      setBanners(data);
      setLoading(false);
    });
  }, []);

  const columns: any[] = [
    { 
      header: 'Banner', 
      accessorKey: 'imageUrl',
      cell: (val: string) => (
        <div className="w-32 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
          <img src={val} className="w-full h-full object-cover" />
        </div>
      )
    },
    { header: 'Ordem', accessorKey: 'order' },
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
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 italic">Banners do Carrossel</h1>
          <p className="text-gray-500">Gerencie as imagens de destaque da sua página inicial.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95">
          <Plus size={20} />
          Novo Banner
        </button>
      </div>
      <DataTable title="Todos os Banners" data={banners} columns={columns} isLoading={loading} />
      <p className="text-center text-gray-400 text-xs italic">Dica: Utilize imagens horizontais (1920x1080) para melhor resultado.</p>
    </div>
  );
}
