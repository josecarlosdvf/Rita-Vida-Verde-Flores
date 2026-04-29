import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  Check, 
  Phone, 
  MapPin, 
  Palette, 
  Globe,
  Upload,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { storeService } from '../../lib/storeService';
import { Settings, SystemStatus } from '../../types';
import { cn } from '../../lib/utils';
import { useDropzone } from 'react-dropzone';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Settings>({
    companyName: '',
    whatsappNumber: '',
    includeOrderLinkInWhatsapp: true,
    address: '',
    googleMapsEmbed: '',
    primaryColor: '#ec4899',
    secondaryColor: '#10b981',
    status: SystemStatus.ONLINE,
    maintenanceMessage: ''
  });

  useEffect(() => {
    async function fetchSettings() {
      const data = await storeService.get<Settings>('settings', 'main');
      if (data) {
        setFormData({
          ...data,
          includeOrderLinkInWhatsapp: data.includeOrderLinkInWhatsapp ?? true,
        } as Settings);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await storeService.update('settings', 'main', formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onDropLogo = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps: getLogoProps, getInputProps: getLogoInput } = useDropzone({ 
    onDrop: onDropLogo, 
    accept: { 'image/*': [] },
    multiple: false 
  } as any);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 italic">Configurações Gerais</h1>
          <p className="text-gray-500">Personalize a identidade e o funcionamento da sua floricultura.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        {/* Basic Identity */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-100 rounded-lg text-pink-600"><Globe size={20} /></div>
            <h3 className="text-xl font-bold text-gray-900">Identidade Visual</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nome da Empresa</label>
                <input 
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Cor Primária</label>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none p-0"
                    />
                    <input 
                      value={formData.primaryColor}
                      readOnly
                      className="flex-grow px-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Cor Secundária</label>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none p-0"
                    />
                    <input 
                      value={formData.secondaryColor}
                      readOnly
                      className="flex-grow px-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Logomarca (Upload)</label>
              <div 
                {...getLogoProps()} 
                className={cn(
                  "aspect-video border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all p-4 group",
                  formData.logoUrl ? "border-pink-500 bg-pink-50/10" : "border-gray-200 hover:border-pink-400 hover:bg-pink-50/30"
                )}
              >
                <input {...getLogoInput()} />
                {formData.logoUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img src={formData.logoUrl} className="max-h-full max-w-full object-contain rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <Upload className="text-white" size={32} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-gray-50 rounded-full text-gray-400 mb-2 group-hover:text-pink-500 transition-all">
                      <ImageIcon size={24} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Logo Principal</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Map */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg text-green-600"><Phone size={20} /></div>
            <h3 className="text-xl font-bold text-gray-900">Contato & Localização</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">WhatsApp (apenas números)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+55</div>
                <input 
                  required
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="11987654321"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div
                onClick={() => setFormData({ ...formData, includeOrderLinkInWhatsapp: !formData.includeOrderLinkInWhatsapp })}
                className={cn(
                  'w-12 h-6 rounded-full relative cursor-pointer transition-colors',
                  formData.includeOrderLinkInWhatsapp ? 'bg-green-500' : 'bg-gray-300'
                )}
              >
                <div className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm',
                  formData.includeOrderLinkInWhatsapp ? 'left-7' : 'left-1'
                )} />
              </div>
              <span className="text-sm font-bold text-gray-700">Incluir link de gestão do pedido na mensagem de WhatsApp</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Endereço Completo</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-gray-400" size={20} />
                <textarea 
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Embed Google Maps (Iframe)</label>
              <textarea 
                rows={3}
                value={formData.googleMapsEmbed}
                onChange={(e) => setFormData({ ...formData, googleMapsEmbed: e.target.value })}
                placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* System State */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><AlertCircle size={20} /></div>
              <h3 className="text-xl font-bold text-gray-900">Estado do Sistema</h3>
            </div>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as SystemStatus })}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer outline-none",
                formData.status === SystemStatus.ONLINE ? "bg-green-50 border-green-200 text-green-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"
              )}
            >
              <option value={SystemStatus.ONLINE}>Sistema Online</option>
              <option value={SystemStatus.MAINTENANCE}>Modo Manutenção</option>
            </select>
          </div>

          {formData.status === SystemStatus.MAINTENANCE && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="text-sm font-bold text-gray-700">Mensagem de Manutenção</label>
              <textarea 
                rows={3}
                value={formData.maintenanceMessage}
                onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Estamos em manutenção para melhor atendê-lo. Voltamos em breve!"
              />
            </div>
          )}
        </div>

        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold shadow-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-75"
          >
            {loading ? <Loader2 className="animate-spin" /> : success ? <Check /> : <Save />}
            {loading ? 'Salvando...' : success ? 'Configurações Salvas!' : 'Salvar Tudo'}
          </button>
        </div>
      </form>
    </div>
  );
}
