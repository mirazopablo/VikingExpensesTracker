"use client";

import React, { useState, useMemo } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { isInstallmentActiveInMonth } from '../lib/projectionEngine';
import { CreditCardSimulator } from './CreditCardSimulator';
import { ChevronLeft, ChevronRight, Wallet, TrendingUp, TrendingDown, CreditCard as CardIcon, ShieldAlert, DollarSign, ArrowUpDown, Calendar, Trash2 } from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const SummaryDashboard: React.FC = () => {
  const {
    incomes,
    fixedExpenses,
    installmentPurchases,
    dailyExpenses,
    deleteDailyExpense,
    safetyMargin,
    setSafetyMargin,
    convert,
    selectedRateType,
    activeProfile
  } = useFinancialContext();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  const isBimonedaEnabled = activeProfile?.preferences?.enableBimoneda ?? true;
  const isCardSimulatorEnabled = activeProfile?.preferences?.enableCardSimulator ?? true;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const selectedYearMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const monthlyBalances = useMemo(() => {
    // Balances en ARS
    const baseIncomeARS = incomes.filter(i => (i.currency || 'ARS') === 'ARS').reduce((acc, inc) => acc + inc.amount, 0);
    const dailyIncomeARS = dailyExpenses
      .filter(de => de.transactionDate.startsWith(selectedYearMonthStr) && (de.currency || 'ARS') === 'ARS' && de.type === 'INCOME')
      .reduce((acc, de) => acc + de.amount, 0);
    const totalIncomeARS = baseIncomeARS + dailyIncomeARS;

    const fixedARS = fixedExpenses.filter(fe => fe.isActive && (fe.currency || 'ARS') === 'ARS').reduce((acc, fe) => acc + fe.amount, 0);
    const installmentsARS = installmentPurchases.filter(p => isInstallmentActiveInMonth(p, selectedYearMonthStr) && (p.currency || 'ARS') === 'ARS').reduce((acc, p) => acc + p.installmentAmount, 0);
    const dailyExpenseARS = dailyExpenses
      .filter(de => de.transactionDate.startsWith(selectedYearMonthStr) && (de.currency || 'ARS') === 'ARS' && de.type !== 'INCOME')
      .reduce((acc, de) => acc + de.amount, 0);

    const availableARS = totalIncomeARS - fixedARS - installmentsARS - dailyExpenseARS;

    // Balances en USD
    const baseIncomeUSD = incomes.filter(i => i.currency === 'USD').reduce((acc, inc) => acc + inc.amount, 0);
    const dailyIncomeUSD = dailyExpenses
      .filter(de => de.transactionDate.startsWith(selectedYearMonthStr) && de.currency === 'USD' && de.type === 'INCOME')
      .reduce((acc, de) => acc + de.amount, 0);
    const totalIncomeUSD = baseIncomeUSD + dailyIncomeUSD;

    const fixedUSD = fixedExpenses.filter(fe => fe.isActive && fe.currency === 'USD').reduce((acc, fe) => acc + fe.amount, 0);
    const installmentsUSD = installmentPurchases.filter(p => isInstallmentActiveInMonth(p, selectedYearMonthStr) && p.currency === 'USD').reduce((acc, p) => acc + p.installmentAmount, 0);
    const dailyExpenseUSD = dailyExpenses
      .filter(de => de.transactionDate.startsWith(selectedYearMonthStr) && de.currency === 'USD' && de.type !== 'INCOME')
      .reduce((acc, de) => acc + de.amount, 0);

    const availableUSD = totalIncomeUSD - fixedUSD - installmentsUSD - dailyExpenseUSD;

    return {
      ars: { totalIncome: totalIncomeARS, totalFixed: fixedARS, totalInstallments: installmentsARS, totalDaily: dailyExpenseARS, available: availableARS },
      usd: { totalIncome: totalIncomeUSD, totalFixed: fixedUSD, totalInstallments: installmentsUSD, totalDaily: dailyExpenseUSD, available: availableUSD }
    };
  }, [incomes, fixedExpenses, installmentPurchases, dailyExpenses, selectedYearMonthStr]);

  const unifiedAvailableARS = monthlyBalances.ars.available + convert(monthlyBalances.usd.available, 'USD', 'ARS');
  const unifiedAvailableUSD = monthlyBalances.usd.available + convert(monthlyBalances.ars.available, 'ARS', 'USD');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Month Selector & Safety Margin Controls Header */}
      <div className="flex flex-col items-center justify-center sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-lg backdrop-blur-md w-full max-w-xs sm:w-auto">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-all cursor-pointer"
            aria-label="Mes Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-3 text-center flex-1 sm:flex-none min-w-[150px]">
            <span className="text-sm font-bold text-white tracking-tight font-mono uppercase">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-all cursor-pointer"
            aria-label="Mes Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Safety cushion control */}
        <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-lg backdrop-blur-md w-full max-w-xs sm:w-auto">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase text-slate-400">Margen (ARS):</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-slate-400 mr-1 font-mono">$</span>
            <input
              type="number"
              value={safetyMargin}
              onChange={e => setSafetyMargin(parseFloat(e.target.value) || 0)}
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 text-right"
            />
          </div>
        </div>
      </div>

      {/* Hero Balance Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ARS Available Cash Hero Card */}
        <div className={`${isBimonedaEnabled ? 'lg:col-span-6' : 'lg:col-span-12'} bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-7 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px]`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Wallet className="w-48 h-48 text-emerald-400 -mr-12 -mt-12" />
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Saldo Disponible Mensual (ARS) • {activeProfile?.name}
            </span>
            <div
              className={`mt-3 text-4xl sm:text-5xl font-bold font-mono tracking-tight tabular-nums transition-colors ${
                monthlyBalances.ars.available < 0
                  ? 'text-rose-500'
                  : monthlyBalances.ars.available < safetyMargin
                  ? 'text-amber-400'
                  : 'text-white'
              }`}
            >
              ${monthlyBalances.ars.available.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {isBimonedaEnabled && (
              <span className="text-xs font-mono text-emerald-400/80 block mt-1">
                ≈ US$ {convert(monthlyBalances.ars.available, 'ARS', 'USD').toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Tasa {selectedRateType.toUpperCase()})
              </span>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Mes: {selectedYearMonthStr}</span>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                monthlyBalances.ars.available >= safetyMargin
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {monthlyBalances.ars.available >= safetyMargin ? 'Margen Viable' : 'Alerta de Liquidez'}
            </span>
          </div>
        </div>

        {/* USD Available Cash Hero Card (Only if Bimoneda enabled for active profile) */}
        {isBimonedaEnabled && (
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-7 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <DollarSign className="w-48 h-48 text-teal-400 -mr-12 -mt-12" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 inline-block animate-pulse"></span>
                Saldo Disponible Mensual (USD)
              </span>
              <div
                className={`mt-3 text-4xl sm:text-5xl font-bold font-mono tracking-tight tabular-nums transition-colors ${
                  monthlyBalances.usd.available < 0 ? 'text-rose-500' : 'text-teal-300'
                }`}
              >
                US$ {monthlyBalances.usd.available.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-xs font-mono text-teal-400/80 block mt-1">
                ≈ ARS ${convert(monthlyBalances.usd.available, 'USD', 'ARS').toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Tasa {selectedRateType.toUpperCase()})
              </span>
            </div>

            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Mes: {selectedYearMonthStr}</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Total Unificado: ${unifiedAvailableARS.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ARS
              </span>
            </div>
          </div>
        )}

        {/* Sub-balances breakdown cards */}
        <div className={`lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 ${isCardSimulatorEnabled ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          {/* Income Card */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Ingresos Totales</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                ARS: +${monthlyBalances.ars.totalIncome.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              {isBimonedaEnabled && (
                <div className="text-sm font-bold font-mono text-emerald-300/80 tabular-nums">
                  USD: +US$ {monthlyBalances.usd.totalIncome.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              )}
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">Flujos de Entrada</span>
            </div>
          </div>

          {/* Fixed Expenses Card */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Gastos Fijos</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-xl font-bold font-mono text-rose-400 tabular-nums">
                ARS: -${monthlyBalances.ars.totalFixed.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              {isBimonedaEnabled && (
                <div className="text-sm font-bold font-mono text-rose-300/80 tabular-nums">
                  USD: -US$ {monthlyBalances.usd.totalFixed.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              )}
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">Servicios Recurrentes</span>
            </div>
          </div>

          {/* Daily Expenses Card */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Gastos Diarios</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <ArrowUpDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-xl font-bold font-mono text-purple-400 tabular-nums">
                ARS: -${monthlyBalances.ars.totalDaily.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              {isBimonedaEnabled && (
                <div className="text-sm font-bold font-mono text-purple-300/80 tabular-nums">
                  USD: -US$ {monthlyBalances.usd.totalDaily.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              )}
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">Salidas Variables</span>
            </div>
          </div>

          {/* Installments Card (Only if credit card module enabled) */}
          {isCardSimulatorEnabled && (
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Cuotas de Tarjetas</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <CardIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                  ARS: -${monthlyBalances.ars.totalInstallments.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
                {isBimonedaEnabled && (
                  <div className="text-sm font-bold font-mono text-amber-300/80 tabular-nums">
                    USD: -US$ {monthlyBalances.usd.totalInstallments.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                )}
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">Vencimientos del Mes</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credit Card Simulator Component Section (Only if enabled in active profile) */}
      {isCardSimulatorEnabled && <CreditCardSimulator />}

      {/* Daily Movements List for Selected Month */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-emerald-400" />
            Movimientos Diarios del Mes ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {dailyExpenses.filter(de => de.transactionDate.startsWith(selectedYearMonthStr)).length} registros
          </span>
        </div>

        {dailyExpenses.filter(de => de.transactionDate.startsWith(selectedYearMonthStr)).length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800/80 rounded-xl">
            No hay movimientos diarios registrados para este mes. Toca el botón (+) flotante para agregar uno.
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {dailyExpenses
              .filter(de => de.transactionDate.startsWith(selectedYearMonthStr))
              .map(item => {
                const isInc = item.type === 'INCOME';
                const itemCurr = item.currency || 'ARS';
                const equiv = itemCurr === 'ARS'
                  ? `≈ US$ ${convert(item.amount, 'ARS', 'USD').toFixed(2)}`
                  : `≈ $ ${convert(item.amount, 'USD', 'ARS').toFixed(0)}`;
                return (
                  <li key={item.id} className="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-800/20 px-2 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isInc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/60 text-slate-400'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white block flex items-center gap-2">
                          {item.description}
                          {isInc && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                              Ingreso
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{item.transactionDate}</span>
                          <span>•</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-semibold">{itemCurr}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-sm sm:text-base font-bold font-mono tabular-nums block ${isInc ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isInc ? '+' : '-'}{itemCurr === 'USD' ? 'US$' : '$'}{item.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {equiv} ({selectedRateType})
                        </span>
                      </div>
                      <button
                        onClick={() => deleteDailyExpense(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
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
