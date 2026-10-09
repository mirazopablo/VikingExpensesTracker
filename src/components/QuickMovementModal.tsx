"use client";

import React, { useState } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { TransactionType, PaymentMethod, Currency } from '../types/financial';
import { X, PlusCircle, DollarSign, TrendingUp, TrendingDown, CreditCard as CardIcon, Banknote, Landmark } from 'lucide-react';

interface QuickMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickMovementModal: React.FC<QuickMovementModalProps> = ({ isOpen, onClose }) => {
  const { addDailyExpense, creditCards, activeProfile } = useFinancialContext();

  const isCardSimulatorEnabled = activeProfile?.preferences?.enableCardSimulator ?? true;

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards.length > 0 ? creditCards[0].id : '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) return;

    addDailyExpense(
      description.trim(),
      Number(amount),
      paymentMethod,
      type === 'EXPENSE' && paymentMethod === 'CREDIT_CARD' ? selectedCardId : undefined,
      type === 'INCOME' ? 'Ingreso Variable' : 'Gasto Diario',
      currency,
      type
    );

    setDescription('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {type === 'INCOME' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-tight">Nuevo Movimiento</h3>
              <p className="text-xs text-slate-400">Registra un ingreso o gasto de inmediato</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Toggle Type: Expense (-) vs Income (+) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" /> Gasto (-)
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Ingreso (+)
            </button>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Descripción / Concepto</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={type === 'INCOME' ? 'Ej. Trabajo Freelance, Reembolso, Regalo...' : 'Ej. Supermercado, Almuerzo, Nafta...'}
              required
              autoFocus
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Currency & Amount */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4">
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Moneda
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-3 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="ARS">ARS ($)</option>
                <option value="USD">USD (US$)</option>
              </select>
            </div>

            <div className="col-span-8">
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Monto ({currency})</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="0.00"
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono text-lg font-bold focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Medio de Operación</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="CASH">Efectivo</option>
              <option value="DEBIT">Transferencia / Débito</option>
              {type === 'EXPENSE' && isCardSimulatorEnabled && <option value="CREDIT_CARD">Tarjeta de Crédito (1 Pago)</option>}
            </select>
          </div>

          {type === 'EXPENSE' && paymentMethod === 'CREDIT_CARD' && (
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Seleccionar Tarjeta</label>
              <select
                value={selectedCardId}
                onChange={e => setSelectedCardId(e.target.value)}
                disabled={creditCards.length === 0}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                {creditCards.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs uppercase hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase font-mono tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Registrar {type === 'INCOME' ? 'Ingreso' : 'Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
