"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Income,
  FixedExpense,
  DailyExpense,
  CreditCard,
  InstallmentPurchase,
  ActiveView,
  PaymentMethod,
  Currency,
  ExchangeRateType
} from '../types/financial';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useExchangeRates, ExchangeRatesData } from '../hooks/useExchangeRates';
import { calculateFirstBillingYearMonth } from '../lib/projectionEngine';

interface FinancialContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isHydrated: boolean;
  safetyMargin: number;
  setSafetyMargin: (val: number) => void;

  exchangeRates: ExchangeRatesData;
  selectedRateType: ExchangeRateType;
  setSelectedRateType: (type: ExchangeRateType | ((prev: ExchangeRateType) => ExchangeRateType)) => void;
  refreshRates: () => Promise<void>;
  convert: (amount: number, from: Currency, to: Currency, customRate?: ExchangeRateType) => number;

  incomes: Income[];
  addIncome: (description: string, amount: number, collectionDay?: number, isRecurring?: boolean, category?: string, currency?: Currency) => void;
  deleteIncome: (id: string) => void;

  fixedExpenses: FixedExpense[];
  addFixedExpense: (description: string, amount: number, dueDay?: number, category?: string, currency?: Currency) => void;
  toggleFixedExpense: (id: string) => void;
  deleteFixedExpense: (id: string) => void;

  dailyExpenses: DailyExpense[];
  addDailyExpense: (description: string, amount: number, paymentMethod: PaymentMethod, creditCardId?: string, category?: string, currency?: Currency) => void;
  deleteDailyExpense: (id: string) => void;

  creditCards: CreditCard[];
  addCreditCard: (name: string, closingDay: number, dueDay: number, creditLimit: number, currency?: Currency) => void;
  deleteCreditCard: (id: string) => void;

  installmentPurchases: InstallmentPurchase[];
  addInstallmentPurchase: (description: string, totalAmount: number, totalInstallments: number, creditCardId: string, purchaseDate?: string, currency?: Currency) => void;
  deleteInstallmentPurchase: (id: string) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const INITIAL_INCOMES: Income[] = [
  {
    id: 'inc-1',
    description: 'Senior Software Engineer Salary',
    amount: 3500,
    currency: 'ARS',
    collectionDay: 1,
    isRecurring: true,
    category: 'Salary',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_FIXED_EXPENSES: FixedExpense[] = [
  {
    id: 'fijo-1',
    description: 'Apartment Rent & Building Expenses',
    amount: 850,
    currency: 'ARS',
    dueDay: 10,
    isActive: true,
    category: 'Housing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fijo-2',
    description: 'High-Speed Fiber Internet',
    amount: 60,
    currency: 'ARS',
    dueDay: 15,
    isActive: true,
    category: 'Utilities',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card-1',
    name: 'Visa Platinum - Valhalla Bank',
    lastFourDigits: '4819',
    currency: 'ARS',
    closingDay: 24,
    dueDay: 4,
    creditLimit: 5000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_INSTALLMENTS: InstallmentPurchase[] = [
  {
    id: 'inst-1',
    creditCardId: 'card-1',
    description: 'MacBook Pro M3 Max (Setup)',
    totalAmount: 2400,
    currency: 'ARS',
    installmentAmount: 200,
    totalInstallments: 12,
    purchaseDate: new Date().toISOString().split('T')[0],
    firstBillingYearMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    category: 'Work Equipment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_DAILY_EXPENSES: DailyExpense[] = [];

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useLocalStorage<ActiveView>('viking_active_view', 'summary');
  const [safetyMargin, setSafetyMargin] = useLocalStorage<number>('viking_safety_margin', 200);

  const { rates, selectedRateType, setSelectedRateType, refreshRates, convert } = useExchangeRates();

  const [incomes, setIncomes, hydratedIncomes] = useLocalStorage<Income[]>('viking_incomes', INITIAL_INCOMES);
  const [fixedExpenses, setFixedExpenses, hydratedFixed] = useLocalStorage<FixedExpense[]>('viking_fixed_expenses', INITIAL_FIXED_EXPENSES);
  const [dailyExpenses, setDailyExpenses, hydratedDaily] = useLocalStorage<DailyExpense[]>('viking_daily_expenses', INITIAL_DAILY_EXPENSES);
  const [creditCards, setCreditCards, hydratedCards] = useLocalStorage<CreditCard[]>('viking_credit_cards', INITIAL_CREDIT_CARDS);
  const [installmentPurchases, setInstallmentPurchases, hydratedInstallments] = useLocalStorage<InstallmentPurchase[]>('viking_installments', INITIAL_INSTALLMENTS);

  const isHydrated = hydratedIncomes && hydratedFixed && hydratedDaily && hydratedCards && hydratedInstallments;

  // Incomes CRUD
  const addIncome = (description: string, amount: number, collectionDay = 1, isRecurring = true, category = 'General', currency: Currency = 'ARS') => {
    const now = new Date().toISOString();
    const newItem: Income = {
      id: uuidv4(),
      description,
      amount,
      currency,
      collectionDay,
      isRecurring,
      category,
      createdAt: now,
      updatedAt: now
    };
    setIncomes(prev => [newItem, ...prev]);
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(item => item.id !== id));
  };

  // Fixed Expenses CRUD
  const addFixedExpense = (description: string, amount: number, dueDay = 10, category = 'General', currency: Currency = 'ARS') => {
    const now = new Date().toISOString();
    const newItem: FixedExpense = {
      id: uuidv4(),
      description,
      amount,
      currency,
      dueDay,
      isActive: true,
      category,
      createdAt: now,
      updatedAt: now
    };
    setFixedExpenses(prev => [newItem, ...prev]);
  };

  const toggleFixedExpense = (id: string) => {
    setFixedExpenses(prev =>
      prev.map(item => (item.id === id ? { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() } : item))
    );
  };

  const deleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(item => item.id !== id));
  };

  // Daily Expenses CRUD
  const addDailyExpense = (description: string, amount: number, paymentMethod: PaymentMethod, creditCardId?: string, category = 'General', currency: Currency = 'ARS') => {
    const now = new Date().toISOString();
    const newItem: DailyExpense = {
      id: uuidv4(),
      description,
      amount,
      currency,
      transactionDate: now.split('T')[0],
      paymentMethod,
      creditCardId,
      category,
      createdAt: now,
      updatedAt: now
    };
    setDailyExpenses(prev => [newItem, ...prev]);
  };

  const deleteDailyExpense = (id: string) => {
    setDailyExpenses(prev => prev.filter(item => item.id !== id));
  };

  // Credit Cards CRUD
  const addCreditCard = (name: string, closingDay: number, dueDay: number, creditLimit: number, currency: Currency = 'ARS') => {
    const now = new Date().toISOString();
    const newItem: CreditCard = {
      id: uuidv4(),
      name,
      closingDay,
      dueDay,
      creditLimit,
      currency,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    setCreditCards(prev => [newItem, ...prev]);
  };

  const deleteCreditCard = (id: string) => {
    setCreditCards(prev => prev.filter(item => item.id !== id));
  };

  // Installment Purchases CRUD
  const addInstallmentPurchase = (
    description: string,
    totalAmount: number,
    totalInstallments: number,
    creditCardId: string,
    purchaseDate?: string,
    currency: Currency = 'ARS'
  ) => {
    const now = new Date().toISOString();
    const dateStr = purchaseDate || now.split('T')[0];
    const card = creditCards.find(c => c.id === creditCardId);
    const firstBillingYearMonth = calculateFirstBillingYearMonth(dateStr, card);

    const newItem: InstallmentPurchase = {
      id: uuidv4(),
      creditCardId,
      description,
      totalAmount,
      currency,
      installmentAmount: totalInstallments > 0 ? totalAmount / totalInstallments : 0,
      totalInstallments,
      purchaseDate: dateStr,
      firstBillingYearMonth,
      category: 'Installments',
      createdAt: now,
      updatedAt: now
    };
    setInstallmentPurchases(prev => [newItem, ...prev]);
  };

  const deleteInstallmentPurchase = (id: string) => {
    setInstallmentPurchases(prev => prev.filter(item => item.id !== id));
  };

  return (
    <FinancialContext.Provider
      value={{
        activeView,
        setActiveView,
        isHydrated,
        safetyMargin,
        setSafetyMargin,
        exchangeRates: rates,
        selectedRateType,
        setSelectedRateType,
        refreshRates,
        convert,
        incomes,
        addIncome,
        deleteIncome,
        fixedExpenses,
        addFixedExpense,
        toggleFixedExpense,
        deleteFixedExpense,
        dailyExpenses,
        addDailyExpense,
        deleteDailyExpense,
        creditCards,
        addCreditCard,
        deleteCreditCard,
        installmentPurchases,
        addInstallmentPurchase,
        deleteInstallmentPurchase
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancialContext = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancialContext must be used within a FinancialProvider');
  }
  return context;
};
