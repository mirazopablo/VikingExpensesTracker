"use client";

import React, { useState } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { Currency } from '../types/financial';
import { TrendingUp, TrendingDown, PlusCircle, Trash2, CalendarClock, CheckCircle, PauseCircle, DollarSign } from 'lucide-react';

export const FixedFlowView: React.FC = () => {
  const {
    incomes,
    addIncome,
    deleteIncome,
    fixedExpenses,
    addFixedExpense,
    toggleFixedExpense,
    deleteFixedExpense,
    convert,
    selectedRateType
  } = useFinancialContext();

  // Incomes local state
  const [incDesc, setIncDesc] = useState('');
  const [incAmount, setIncAmount] = useState<number | ''>('');
  const [incCurrency, setIncCurrency] = useState<Currency>('ARS');
  const [incDay, setIncDay] = useState<number>(1);
  const [incRecurring, setIncRecurring] = useState<boolean>(true);

  // Fixed expenses local state
  const [fixedDesc, setFixedDesc] = useState('');
  const [fixedAmount, setFixedAmount] = useState<number | ''>('');
  const [fixedCurrency, setFixedCurrency] = useState<Currency>('ARS');
  const [fixedDay, setFixedDay] = useState<number>(10);

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc.trim() || !incAmount || Number(incAmount) <= 0) return;
    addIncome(incDesc.trim(), Number(incAmount), incDay, incRecurring, 'General', incCurrency);
    setIncDesc('');
    setIncAmount('');
  };

  const handleAddFixed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedDesc.trim() || !fixedAmount || Number(fixedAmount) <= 0) return;
    addFixedExpense(fixedDesc.trim(), Number(fixedAmount), fixedDay, 'General', fixedCurrency);
    setFixedDesc('');
    setFixedAmount('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
      {/* ===================== INCOMES SECTION ===================== */}
      <div className="space-y-6">
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ingresos Fijos y Recurrentes</h3>
              <p className="text-xs text-slate-400">Gestiona sueldos mensuales, honorarios y flujos de entrada</p>
            </div>
          </div>

          <form onSubmit={handleAddIncome} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Origen / Descripción</label>
              <input
                type="text"
                value={incDesc}
                onChange={e => setIncDesc(e.target.value)}
                placeholder="Ej. Sueldo Mensual, Contrato Freelance..."
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Moneda
                </label>
                <select
                  value={incCurrency}
                  onChange={e => setIncCurrency(e.target.value as Currency)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="ARS">ARS ($)</option>
                  <option value="USD">USD (US$)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={incAmount}
                  onChange={e => setIncAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Día Cobro (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={incDay}
                  onChange={e => setIncDay(parseInt(e.target.value) || 1)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incRecurring}
                  onChange={e => setIncRecurring(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                Ingreso Mensual Recurrente
              </label>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Agregar Ingreso
              </button>
            </div>
          </form>
        </div>

        {/* Incomes List */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block pb-3 border-b border-slate-800 mb-3">
            Directorio de Ingresos ({incomes.length})
          </span>
          {incomes.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono">No hay ingresos configurados.</div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {incomes.map(item => {
                const itemCurr = item.currency || 'ARS';
                const equiv = itemCurr === 'ARS'
                  ? `≈ US$ ${convert(item.amount, 'ARS', 'USD').toFixed(2)}`
                  : `≈ $ ${convert(item.amount, 'USD', 'ARS').toFixed(0)}`;
                return (
                  <li key={item.id} className="py-3.5 flex items-center justify-between gap-4 group">
                    <div>
                      <span className="text-sm font-medium text-white block flex items-center gap-2">
                        {item.description}
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-semibold font-mono">{itemCurr}</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-500" /> Día {item.collectionDay}
                        {item.isRecurring && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                            Recurrente
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-bold font-mono text-emerald-400 tabular-nums block">
                          +{itemCurr === 'USD' ? 'US$' : '$'}{item.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {equiv} ({selectedRateType})
                        </span>
                      </div>
                      <button
                        onClick={() => deleteIncome(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar ingreso"
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

      {/* ===================== FIXED EXPENSES SECTION ===================== */}
      <div className="space-y-6">
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Gastos Fijos Mensuales</h3>
              <p className="text-xs text-slate-400">Gestiona alquiler, servicios, suscripciones e impuestos</p>
            </div>
          </div>

          <form onSubmit={handleAddFixed} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Nombre del Servicio / Gasto</label>
              <input
                type="text"
                value={fixedDesc}
                onChange={e => setFixedDesc(e.target.value)}
                placeholder="Ej. Alquiler, Luz, Internet, Gimnasio..."
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Moneda
                </label>
                <select
                  value={fixedCurrency}
                  onChange={e => setFixedCurrency(e.target.value as Currency)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-rose-400 font-mono font-bold focus:outline-none focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="ARS">ARS ($)</option>
                  <option value="USD">USD (US$)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={fixedAmount}
                  onChange={e => setFixedAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Día Vence (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={fixedDay}
                  onChange={e => setFixedDay(parseInt(e.target.value) || 10)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Agregar Gasto Fijo
              </button>
            </div>
          </form>
        </div>

        {/* Fixed Expenses List */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block pb-3 border-b border-slate-800 mb-3">
            Directorio de Gastos Fijos ({fixedExpenses.length})
          </span>
          {fixedExpenses.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono">No hay gastos fijos configurados.</div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {fixedExpenses.map(item => {
                const itemCurr = item.currency || 'ARS';
                const equiv = itemCurr === 'ARS'
                  ? `≈ US$ ${convert(item.amount, 'ARS', 'USD').toFixed(2)}`
                  : `≈ $ ${convert(item.amount, 'USD', 'ARS').toFixed(0)}`;
                return (
                  <li key={item.id} className={`py-3.5 flex items-center justify-between gap-4 group ${!item.isActive ? 'opacity-50' : ''}`}>
                    <div>
                      <span className="text-sm font-medium text-white block flex items-center gap-2">
                        {item.description}
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-semibold font-mono">{itemCurr}</span>
                        {!item.isActive && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Pausado
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-500" /> Vence día {item.dueDay}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-bold font-mono text-rose-400 tabular-nums block">
                          -{itemCurr === 'USD' ? 'US$' : '$'}{item.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {equiv} ({selectedRateType})
                        </span>
                      </div>
                      <button
                        onClick={() => toggleFixedExpense(item.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          item.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-400 hover:bg-amber-500/10'
                        }`}
                        title={item.isActive ? 'Pausar ítem' : 'Activar ítem'}
                      >
                        {item.isActive ? <CheckCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteFixedExpense(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar gasto fijo"
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
    </div>
  );
};
