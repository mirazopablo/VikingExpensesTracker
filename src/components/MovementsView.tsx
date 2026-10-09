"use client";

import React, { useState } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { PaymentMethod, Currency } from '../types/financial';
import { ArrowUpDown, PlusCircle, Trash2, Calendar, CreditCard as CardIcon, Banknote, Landmark, DollarSign } from 'lucide-react';

export const MovementsView: React.FC = () => {
  const { dailyExpenses, addDailyExpense, deleteDailyExpense, creditCards, convert, selectedRateType, activeProfile } = useFinancialContext();

  const isCardSimulatorEnabled = activeProfile?.preferences?.enableCardSimulator ?? true;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards.length > 0 ? creditCards[0].id : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) return;

    addDailyExpense(
      description.trim(),
      Number(amount),
      paymentMethod,
      paymentMethod === 'CREDIT_CARD' ? selectedCardId : undefined,
      'General',
      currency
    );

    setDescription('');
    setAmount('');
  };

  const getMethodBadge = (method: PaymentMethod, cardId?: string) => {
    const card = cardId ? creditCards.find(c => c.id === cardId) : undefined;
    switch (method) {
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Banknote className="w-3.5 h-3.5" /> Efectivo
          </span>
        );
      case 'DEBIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Landmark className="w-3.5 h-3.5" /> Débito
          </span>
        );
      case 'CREDIT_CARD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CardIcon className="w-3.5 h-3.5" /> {card ? card.name : 'Tarjeta de Crédito'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Form Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ArrowUpDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Registrar Gasto Diario Variable</h3>
            <p className="text-xs text-slate-400">Registra salidas diarias esporádicas y compras inmediatas en ARS o USD</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej. Supermercado, Café, Taxi..."
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Moneda
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as Currency)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="ARS">ARS ($)</option>
              <option value="USD">USD (US$)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Monto</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="0.00"
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Medio de Pago</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="CASH">Efectivo</option>
              <option value="DEBIT">Débito</option>
              {isCardSimulatorEnabled && <option value="CREDIT_CARD">Crédito (1 Pago)</option>}
            </select>
          </div>

          {paymentMethod === 'CREDIT_CARD' && (
            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Tarjeta</label>
              <select
                value={selectedCardId}
                onChange={e => setSelectedCardId(e.target.value)}
                disabled={creditCards.length === 0}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                {creditCards.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={`${paymentMethod === 'CREDIT_CARD' ? 'md:col-span-12 flex justify-end' : 'md:col-span-2 flex items-end'}`}>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Registrar
            </button>
          </div>
        </form>
      </div>

      {/* Movements List Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Historial de Movimientos Diarios ({dailyExpenses.length})
          </span>
        </div>

        {dailyExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-mono border border-dashed border-slate-800 rounded-xl">
            Aún no se han registrado movimientos diarios.
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {dailyExpenses.map(item => {
              const itemCurr = item.currency || 'ARS';
              const equiv = itemCurr === 'ARS'
                ? `≈ US$ ${convert(item.amount, 'ARS', 'USD').toFixed(2)}`
                : `≈ $ ${convert(item.amount, 'USD', 'ARS').toFixed(0)}`;
              return (
                <li key={item.id} className="py-4 flex items-center justify-between gap-4 group hover:bg-slate-800/20 px-3 rounded-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-slate-800/60 text-slate-400 group-hover:text-white transition-colors">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white block">{item.description}</span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-1">
                        <span>{item.transactionDate}</span>
                        <span>•</span>
                        {getMethodBadge(item.paymentMethod, item.creditCardId)}
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-semibold">{itemCurr}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-rose-400 tabular-nums block">
                        -{itemCurr === 'USD' ? 'US$' : '$'}{item.amount.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        {equiv} ({selectedRateType})
                      </span>
                    </div>
                    <button
                      onClick={() => deleteDailyExpense(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                      title="Eliminar movimiento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
