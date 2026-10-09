"use client";

import React, { useState } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { ActiveView, ExchangeRateType } from '../types/financial';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { Shield, LayoutDashboard, ArrowUpDown, CalendarClock, CreditCard, ShoppingBag, Loader2, DollarSign, RefreshCw, User, Settings2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isHydrated,
    exchangeRates,
    selectedRateType,
    setSelectedRateType,
    refreshRates,
    profiles,
    activeProfile,
    setActiveProfileId
  } = useFinancialContext();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Dashboard Principal', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'movements', label: 'Gastos Diarios', icon: <ArrowUpDown className="w-4 h-4" /> },
    { id: 'fixed', label: 'Flujos Fijos', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'cards', label: 'Tarjetas de Crédito', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'installments', label: 'Compras en Cuotas', icon: <ShoppingBag className="w-4 h-4" /> }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
            {/* Brand Logo & Profile Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-lg shadow-emerald-500/20">
                  <Shield className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 font-mono">
                    VIK<span className="text-emerald-400">ING</span>
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 font-sans">
                      v2.0
                    </span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest hidden sm:block">
                    Motor de Gestión Financiera
                  </p>
                </div>
              </div>

              {/* Profile Selection & Settings Trigger */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <select
                    value={activeProfile?.id}
                    onChange={(e) => setActiveProfileId(e.target.value)}
                    className="bg-transparent text-slate-200 font-mono font-semibold focus:outline-none cursor-pointer"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                  title="Configuración de Perfil y Feature Flags"
                >
                  <Settings2 className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* DolarApi Live Ticker (Rendered conditionally based on active profile preference) */}
            {activeProfile?.preferences?.enableDolarApi ? (
              <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 bg-slate-900/90 border border-slate-800/90 rounded-xl px-3.5 py-2 shadow-inner">
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Cotizaciones en Vivo:</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300 overflow-x-auto no-scrollbar">
                    <span className={selectedRateType === 'tarjeta' ? 'text-emerald-300 font-bold underline decoration-emerald-500' : ''}>
                      Tarjeta: ${exchangeRates?.tarjeta?.toLocaleString('es-AR') || '1.680'}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className={selectedRateType === 'blue' ? 'text-emerald-300 font-bold underline decoration-emerald-500' : ''}>
                      Blue: ${exchangeRates?.blue?.toLocaleString('es-AR') || '1.350'}
                    </span>
                    <span className="text-slate-600 hidden sm:inline">|</span>
                    <span className={`hidden sm:inline ${selectedRateType === 'mep' ? 'text-emerald-300 font-bold underline decoration-emerald-500' : ''}`}>
                      MEP: ${exchangeRates?.mep?.toLocaleString('es-AR') || '1.320'}
                    </span>
                    <span className="text-slate-600 hidden xl:inline">|</span>
                    <span className={`hidden xl:inline ${selectedRateType === 'oficial' ? 'text-emerald-300 font-bold underline decoration-emerald-500' : ''}`}>
                      Oficial: ${exchangeRates?.oficial?.toLocaleString('es-AR') || '1.050'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                  <label className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Tasa Activa:</label>
                  <select
                    value={selectedRateType}
                    onChange={(e) => setSelectedRateType(e.target.value as ExchangeRateType)}
                    className="bg-slate-950 border border-slate-700 text-emerald-400 text-xs rounded-lg px-2 py-1 font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="tarjeta">Dólar Tarjeta</option>
                    <option value="blue">Dólar Blue</option>
                    <option value="mep">Dólar MEP / Bolsa</option>
                    <option value="oficial">Dólar Oficial</option>
                  </select>
                  <button
                    onClick={() => refreshRates()}
                    title="Actualizar cotizaciones en tiempo real"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>Modo Monomeda Local (DolarApi desactivado para {activeProfile?.name})</span>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-800/60">
            {navItems.map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
