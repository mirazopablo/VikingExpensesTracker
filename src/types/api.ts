/**
 * API Data Transfer Objects (DTOs) and Contract Types
 * Matched strictly with Viking Expenses Go Backend v2.0 (swagger.json)
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiAccountPreference {
  id: string;
  profile_id: string;
  enable_bimoneda: boolean;
  enable_dolar_api: boolean;
  enable_card_simulator: boolean;
  default_currency: 'ARS' | 'USD';
  safety_margin: number;
}

export interface ApiUserProfile {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  preferences: ApiAccountPreference;
}

export interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  picture_url?: string;
  is_active: boolean;
  profiles: ApiUserProfile[];
}

export interface ApiAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: ApiUser;
}

export interface ApiIncomeConfirmation {
  id: string;
  income_id: string;
  year_month: string; // YYYY-MM
  confirmed_at: string;
}

export interface ApiIncome {
  id: string;
  profile_id: string;
  description: string;
  amount: number;
  currency: string;
  collection_day: number;
  is_recurring: boolean;
  category?: string;
  confirmations?: ApiIncomeConfirmation[];
}

export interface ApiFixedExpenseConfirmation {
  id: string;
  fixed_expense_id: string;
  year_month: string; // YYYY-MM
  confirmed_at: string;
}

export interface ApiFixedExpense {
  id: string;
  profile_id: string;
  description: string;
  amount: number;
  currency: string;
  due_day: number;
  is_active: boolean;
  category?: string;
  confirmations?: ApiFixedExpenseConfirmation[];
}

export interface ApiCreditCard {
  id: string;
  profile_id: string;
  name: string;
  last_four_digits: string;
  closing_day: number;
  due_day: number;
  credit_limit: number;
  color?: string;
}

export interface ApiInstallmentPurchase {
  id: string;
  profile_id: string;
  credit_card_id: string;
  description: string;
  total_amount: number;
  total_installments: number;
  purchase_date: string;
  first_billing_year_month: string;
  installment_amount?: number;
  category?: string;
}

export interface ApiDailyExpense {
  id: string;
  profile_id: string;
  description: string;
  amount: number;
  currency: string;
  transaction_date: string;
  payment_method: 'CASH' | 'DEBIT' | 'CREDIT_CARD';
  credit_card_id?: string;
  category?: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface ApiExchangeRateItem {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion?: string;
}

export interface ApiExchangeRates {
  source: string;
  is_cached: boolean;
  rates: ApiExchangeRateItem[];
}

export interface ApiDashboardSummary {
  month: string;
  total_incomes: number;
  confirmed_incomes: number;
  total_fixed_expenses: number;
  confirmed_fixed_expenses: number;
  total_installments: number;
  total_daily_expenses: number;
  total_outflows: number;
  net_balance: number;
  available_margin: number;
}

export interface ApiDashboardData {
  profile: ApiUserProfile;
  selected_month: string;
  incomes: ApiIncome[];
  fixed_expenses: ApiFixedExpense[];
  credit_cards: ApiCreditCard[];
  installment_purchases: ApiInstallmentPurchase[];
  daily_expenses: ApiDailyExpense[];
  exchange_rates: ApiExchangeRates;
  summary: ApiDashboardSummary;
}

export interface ApiSimulationItem {
  description: string;
  total_amount: number;
  total_installments: number;
  purchase_date: string;
}

export interface ApiSimulationRequest {
  start_year_month: string;
  months_ahead: number;
  simulated_item: ApiSimulationItem;
}

export interface ApiSimulationMonthResult {
  year_month: string;
  projected_income: number;
  projected_fixed_expenses: number;
  projected_installments: number;
  available_cash_before: number;
  available_cash_after: number;
  is_viable: boolean;
}

export interface ApiSimulationResponse {
  simulated_installment_amount: number;
  first_impact_year_month: string;
  is_total_viable: boolean;
  monthly_details: ApiSimulationMonthResult[];
}
