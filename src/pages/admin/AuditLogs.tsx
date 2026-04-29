import { useState, useEffect } from 'react';
import { storeService } from '../../lib/storeService';
import { AuditLog } from '../../types';
import DataTable from '../../components/DataTable';
import { History, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return storeService.subscribe<AuditLog>('auditLogs', (data) => {
      // Sort by timestamp desc
      // @ts-ignore
      data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const columns: any[] = [
    { 
      header: 'Operação', 
      accessorKey: 'operationType',
      cell: (val: string) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          val === 'create' ? "bg-blue-100 text-blue-700" : 
          val === 'update' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
        )}>
          {val}
        </span>
      ),
      groupable: true
    },
    { header: 'Entidade', accessorKey: 'entityName', groupable: true },
    { header: 'Usuário', accessorKey: 'userEmail', groupable: true },
    { 
      header: 'Data/Hora', 
      accessorKey: 'timestamp',
      cell: (val: any) => val ? new Date(val.seconds * 1000).toLocaleString() : '-' 
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 italic">Histórico de Auditoria</h1>
        <p className="text-gray-500">Rastreie todas as alterações realizadas no sistema por cada administrador.</p>
      </div>
      <DataTable title="Logs de Sistema" data={logs} columns={columns} isLoading={loading} />
    </div>
  );
}
