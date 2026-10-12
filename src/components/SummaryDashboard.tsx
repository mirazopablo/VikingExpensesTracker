"use client";

import React, { useState, useMemo } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { isInstallmentActiveInMonth } from '../lib/projectionEngine';
import {
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard as CardIcon,
  ShieldAlert,
  DollarSign,
  ArrowUpDown,
  Calendar,
  Trash2,
  CheckCircle,
  Clock,
  CalendarClock,
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const SummaryDashboard: React.FC = () => {
  const {
    incomes,
    toggleIncomeConfirmation,
    fixedExpenses,
    toggleFixedExpenseConfirmation,
    installmentPurchases,
    dailyExpenses,
    deleteDailyExpense,
    safetyMargin,
    setSafetyMargin,
    convert,
    selectedRateType,
    activeProfile,
    setActiveView
  } = useFinancialContext();

  const now = new Date();
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentRealYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentRealMonth);

  const isBimonedaEnabled = activeProfile?.preferences?.enableBimoneda ?? true;
  const isCardSimulatorEnabled = activeProfile?.preferences?.enableCardSimulator ?? true;

  const isCurrentMonth = selectedYear === currentRealYear && selectedMonth === currentRealMonth;
  const isPastMonth = (selectedYear * 12 + selectedMonth) < (currentRealYear * 12 + currentRealMonth);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    // Block navigating beyond current month to keep cashflow realistic
    if (isCurrentMonth) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const selectedYearMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const monthlyBalances = useMemo(() => {
    // --- Balances en ARS ---
    const arsIncomes = incomes.filter(i => (i.currency || 'ARS') === 'ARS');
    const confirmedIncomeARS = arsIncomes
      .filter(i => i.confirmedMonths?.includes(selectedYearMonthStr))
      .reduce((acc, inc) => acc + inc.amount, 0);
    const pendingIncomeARS = arsIncomes
      .filter(i => !i.confirmedMonths?.includes(selectedYearMonthStr))
      .reduce((acc, inc) => acc + inc.amount, 0);
    const totalExpectedIncomeARS = confirmedIncomeARS + pendingIncomeARS;

    const dailyIncomeARS = dailyExpenses
      .filter(de => de.transactionDate.startsWith(selectedYearMonthStr) && (de.currency || 'ARS') === 'ARS' && de.type === 'INCOME')
      .reduce((acc, de) => acc + de.amount, 0);

    const realCashIncomeARS = confirmedIncomeARS + dailyIncomeARS;
    const totalBudgetIncomeARS = totalExpectedIncomeARS + dailyIncomeARS;

    const activeFixedARS = fixedExpenses.filter(fe => fe.isActive && (fe.currency || 'ARS') === 'ARS');
    const confirmedFixedARS = activeFixedARS
      .filter(fe => fe.confirmedMonths?.includes(selectedYearMonthStr))
      .reduce((acc, fe) => acc + fe.amount, 0);
    const pendingFixedARS = activeFixedARS
      .filter(fe => !fe.confirmedMonths?.includes(selectedYearMonthStr))
      .reduce((acc, fe) => acc + fe.amount, 0);
    const totalExpectedFixedARS = confirmedFixedARS + pendingFixedARS;

    const installmentsARS = installmentPurchases
      .filter(p => isInstallmentActiveInMonth(p, selectedYearMonthStr) && (p.currency || 'ARS') === 'ARS')
      .reduce((acc, p) => acc + p.installmentAmount, 0);

    const dailyExpenseARS = dailyExpenses
      .filter(de => de.transactionDate.startsWith(selectedYearMonthStr) && (de.currency || 'ARS') === 'ARS' && de.type !== 'INCOME')
      .reduce((acc, de) => acc + de.amount, 0);

    // Flujo de Caja Real Líquido en Mano
    const liquidCashARS = realCashIncomeARS - confirmedFixedARS - installmentsARS - dailyExpenseARS;
    // Proyección de Fin de Mes (Presupuestado)
    const projectedAvailableARS = totalBudgetIncomeARS - totalExpectedFixedARS - installmentsARS - dailyExpenseARS;

    // --- Balances en USD ---
    const usdIncomes = incomes.filter(i => i.currency === 'USD');
    const confirmedIncomeUSD = usdIncomes
      .filter(i => i.confirmedMonths?.includes(selectedYearMonthStr))
      .reduce((acc, inc) => acc + inc.amount, 0);
    const pendingIncomeUSD = usdIncomes
      .filter(i => !i.confirmedMonths?.includes(selectedYearMonthStr))
      .reduce((acc, inc) => acc + inc.amount, 0);
    const totalExpectedIncomeUSD = confirmedIncomeUSD + pendingIncomeUSD;

    const dailyIncomeUSD = dailyExpenses
      .filter(de => de.transactionDate.startsWith(selectedYearMonthStr) && de.currency === 'USD' && de.type === 'INCOME')
      .reduce((acc, de) => acc + de.amount, 0);

    const realCashIncomeUSD = confirmedIncomeUSD + dailyIncomeUSD;
    const totalBudgetIncomeUSD = totalExpectedIncomeUSD + dailyIncomeUSD;

    const activeFixedUSD = fixedExpenses.filter(fe => fe.isActive && fe.currency === 'USD');
    const confirmedFixedUSD = activeFixedUSD
      .filter(fe => fe.confirmedMonths?.includes(selectedYearMonthStr))
      .reduce((acc, fe) => acc + fe.amount, 0);
    const pendingFixedUSD = activeFixedUSD
      .filter(fe => !fe.confirmedMonths?.includes(selectedYearMonthStr))
      .reduce((acc, fe) => acc + fe.amount, 0);
    const totalExpectedFixedUSD = confirmedFixedUSD + pendingFixedUSD;

    const installmentsUSD = installmentPurchases
      .filter(p => isInstallmentActiveInMonth(p, selectedYearMonthStr) && p.currency === 'USD')
      .reduce((acc, p) => acc + p.installmentAmount, 0);

    const dailyExpenseUSD = dailyExpenses
      .filter(de => de.transactionDate.startsWith(selectedYearMonthStr) && de.currency === 'USD' && de.type !== 'INCOME')
      .reduce((acc, de) => acc + de.amount, 0);

    const liquidCashUSD = realCashIncomeUSD - confirmedFixedUSD - installmentsUSD - dailyExpenseUSD;
    const projectedAvailableUSD = totalBudgetIncomeUSD - totalExpectedFixedUSD - installmentsUSD - dailyExpenseUSD;

    return {
      ars: {
        liquidCash: liquidCashARS,
        projectedAvailable: projectedAvailableARS,
        confirmedIncome: confirmedIncomeARS,
        pendingIncome: pendingIncomeARS,
        totalIncome: totalBudgetIncomeARS,
        confirmedFixed: confirmedFixedARS,
        pendingFixed: pendingFixedARS,
        totalFixed: totalExpectedFixedARS,
        totalInstallments: installmentsARS,
        totalDaily: dailyExpenseARS,
      },
      usd: {
        liquidCash: liquidCashUSD,
        projectedAvailable: projectedAvailableUSD,
        confirmedIncome: confirmedIncomeUSD,
        pendingIncome: pendingIncomeUSD,
        totalIncome: totalBudgetIncomeUSD,
        confirmedFixed: confirmedFixedUSD,
        pendingFixed: pendingFixedUSD,
        totalFixed: totalExpectedFixedUSD,
        totalInstallments: installmentsUSD,
        totalDaily: dailyExpenseUSD,
      }
    };
  }, [incomes, fixedExpenses, installmentPurchases, dailyExpenses, selectedYearMonthStr]);

  const unifiedLiquidCashARS = monthlyBalances.ars.liquidCash + convert(monthlyBalances.usd.liquidCash, 'USD', 'ARS');
  const unifiedProjectedARS = monthlyBalances.ars.projectedAvailable + convert(monthlyBalances.usd.projectedAvailable, 'USD', 'ARS');

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
          <div className="px-3 text-center flex-1 sm:flex-none min-w-[170px] flex items-center justify-center gap-1.5">
            <span className="text-sm font-bold text-white tracking-tight font-mono uppercase">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
            {isCurrentMonth && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold border border-emerald-500/30">
                En curso
              </span>
            )}
            {isPastMonth && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono font-semibold">
                Histórico
              </span>
            )}
          </div>
          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
            title={isCurrentMonth ? "El mes siguiente está bloqueado (mes en curso)" : "Mes Siguiente"}
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
        <div className={`${isBimonedaEnabled ? 'lg:col-span-6' : 'lg:col-span-12'} bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-7 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[240px]`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Wallet className="w-48 h-48 text-emerald-400 -mr-12 -mt-12" />
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full inline-block animate-pulse ${monthlyBalances.ars.liquidCash < 0 ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
              Flujo de Caja Real en Mano (ARS)
            </span>
            <div
              className={`mt-3 text-4xl sm:text-5xl font-bold font-mono tracking-tight tabular-nums transition-colors ${monthlyBalances.ars.liquidCash < 0
                  ? 'text-rose-500'
                  : monthlyBalances.ars.liquidCash < safetyMargin
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
            >
              ${monthlyBalances.ars.liquidCash.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            
            {/* Proyección y Estado de Sueldo */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">
                Proyectado Fin de Mes: <strong className="text-emerald-400 font-bold">${monthlyBalances.ars.projectedAvailable.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </span>
              {monthlyBalances.ars.pendingIncome > 0 && (
                <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Sueldo pendiente (+${monthlyBalances.ars.pendingIncome.toLocaleString('es-AR', { minimumFractionDigits: 0 })})
                </span>
              )}
            </div>

            {isBimonedaEnabled && (
              <span className="text-xs font-mono text-emerald-400/80 block mt-1.5">
                ≈ US$ {convert(monthlyBalances.ars.liquidCash, 'ARS', 'USD').toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Tasa {selectedRateType.toUpperCase()})
              </span>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Mes: {selectedYearMonthStr}</span>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${monthlyBalances.ars.liquidCash >= safetyMargin
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
            >
              {monthlyBalances.ars.liquidCash >= safetyMargin ? 'Margen Viable' : 'Alerta de Liquidez'}
            </span>
          </div>
        </div>

        {/* USD Available Cash Hero Card (Only if Bimoneda enabled for active profile) */}
        {isBimonedaEnabled && (
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-7 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[240px]">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <DollarSign className="w-48 h-48 text-teal-400 -mr-12 -mt-12" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full inline-block animate-pulse ${monthlyBalances.usd.liquidCash < 0 ? 'bg-rose-500' : 'bg-teal-400'}`}></span>
                Flujo de Caja Real en Mano (USD)
              </span>
              <div
                className={`mt-3 text-4xl sm:text-5xl font-bold font-mono tracking-tight tabular-nums transition-colors ${monthlyBalances.usd.liquidCash < 0 ? 'text-rose-500' : 'text-teal-300'
                  }`}
              >
                US$ {monthlyBalances.usd.liquidCash.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2.5 text-xs font-mono text-slate-400">
                Proyectado Fin de Mes: <strong className="text-teal-400 font-bold">US$ {monthlyBalances.usd.projectedAvailable.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              <span className="text-xs font-mono text-teal-400/80 block mt-1.5">
                ≈ ARS ${convert(monthlyBalances.usd.liquidCash, 'USD', 'ARS').toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Tasa {selectedRateType.toUpperCase()})
              </span>
            </div>

            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Mes: {selectedYearMonthStr}</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Total Unificado Real: ${unifiedLiquidCashARS.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ARS
              </span>
            </div>
          </div>
        )}

        {/* Sub-balances breakdown cards */}
        <div className={`lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 ${isCardSimulatorEnabled ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          {/* Income Card */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Ingresos del Mes</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                ARS: +${monthlyBalances.ars.confirmedIncome.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              {monthlyBalances.ars.pendingIncome > 0 && (
                <div className="text-xs font-mono text-amber-400">
                  Pendiente: +${monthlyBalances.ars.pendingIncome.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              )}
              {isBimonedaEnabled && (
                <div className="text-sm font-bold font-mono text-emerald-300/80 tabular-nums">
                  USD: +US$ {monthlyBalances.usd.confirmedIncome.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              )}
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">Acreditados en Cuenta</span>
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
                ARS: -${monthlyBalances.ars.confirmedFixed.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              {monthlyBalances.ars.pendingFixed > 0 && (
                <div className="text-xs font-mono text-slate-400">
                  Por pagar: -${monthlyBalances.ars.pendingFixed.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              )}
              {isBimonedaEnabled && (
                <div className="text-sm font-bold font-mono text-rose-300/80 tabular-nums">
                  USD: -US$ {monthlyBalances.usd.confirmedFixed.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              )}
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">Pagados este Mes</span>
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

      {/* Control de Cobros y Pagos del Mes (Cashflow Execution Center) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incomes Confirmation Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Sueldos & Ingresos del Mes
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              {incomes.filter(i => i.confirmedMonths?.includes(selectedYearMonthStr)).length}/{incomes.length} cobrados
            </span>
          </div>

          {incomes.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs font-mono">
              No hay ingresos configurados. Ve a la sección &quot;Fijos&quot; para registrar tu sueldo.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {incomes.map(item => {
                const isConfirmed = item.confirmedMonths?.includes(selectedYearMonthStr);
                const itemCurr = item.currency || 'ARS';
                return (
                  <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-medium text-white block">
                        {item.description}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                        Cobro habitual: día {item.collectionDay}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                        +{itemCurr === 'USD' ? 'US$' : '$'}{item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => toggleIncomeConfirmation(item.id, selectedYearMonthStr)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isConfirmed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                        }`}
                        title={isConfirmed ? "Click para desmarcar cobro" : "Informar cobro efectivo para este mes"}
                      >
                        {isConfirmed ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Cobrado
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" /> Informar Cobro
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Fixed Expenses Confirmation Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              Servicios & Gastos Fijos del Mes
            </span>
            <span className="text-[11px] font-mono text-rose-400">
              {fixedExpenses.filter(fe => fe.isActive && fe.confirmedMonths?.includes(selectedYearMonthStr)).length}/{fixedExpenses.filter(fe => fe.isActive).length} pagados
            </span>
          </div>

          {fixedExpenses.filter(fe => fe.isActive).length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs font-mono">
              No hay servicios o gastos fijos activos configurados.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {fixedExpenses.filter(fe => fe.isActive).map(item => {
                const isConfirmed = item.confirmedMonths?.includes(selectedYearMonthStr);
                const itemCurr = item.currency || 'ARS';
                return (
                  <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-medium text-white block">
                        {item.description}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                        Vence: día {item.dueDay}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-rose-400 tabular-nums">
                        -{itemCurr === 'USD' ? 'US$' : '$'}{item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => toggleFixedExpenseConfirmation(item.id, selectedYearMonthStr)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isConfirmed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                        }`}
                        title={isConfirmed ? "Click para desmarcar pago" : "Informar pago realizado para este mes"}
                      >
                        {isConfirmed ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Pagado
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" /> Informar Pago
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

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

        <div className="pt-4 mt-2 border-t border-slate-800/60 flex justify-end">
          <button
            onClick={() => setActiveView('movements')}
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
          >
            Abrir Historial Completo & Filtros de Cashflow <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
