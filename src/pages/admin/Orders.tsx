import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { ShoppingBag, Eye, Trash2, CheckCircle, Clock, Truck, XCircle, Search, Phone } from 'lucide-react';
import DataTable from '../../components/DataTable';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status,
        updatedAt: new Date()
      });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status.');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir pedido.');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-yellow-100 flex items-center gap-2 w-fit"><Clock size={12} /> Pendente</span>;
      case OrderStatus.PROCESSING: return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100 flex items-center gap-2 w-fit"><Truck size={12} /> Em preparo</span>;
      case OrderStatus.SHIPPED: return <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-100 flex items-center gap-2 w-fit"><Truck size={12} /> Enviado</span>;
      case OrderStatus.DELIVERED: return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100 flex items-center gap-2 w-fit"><CheckCircle size={12} /> Entregue</span>;
      case OrderStatus.CANCELLED: return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100 flex items-center gap-2 w-fit"><XCircle size={12} /> Cancelado</span>;
      default: return null;
    }
  };

  const columns = [
    { 
      header: 'Pedido', 
      accessorKey: 'id' as const, 
      cell: (v: string) => <span className="font-mono text-[10px] font-bold text-gray-400">#{v.slice(-6).toUpperCase()}</span> 
    },
    { header: 'Cliente', accessorKey: 'customerName' as const },
    { 
      header: 'Total', 
      accessorKey: 'total' as const, 
      cell: (v: number) => <span className="font-bold text-primary">{formatPrice(v)}</span> 
    },
    { 
      header: 'Status', 
      accessorKey: 'status' as const, 
      cell: (v: OrderStatus) => getStatusBadge(v) 
    },
    { 
      header: 'Data', 
      accessorKey: 'createdAt' as const, 
      cell: (v: any) => v?.toDate ? v.toDate().toLocaleDateString('pt-BR') : '---'
    },
  ];

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif text-primary-dark mb-2">Gerenciar <span className="italic">Pedidos</span></h2>
          <p className="text-gray-400 text-sm font-medium">Acompanhe todas as vendas em tempo real.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        <div className="xl:col-span-2">
          <DataTable 
            title="Lista de Pedidos"
            columns={columns} 
            data={filteredOrders} 
            isLoading={loading}
          />
        </div>

        <div className="xl:col-span-1">
          {selectedOrder ? (
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden sticky top-4 animate-in slide-in-from-right duration-500">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="font-serif italic text-xl text-primary-dark">Detalhes do Pedido</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{selectedOrder.id.slice(-6).toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Customer Info */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-4">Informações do Cliente</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nome</p>
                      <p className="text-sm font-serif italic text-primary-dark text-lg">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">WhatsApp</p>
                      <p className="text-sm font-medium text-gray-900">{selectedOrder.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Endereço</p>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed">{selectedOrder.customerAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-4">Status da Entrega</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(OrderStatus).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedOrder.id, status)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                          selectedOrder.status === status
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-white text-gray-400 border-gray-100 hover:border-primary hover:text-primary"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-4">Itens Selecionados</h4>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-xs font-bold text-primary-dark">{item.productName}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{item.quantity}x {formatPrice(item.price)}</p>
                        </div>
                        <p className="text-xs font-bold text-primary-dark">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Total Geral</span>
                    <span className="text-2xl font-serif italic text-primary-dark">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <a 
                    href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-grow flex items-center justify-center gap-2 py-4 bg-green-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                  >
                    <Phone size={16} /> Contato WhatsApp
                  </a>
                  <button 
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-200 mb-6 shadow-sm">
                <ShoppingBag size={32} />
              </div>
              <h4 className="font-serif italic text-lg text-gray-400">Nenhum pedido selecionado</h4>
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-2">Clique em um pedido na lista para ver detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
