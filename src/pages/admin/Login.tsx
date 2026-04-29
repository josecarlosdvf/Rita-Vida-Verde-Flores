import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Flower2, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { UserStatus, SessionPolicy } from '../../types';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login por E-mail/Senha não está ativado no Firebase Console. Por favor, ative-o em Authentication > Sign-in method.');
      } else {
        setError('Credenciais inválidas ou erro de conexão.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async () => {
    setLoading(true);
    setError('');
    const defaultEmail = 'admin@floricultura.com';
    const defaultPass = 'admin123';

    try {
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, defaultEmail, defaultPass);
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          userCredential = await signInWithEmailAndPassword(auth, defaultEmail, defaultPass);
        } else if (e.code === 'auth/operation-not-allowed') {
          throw new Error('O login por E-mail/Senha não está ativado no Firebase Console.');
        } else throw e;
      }

      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          login: 'admin',
          name: 'Administrador',
          companyName: 'Floresça Boutique',
          status: UserStatus.ACTIVE,
          maxSessions: 5,
          sessionPolicy: SessionPolicy.KILL_OLD,
          createdAt: serverTimestamp()
        });
      }
      
      const settingsRef = doc(db, 'settings', 'main');
      const settingsDoc = await getDoc(settingsRef);
      if (!settingsDoc.exists()) {
        await setDoc(settingsRef, {
          companyName: 'Floresça Boutique',
          whatsappNumber: '11987654321',
          status: 'online',
          address: 'Av. das Flores, 1234 - Jardim Botânico, São Paulo, SP',
          primaryColor: '#8B5E3C',
          secondaryColor: '#D4A373'
        });
      }

    } catch (err: any) {
      setError('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 relative overflow-hidden border border-gray-100">
        <div className="absolute top-0 left-0 right-0 h-2 bg-primary" />
        
        <div className="text-center mb-12">
          <div className="inline-flex p-5 bg-[#fcf9f7] rounded-full text-primary mb-6 shadow-sm border border-gray-50">
            <Flower2 size={40} />
          </div>
          <h1 className="text-3xl font-serif text-primary-dark mb-2">Painel <span className="italic">Privado</span></h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Gestão Floresça Boutique</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs font-medium leading-relaxed animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">E-mail de Acesso</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-[#fcf9f7] border border-transparent rounded-full outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all text-sm font-medium"
                placeholder="nome@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Senha</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-[#fcf9f7] border border-transparent rounded-full outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary-dark text-white rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Acessar Dashboard'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col items-center">
          <button 
            onClick={handleBootstrap}
            disabled={loading}
            className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:text-primary-dark transition-colors"
          >
            {loading ? 'Processando...' : 'Configurar Primeiro Acesso'}
          </button>
          <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-4">
            admin@floricultura.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
