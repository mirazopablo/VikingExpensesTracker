"use client";

import React, { useState } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { ActiveView } from '../types/financial';
import {
  LayoutDashboard,
  CalendarClock,
  CreditCard,
  ShoppingBag,
  Plus,
} from 'lucide-react';
import { QuickMovementModal } from './QuickMovementModal';

export const BottomNavigation: React.FC = () => {
  const { activeView, setActiveView, activeProfile } = useFinancialContext();
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

  const isCardSimulatorEnabled = activeProfile?.preferences?.enableCardSimulator ?? true;

  const leftNavItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = isCardSimulatorEnabled
    ? [
        { id: 'summary', label: 'Resumen', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'fixed', label: 'Fijos', icon: <CalendarClock className="w-5 h-5" /> },
      ]
    : [
        { id: 'summary', label: 'Resumen', icon: <LayoutDashboard className="w-5 h-5" /> },
      ];

  const rightNavItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = isCardSimulatorEnabled
    ? [
        { id: 'cards' as ActiveView, label: 'Tarjetas', icon: <CreditCard className="w-5 h-5" /> },
        { id: 'installments' as ActiveView, label: 'Cuotas', icon: <ShoppingBag className="w-5 h-5" /> },
      ]
    : [
        { id: 'fixed', label: 'Fijos', icon: <CalendarClock className="w-5 h-5" /> },
      ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-2xl transition-all shadow-2xl">
        {/* Barra de Navegación Sectorizada con Botón (+) Centrado */}
        <nav className="grid grid-cols-5 items-center px-2.5 py-2 relative">
          {/* Grupo Izquierdo: Sectores 1 y 2 */}
          <div className="col-span-2 flex items-center justify-around gap-1.5">
            {leftNavItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 min-h-[50px] py-1.5 px-1.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-b from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950/60 font-bold scale-[1.02]'
                      : 'bg-slate-900/50 border-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700/80'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-mono mt-0.5 tracking-tight font-medium">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Botón Central (+) Centrado y Elevado con Halo Sutil (Sin shape trasero) */}
          <div className="col-span-1 flex justify-center items-center relative">
            <button
              type="button"
              onClick={() => setIsQuickModalOpen(true)}
              className="-mt-5 w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 border-4 border-slate-950 ring-2 ring-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer z-10"
              title="Registrar Nuevo Movimiento"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
          </div>

          {/* Grupo Derecho: Sectores 3 y 4 */}
          <div className="col-span-2 flex items-center justify-around gap-1.5">
            {rightNavItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 min-h-[50px] py-1.5 px-1.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-b from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950/60 font-bold scale-[1.02]'
                      : 'bg-slate-900/50 border-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700/80'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-mono mt-0.5 tracking-tight font-medium">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <QuickMovementModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
      />
    </>
  );
};
