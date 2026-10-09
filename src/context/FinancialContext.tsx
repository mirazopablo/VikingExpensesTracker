"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Income,
  FixedExpense,
  DailyExpense,
  CreditCard,
  InstallmentPurchase,
  ActiveView,
  PaymentMethod,
  TransactionType,
  Currency,
  ExchangeRateType,
  UserProfile,
  AccountPreferences
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

  // Profiles & Preferences
  profiles: UserProfile[];
  activeProfile: UserProfile;
  setActiveProfileId: (id: string) => void;
  addProfile: (name: string, preferences?: Partial<AccountPreferences>) => void;
  updateProfilePreferences: (profileId: string, newPrefs: Partial<AccountPreferences>) => void;

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
  confirmIncome: (id: string, yearMonth?: string) => void;
  confirmFixedExpense: (id: string, yearMonth?: string, paymentMethod?: PaymentMethod) => void;

  dailyExpenses: DailyExpense[];
  addDailyExpense: (
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
    creditCardId?: string,
    category?: string,
    currency?: Currency,
    type?: TransactionType
  ) => void;
  deleteDailyExpense: (id: string) => void;

  creditCards: CreditCard[];
  addCreditCard: (name: string, closingDay: number, dueDay: number, creditLimit: number, currency?: Currency) => void;
  deleteCreditCard: (id: string) => void;

  installmentPurchases: InstallmentPurchase[];
  addInstallmentPurchase: (description: string, totalAmount: number, totalInstallments: number, creditCardId: string, purchaseDate?: string, currency?: Currency) => void;
  deleteInstallmentPurchase: (id: string) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'prof-personal',
    name: 'Cuenta Personal',
    isDefault: true,
    preferences: {
      enableBimoneda: true,
      enableDolarApi: true,
      enableCardSimulator: true,
      defaultCurrency: 'ARS'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prof-pareja',
    name: 'Cuenta Pareja',
    isDefault: false,
    preferences: {
      enableBimoneda: false,
      enableDolarApi: false,
      enableCardSimulator: false,
      defaultCurrency: 'ARS'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_INCOMES: Income[] = [
  {
    id: 'inc-1',
    profileId: 'prof-personal',
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
    profileId: 'prof-personal',
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
    profileId: 'prof-personal',
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
    profileId: 'prof-personal',
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
    profileId: 'prof-personal',
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

  // Profiles State
  const [profiles, setProfiles, hydratedProfiles] = useLocalStorage<UserProfile[]>('viking_user_profiles', DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId, hydratedActiveProfile] = useLocalStorage<string>('viking_active_profile_id', 'prof-personal');

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];
  }, [profiles, activeProfileId]);

  // Hook Exchange Rates respects profile DolarApi feature toggle
  const { rates, selectedRateType, setSelectedRateType, refreshRates, convert } = useExchangeRates({
    enabled: activeProfile?.preferences?.enableDolarApi ?? true
  });

  const [rawIncomes, setIncomes, hydratedIncomes] = useLocalStorage<Income[]>('viking_incomes', INITIAL_INCOMES);
  const [rawFixedExpenses, setFixedExpenses, hydratedFixed] = useLocalStorage<FixedExpense[]>('viking_fixed_expenses', INITIAL_FIXED_EXPENSES);
  const [rawDailyExpenses, setDailyExpenses, hydratedDaily] = useLocalStorage<DailyExpense[]>('viking_daily_expenses', INITIAL_DAILY_EXPENSES);
  const [rawCreditCards, setCreditCards, hydratedCards] = useLocalStorage<CreditCard[]>('viking_credit_cards', INITIAL_CREDIT_CARDS);
  const [rawInstallments, setInstallmentPurchases, hydratedInstallments] = useLocalStorage<InstallmentPurchase[]>('viking_installments', INITIAL_INSTALLMENTS);

  const isHydrated = hydratedProfiles && hydratedActiveProfile && hydratedIncomes && hydratedFixed && hydratedDaily && hydratedCards && hydratedInstallments;

  // Filter entities by active profile ID (or items with no profileId for backward compatibility)
  const incomes = useMemo(() => {
    return rawIncomes.filter(item => !item.profileId || item.profileId === activeProfile.id);
  }, [rawIncomes, activeProfile.id]);

  const fixedExpenses = useMemo(() => {
    return rawFixedExpenses.filter(item => !item.profileId || item.profileId === activeProfile.id);
  }, [rawFixedExpenses, activeProfile.id]);

  const dailyExpenses = useMemo(() => {
    return rawDailyExpenses.filter(item => !item.profileId || item.profileId === activeProfile.id);
  }, [rawDailyExpenses, activeProfile.id]);

  const creditCards = useMemo(() => {
    return rawCreditCards.filter(item => !item.profileId || item.profileId === activeProfile.id);
  }, [rawCreditCards, activeProfile.id]);

  const installmentPurchases = useMemo(() => {
    return rawInstallments.filter(item => !item.profileId || item.profileId === activeProfile.id);
  }, [rawInstallments, activeProfile.id]);

  // Profile Mutations
  const addProfile = (name: string, preferences?: Partial<AccountPreferences>) => {
    const now = new Date().toISOString();
    const newProf: UserProfile = {
      id: uuidv4(),
      name,
      isDefault: false,
      preferences: {
        enableBimoneda: true,
        enableDolarApi: true,
        enableCardSimulator: true,
        defaultCurrency: 'ARS',
        ...preferences
      },
      createdAt: now,
      updatedAt: now
    };
    setProfiles(prev => [...prev, newProf]);
    setActiveProfileId(newProf.id);
  };

  const updateProfilePreferences = (profileId: string, newPrefs: Partial<AccountPreferences>) => {
    const now = new Date().toISOString();
    setProfiles(prev =>
      prev.map(p => {
        if (p.id === profileId) {
          return {
            ...p,
            preferences: { ...p.preferences, ...newPrefs },
            updatedAt: now
          };
        }
        return p;
      })
    );
  };

  // Incomes CRUD
  const addIncome = (description: string, amount: number, collectionDay = 1, isRecurring = true, category = 'General', currency: Currency = 'ARS') => {
    const now = new Date().toISOString();
    const newItem: Income = {
      id: uuidv4(),
      profileId: activeProfile.id,
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
      profileId: activeProfile.id,
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
  const addDailyExpense = (
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
    creditCardId?: string,
    category = 'General',
    currency: Currency = 'ARS',
    type: TransactionType = 'EXPENSE'
  ) => {
    const now = new Date().toISOString();
    const newItem: DailyExpense = {
      id: uuidv4(),
      profileId: activeProfile.id,
      description,
      amount,
      currency,
      transactionDate: now.split('T')[0],
      paymentMethod,
      creditCardId,
      category,
      type,
      createdAt: now,
      updatedAt: now
    };
    setDailyExpenses(prev => [newItem, ...prev]);
  };

  const confirmIncome = (id: string, yearMonth?: string) => {
    const currentYM = yearMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const target = rawIncomes.find(i => i.id === id);
    if (!target) return;

    setIncomes(prev =>
      prev.map(i => {
        if (i.id === id) {
          const months = i.confirmedMonths || [];
          if (!months.includes(currentYM)) {
            return { ...i, confirmedMonths: [...months, currentYM], updatedAt: new Date().toISOString() };
          }
        }
        return i;
      })
    );

    addDailyExpense(
      `[Cobro] ${target.description}`,
      target.amount,
      'BANK_TRANSFER',
      undefined,
      target.category || 'Ingresos',
      target.currency || 'ARS',
      'INCOME'
    );
  };

  const confirmFixedExpense = (id: string, yearMonth?: string, paymentMethod: PaymentMethod = 'DEBIT') => {
    const currentYM = yearMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const target = rawFixedExpenses.find(fe => fe.id === id);
    if (!target) return;

    setFixedExpenses(prev =>
      prev.map(fe => {
        if (fe.id === id) {
          const months = fe.confirmedMonths || [];
          if (!months.includes(currentYM)) {
            return { ...fe, confirmedMonths: [...months, currentYM], updatedAt: new Date().toISOString() };
          }
        }
        return fe;
      })
    );

    addDailyExpense(
      `[Pago] ${target.description}`,
      target.amount,
      paymentMethod,
      undefined,
      target.category || 'Gastos Fijos',
      target.currency || 'ARS',
      'EXPENSE'
    );
  };

  const deleteDailyExpense = (id: string) => {
    setDailyExpenses(prev => prev.filter(item => item.id !== id));
  };

  // Credit Cards CRUD
  const addCreditCard = (name: string, closingDay: number, dueDay: number, creditLimit: number, currency: Currency = 'ARS') => {
    const now = new Date().toISOString();
    const newItem: CreditCard = {
      id: uuidv4(),
      profileId: activeProfile.id,
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
      profileId: activeProfile.id,
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
        profiles,
        activeProfile,
        setActiveProfileId,
        addProfile,
        updateProfilePreferences,
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
        confirmIncome,
        confirmFixedExpense,
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

