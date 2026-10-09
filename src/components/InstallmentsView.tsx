"use client";

import React, { useState } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { Currency } from '../types/financial';
import { ShoppingBag, PlusCircle, Trash2, CreditCard as CardIcon, Layers, Calculator, ArrowRight, DollarSign } from 'lucide-react';

export const InstallmentsView: React.FC = () => {
  const { installmentPurchases, addInstallmentPurchase, deleteInstallmentPurchase, creditCards, setActiveView, convert, selectedRateType } = useFinancialContext();

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [totalInstallments, setTotalInstallments] = useState<number>(6);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards.length > 0 ? creditCards[0].id : '');

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !totalAmount || Number(totalAmount) <= 0 || !selectedCardId) return;

    addInstallmentPurchase(
      description.trim(),
      Number(totalAmount),
      totalInstallments,
      selectedCardId,
      purchaseDate,
      currency
    );

    setDescription('');
    setTotalAmount('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner directing to Simulator */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 rounded-2xl p-6 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">¿Quieres simular antes de comprar?</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Usa nuestro motor interactivo de proyección matemática para verificar si la compra en cuotas se ajusta a tu margen financiero antes de confirmar.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveView('summary')}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          Abrir Simulador <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Manual Installment Plan Form */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Registro Manual de Compras en Cuotas</h3>
            <p className="text-xs text-slate-400">Registra directamente compras en cuotas con tarjeta de crédito en ARS o USD sin pasar por el simulador</p>
          </div>
        </div>

        <form onSubmit={handleManualAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej. Smart TV OLED, Muebles..."
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Moneda
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as Currency)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="ARS">ARS ($)</option>
              <option value="USD">USD (US$)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Monto Total</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="0.00"
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Cuotas</label>
            <select
              value={totalInstallments}
              onChange={e => setTotalInstallments(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-2 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              {[1, 2, 3, 6, 9, 12, 18, 24, 36].map(num => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Fecha Compra</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Tarjeta</label>
            <select
              value={selectedCardId}
              onChange={e => setSelectedCardId(e.target.value)}
              disabled={creditCards.length === 0}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              {creditCards.map(card => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-12 flex justify-end">
            <button
              type="submit"
              disabled={!selectedCardId}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" /> Agregar Plan
            </button>
          </div>
        </form>
      </div>

      {/* Active Installment Plans List */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block pb-3 border-b border-slate-800 mb-3">
          Registro de Compras en Cuotas Activas ({installmentPurchases.length})
        </span>

        {installmentPurchases.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-mono border border-dashed border-slate-800 rounded-xl">
            No hay compras en cuotas activas registradas.
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {installmentPurchases.map(item => {
              const card = creditCards.find(c => c.id === item.creditCardId);
              const itemCurr = item.currency || 'ARS';
              const quotaEquiv = itemCurr === 'ARS'
                ? `≈ US$ ${convert(item.installmentAmount, 'ARS', 'USD').toFixed(2)}`
                : `≈ $ ${convert(item.installmentAmount, 'USD', 'ARS').toFixed(0)}`;
              return (
                <li key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-800/20 px-3 rounded-xl transition-all">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5 sm:mt-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block flex items-center gap-2">
                        {item.description}
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-semibold font-mono">{itemCurr}</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                        <span className="inline-flex items-center gap-1 text-purple-300">
                          <CardIcon className="w-3.5 h-3.5" /> {card ? card.name : 'Tarjeta Desconocida'}
                        </span>
                        <span>•</span>
                        <span>{item.totalInstallments} cuotas mensuales</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">Inicia en: {item.firstBillingYearMonth}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-400 block">Cuota Mensual</span>
                      <span className="text-lg font-bold font-mono text-amber-400 tabular-nums block">
                        {itemCurr === 'USD' ? 'US$' : '$'}{item.installmentAmount.toFixed(2)}/mes
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        {quotaEquiv} ({selectedRateType})
                      </span>
                    </div>
                    <div className="text-right border-l border-slate-800 pl-4">
                      <span className="text-xs font-mono text-slate-400 block">Monto Total</span>
                      <span className="text-sm font-mono text-slate-300 tabular-nums">
                        {itemCurr === 'USD' ? 'US$' : '$'}{item.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteInstallmentPurchase(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer shrink-0"
                      title="Eliminar plan de cuotas"
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
