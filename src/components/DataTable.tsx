import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronRight, 
  Printer, 
  Download,
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (value: any, item: T) => React.ReactNode;
  filterFn?: (value: any) => boolean;
  groupable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  onPrint?: () => void;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  title, 
  onPrint,
  isLoading,
  onRowClick
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<{ key: keyof T; dir: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [showFilters, setShowFilters] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<keyof T | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 1. Filter
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = columns.some(col => 
        String(item[col.accessorKey]).toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesFilters = Object.entries(filters).every(([key, selectedValues]) => {
        if (!selectedValues || (selectedValues as any[]).length === 0) return true;
        const val = item[key as keyof T];
        return (selectedValues as any[]).includes(val);
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, searchTerm, filters, columns]);

  // 2. Sort
  const sortedData = useMemo(() => {
    if (!sorting) return filteredData;
    return [...filteredData].sort((a, b) => {
      const va = a[sorting.key];
      const vb = b[sorting.key];
      if (va < vb) return sorting.dir === 'asc' ? -1 : 1;
      if (va > vb) return sorting.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sorting]);

  // 3. Group
  const groups = useMemo(() => {
    if (!groupBy) return null;
    const g: Record<string, T[]> = {};
    sortedData.forEach(item => {
      const val = String(item[groupBy]);
      if (!g[val]) g[val] = [];
      g[val].push(item);
    });
    return g;
  }, [sortedData, groupBy]);

  const toggleGroup = (group: string) => {
    const next = new Set(expandedGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedGroups(next);
  };

  const handleSort = (key: keyof T) => {
    setSorting(prev => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const toggleFilterValue = (column: string, value: any) => {
    setFilters(prev => {
      const current = prev[column] || [];
      const updated = current.includes(value) 
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [column]: updated };
    });
  };

  const uniqueValues = (key: keyof T) => {
    return Array.from(new Set(data.map(item => item[key]))).sort();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-full border-b pb-8">
      {/* Header / Toolbar */}
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-2xl font-serif text-primary-dark mb-1 leading-tight">{title}</h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
              {filteredData.length} registros encontrados
            </span>
            <div className="w-1 h-1 rounded-full bg-gray-200"></div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Sistema Ativo</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 border border-gray-100 rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-full md:w-72 bg-gray-50/50 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="p-3 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-full border border-gray-100 transition-all shadow-sm"
              title="Imprimir Relatório"
            >
              <Printer size={18} />
            </button>
            <button 
              className="p-3 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-full border border-gray-100 transition-all shadow-sm"
              title="Exportar CSV"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-grow overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-20 print:bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            <tr>
              {groupBy && <th className="w-10 px-4 py-5" />}
              {columns.map((col) => (
                <th 
                  key={String(col.accessorKey)} 
                  className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" onClick={() => handleSort(col.accessorKey)}>
                      {col.header}
                      <ArrowUpDown size={12} className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        sorting?.key === col.accessorKey && "opacity-100 text-primary"
                      )} />
                    </div>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setShowFilters(showFilters === String(col.accessorKey) ? null : String(col.accessorKey))}
                        className={cn(
                          "p-1.5 rounded-lg hover:bg-gray-100 transition-colors",
                          filters[String(col.accessorKey)]?.length > 0 && "text-primary bg-primary/5"
                        )}
                      >
                        <Filter size={12} />
                      </button>

                      {showFilters === String(col.accessorKey) && (
                        <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-5 z-50 animate-in fade-in zoom-in duration-200 text-gray-900 border-t-4 border-t-primary">
                          <div className="flex justify-between items-center mb-5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Filtrar por {col.header}</span>
                            <button onClick={() => setShowFilters(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                          </div>
                          <div className="max-h-56 overflow-auto space-y-1 mb-2 pr-2 custom-scrollbar">
                            {uniqueValues(col.accessorKey).map((val: any) => (
                              <label key={String(val)} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-all group/item text-gray-900 border border-transparent hover:border-gray-100">
                                <input 
                                  type="checkbox"
                                  checked={((filters[String(col.accessorKey)] || []) as any[]).includes(val)}
                                  onChange={() => toggleFilterValue(String(col.accessorKey), val)}
                                  className="w-4 h-4 rounded-lg text-primary focus:ring-primary border-gray-200"
                                />
                                <span className="text-sm font-medium text-gray-600 group-hover/item:text-primary transition-colors">
                                  {val === true ? 'Ativo' : val === false ? 'Inativo' : String(val)}
                                </span>
                              </label>
                            ))}
                          </div>
                          {col.groupable && (
                            <button 
                              onClick={() => { setGroupBy(groupBy === col.accessorKey ? null : col.accessorKey); setShowFilters(null); }}
                              className="w-full mt-4 py-3 bg-primary text-white text-[10px] font-bold rounded-xl uppercase tracking-[0.2em] hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                            >
                              {groupBy === col.accessorKey ? 'Remover Agrupamento' : 'Agrupar registros'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {isLoading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i} className="animate-pulse">
                  {columns.map(c => <td key={String(c.accessorKey)} className="px-8 py-8 border-b border-gray-50"><div className="h-4 bg-gray-100 rounded-full w-2/3" /></td>)}
                </tr>
              ))
            ) : groups ? (
              Object.entries(groups).map(([group, items]) => (
                <React.Fragment key={group}>
                  <tr 
                    className="bg-[#fcf9f7]/60 cursor-pointer hover:bg-gray-100 transition-all group"
                    onClick={() => toggleGroup(group)}
                  >
                    <td className="px-6 py-4">{expandedGroups.has(group) ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-gray-400" />}</td>
                    <td colSpan={columns.length} className="px-2 py-4 font-serif italic text-lg text-primary-dark">
                      {group} <span className="text-primary ml-2 text-[10px] font-bold uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-full">({(items as any[]).length} itens)</span>
                    </td>
                  </tr>
                  {expandedGroups.has(group) && (items as any[]).map((item) => (
                    <tr 
                      key={item.id} 
                      className={cn("hover:bg-gray-50 transition-all group/row", onRowClick && "cursor-pointer")}
                      onClick={() => onRowClick?.(item)}
                    >
                      <td />
                      {columns.map((col) => (
                        <td key={String(col.accessorKey)} className="px-8 py-5 text-sm text-gray-600 font-medium">
                          {col.cell ? col.cell(item[col.accessorKey], item) : String(item[col.accessorKey])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            ) : (
              sortedData.map((item) => (
                <tr 
                  key={item.id} 
                  className={cn("hover:bg-[#fcf9f7] transition-all group/row", onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={String(col.accessorKey)} className="px-8 py-5 text-sm text-gray-600 font-medium whitespace-nowrap">
                      {col.cell ? col.cell(item[col.accessorKey], item) : String(item[col.accessorKey])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:flex fixed bottom-0 left-0 right-0 p-8 border-t border-gray-300 justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest">
        <span>Relatório gerado por: {auth.currentUser?.email}</span>
        <span>Data/Hora: {new Date().toLocaleString()}</span>
        <span>Floricultura Encanto - Backoffice</span>
      </div>

      {/* Maintenance message if empty */}
      {!isLoading && sortedData.length === 0 && (
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <div className="p-6 bg-gray-50 rounded-full text-gray-300 mb-6 font-serif">
            <Filter size={64} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 italic">Nenhum dado para exibir</h3>
          <p className="text-gray-400">Tente ajustar a pesquisa ou remover os filtros aplicados.</p>
        </div>
      )}
    </div>
  );
}


