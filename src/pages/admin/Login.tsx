import React, { useState } from 'react';
import { Flower2, Lock, Mail, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { localAuth } from '../../lib/localAuth';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('admin@floricultura.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Credenciais inválidas.');
        return;
      }
      localAuth.setSession(data.token, data.user);
      onLogin();
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@floricultura.com', password: 'admin123' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao configurar o sistema.');
        return;
      }
      if (data.alreadyDone) {
        setSuccessMsg('Sistema já configurado. Use admin@floricultura.com / admin123');
        return;
      }
      // Bootstrap retorna token — faz login automático
      localAuth.setSession(data.token, data.user);
      setSuccessMsg(data.message);
      setTimeout(() => onLogin(), 1200);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f5ee] via-[#fcf9f7] to-[#f5f0eb] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 relative overflow-hidden border border-gray-100">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-[#7aad6a] to-accent" />

        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-[#f0f5ee] rounded-full text-primary mb-6 shadow-sm border border-green-50">
            <Flower2 size={40} />
          </div>
          <h1 className="text-3xl font-serif text-primary-dark mb-1">Painel <span className="italic">Privado</span></h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Rita Vida Verde Flores</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs font-medium leading-relaxed animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-green-700 text-xs font-medium leading-relaxed animate-in fade-in">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={17} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-[#f8faf7] border border-transparent rounded-full outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/30 transition-all text-sm font-medium"
                placeholder="admin@floricultura.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Senha</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={17} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-[#f8faf7] border border-transparent rounded-full outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/30 transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Acessar Dashboard'}
          </button>
        </form>

        <div className="mt-10 pt-7 border-t border-gray-50 flex flex-col items-center gap-3">
          <button
            onClick={handleBootstrap}
            disabled={loading}
            className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:text-primary-dark transition-colors px-4 py-2 rounded-full hover:bg-green-50"
          >
            {loading ? 'Processando...' : '⚙️ Configurar Primeiro Acesso'}
          </button>
          <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest text-center">
            Cria usuário admin com senha <span className="text-gray-400">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
