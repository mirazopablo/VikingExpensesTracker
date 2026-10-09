"use client";

import React, { useState } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { ActiveView } from '../types/financial';
import { LayoutDashboard, ArrowUpDown, CalendarClock, CreditCard, ShoppingBag, Plus } from 'lucide-react';
import { QuickMovementModal } from './QuickMovementModal';

export const BottomNavigation: React.FC = () => {
  const { activeView, setActiveView, activeProfile } = useFinancialContext();
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

  const isCardSimulatorEnabled = activeProfile?.preferences?.enableCardSimulator ?? true;

  const leftNavItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Resumen', icon: <LayoutDashboard className="w-5 h-5" /> },
    ...(isCardSimulatorEnabled
      ? [{ id: 'movements' as ActiveView, label: 'Diarios', icon: <ArrowUpDown className="w-5 h-5" /> }]
      : [])
  ];

  const rightNavItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'fixed', label: 'Fijos', icon: <CalendarClock className="w-5 h-5" /> },
    ...(isCardSimulatorEnabled
      ? [
          { id: 'cards' as ActiveView, label: 'Tarjetas', icon: <CreditCard className="w-5 h-5" /> },
          { id: 'installments' as ActiveView, label: 'Cuotas', icon: <ShoppingBag className="w-5 h-5" /> }
        ]
      : [])
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl shadow-2xl transition-all">
        <nav className="grid grid-cols-3 items-center py-1.5 px-2 relative">
          {/* Left Nav Group - Centered in Left Half */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
            {leftNavItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10 font-bold scale-105'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
                  <span className="text-[10px] font-mono mt-0.5 tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Central Floating Action Button (+) MercadoPago style */}
          <div className="relative -top-5 flex justify-center items-center">
            <button
              onClick={() => setIsQuickModalOpen(true)}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 border-4 border-slate-950 ring-2 ring-emerald-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Registrar Nuevo Movimiento"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
          </div>

          {/* Right Nav Group - Centered in Right Half */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
            {rightNavItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10 font-bold scale-105'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
                  <span className="text-[10px] font-mono mt-0.5 tracking-tight">{item.label}</span>
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
