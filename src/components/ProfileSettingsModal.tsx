"use client";

import React, { useState } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { UserProfile, AccountPreferences, Currency } from '../types/financial';
import { X, User, Plus, Settings2, Check, DollarSign, RefreshCw, Calculator, Layers } from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    profiles,
    activeProfile,
    setActiveProfileId,
    addProfile,
    updateProfilePreferences
  } = useFinancialContext();

  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    addProfile(newProfileName.trim(), {
      enableBimoneda: true,
      enableDolarApi: true,
      enableCardSimulator: true,
      defaultCurrency: 'ARS'
    });

    setNewProfileName('');
    setIsCreating(false);
  };

  const togglePreference = (key: keyof AccountPreferences) => {
    if (!activeProfile) return;
    const currentVal = activeProfile.preferences[key];
    if (typeof currentVal === 'boolean') {
      updateProfilePreferences(activeProfile.id, { [key]: !currentVal });
    }
  };

  const setCurrencyPref = (currency: Currency) => {
    if (!activeProfile) return;
    updateProfilePreferences(activeProfile.id, { defaultCurrency: currency });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Gestión de Perfiles y Preferencias</h3>
              <p className="text-xs text-slate-400">Configura perfiles aislados y activa o desactiva módulos por cuenta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Active Profile Switcher */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono uppercase text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" /> Seleccionar Perfil Activo
              </label>
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo Perfil
                </button>
              )}
            </div>

            {isCreating && (
              <form onSubmit={handleCreateProfile} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Ej. Cuenta Pareja, Trabajo, Personal..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl uppercase hover:bg-emerald-400 cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 font-medium text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profiles.map((profile) => {
                const isActive = activeProfile?.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    onClick={() => setActiveProfileId(profile.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border-emerald-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{profile.name}</span>
                        {profile.isDefault && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                            Principal
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 block mt-1">
                        {profile.preferences.enableBimoneda ? 'Bimoneda ARS/USD' : 'Solo ARS'} • {profile.preferences.enableDolarApi ? 'DolarApi Activo' : 'Sin Polling'}
                      </span>
                    </div>
                    {isActive && <Check className="w-5 h-5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature Toggles Section for Active Profile */}
          {activeProfile && (
            <div className="pt-6 border-t border-slate-800/80 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" /> Modulos y Módulos de Red ({activeProfile.name})
              </h4>

              <div className="space-y-3">
                {/* Enable Bimoneda Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">Soporte Bimoneda (ARS / USD)</span>
                      <span className="text-xs text-slate-400 block">
                        Permite registrar ingresos y gastos en USD y mostrar saldos convertidos
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePreference('enableBimoneda')}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      activeProfile.preferences.enableBimoneda ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        activeProfile.preferences.enableBimoneda ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Enable DolarApi Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">Consultas en Vivo a DolarApi.com</span>
                      <span className="text-xs text-slate-400 block">
                        Actualiza tipos de cambio en segundo plano. Desactiva si la cuenta no opera en dolares.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePreference('enableDolarApi')}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      activeProfile.preferences.enableDolarApi ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        activeProfile.preferences.enableDolarApi ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Enable Credit Card Simulator Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">Simulador de Tarjetas de Crédito</span>
                      <span className="text-xs text-slate-400 block">
                        Visualiza el widget de simulación de impacto de cuotas futuras en el Dashboard
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePreference('enableCardSimulator')}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      activeProfile.preferences.enableCardSimulator ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        activeProfile.preferences.enableCardSimulator ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Listo / Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
