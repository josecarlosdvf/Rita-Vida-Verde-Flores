import React, { useState, useEffect } from 'react';
import { storeService } from '../../lib/storeService';
import { Review } from '../../types';
import { Star, CheckCircle, XCircle, Trash2, Search, MessageSquare, Loader2, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import DataTable from '../../components/DataTable';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = storeService.subscribe<Review>('reviews', (data) => {
      setReviews(data.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
        return tb - ta;
      }));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const toggleApproval = async (review: Review) => {
    try {
      const newStatus = !review.approved;
      await storeService.update('reviews', review.id, { approved: newStatus });
      // Optimistic local update
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, approved: newStatus } : r));
      await recalculateProductRating(review.productId);
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status.');
    }
  };

  const deleteReview = async (review: Review) => {
    if (!window.confirm('Excluir esta avaliação Permanentemente?')) return;
    try {
      await storeService.delete('reviews', review.id);
      setReviews(prev => prev.filter(r => r.id !== review.id));
      await recalculateProductRating(review.productId);
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir avaliação.');
    }
  };

  const recalculateProductRating = async (productId: string) => {
    const allReviews = await storeService.list<Review>('reviews');
    const approved = allReviews.filter(r => r.productId === productId && r.approved);
    const avg = approved.length > 0 ? approved.reduce((acc, r) => acc + r.rating, 0) / approved.length : 0;
    await storeService.update('products', productId, { rating: avg, reviewsCount: approved.length });
  };

  const columns = [
    { 
      header: 'Produto', 
      accessorKey: 'productName' as any,
      cell: (v: string, row: Review) => (
        <div className="flex flex-col">
          <span className="font-serif italic text-primary-dark">{v}</span>
          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{row.productId.slice(-6)}</span>
        </div>
      )
    },
    { header: 'Cliente', accessorKey: 'customerName' as const },
    { 
      header: 'Nota', 
      accessorKey: 'rating' as const,
      cell: (v: number) => (
        <div className="flex text-accent gap-0.5">
          {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= v ? "currentColor" : "none"} />)}
        </div>
      )
    },
    { 
      header: 'Comentário', 
      accessorKey: 'comment' as const,
      cell: (v: string) => <p className="max-w-xs truncate text-xs text-gray-500 font-medium italic">"{v}"</p>
    },
    { 
      header: 'Status', 
      accessorKey: 'approved' as const,
      cell: (v: boolean) => (
        v 
          ? <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100">Aprovado</span>
          : <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-yellow-100">Aguardando</span>
      )
    },
    {
      header: 'Data',
      accessorKey: 'createdAt' as const,
      cell: (v: any) => v ? new Date(v).toLocaleDateString('pt-BR') : '---'
    },
    {
      header: 'Ações',
      accessorKey: 'id' as const,
      cell: (_: string, row: Review) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => toggleApproval(row)}
            className={cn(
              "p-2 rounded-lg transition-all",
              row.approved ? "text-yellow-500 hover:bg-yellow-50" : "text-green-500 hover:bg-green-50"
            )}
            title={row.approved ? "Desaprovar" : "Aprovar"}
          >
            {row.approved ? <XCircle size={18} /> : <CheckCircle size={18} />}
          </button>
          <button 
            onClick={() => deleteReview(row)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Excluir"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  const filteredReviews = reviews.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //@ts-ignore
    r.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif text-primary-dark mb-2">Moderação de <span className="italic">Avaliações</span></h2>
          <p className="text-gray-400 text-sm font-medium">Controle o feedback exibido em sua vitrine.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <DataTable 
          title="Avaliações de Clientes"
          columns={columns} 
          data={filteredReviews} 
          isLoading={loading}
        />
        
        {reviews.length === 0 && !loading && (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
              <MessageSquare size={32} />
            </div>
            <p className="font-serif italic text-lg text-gray-400">Nenhuma avaliação recebida até o momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
