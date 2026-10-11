"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen }) => {
  const { loginWithGoogle, authError, clearAuthError, isLoading } = useAuth();
  const [devToken, setDevToken] = useState('');
  const [showDevInput, setShowDevInput] = useState(false);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

  useEffect(() => {
    if (!isOpen) return;

    // Load Google Identity Services Script
    const scriptId = 'google-gsi-client';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const setupGoogleButton = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response.credential) {
              loginWithGoogle(response.credential);
            }
          },
        });

        const buttonContainer = document.getElementById('google-signin-btn-container');
        if (buttonContainer) {
          buttonContainer.innerHTML = '';
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: 320,
            text: 'signin_with',
          });
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = setupGoogleButton;
      document.body.appendChild(script);
    } else {
      setupGoogleButton();
    }
  }, [isOpen, googleClientId, loginWithGoogle]);

  if (!isOpen) return null;

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devToken.trim()) return;
    await loginWithGoogle(devToken.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-indigo-950/40">
        {/* Glow Decorator */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Lock className="h-8 w-8 text-indigo-400" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">
            Viking Expenses Tracker
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sistema privado de gestión financiera y control presupuestario multiperfil.
          </p>

          {/* Access Warning / Whitelist notice */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 p-3.5 text-left text-xs text-slate-300">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Acceso Restringido:</span> Este
              sistema opera bajo una lista blanca estricta. Sólo las cuentas de Google previamente
              autorizadas pueden ingresar.
            </div>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="mt-4 w-full rounded-2xl bg-red-950/40 border border-red-500/30 p-4 text-left text-xs text-red-200 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <div className="flex-1">
                  <p className="font-semibold text-red-300">Fallo de Autenticación</p>
                  <p className="mt-1 leading-relaxed text-red-200/90">{authError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearAuthError}
                className="mt-3 text-xs underline text-red-300 hover:text-red-100"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Google Sign-in Container */}
          <div className="mt-6 flex w-full flex-col items-center justify-center">
            {isLoading ? (
              <div className="flex items-center gap-3 py-3 text-sm text-slate-300">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                <span>Verificando credenciales con Viking Backend...</span>
              </div>
            ) : (
              <div
                id="google-signin-btn-container"
                className="min-h-[44px] flex items-center justify-center"
              />
            )}
          </div>

          {/* Developer / Manual ID Token Bypass for Staging */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 w-full">
            <button
              type="button"
              onClick={() => setShowDevInput(!showDevInput)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{showDevInput ? 'Ocultar prueba manual' : 'Modo pruebas / Token manual'}</span>
            </button>

            {showDevInput && (
              <form onSubmit={handleDevLogin} className="mt-3 flex flex-col gap-2 text-left">
                <label className="text-[11px] text-slate-400">
                  Google ID Token (para pruebas en local / Postman):
                </label>
                <textarea
                  value={devToken}
                  onChange={(e) => setDevToken(e.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIs..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !devToken.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Enviar Token al Backend</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
