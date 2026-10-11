/**
 * Viking Expenses API Service Layer
 * Wraps apiClient with clean functions mapped to swagger.json endpoints.
 */

import { apiClient } from '../apiClient';
import {
  ApiAuthResponse,
  ApiDashboardData,
  ApiUser,
  ApiUserProfile,
  ApiAccountPreference,
  ApiIncome,
  ApiFixedExpense,
  ApiCreditCard,
  ApiDailyExpense,
  ApiInstallmentPurchase,
  ApiExchangeRates,
  ApiSimulationRequest,
  ApiSimulationResponse,
  ApiResponse,
} from '../../types/api';

// ==================== 1. Authentication ====================

export const authApi = {
  loginWithGoogle: (idToken: string) =>
    apiClient<ApiAuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
      requiresAuth: false,
    }),

  refreshToken: (refreshToken: string) =>
    apiClient<ApiAuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      requiresAuth: false,
    }),

  logout: (refreshToken: string) =>
    apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      requiresAuth: true,
    }),

  getMe: () => apiClient<ApiUser>('/auth/me', { method: 'GET' }),
};

// ==================== 2. User Profiles ====================

export const profilesApi = {
  getProfiles: () => apiClient<ApiUserProfile[]>('/profiles', { method: 'GET' }),

  createProfile: (name: string) =>
    apiClient<ApiUserProfile>('/profiles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getProfile: (id: string) =>
    apiClient<ApiUserProfile>(`/profiles/${id}`, { method: 'GET' }),

  updatePreferences: (id: string, preferences: Partial<ApiAccountPreference>) =>
    apiClient<ApiAccountPreference>(`/profiles/${id}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  setDefaultProfile: (id: string) =>
    apiClient<{ message: string }>(`/profiles/${id}/set-default`, {
      method: 'POST',
    }),

  deleteProfile: (id: string) =>
    apiClient<{ message: string }>(`/profiles/${id}`, { method: 'DELETE' }),
};

// ==================== 3. Dashboard Single-Roundtrip ====================

export const dashboardApi = {
  getDashboardData: (profileId: string, month?: string) => {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return apiClient<ApiDashboardData>(`/profiles/${profileId}/dashboard-data${query}`, {
      method: 'GET',
    });
  },
};

// ==================== 4. Incomes ====================

export interface CreateIncomeInput {
  description: string;
  amount: number;
  currency?: string;
  collection_day: number;
  is_recurring?: boolean;
  category?: string;
}

export const incomesApi = {
  getIncomes: () => apiClient<ApiIncome[]>('/incomes', { method: 'GET' }),

  createIncome: (data: CreateIncomeInput) =>
    apiClient<ApiIncome>('/incomes', {
      method: 'POST',
      body: JSON.stringify({
        currency: 'ARS',
        is_recurring: true,
        ...data,
      }),
    }),

  updateIncome: (id: string, data: Partial<CreateIncomeInput>) =>
    apiClient<ApiIncome>(`/incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteIncome: (id: string) =>
    apiClient<{ message: string }>(`/incomes/${id}`, { method: 'DELETE' }),

  confirmIncome: (id: string, yearMonth: string) =>
    apiClient<{ message: string }>(`/incomes/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ year_month: yearMonth }),
    }),

  unconfirmIncome: (id: string, yearMonth: string) =>
    apiClient<{ message: string }>(`/incomes/${id}/confirm/${yearMonth}`, {
      method: 'DELETE',
    }),
};

// ==================== 5. Fixed Expenses ====================

export interface CreateFixedExpenseInput {
  description: string;
  amount: number;
  currency?: string;
  due_day: number;
  category?: string;
}

export const fixedExpensesApi = {
  getFixedExpenses: () =>
    apiClient<ApiFixedExpense[]>('/fixed-expenses', { method: 'GET' }),

  createFixedExpense: (data: CreateFixedExpenseInput) =>
    apiClient<ApiFixedExpense>('/fixed-expenses', {
      method: 'POST',
      body: JSON.stringify({
        currency: 'ARS',
        ...data,
      }),
    }),

  updateFixedExpense: (id: string, data: Partial<CreateFixedExpenseInput>) =>
    apiClient<ApiFixedExpense>(`/fixed-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFixedExpense: (id: string) =>
    apiClient<{ message: string }>(`/fixed-expenses/${id}`, { method: 'DELETE' }),

  confirmFixedExpense: (id: string, yearMonth: string) =>
    apiClient<{ message: string }>(`/fixed-expenses/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ year_month: yearMonth }),
    }),

  unconfirmFixedExpense: (id: string, yearMonth: string) =>
    apiClient<{ message: string }>(`/fixed-expenses/${id}/confirm/${yearMonth}`, {
      method: 'DELETE',
    }),
};

// ==================== 6. Credit Cards ====================

export interface CreateCreditCardInput {
  name: string;
  last_four_digits: string;
  closing_day: number;
  due_day: number;
  credit_limit: number;
  color?: string;
}

export const creditCardsApi = {
  getCreditCards: () => apiClient<ApiCreditCard[]>('/credit-cards', { method: 'GET' }),

  createCreditCard: (data: CreateCreditCardInput) =>
    apiClient<ApiCreditCard>('/credit-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCreditCard: (id: string) =>
    apiClient<ApiCreditCard>(`/credit-cards/${id}`, { method: 'GET' }),

  updateCreditCard: (id: string, data: Partial<CreateCreditCardInput>) =>
    apiClient<ApiCreditCard>(`/credit-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCreditCard: (id: string) =>
    apiClient<{ message: string }>(`/credit-cards/${id}`, { method: 'DELETE' }),
};

// ==================== 7. Daily Expenses & Movements ====================

export interface CreateDailyExpenseInput {
  description: string;
  amount: number;
  currency?: string;
  transaction_date: string;
  payment_method: 'CASH' | 'DEBIT' | 'CREDIT_CARD';
  credit_card_id?: string;
  category?: string;
  type?: 'INCOME' | 'EXPENSE';
}

export interface DailyExpenseFilters {
  type?: 'INCOME' | 'EXPENSE';
  payment_method?: 'CASH' | 'DEBIT' | 'CREDIT_CARD';
  from_date?: string;
  to_date?: string;
}

export const dailyExpensesApi = {
  getDailyExpenses: (filters?: DailyExpenseFilters) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.payment_method) params.append('payment_method', filters.payment_method);
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<ApiDailyExpense[]>(`/daily-expenses${query}`, { method: 'GET' });
  },

  createDailyExpense: (data: CreateDailyExpenseInput) =>
    apiClient<ApiDailyExpense>('/daily-expenses', {
      method: 'POST',
      body: JSON.stringify({
        currency: 'ARS',
        type: 'EXPENSE',
        ...data,
      }),
    }),

  getDailyExpense: (id: string) =>
    apiClient<ApiDailyExpense>(`/daily-expenses/${id}`, { method: 'GET' }),

  updateDailyExpense: (id: string, data: Partial<CreateDailyExpenseInput>) =>
    apiClient<ApiDailyExpense>(`/daily-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDailyExpense: (id: string) =>
    apiClient<{ message: string }>(`/daily-expenses/${id}`, { method: 'DELETE' }),
};

// ==================== 8. Installment Purchases ====================

export interface CreateInstallmentPurchaseInput {
  credit_card_id: string;
  description: string;
  total_amount: number;
  total_installments: number;
  purchase_date: string;
  category?: string;
}

export const installmentPurchasesApi = {
  getInstallmentPurchases: (creditCardId?: string) => {
    const query = creditCardId ? `?credit_card_id=${encodeURIComponent(creditCardId)}` : '';
    return apiClient<ApiInstallmentPurchase[]>(`/installment-purchases${query}`, {
      method: 'GET',
    });
  },

  createInstallmentPurchase: (data: CreateInstallmentPurchaseInput) =>
    apiClient<ApiInstallmentPurchase>('/installment-purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInstallmentPurchase: (id: string) =>
    apiClient<ApiInstallmentPurchase>(`/installment-purchases/${id}`, {
      method: 'GET',
    }),

  updateInstallmentPurchase: (
    id: string,
    data: Partial<CreateInstallmentPurchaseInput>
  ) =>
    apiClient<ApiInstallmentPurchase>(`/installment-purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteInstallmentPurchase: (id: string) =>
    apiClient<{ message: string }>(`/installment-purchases/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== 9. Projections & Simulations ====================

export const projectionsApi = {
  simulate: (data: ApiSimulationRequest) =>
    apiClient<ApiSimulationResponse>('/projections/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== 10. Exchange Rates & Health ====================

export const systemApi = {
  getExchangeRates: () =>
    apiClient<ApiExchangeRates>('/exchange-rates', { method: 'GET' }),

  getHealth: () =>
    apiClient<{ status: string }>('/health', {
      method: 'GET',
      requiresAuth: false,
    }),
};
