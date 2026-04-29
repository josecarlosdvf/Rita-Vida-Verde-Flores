import React, { useState, useEffect } from 'react';
import { storeService } from '../../lib/storeService';
import { Banner } from '../../types';
import DataTable from '../../components/DataTable';
import { Plus, Edit2, Trash2, X, Loader2, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDropzone } from 'react-dropzone';

const MAX_IMAGE_DIMENSION = 1920;
const MAX_IMAGE_SIZE_BYTES = 2_500_000;

function estimateDataUrlSize(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.ceil((base64.length * 3) / 4);
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
    image.src = dataUrl;
  });
}

async function compressImageDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) return dataUrl;
  if (estimateDataUrlSize(dataUrl) <= MAX_IMAGE_SIZE_BYTES) return dataUrl;

  const image = await loadImage(dataUrl);
  const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.88;
  let compressed = canvas.toDataURL('image/jpeg', quality);
  while (estimateDataUrlSize(compressed) > MAX_IMAGE_SIZE_BYTES && quality > 0.48) {
    quality -= 0.08;
    compressed = canvas.toDataURL('image/jpeg', quality);
  }
  return compressed;
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [bannerTheme, setBannerTheme] = useState('');
  const [bannerPrompt, setBannerPrompt] = useState('');
  const [formData, setFormData] = useState({
    imageUrl: '',
    link: '',
    order: 1,
    active: true,
  });

  useEffect(() => {
    return storeService.subscribe<Banner>('banners', (data) => {
      setBanners(data.sort((a, b) => a.order - b.order));
      setLoading(false);
    });
  }, []);

  const resetForm = () => {
    setFormData({ imageUrl: '', link: '', order: banners.length + 1, active: true });
    setBannerTheme('');
    setBannerPrompt('');
    setEditingBanner(null);
  };

  const openEditor = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      imageUrl: banner.imageUrl,
      link: banner.link || '',
      order: banner.order,
      active: banner.active,
    });
    setBannerTheme('');
    setBannerPrompt('');
    setIsModalOpen(true);
  };

  const handleGenerateText = async () => {
    if (!bannerTheme.trim()) return alert('Defina um tema curto para o banner primeiro.');
    setGeneratingText(true);
    try {
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('floricultura_token')}`,
        },
        body: JSON.stringify({ type: 'banner', context: bannerTheme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar texto');
      setBannerPrompt(data.promptText || '');
    } catch (error: any) {
      alert(error.message || 'Erro ao gerar texto do banner com IA');
    } finally {
      setGeneratingText(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        imageUrl: formData.imageUrl ? await compressImageDataUrl(formData.imageUrl) : '',
      };

      if (editingBanner) {
        await storeService.update('banners', editingBanner.id, payload);
      } else {
        await storeService.create('banners', payload);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar banner.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este banner?')) return;
    await storeService.delete('banners', id);
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const imageUrl = await compressImageDataUrl(reader.result as string);
      setFormData((prev) => ({ ...prev, imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  } as any);

  const handleGenerateImage = async () => {
    if (!bannerPrompt.trim()) return alert('Descreva o banner primeiro.');
    setGeneratingImage(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('floricultura_token')}`,
        },
        body: JSON.stringify({ promptText: bannerPrompt, kind: 'banner' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar imagem');
      const imageUrl = await compressImageDataUrl(data.imageData);
      setFormData((prev) => ({ ...prev, imageUrl }));
    } catch (error: any) {
      alert(error.message || 'Erro ao gerar banner com IA');
    } finally {
      setGeneratingImage(false);
    }
  };

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
      header: 'Link', 
      accessorKey: 'link',
      cell: (val: string) => <span className="text-xs text-gray-400">{val || '---'}</span>
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
      cell: (val: string, item: Banner) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEditor(item)}
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
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 italic">Banners do Carrossel</h1>
          <p className="text-gray-500">Gerencie as imagens de destaque da sua página inicial.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} />
          Novo Banner
        </button>
      </div>
      <DataTable title="Todos os Banners" data={banners} columns={columns} isLoading={loading} onRowClick={openEditor} />
      <p className="text-center text-gray-400 text-xs italic">Dica: Utilize imagens horizontais (1920x1080) para melhor resultado.</p>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-serif font-bold text-gray-900 italic">{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-bold text-gray-700">Tema rápido do banner</label>
                  <button
                    type="button"
                    onClick={handleGenerateText}
                    disabled={generatingText || !bannerTheme.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generatingText ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {generatingText ? 'Gerando...' : 'Gerar texto com IA'}
                  </button>
                </div>
                <input
                  value={bannerTheme}
                  onChange={(e) => setBannerTheme(e.target.value)}
                  placeholder="Ex: Dia das mães com orquídeas elegantes"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-bold text-gray-700">Texto descritivo para gerar imagem</label>
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={generatingImage || !bannerPrompt.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generatingImage ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {generatingImage ? 'Gerando...' : 'Gerar com IA'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={bannerPrompt}
                  onChange={(e) => setBannerPrompt(e.target.value)}
                  placeholder="Ex: banner sofisticado de orquídeas para dia das mães, com tons claros e espaço para texto promocional"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Imagem do Banner</label>
                <div
                  {...getRootProps()}
                  className={cn(
                    'aspect-[16/7] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all p-4 group',
                    formData.imageUrl ? 'border-pink-500 bg-pink-50/10' : 'border-gray-200 hover:border-pink-400 hover:bg-pink-50/30'
                  )}
                >
                  <input {...getInputProps()} />
                  {generatingImage ? (
                    <div className="flex flex-col items-center gap-3 text-violet-500">
                      <Loader2 size={40} className="animate-spin" />
                      <p className="text-xs font-bold uppercase tracking-widest">Gerando banner com Gemini...</p>
                    </div>
                  ) : formData.imageUrl ? (
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
                      <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest">Arraste, clique ou gere com IA</p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Link do Banner</label>
                  <input
                    value={formData.link}
                    onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                    placeholder="/catalogo ou https://..."
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Ordem</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value || '1', 10) }))}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div
                  onClick={() => setFormData((prev) => ({ ...prev, active: !prev.active }))}
                  className={cn(
                    'w-12 h-6 rounded-full relative cursor-pointer transition-colors',
                    formData.active ? 'bg-green-500' : 'bg-gray-300'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm',
                      formData.active ? 'left-7' : 'left-1'
                    )}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700">Banner ativo no carrossel</span>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-grow py-5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  {editingBanner ? 'Salvar Alterações' : 'Criar Banner'}
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
