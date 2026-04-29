import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Facebook, Flower2, Loader2, LogIn } from 'lucide-react';
import { customerAuth } from '../lib/customerAuth';
import { CustomerProfile } from '../types';

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(script);
  });
}

export default function CustomerAuth() {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const googleClientId = useMemo(() => import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined, []);
  const facebookAppId = useMemo(() => import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined, []);

  useEffect(() => {
    if (customerAuth.isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    let disposed = false;

    loadScript('https://accounts.google.com/gsi/client', 'google-identity-client')
      .then(() => {
        if (disposed || !window.google || !googleButtonRef.current) return;
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (!response?.credential) return;
            setLoadingProvider('google');
            setError('');
            try {
              const res = await fetch('/api/customer-auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Falha ao autenticar com Google');
              customerAuth.setSession(data.token, data.user as CustomerProfile);
              setMessage('Conta conectada com Google.');
              navigate('/', { replace: true });
            } catch (err: any) {
              setError(err.message || 'Falha ao autenticar com Google.');
            } finally {
              setLoadingProvider(null);
            }
          },
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          text: 'continue_with',
          shape: 'pill',
          size: 'large',
          width: 320,
        });
      })
      .catch((err: any) => setError(err.message || 'Falha ao carregar Google Login.'));

    return () => {
      disposed = true;
    };
  }, [googleClientId, navigate]);

  useEffect(() => {
    if (!facebookAppId) return;

    window.fbAsyncInit = function () {
      window.FB?.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: 'v22.0',
      });
    };

    loadScript('https://connect.facebook.net/pt_BR/sdk.js', 'facebook-sdk').catch((err: any) => {
      setError(err.message || 'Falha ao carregar Facebook Login.');
    });
  }, [facebookAppId]);

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('SDK do Facebook ainda não carregou.');
      return;
    }
    setLoadingProvider('facebook');
    setError('');
    window.FB.login(
      async (response: any) => {
        if (!response?.authResponse?.accessToken) {
          setLoadingProvider(null);
          setError('Login com Facebook cancelado.');
          return;
        }

        try {
          const res = await fetch('/api/customer-auth/facebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: response.authResponse.accessToken }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Falha ao autenticar com Facebook');
          customerAuth.setSession(data.token, data.user as CustomerProfile);
          setMessage('Conta conectada com Facebook.');
          navigate('/', { replace: true });
        } catch (err: any) {
          setError(err.message || 'Falha ao autenticar com Facebook.');
        } finally {
          setLoadingProvider(null);
        }
      },
      { scope: 'public_profile,email' }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f5ee] via-[#fcf9f7] to-[#f5f0eb] flex items-center justify-center p-4 pt-32 pb-20">
      <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-10 md:p-12 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-[#7aad6a] to-accent" />
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-[#f0f5ee] rounded-full text-primary mb-6 shadow-sm border border-green-50">
            <Flower2 size={40} />
          </div>
          <h1 className="text-4xl font-serif text-primary-dark mb-2">Entrar ou criar conta</h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Use Google ou Facebook para criar sua conta de cliente e acelerar compras futuras.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-green-700 text-sm">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-4">
          {googleClientId ? (
            <div className="rounded-3xl border border-gray-100 bg-[#fcfcfc] p-5 flex justify-center">
              <div ref={googleButtonRef} />
            </div>
          ) : (
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-700">
              Defina VITE_GOOGLE_CLIENT_ID no .env para habilitar cadastro com Google.
            </div>
          )}

          {facebookAppId ? (
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-[#1877F2] text-white font-bold hover:bg-[#1669d8] transition-colors disabled:opacity-60"
            >
              {loadingProvider === 'facebook' ? <Loader2 size={18} className="animate-spin" /> : <Facebook size={18} />}
              Continuar com Facebook
            </button>
          ) : (
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-700">
              Defina VITE_FACEBOOK_APP_ID no .env para habilitar cadastro com Facebook.
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors">
            <LogIn size={16} />
            Voltar para o catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}