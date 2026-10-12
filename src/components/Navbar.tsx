"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import logoImg from '../../public/logo.png';
import { useFinancialContext } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { ActiveView, ExchangeRateType } from '../types/financial';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import {
  LayoutDashboard,
  ArrowUpDown,
  CalendarClock,
  CreditCard,
  ShoppingBag,
  DollarSign,
  RefreshCw,
  Settings2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    exchangeRates,
    selectedRateType,
    setSelectedRateType,
    refreshRates,
    activeProfile,
  } = useFinancialContext();

  const { user, isAuthenticated, logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isCardSimulatorEnabled = activeProfile?.preferences?.enableCardSimulator ?? true;

  React.useEffect(() => {
    if (!isCardSimulatorEnabled && (activeView === 'cards' || activeView === 'installments')) {
      setActiveView('summary');
    }
  }, [isCardSimulatorEnabled, activeView, setActiveView]);

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Dashboard Principal', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'movements', label: 'Gastos Diarios', icon: <ArrowUpDown className="w-4 h-4" /> },
    { id: 'fixed', label: 'Flujos Fijos', icon: <CalendarClock className="w-4 h-4" /> },
    ...(isCardSimulatorEnabled
      ? [
          { id: 'cards' as ActiveView, label: 'Tarjetas de Crédito', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'installments' as ActiveView, label: 'Compras en Cuotas', icon: <ShoppingBag className="w-4 h-4" /> },
        ]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-2.5">
            {/* Top Bar: Brand Logo & Right Controls */}
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              {/* Logo e Identidad */}
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-xl bg-slate-900 border border-slate-800/80 shadow-md shadow-emerald-500/10 flex items-center justify-center shrink-0 w-9 h-9 overflow-hidden">
                  <Image
                    src={logoImg}
                    alt="Logo Gestor de Gastos"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                    GESTOR <span className="text-emerald-400">DE GASTOS</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest hidden sm:block">
                    Control Financiero Personal
                  </p>
                </div>
              </div>

              {/* Botón Hamburguesa / Menú de Usuario (Móvil) */}
              <div className="md:hidden relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-colors"
                  aria-label="Abrir Menú"
                >
                  {isMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Right Side: Dólar Ticker Compacto & Botón Menú (Desktop) */}
            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              {/* Ticker de Cotizaciones Compacto */}
              {activeProfile?.preferences?.enableDolarApi && (
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 shadow-inner text-xs font-mono">
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px] text-slate-400">USD:</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                    <span className={selectedRateType === 'tarjeta' ? 'text-emerald-300 font-bold' : ''}>
                      Tarj: ${exchangeRates?.tarjeta?.toLocaleString('es-AR') || '1.995'}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className={selectedRateType === 'blue' ? 'text-emerald-300 font-bold' : ''}>
                      Blue: ${exchangeRates?.blue?.toLocaleString('es-AR') || '1.540'}
                    </span>
                    <span className="text-slate-600 hidden xl:inline">·</span>
                    <span className={`hidden xl:inline ${selectedRateType === 'mep' ? 'text-emerald-300 font-bold' : ''}`}>
                      MEP: ${exchangeRates?.mep?.toLocaleString('es-AR') || '1.542'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
                    <select
                      value={selectedRateType}
                      onChange={(e) => setSelectedRateType(e.target.value as ExchangeRateType)}
                      className="bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] rounded-md px-1.5 py-0.5 font-mono focus:outline-none cursor-pointer"
                      title="Tasa activa"
                    >
                      <option value="tarjeta">Tarjeta</option>
                      <option value="blue">Blue</option>
                      <option value="mep">MEP</option>
                      <option value="oficial">Oficial</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => refreshRates()}
                      title="Actualizar cotizaciones"
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Menú Hamburguesa / Opciones (Desktop) */}
              <div className="hidden md:block relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer flex items-center justify-center"
                  title="Opciones de Cuenta y Configuración"
                >
                  {isMenuOpen ? <X className="w-4 h-4 text-emerald-400" /> : <Menu className="w-4 h-4" />}
                </button>

                {/* Dropdown flotante */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-800/80">
                      <p className="text-xs font-semibold text-white truncate">
                        {user?.full_name || 'Mi Cuenta'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {user?.email || 'Sesión iniciada'}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                      >
                        <Settings2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Configuración de Perfil y Margen</span>
                      </button>

                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                          <span>Cerrar Sesión</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dropdown flotante para móvil */}
            {isMenuOpen && (
              <div className="md:hidden w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-3 mt-1">
                <div className="pb-2 mb-2 border-b border-slate-800 text-xs">
                  <span className="font-semibold text-white">{user?.full_name || 'Mi Cuenta'}</span>
                  <p className="text-[11px] text-slate-400">{user?.email || 'Sesión activa'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 py-2 text-xs text-slate-300 hover:text-white"
                >
                  <Settings2 className="w-4 h-4 text-emerald-400" />
                  <span>Configuración y Margen</span>
                </button>
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 py-2 text-xs text-red-400 hover:text-red-300"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navigation Tabs (Desktop/PC) */}
          <nav className="hidden md:flex space-x-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/60">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
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
      <ProfileSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};
