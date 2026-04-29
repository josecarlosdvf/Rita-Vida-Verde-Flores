import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { storeService } from '../../lib/storeService';
import { Product } from '../../types';
import { formatPrice, generateSlug, cn } from '../../lib/utils';
import DataTable from '../../components/DataTable';
import { useDropzone } from 'react-dropzone';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    active: true,
    slug: ''
  });

  useEffect(() => {
    return storeService.subscribe<Product>('products', (data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const resetForm = () => {
    setFormData({ name: '', description: '', price: 0, imageUrl: '', active: true, slug: '' });
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...formData, slug: formData.slug || generateSlug(formData.name) };
      if (editingProduct) {
        await storeService.update('products', editingProduct.id, data);
      } else {
        await storeService.create('products', data);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await storeService.delete('products', id);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    // In a real app, upload to storage. Here well use a placeholder or base64
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false 
  } as any);

  const columns: any[] = [
    { 
      header: 'Produto', 
      accessorKey: 'name',
      cell: (val: string, item: Product) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 shadow-sm">
            <img src={item.imageUrl} alt={val} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-gray-900">{val}</div>
            <div className="text-xs text-gray-400 font-mono">/{item.slug}</div>
          </div>
        </div>
      ),
      groupable: true
    },
    { 
      header: 'Preço', 
      accessorKey: 'price',
      cell: (val: number) => <span className="font-mono font-bold text-gray-900">{formatPrice(val)}</span>
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
      header: 'Ações', 
      accessorKey: 'id',
      cell: (val: string, item: Product) => (
        <div className="flex justify-end gap-2">
          <Link to={`/produto/${item.slug}`} target="_blank" className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors">
            <ExternalLink size={18} />
          </Link>
          <button 
            onClick={() => { setEditingProduct(item); setFormData(item); setIsModalOpen(true); }}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => handleDelete(val)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 italic">Gerenciar Produtos</h1>
          <p className="text-gray-500">Adicione, edite ou remova flores e arranjos do seu catálogo.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <DataTable 
        title="Todos os Produtos"
        data={products}
        columns={columns}
        isLoading={loading}
      />

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-serif font-bold text-gray-900 italic">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Nome do Produto</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Preço (R$)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Link Amigável (Slug)</label>
                    <input 
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                      placeholder="ex: rosa-vermelha-premium"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Imagem do Produto</label>
                    <div 
                      {...getRootProps()} 
                      className={cn(
                        "aspect-square border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all p-4 group",
                        formData.imageUrl ? "border-pink-500 bg-pink-50/10" : "border-gray-200 hover:border-pink-400 hover:bg-pink-50/30"
                      )}
                    >
                      <input {...getInputProps()} />
                      {formData.imageUrl ? (
                        <div className="relative w-full h-full">
                          <img src={formData.imageUrl} className="w-full h-full object-cover rounded-2xl" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <Upload className="text-white" size={32} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-4 group-hover:text-pink-500 group-hover:bg-white transition-all">
                            <ImageIcon size={32} />
                          </div>
                          <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest">Arraste ou clique para enviar</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Descrição</label>
                <textarea 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div 
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                    formData.active ? "bg-green-500" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    formData.active ? "left-7" : "left-1"
                  )} />
                </div>
                <span className="text-sm font-bold text-gray-700">Produto Visível no Site</span>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-grow py-5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-5 border-2 border-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
