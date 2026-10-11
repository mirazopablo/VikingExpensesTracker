"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
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
  AccountPreferences,
} from '../types/financial';
import { ApiDashboardSummary, ApiIncome, ApiFixedExpense, ApiCreditCard, ApiInstallmentPurchase, ApiDailyExpense } from '../types/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useExchangeRates, ExchangeRatesData } from '../hooks/useExchangeRates';
import { calculateFirstBillingYearMonth } from '../lib/projectionEngine';
import { useAuth } from './AuthContext';
import {
  dashboardApi,
  incomesApi,
  fixedExpensesApi,
  creditCardsApi,
  dailyExpensesApi,
  installmentPurchasesApi,
  profilesApi,
} from '../lib/services/vikingApi';

interface FinancialContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isHydrated: boolean;
  isSyncing: boolean;
  isApiConnected: boolean;
  currentMonth: string;
  setCurrentMonth: (ym: string) => void;
  refreshDashboard: () => Promise<void>;
  dashboardSummary: ApiDashboardSummary | null;
  safetyMargin: number;
  setSafetyMargin: (val: number) => void;

  // Profiles & Preferences
  profiles: UserProfile[];
  activeProfile: UserProfile;
  setActiveProfileId: (id: string) => void;
  addProfile: (name: string, preferences?: Partial<AccountPreferences>) => Promise<void>;
  updateProfilePreferences: (profileId: string, newPrefs: Partial<AccountPreferences>) => Promise<void>;

  exchangeRates: ExchangeRatesData;
  selectedRateType: ExchangeRateType;
  setSelectedRateType: (type: ExchangeRateType | ((prev: ExchangeRateType) => ExchangeRateType)) => void;
  refreshRates: () => Promise<void>;
  convert: (amount: number, from: Currency, to: Currency, customRate?: ExchangeRateType) => number;

  incomes: Income[];
  addIncome: (description: string, amount: number, collectionDay?: number, isRecurring?: boolean, category?: string, currency?: Currency) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  fixedExpenses: FixedExpense[];
  addFixedExpense: (description: string, amount: number, dueDay?: number, category?: string, currency?: Currency) => Promise<void>;
  toggleFixedExpense: (id: string) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;
  confirmIncome: (id: string, yearMonth?: string) => Promise<void>;
  confirmFixedExpense: (id: string, yearMonth?: string, paymentMethod?: PaymentMethod) => Promise<void>;

  dailyExpenses: DailyExpense[];
  addDailyExpense: (
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
    creditCardId?: string,
    category?: string,
    currency?: Currency,
    type?: TransactionType
  ) => Promise<void>;
  deleteDailyExpense: (id: string) => Promise<void>;

  creditCards: CreditCard[];
  addCreditCard: (name: string, closingDay: number, dueDay: number, creditLimit: number, currency?: Currency) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;

  installmentPurchases: InstallmentPurchase[];
  addInstallmentPurchase: (description: string, totalAmount: number, totalInstallments: number, creditCardId: string, purchaseDate?: string, currency?: Currency) => Promise<void>;
  deleteInstallmentPurchase: (id: string) => Promise<void>;
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
      defaultCurrency: 'ARS',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, activeProfile: authActiveProfile, user, switchProfile } = useAuth();

  const [activeView, setActiveView] = useLocalStorage<ActiveView>('viking_active_view', 'summary');
  const [safetyMargin, setSafetyMargin] = useLocalStorage<number>('viking_safety_margin', 50000);

  const now = new Date();
  const defaultCurrentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [currentMonth, setCurrentMonth] = useState<string>(defaultCurrentMonth);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [dashboardSummary, setDashboardSummary] = useState<ApiDashboardSummary | null>(null);

  // Local fallback storage
  const [rawIncomes, setIncomes, hydratedIncomes] = useLocalStorage<Income[]>('viking_incomes', []);
  const [rawFixedExpenses, setFixedExpenses, hydratedFixed] = useLocalStorage<FixedExpense[]>('viking_fixed_expenses', []);
  const [rawDailyExpenses, setDailyExpenses, hydratedDaily] = useLocalStorage<DailyExpense[]>('viking_daily_expenses', []);
  const [rawCreditCards, setCreditCards, hydratedCards] = useLocalStorage<CreditCard[]>('viking_credit_cards', []);
  const [rawInstallments, setInstallmentPurchases, hydratedInstallments] = useLocalStorage<InstallmentPurchase[]>('viking_installments', []);

  // Compute active profiles either from authenticated user or fallback
  const profiles: UserProfile[] = useMemo(() => {
    if (user && user.profiles && user.profiles.length > 0) {
      return user.profiles.map((p) => ({
        id: p.id,
        name: p.name,
        isDefault: p.is_default,
        preferences: {
          enableBimoneda: p.preferences?.enable_bimoneda ?? true,
          enableDolarApi: p.preferences?.enable_dolar_api ?? true,
          enableCardSimulator: p.preferences?.enable_card_simulator ?? true,
          defaultCurrency: p.preferences?.default_currency ?? 'ARS',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
    return DEFAULT_PROFILES;
  }, [user]);

  const activeProfile: UserProfile = useMemo(() => {
    if (authActiveProfile) {
      return {
        id: authActiveProfile.id,
        name: authActiveProfile.name,
        isDefault: authActiveProfile.is_default,
        preferences: {
          enableBimoneda: authActiveProfile.preferences?.enable_bimoneda ?? true,
          enableDolarApi: authActiveProfile.preferences?.enable_dolar_api ?? true,
          enableCardSimulator: authActiveProfile.preferences?.enable_card_simulator ?? true,
          defaultCurrency: authActiveProfile.preferences?.default_currency ?? 'ARS',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return profiles[0] || DEFAULT_PROFILES[0];
  }, [authActiveProfile, profiles]);

  const { rates, selectedRateType, setSelectedRateType, refreshRates, convert } = useExchangeRates({
    enabled: activeProfile?.preferences?.enableDolarApi ?? true,
  });

  // ==================== Single Roundtrip Dashboard Hydration ====================
  const refreshDashboard = useCallback(async () => {
    if (!isAuthenticated || !activeProfile?.id) return;

    setIsSyncing(true);
    try {
      const response = await dashboardApi.getDashboardData(activeProfile.id, currentMonth);
      if (response.success && response.data) {
        const d = response.data;
        setIsApiConnected(true);

        if (d.summary) {
          setDashboardSummary(d.summary);
        }

        if (d.profile?.preferences) {
          setSafetyMargin(d.profile.preferences.safety_margin);
        }

        // Map API incomes to context structure
        if (d.incomes) {
          const mappedIncomes: Income[] = d.incomes.map((inc: ApiIncome) => ({
            id: inc.id,
            profileId: inc.profile_id,
            description: inc.description,
            amount: inc.amount,
            currency: (inc.currency as Currency) || 'ARS',
            collectionDay: inc.collection_day,
            isRecurring: inc.is_recurring,
            category: inc.category || 'General',
            confirmedMonths: inc.confirmations?.map((c) => c.year_month) || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setIncomes(mappedIncomes);
        }

        // Map API fixed expenses
        if (d.fixed_expenses) {
          const mappedFixed: FixedExpense[] = d.fixed_expenses.map((fe: ApiFixedExpense) => ({
            id: fe.id,
            profileId: fe.profile_id,
            description: fe.description,
            amount: fe.amount,
            currency: (fe.currency as Currency) || 'ARS',
            dueDay: fe.due_day,
            isActive: fe.is_active,
            category: fe.category || 'General',
            confirmedMonths: fe.confirmations?.map((c) => c.year_month) || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setFixedExpenses(mappedFixed);
        }

        // Map API credit cards
        if (d.credit_cards) {
          const mappedCards: CreditCard[] = d.credit_cards.map((cc: ApiCreditCard) => ({
            id: cc.id,
            profileId: cc.profile_id,
            name: cc.name,
            lastFourDigits: cc.last_four_digits,
            closingDay: cc.closing_day,
            dueDay: cc.due_day,
            creditLimit: cc.credit_limit,
            currency: 'ARS',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setCreditCards(mappedCards);
        }

        // Map API installments
        if (d.installment_purchases) {
          const mappedInst: InstallmentPurchase[] = d.installment_purchases.map(
            (inst: ApiInstallmentPurchase) => ({
              id: inst.id,
              profileId: inst.profile_id,
              creditCardId: inst.credit_card_id,
              description: inst.description,
              totalAmount: inst.total_amount,
              currency: 'ARS',
              installmentAmount:
                inst.installment_amount ||
                (inst.total_installments > 0 ? inst.total_amount / inst.total_installments : 0),
              totalInstallments: inst.total_installments,
              purchaseDate: inst.purchase_date,
              firstBillingYearMonth: inst.first_billing_year_month,
              category: inst.category || 'Cuotas',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          );
          setInstallmentPurchases(mappedInst);
        }

        // Map API daily expenses
        if (d.daily_expenses) {
          const mappedDaily: DailyExpense[] = d.daily_expenses.map((de: ApiDailyExpense) => ({
            id: de.id,
            profileId: de.profile_id,
            description: de.description,
            amount: de.amount,
            currency: (de.currency as Currency) || 'ARS',
            transactionDate: de.transaction_date,
            paymentMethod: de.payment_method as PaymentMethod,
            creditCardId: de.credit_card_id,
            category: de.category || 'General',
            type: de.type as TransactionType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setDailyExpenses(mappedDaily);
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch error, falling back to local state:', err);
      setIsApiConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, [
    isAuthenticated,
    activeProfile?.id,
    currentMonth,
    setSafetyMargin,
    setIncomes,
    setFixedExpenses,
    setCreditCards,
    setInstallmentPurchases,
    setDailyExpenses,
  ]);

  // Trigger dashboard hydration on auth or month change
  useEffect(() => {
    if (isAuthenticated && activeProfile?.id) {
      refreshDashboard();
    }
  }, [isAuthenticated, activeProfile?.id, currentMonth, refreshDashboard]);

  const isHydrated =
    hydratedIncomes && hydratedFixed && hydratedDaily && hydratedCards && hydratedInstallments;

  // Filter entities by active profile
  const incomes = useMemo(() => {
    return rawIncomes.filter((item) => !item.profileId || item.profileId === activeProfile.id);
  }, [rawIncomes, activeProfile.id]);

  const fixedExpenses = useMemo(() => {
    return rawFixedExpenses.filter((item) => !item.profileId || item.profileId === activeProfile.id);
  }, [rawFixedExpenses, activeProfile.id]);

  const dailyExpenses = useMemo(() => {
    return rawDailyExpenses.filter((item) => !item.profileId || item.profileId === activeProfile.id);
  }, [rawDailyExpenses, activeProfile.id]);

  const creditCards = useMemo(() => {
    return rawCreditCards.filter((item) => !item.profileId || item.profileId === activeProfile.id);
  }, [rawCreditCards, activeProfile.id]);

  const installmentPurchases = useMemo(() => {
    return rawInstallments.filter((item) => !item.profileId || item.profileId === activeProfile.id);
  }, [rawInstallments, activeProfile.id]);

  // ==================== CRUD Mutations ====================

  const setActiveProfileId = (id: string) => {
    switchProfile(id);
  };

  const addProfile = async (name: string, preferences?: Partial<AccountPreferences>) => {
    if (isAuthenticated) {
      try {
        await profilesApi.createProfile(name);
      } catch (err) {
        console.error('Failed to create profile via API:', err);
      }
    }
  };

  const updateProfilePreferences = async (
    profileId: string,
    newPrefs: Partial<AccountPreferences>
  ) => {
    if (isAuthenticated) {
      try {
        await profilesApi.updatePreferences(profileId, {
          enable_bimoneda: newPrefs.enableBimoneda,
          enable_dolar_api: newPrefs.enableDolarApi,
          enable_card_simulator: newPrefs.enableCardSimulator,
          default_currency: newPrefs.defaultCurrency,
          safety_margin: safetyMargin,
        });
        await refreshDashboard();
      } catch (err) {
        console.error('Failed to update preferences via API:', err);
      }
    }
  };

  // Incomes CRUD
  const addIncome = async (
    description: string,
    amount: number,
    collectionDay = 1,
    isRecurring = true,
    category = 'General',
    currency: Currency = 'ARS'
  ) => {
    const tempId = uuidv4();
    const nowStr = new Date().toISOString();
    const newItem: Income = {
      id: tempId,
      profileId: activeProfile.id,
      description,
      amount,
      currency,
      collectionDay,
      isRecurring,
      category,
      confirmedMonths: [],
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setIncomes((prev) => [newItem, ...prev]);

    if (isAuthenticated) {
      try {
        const res = await incomesApi.createIncome({
          description,
          amount,
          collection_day: collectionDay,
          is_recurring: isRecurring,
          category,
          currency,
        });
        if (res.data?.id) {
          setIncomes((prev) =>
            prev.map((i) => (i.id === tempId ? { ...i, id: res.data!.id } : i))
          );
        }
      } catch (err) {
        console.error('API createIncome failed:', err);
      }
    }
  };

  const deleteIncome = async (id: string) => {
    setIncomes((prev) => prev.filter((item) => item.id !== id));
    if (isAuthenticated) {
      try {
        await incomesApi.deleteIncome(id);
      } catch (err) {
        console.error('API deleteIncome failed:', err);
      }
    }
  };

  const confirmIncome = async (id: string, yearMonth?: string) => {
    const ym = yearMonth || currentMonth;
    const target = rawIncomes.find((i) => i.id === id);
    if (!target) return;

    setIncomes((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const months = i.confirmedMonths || [];
          if (!months.includes(ym)) {
            return { ...i, confirmedMonths: [...months, ym], updatedAt: new Date().toISOString() };
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

    if (isAuthenticated) {
      try {
        await incomesApi.confirmIncome(id, ym);
      } catch (err) {
        console.error('API confirmIncome failed:', err);
      }
    }
  };

  // Fixed Expenses CRUD
  const addFixedExpense = async (
    description: string,
    amount: number,
    dueDay = 10,
    category = 'General',
    currency: Currency = 'ARS'
  ) => {
    const tempId = uuidv4();
    const nowStr = new Date().toISOString();
    const newItem: FixedExpense = {
      id: tempId,
      profileId: activeProfile.id,
      description,
      amount,
      currency,
      dueDay,
      isActive: true,
      category,
      confirmedMonths: [],
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setFixedExpenses((prev) => [newItem, ...prev]);

    if (isAuthenticated) {
      try {
        const res = await fixedExpensesApi.createFixedExpense({
          description,
          amount,
          due_day: dueDay,
          category,
          currency,
        });
        if (res.data?.id) {
          setFixedExpenses((prev) =>
            prev.map((fe) => (fe.id === tempId ? { ...fe, id: res.data!.id } : fe))
          );
        }
      } catch (err) {
        console.error('API createFixedExpense failed:', err);
      }
    }
  };

  const toggleFixedExpense = async (id: string) => {
    setFixedExpenses((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const deleteFixedExpense = async (id: string) => {
    setFixedExpenses((prev) => prev.filter((item) => item.id !== id));
    if (isAuthenticated) {
      try {
        await fixedExpensesApi.deleteFixedExpense(id);
      } catch (err) {
        console.error('API deleteFixedExpense failed:', err);
      }
    }
  };

  const confirmFixedExpense = async (
    id: string,
    yearMonth?: string,
    paymentMethod: PaymentMethod = 'DEBIT'
  ) => {
    const ym = yearMonth || currentMonth;
    const target = rawFixedExpenses.find((fe) => fe.id === id);
    if (!target) return;

    setFixedExpenses((prev) =>
      prev.map((fe) => {
        if (fe.id === id) {
          const months = fe.confirmedMonths || [];
          if (!months.includes(ym)) {
            return { ...fe, confirmedMonths: [...months, ym], updatedAt: new Date().toISOString() };
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

    if (isAuthenticated) {
      try {
        await fixedExpensesApi.confirmFixedExpense(id, ym);
      } catch (err) {
        console.error('API confirmFixedExpense failed:', err);
      }
    }
  };

  // Daily Expenses CRUD
  const addDailyExpense = async (
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
    creditCardId?: string,
    category = 'General',
    currency: Currency = 'ARS',
    type: TransactionType = 'EXPENSE'
  ) => {
    const tempId = uuidv4();
    const nowStr = new Date().toISOString();
    const newItem: DailyExpense = {
      id: tempId,
      profileId: activeProfile.id,
      description,
      amount,
      currency,
      transactionDate: nowStr.split('T')[0],
      paymentMethod,
      creditCardId,
      category,
      type,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setDailyExpenses((prev) => [newItem, ...prev]);

    if (isAuthenticated) {
      try {
        const res = await dailyExpensesApi.createDailyExpense({
          description,
          amount,
          transaction_date: nowStr.split('T')[0],
          payment_method: paymentMethod as 'CASH' | 'DEBIT' | 'CREDIT_CARD',
          credit_card_id: creditCardId,
          category,
          type: type as 'INCOME' | 'EXPENSE',
          currency,
        });
        if (res.data?.id) {
          setDailyExpenses((prev) =>
            prev.map((de) => (de.id === tempId ? { ...de, id: res.data!.id } : de))
          );
        }
      } catch (err) {
        console.error('API createDailyExpense failed:', err);
      }
    }
  };

  const deleteDailyExpense = async (id: string) => {
    setDailyExpenses((prev) => prev.filter((item) => item.id !== id));
    if (isAuthenticated) {
      try {
        await dailyExpensesApi.deleteDailyExpense(id);
      } catch (err) {
        console.error('API deleteDailyExpense failed:', err);
      }
    }
  };

  // Credit Cards CRUD
  const addCreditCard = async (
    name: string,
    closingDay: number,
    dueDay: number,
    creditLimit: number,
    currency: Currency = 'ARS'
  ) => {
    const tempId = uuidv4();
    const nowStr = new Date().toISOString();
    const newItem: CreditCard = {
      id: tempId,
      profileId: activeProfile.id,
      name,
      closingDay,
      dueDay,
      creditLimit,
      currency,
      isActive: true,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setCreditCards((prev) => [newItem, ...prev]);

    if (isAuthenticated) {
      try {
        const res = await creditCardsApi.createCreditCard({
          name,
          last_four_digits: '0000',
          closing_day: closingDay,
          due_day: dueDay,
          credit_limit: creditLimit,
        });
        if (res.data?.id) {
          setCreditCards((prev) =>
            prev.map((cc) => (cc.id === tempId ? { ...cc, id: res.data!.id } : cc))
          );
        }
      } catch (err) {
        console.error('API createCreditCard failed:', err);
      }
    }
  };

  const deleteCreditCard = async (id: string) => {
    setCreditCards((prev) => prev.filter((item) => item.id !== id));
    if (isAuthenticated) {
      try {
        await creditCardsApi.deleteCreditCard(id);
      } catch (err) {
        console.error('API deleteCreditCard failed:', err);
      }
    }
  };

  // Installment Purchases CRUD
  const addInstallmentPurchase = async (
    description: string,
    totalAmount: number,
    totalInstallments: number,
    creditCardId: string,
    purchaseDate?: string,
    currency: Currency = 'ARS'
  ) => {
    const tempId = uuidv4();
    const nowStr = new Date().toISOString();
    const dateStr = purchaseDate || nowStr.split('T')[0];
    const card = creditCards.find((c) => c.id === creditCardId);
    const firstBillingYearMonth = calculateFirstBillingYearMonth(dateStr, card);

    const newItem: InstallmentPurchase = {
      id: tempId,
      profileId: activeProfile.id,
      creditCardId,
      description,
      totalAmount,
      currency,
      installmentAmount: totalInstallments > 0 ? totalAmount / totalInstallments : 0,
      totalInstallments,
      purchaseDate: dateStr,
      firstBillingYearMonth,
      category: 'Cuotas',
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setInstallmentPurchases((prev) => [newItem, ...prev]);

    if (isAuthenticated) {
      try {
        const res = await installmentPurchasesApi.createInstallmentPurchase({
          credit_card_id: creditCardId,
          description,
          total_amount: totalAmount,
          total_installments: totalInstallments,
          purchase_date: dateStr,
        });
        if (res.data?.id) {
          setInstallmentPurchases((prev) =>
            prev.map((ip) => (ip.id === tempId ? { ...ip, id: res.data!.id } : ip))
          );
        }
      } catch (err) {
        console.error('API createInstallmentPurchase failed:', err);
      }
    }
  };

  const deleteInstallmentPurchase = async (id: string) => {
    setInstallmentPurchases((prev) => prev.filter((item) => item.id !== id));
    if (isAuthenticated) {
      try {
        await installmentPurchasesApi.deleteInstallmentPurchase(id);
      } catch (err) {
        console.error('API deleteInstallmentPurchase failed:', err);
      }
    }
  };

  return (
    <FinancialContext.Provider
      value={{
        activeView,
        setActiveView,
        isHydrated,
        isSyncing,
        isApiConnected,
        currentMonth,
        setCurrentMonth,
        refreshDashboard,
        dashboardSummary,
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
        deleteInstallmentPurchase,
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
