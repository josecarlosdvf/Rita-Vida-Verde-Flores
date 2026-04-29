import { useState, useEffect } from 'react';
import { storeService } from '../../lib/storeService';
import { UserProfile } from '../../types';
import DataTable from '../../components/DataTable';
import { Plus, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return storeService.subscribe<UserProfile>('users', (data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const columns: any[] = [
    { 
      header: 'Administrador', 
      accessorKey: 'name',
      cell: (val: string, item: UserProfile) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold uppercase text-xs">
            {val.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-gray-900">{val}</div>
            <div className="text-[10px] text-gray-400 font-mono tracking-tight">{item.login}</div>
          </div>
        </div>
      )
    },
    { header: 'Empresa', accessorKey: 'companyName' },
    { 
      header: 'Sessões', 
      accessorKey: 'maxSessions',
      cell: (val: number) => <span className="font-bold text-gray-600">Máx {val}</span>
    },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (val: string) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          val === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {val === 'active' ? 'Ativo' : 'Bloqueado'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 italic">Gestão de Acesso</h1>
          <p className="text-gray-500">Controle quem pode administrar a sua loja.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95">
          <Plus size={20} />
          Novo Administrador
        </button>
      </div>
      <DataTable title="Equipe Administrativa" data={users} columns={columns} isLoading={loading} />
    </div>
  );
}
