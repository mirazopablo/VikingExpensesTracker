"use client";

import React from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { ActiveView } from '../types/financial';
import { LayoutDashboard, ArrowUpDown, CalendarClock, CreditCard, ShoppingBag } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { activeView, setActiveView, activeProfile } = useFinancialContext();

  const isCardSimulatorEnabled = activeProfile?.preferences?.enableCardSimulator ?? true;

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Resumen', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'movements', label: 'Diarios', icon: <ArrowUpDown className="w-5 h-5" /> },
    { id: 'fixed', label: 'Fijos', icon: <CalendarClock className="w-5 h-5" /> },
    ...(isCardSimulatorEnabled
      ? [
          { id: 'cards' as ActiveView, label: 'Tarjetas', icon: <CreditCard className="w-5 h-5" /> },
          { id: 'installments' as ActiveView, label: 'Cuotas', icon: <ShoppingBag className="w-5 h-5" /> }
        ]
      : [])
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl shadow-2xl transition-all">
      <nav className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
              <span className="text-[10px] font-mono mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
