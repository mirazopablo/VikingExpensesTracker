"use client";

import React, { useState, useMemo } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { PaymentMethod, Currency, TransactionType } from '../types/financial';
import {
  ArrowUpDown,
  PlusCircle,
  Trash2,
  Calendar,
  CreditCard as CardIcon,
  Banknote,
  Landmark,
  DollarSign,
  Search,
  Filter,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MovementsView: React.FC = () => {
  const {
    dailyExpenses,
    addDailyExpense,
    deleteDailyExpense,
    creditCards,
    convert,
    selectedRateType,
    activeProfile
  } = useFinancialContext();

  const isBimonedaEnabled = activeProfile?.preferences?.enableBimoneda ?? true;
  const isCardSimulatorEnabled = activeProfile?.preferences?.enableCardSimulator ?? true;

  const now = new Date();
  const currentYearMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards.length > 0 ? creditCards[0].id : '');
  const [customDate, setCustomDate] = useState<string>(now.toISOString().split('T')[0]);

  // Filters State
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(currentYearMonthStr);
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | Currency>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [cardFilter, setCardFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract distinct available months from recorded data
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYearMonthStr);
    dailyExpenses.forEach(item => {
      if (item.transactionDate && item.transactionDate.length >= 7) {
        set.add(item.transactionDate.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [dailyExpenses, currentYearMonthStr]);

  const formatMonthLabel = (ym: string) => {
    const [yStr, mStr] = ym.split('-');
    const mNum = parseInt(mStr, 10);
    return `${MONTH_NAMES[mNum - 1]} ${yStr}`;
  };

  const handleResetFilters = () => {
    setSelectedMonthFilter('ALL');
    setTypeFilter('ALL');
    setCurrencyFilter('ALL');
    setMethodFilter('ALL');
    setCardFilter('ALL');
    setSearchQuery('');
  };

  const isFiltered =
    selectedMonthFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    currencyFilter !== 'ALL' ||
    methodFilter !== 'ALL' ||
    cardFilter !== 'ALL' ||
    searchQuery.trim() !== '';

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
    setIsFormOpen(false);
  };

  // Filtered movements list
  const filteredMovements = useMemo(() => {
    return dailyExpenses.filter(item => {
      // Month
      if (selectedMonthFilter !== 'ALL' && !item.transactionDate.startsWith(selectedMonthFilter)) {
        return false;
      }
      // Type
      if (typeFilter !== 'ALL') {
        const itemType = item.type || 'EXPENSE';
        if (itemType !== typeFilter) return false;
      }
      // Currency
      if (currencyFilter !== 'ALL') {
        const itemCurr = item.currency || 'ARS';
        if (itemCurr !== currencyFilter) return false;
      }
      // Method
      if (methodFilter !== 'ALL' && item.paymentMethod !== methodFilter) {
        return false;
      }
      // Card
      if (methodFilter === 'CREDIT_CARD' && cardFilter !== 'ALL' && item.creditCardId !== cardFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCat = item.category ? item.category.toLowerCase().includes(q) : false;
        if (!matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [dailyExpenses, selectedMonthFilter, typeFilter, currencyFilter, methodFilter, cardFilter, searchQuery]);

  // Financial Metrics for the filtered subset
  const metrics = useMemo(() => {
    let incomeARS = 0;
    let expenseARS = 0;
    let incomeUSD = 0;
    let expenseUSD = 0;

    filteredMovements.forEach(item => {
      const isInc = item.type === 'INCOME';
      const curr = item.currency || 'ARS';
      if (curr === 'ARS') {
        if (isInc) incomeARS += item.amount;
        else expenseARS += item.amount;
      } else {
        if (isInc) incomeUSD += item.amount;
        else expenseUSD += item.amount;
      }
    });

    const netARS = incomeARS - expenseARS;
    const netUSD = incomeUSD - expenseUSD;

    return { incomeARS, expenseARS, netARS, incomeUSD, expenseUSD, netUSD };
  }, [filteredMovements]);

  const getMethodBadge = (method: PaymentMethod, cardId?: string) => {
    const card = cardId ? creditCards.find(c => c.id === cardId) : undefined;
    switch (method) {
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Banknote className="w-3 h-3" /> Efectivo
          </span>
        );
      case 'DEBIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Landmark className="w-3 h-3" /> Débito / Transf.
          </span>
        );
      case 'CREDIT_CARD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CardIcon className="w-3 h-3" /> {card ? card.name : 'Tarjeta de Crédito'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            Historial de Movimientos & Auditoría de Cashflow
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Filtra, audita y analiza entradas y salidas de efectivo para meses actuales y pasados
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          {isFormOpen ? 'Ocultar Formulario' : 'Nuevo Movimiento'}
          {isFormOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </button>
      </div>

      {/* Form Card (Collapsible) */}
      {isFormOpen && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <ArrowUpDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Registrar Movimiento Diario</h3>
                <p className="text-xs text-slate-400">Registra entradas (ingresos) o salidas (gastos) en ARS o USD</p>
              </div>
            </div>

            {/* Toggle Type */}
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  type === 'EXPENSE' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Gasto (-)
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  type === 'INCOME' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ingreso (+)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={type === 'INCOME' ? 'Ej. Venta, Reembolso, Regalo...' : 'Ej. Supermercado, Café, Taxi...'}
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
                <option value="DEBIT">Débito / Transf.</option>
                {type === 'EXPENSE' && isCardSimulatorEnabled && <option value="CREDIT_CARD">Crédito (1 Pago)</option>}
              </select>
            </div>

            {type === 'EXPENSE' && paymentMethod === 'CREDIT_CARD' && (
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

            <div className={`${type === 'EXPENSE' && paymentMethod === 'CREDIT_CARD' ? 'md:col-span-12 flex justify-end' : 'md:col-span-2 flex items-end'}`}>
              <button
                type="submit"
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                }`}
              >
                <PlusCircle className="w-4 h-4" /> Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Snapshot de Métricas Filtradas (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Entradas */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Entradas Filtradas
            </span>
          </div>
          <div className="mt-3 space-y-0.5">
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              +${metrics.incomeARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            {isBimonedaEnabled && (
              <div className="text-xs font-mono text-emerald-300/80 tabular-nums">
                +US$ {metrics.incomeUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>

        {/* Salidas */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Salidas Filtradas
            </span>
          </div>
          <div className="mt-3 space-y-0.5">
            <div className="text-xl font-bold font-mono text-rose-400 tabular-nums">
              -${metrics.expenseARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            {isBimonedaEnabled && (
              <div className="text-xs font-mono text-rose-300/80 tabular-nums">
                -US$ {metrics.expenseUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>

        {/* Flujo Neto */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" /> Flujo Neto (Δ Caja)
            </span>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                metrics.netARS >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {metrics.netARS >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>
          <div className="mt-3 space-y-0.5">
            <div
              className={`text-xl font-bold font-mono tabular-nums ${
                metrics.netARS >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics.netARS >= 0 ? '+' : ''}${metrics.netARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            {isBimonedaEnabled && (
              <div className={`text-xs font-mono tabular-nums ${metrics.netUSD >= 0 ? 'text-teal-300' : 'text-rose-300'}`}>
                {metrics.netUSD >= 0 ? '+' : ''}US$ {metrics.netUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Filtros Multidimensional */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            Filtros de Auditoría
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar Filtros
            </button>
          )}
        </div>

        {/* Fila 1: Selector de Mes & Buscador */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Selector de Mes */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5 text-slate-500" /> Período Temporal
            </label>
            <select
              value={selectedMonthFilter}
              onChange={e => setSelectedMonthFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Todo el Historial (Sin filtrar por mes)</option>
              {availableMonths.map(ym => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)} {ym === currentYearMonthStr ? '(Mes Actual)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador de Concepto */}
          <div className="md:col-span-8">
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-slate-500" /> Búsqueda por Concepto
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por descripción (ej. supermercado, nafta, sueldo, cena...)"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Fila 2: Filtros de Píldoras (Tipo, Moneda, Medio de Pago) */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Tipo */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                typeFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('EXPENSE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                typeFilter === 'EXPENSE' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Gastos (-)
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('INCOME')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                typeFilter === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Ingresos (+)
            </button>
          </div>

          {/* Moneda */}
          {isBimonedaEnabled && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCurrencyFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                  currencyFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas las Monedas
              </button>
              <button
                type="button"
                onClick={() => setCurrencyFilter('ARS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                  currencyFilter === 'ARS' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ARS ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrencyFilter('USD')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                  currencyFilter === 'USD' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                USD (US$)
              </button>
            </div>
          )}

          {/* Medio de Pago */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMethodFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                methodFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cualquier Medio
            </button>
            <button
              type="button"
              onClick={() => setMethodFilter('CASH')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                methodFilter === 'CASH' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => setMethodFilter('DEBIT')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                methodFilter === 'DEBIT' ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Débito / Transf.
            </button>
            {isCardSimulatorEnabled && (
              <button
                type="button"
                onClick={() => setMethodFilter('CREDIT_CARD')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                  methodFilter === 'CREDIT_CARD' ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tarjeta
              </button>
            )}
          </div>

          {/* Selector de tarjeta específico si se filtró por tarjeta */}
          {methodFilter === 'CREDIT_CARD' && creditCards.length > 0 && (
            <select
              value={cardFilter}
              onChange={e => setCardFilter(e.target.value)}
              className="bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1 text-[11px] text-purple-300 font-mono focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="ALL">Todas las Tarjetas</option>
              {creditCards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Listado de Movimientos Auditados */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-emerald-400" />
            Movimientos Encontrados ({filteredMovements.length})
          </span>
          {selectedMonthFilter !== 'ALL' && (
            <span className="text-[11px] font-mono text-emerald-400">
              Período: {formatMonthLabel(selectedMonthFilter)}
            </span>
          )}
        </div>

        {filteredMovements.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-mono border border-dashed border-slate-800 rounded-xl space-y-2">
            <p>No se encontraron movimientos con los filtros aplicados.</p>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-emerald-400 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Restablecer Filtros
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {filteredMovements.map(item => {
              const isInc = item.type === 'INCOME';
              const itemCurr = item.currency || 'ARS';
              const equiv = itemCurr === 'ARS'
                ? `≈ US$ ${convert(item.amount, 'ARS', 'USD').toFixed(2)}`
                : `≈ $ ${convert(item.amount, 'USD', 'ARS').toFixed(0)}`;
              return (
                <li key={item.id} className="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-800/20 px-3 rounded-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${isInc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/60 text-slate-400'} group-hover:text-white transition-colors`}>
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
                      <span className={`text-base font-bold font-mono tabular-nums block ${isInc ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isInc ? '+' : '-'}{itemCurr === 'USD' ? 'US$' : '$'}{item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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

