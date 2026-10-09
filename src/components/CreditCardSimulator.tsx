"use client";

import React, { useState, useMemo } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import { simulatePurchaseProjection } from '../lib/projectionEngine';
import { Currency } from '../types/financial';
import { Calculator, CheckCircle2, AlertTriangle, ArrowRight, PlusCircle, CreditCard as CardIcon, Calendar, DollarSign, Layers } from 'lucide-react';

export const CreditCardSimulator: React.FC = () => {
  const {
    incomes,
    fixedExpenses,
    installmentPurchases,
    creditCards,
    safetyMargin,
    addInstallmentPurchase,
    setActiveView,
    convert,
    selectedRateType
  } = useFinancialContext();

  const [description, setDescription] = useState('Nuevo Smartphone / Pasaje Aéreo');
  const [totalAmount, setTotalAmount] = useState<number>(1200);
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [totalInstallments, setTotalInstallments] = useState<number>(6);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const effectiveCardId = selectedCardId || (creditCards.length > 0 ? creditCards[0].id : '');
  const selectedCard = creditCards.find(c => c.id === effectiveCardId);

  // Live simulation projection calculation with convert hook & currency
  const simulation = useMemo(() => {
    if (!totalAmount || totalAmount <= 0 || !totalInstallments || totalInstallments <= 0) {
      return null;
    }
    return simulatePurchaseProjection(
      totalAmount,
      totalInstallments,
      purchaseDate,
      effectiveCardId,
      incomes,
      fixedExpenses,
      installmentPurchases,
      creditCards,
      safetyMargin,
      currency,
      (amt, from, to) => convert(amt, from, to)
    );
  }, [
    totalAmount,
    totalInstallments,
    purchaseDate,
    effectiveCardId,
    incomes,
    fixedExpenses,
    installmentPurchases,
    creditCards,
    safetyMargin,
    currency,
    convert
  ]);

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulation || !effectiveCardId || !description.trim()) return;

    addInstallmentPurchase(
      description.trim(),
      totalAmount,
      totalInstallments,
      effectiveCardId,
      purchaseDate,
      currency
    );

    setSuccessMessage(`¡Compra "${description}" registrada por ${currency === 'USD' ? 'US$' : '$'}${totalAmount} en ${totalInstallments} cuotas!`);
    setTimeout(() => {
      setSuccessMessage(null);
      setActiveView('installments');
    }, 1800);
  };

  const amountEquivalent = useMemo(() => {
    if (currency === 'ARS') {
      const usdVal = convert(totalAmount, 'ARS', 'USD');
      return `≈ US$ ${usdVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    } else {
      const arsVal = convert(totalAmount, 'USD', 'ARS');
      return `≈ $ ${arsVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARS`;
    }
  }, [totalAmount, currency, convert]);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Background glow decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Simulador de Compras en Cuotas y Tarjetas</h3>
            <p className="text-xs text-slate-400">
              Proyección matemática en tiempo real sobre los cierres de tarjeta e impacto en el flujo mensual
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {successMessage}
          </span>
        </div>
      )}

      <form onSubmit={handleConfirmPurchase} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {/* Description */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" /> Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            placeholder="Nombre del ítem..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Currency */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Moneda
          </label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
          >
            <option value="ARS">ARS ($)</option>
            <option value="USD">USD (US$)</option>
          </select>
        </div>

        {/* Total Amount */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Monto Total
          </label>
          <input
            type="number"
            step="0.01"
            min="1"
            value={totalAmount}
            onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)}
            required
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <span className="text-[10px] font-mono text-emerald-400/80 mt-1 block truncate" title={`Equivalencia a tasa ${selectedRateType}`}>
            {amountEquivalent}
          </span>
        </div>

        {/* Installments */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Cuotas (N)</label>
          <select
            value={totalInstallments}
            onChange={e => setTotalInstallments(parseInt(e.target.value, 10))}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
          >
            {[1, 2, 3, 6, 9, 12, 18, 24, 36].map(num => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'cuota (Pago Total)' : 'cuotas'}
              </option>
            ))}
          </select>
        </div>

        {/* Purchase Date */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Fecha Compra
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={e => setPurchaseDate(e.target.value)}
            required
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
          />
        </div>

        {/* Credit Card */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
            <CardIcon className="w-3.5 h-3.5 text-slate-500" /> Tarjeta
          </label>
          <select
            value={effectiveCardId}
            onChange={e => setSelectedCardId(e.target.value)}
            disabled={creditCards.length === 0}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {creditCards.length === 0 && <option value="">Sin Tarjetas Disponibles</option>}
            {creditCards.map(card => (
              <option key={card.id} value={card.id}>
                {card.name} (Cierre: {card.closingDay})
              </option>
            ))}
          </select>
        </div>
      </form>

      {/* Simulation Results Box */}
      {simulation && (
        <div className="border border-slate-800/80 rounded-xl p-5 bg-slate-950/60 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-xs text-slate-400 block font-mono">VALOR DE LA CUOTA</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                  {currency === 'USD' ? 'US$' : '$'}{simulation.simulatedInstallmentAmount.toFixed(2)}
                </span>
                <span className="text-[11px] font-mono text-slate-400 ml-2">
                  ({currency === 'USD' ? `≈ $${convert(simulation.simulatedInstallmentAmount, 'USD', 'ARS').toFixed(0)} ARS` : `≈ US$${convert(simulation.simulatedInstallmentAmount, 'ARS', 'USD').toFixed(2)} USD`})
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
              <div>
                <span className="text-xs text-slate-400 block font-mono">PRIMER RESUMEN AFECTADO</span>
                <span className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-1.5">
                  {simulation.firstImpactYearMonth}
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {selectedCard ? `Cierre Tarjeta: Día ${selectedCard.closingDay}` : 'Estándar'}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                  simulation.isTotalViable
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {simulation.isTotalViable ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Viable en Todos los Meses Proyectados
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" /> Alerta: Supera Margen (${safetyMargin})
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={!effectiveCardId}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" /> Confirmar y Agregar
              </button>
            </div>
          </div>

          {/* Monthly breakdown table/list */}
          <div className="mt-4">
            <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2.5">
              Impacto Proyectado en el Flujo Mensual ({simulation.monthlyDetails.length} {simulation.monthlyDetails.length === 1 ? 'Mes' : 'Meses'}) en {currency}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
              {simulation.monthlyDetails.map(item => (
                <div
                  key={item.yearMonth}
                  className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                    item.isViable
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : 'bg-rose-950/20 border-rose-900/50 hover:border-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-300">{item.yearMonth}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                        item.isViable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/20 text-rose-400 font-bold'
                      }`}
                    >
                      {item.isViable ? 'OK' : 'ALERTA'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">${item.availableCashBeforeNewPurchase.toFixed(0)}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className={`font-semibold ${item.isViable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${item.availableCashAfterNewPurchase.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
