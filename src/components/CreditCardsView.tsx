"use client";

import React, { useState } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { Currency } from '../types/financial';
import { CreditCard as CardIcon, PlusCircle, Trash2, Calendar, DollarSign, ShieldCheck, Layers } from 'lucide-react';

export const CreditCardsView: React.FC = () => {
  const { creditCards, addCreditCard, deleteCreditCard, installmentPurchases, convert, selectedRateType } = useFinancialContext();

  const [name, setName] = useState('');
  const [closingDay, setClosingDay] = useState<number>(24);
  const [dueDay, setDueDay] = useState<number>(4);
  const [creditLimit, setCreditLimit] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('ARS');

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !creditLimit || Number(creditLimit) <= 0) return;

    addCreditCard(name.trim(), closingDay, dueDay, Number(creditLimit), currency);
    setName('');
    setCreditLimit('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Add Card Form */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CardIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Configuración de Tarjetas y Cierres</h3>
            <p className="text-xs text-slate-400">
              Configura las fechas exactas de cierre (`Día de Cierre`) y vencimiento para el cálculo preciso del flujo
            </p>
          </div>
        </div>

        <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Banco / Tarjeta</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Visa Platinum - Banco X..."
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Moneda
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as Currency)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-purple-400 font-mono font-bold focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
            >
              <option value="ARS">ARS ($)</option>
              <option value="USD">USD (US$)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Día de Cierre (1-31)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={closingDay}
              onChange={e => setClosingDay(parseInt(e.target.value) || 24)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Día Vence (1-31)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={e => setDueDay(parseInt(e.target.value) || 4)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Límite Aprobado</label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={creditLimit}
              onChange={e => setCreditLimit(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="5000"
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full px-3 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Agregar tarjeta"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Credit Cards Visual Grid */}
      <div>
        <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-4">
          Tarjetas de Crédito Activas ({creditCards.length})
        </h4>

        {creditCards.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-mono border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            Aún no has configurado ninguna tarjeta de crédito. Agrega tu primera tarjeta arriba para habilitar simulaciones y proyecciones.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditCards.map(card => {
              const activeInstallmentsCount = installmentPurchases.filter(p => p.creditCardId === card.id).length;
              const totalCommitted = installmentPurchases
                .filter(p => p.creditCardId === card.id)
                .reduce((acc, p) => acc + convert(p.totalAmount, p.currency || 'ARS', card.currency || 'ARS'), 0);

              const cardCurr = card.currency || 'ARS';
              const limitEquiv = cardCurr === 'ARS'
                ? `≈ US$ ${convert(card.creditLimit, 'ARS', 'USD').toFixed(0)}`
                : `≈ $ ${convert(card.creditLimit, 'USD', 'ARS').toFixed(0)}`;

              return (
                <div
                  key={card.id}
                  className="bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-950 rounded-3xl p-6 border border-purple-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px] group hover:border-purple-500/40 transition-all"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <CardIcon className="w-40 h-40 text-purple-400 -mr-8 -mt-8" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-mono uppercase tracking-widest text-purple-300 font-bold flex items-center gap-1.5">
                          INSTRUMENTO DE CRÉDITO
                          <span className="bg-purple-900/60 px-1.5 py-0.5 rounded text-[10px] text-white">{cardCurr}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => deleteCreditCard(card.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar tarjeta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h5 className="text-lg font-bold text-white tracking-tight">{card.name}</h5>
                    <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" /> Cierre: Día {card.closingDay}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Vence: Día {card.dueDay}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 mt-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">LÍMITE APROBADO</span>
                      <span className="text-xl font-bold font-mono text-white tabular-nums">
                        {cardCurr === 'USD' ? 'US$' : '$'}{card.creditLimit.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {limitEquiv} ({selectedRateType})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block flex items-center justify-end gap-1">
                        <Layers className="w-3 h-3" /> COMPRAS ACT.
                      </span>
                      <span className="text-sm font-semibold font-mono text-purple-300 block">
                        {activeInstallmentsCount} ({activeInstallmentsCount === 1 ? 'plan' : 'planes'})
                      </span>
                      {totalCommitted > 0 && (
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          {cardCurr === 'USD' ? 'US$' : '$'}{totalCommitted.toLocaleString()} comprometidos
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
