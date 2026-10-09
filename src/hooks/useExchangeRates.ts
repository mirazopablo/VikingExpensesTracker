"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Currency, ExchangeRateType, DollarQuote } from '../types/financial';
import { useLocalStorage } from './useLocalStorage';

export interface ExchangeRatesData {
  tarjeta: number;
  blue: number;
  mep: number;
  oficial: number;
}

export interface ExchangeRateCache {
  rates: ExchangeRatesData;
  lastUpdated: string;
}

const DEFAULT_RATES_CACHE: ExchangeRateCache = {
  rates: {
    tarjeta: 1680,
    blue: 1350,
    mep: 1320,
    oficial: 1050
  },
  lastUpdated: new Date().toISOString()
};

export interface UseExchangeRatesReturn {
  rates: ExchangeRatesData;
  lastUpdated: string;
  selectedRateType: ExchangeRateType;
  setSelectedRateType: (type: ExchangeRateType | ((prev: ExchangeRateType) => ExchangeRateType)) => void;
  isLoading: boolean;
  refreshRates: () => Promise<void>;
  convert: (amount: number, from: Currency, to: Currency, customRate?: ExchangeRateType) => number;
}

export interface UseExchangeRatesOptions {
  enabled?: boolean;
}

/**
 * Custom hook to fetch real-time USD/ARS exchange rates from DolarApi.com.
 * Features automatic background fetch, offline caching via localStorage, and instant currency conversion.
 */
export function useExchangeRates(options: UseExchangeRatesOptions = { enabled: true }): UseExchangeRatesReturn {
  const isEnabled = options.enabled ?? true;
  const [cachedData, setCachedData] = useLocalStorage<ExchangeRateCache>('viking_exchange_rates', DEFAULT_RATES_CACHE);
  const [selectedRateType, setSelectedRateType] = useLocalStorage<ExchangeRateType>('viking_selected_rate_type', 'tarjeta');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const ratesRef = useRef<ExchangeRatesData>(cachedData.rates);
  useEffect(() => {
    ratesRef.current = cachedData.rates;
  }, [cachedData.rates]);

  const fetchFromApi = useCallback(async () => {
    if (!isEnabled) return;
    try {
      setIsLoading(true);
      const res = await fetch('https://dolarapi.com/v1/dolares', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const quotes: DollarQuote[] = await res.json();

      const newRates: ExchangeRatesData = { ...ratesRef.current };
      quotes.forEach(quote => {
        const casaLower = quote.casa.toLowerCase();
        const value = quote.venta || quote.compra || 0;
        if (casaLower === 'tarjeta' && value > 0) newRates.tarjeta = value;
        if (casaLower === 'blue' && value > 0) newRates.blue = value;
        if ((casaLower === 'bolsa' || casaLower === 'mep') && value > 0) newRates.mep = value;
        if (casaLower === 'oficial' && value > 0) newRates.oficial = value;
      });

      setCachedData({
        rates: newRates,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch exchange rates from DolarApi.com, using offline cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, setCachedData]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isEnabled) return;
    // Defer initial fetch to avoid synchronous state updates inside effect body (cascading renders)
    const timeout = setTimeout(() => {
      void fetchFromApi();
    }, 0);
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchFromApi, 5 * 60 * 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isEnabled, fetchFromApi]);

  const convert = useCallback((amount: number, from: Currency = 'ARS', to: Currency = 'ARS', customRate?: ExchangeRateType): number => {
    if (from === to || !amount || isNaN(amount)) return amount;
    const activeRateKey = customRate || selectedRateType || 'tarjeta';
    const rateValue = cachedData.rates[activeRateKey] || cachedData.rates.tarjeta || 1680;
    if (rateValue <= 0) return amount;

    if (from === 'USD' && to === 'ARS') {
      return amount * rateValue;
    }
    if (from === 'ARS' && to === 'USD') {
      return amount / rateValue;
    }
    return amount;
  }, [cachedData.rates, selectedRateType]);

  return {
    rates: cachedData.rates,
    lastUpdated: cachedData.lastUpdated,
    selectedRateType,
    setSelectedRateType,
    isLoading,
    refreshRates: fetchFromApi,
    convert
  };
}
