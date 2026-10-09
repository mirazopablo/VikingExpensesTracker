/**
 * Core domain types and interfaces for the Viking Expenses Tracker.
 * Designed with clean architecture principles to allow seamless migration to NestJS API + TypeORM/Prisma.
 */

export type TransactionType = 'INCOME' | 'EXPENSE';
export type PaymentMethod = 'CASH' | 'DEBIT' | 'CREDIT_CARD' | 'BANK_TRANSFER';
export type ActiveView = 'summary' | 'movements' | 'fixed' | 'cards' | 'installments';

export type Currency = 'ARS' | 'USD';
export type ExchangeRateType = 'tarjeta' | 'blue' | 'mep' | 'oficial';

export interface DollarQuote {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

/**
 * Represents a recurrent or extraordinary income.
 */
export interface Income {
  id: string;                      // UUIDv4
  description: string;
  amount: number;
  currency?: Currency;             // Defaults to 'ARS'
  collectionDay: number;           // Day of the month (1-31) when it is typically received
  isRecurring: boolean;
  category?: string;
  createdAt: string;               // ISO 8601 string
  updatedAt: string;               // ISO 8601 string
}

/**
 * Represents a monthly fixed expense (e.g., Rent, Internet, Subscriptions).
 */
export interface FixedExpense {
  id: string;                      // UUIDv4
  description: string;
  amount: number;
  currency?: Currency;             // Defaults to 'ARS'
  dueDay: number;                  // Day of the month (1-31) when payment is due
  isActive: boolean;               // Allows disabling without deleting history
  category?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents daily, variable, or sporadic transactions.
 */
export interface DailyExpense {
  id: string;                      // UUIDv4
  description: string;
  amount: number;
  currency?: Currency;             // Defaults to 'ARS'
  transactionDate: string;         // ISO 8601 date string (YYYY-MM-DD)
  paymentMethod: PaymentMethod;
  creditCardId?: string;           // Optional foreign key to CreditCard if paid with credit
  category?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a credit card entity with its exact billing cycle parameters.
 */
export interface CreditCard {
  id: string;                      // UUIDv4
  name: string;                    // e.g., "Visa Platinum - Bank X"
  lastFourDigits?: string;
  currency?: Currency;             // Defaults to 'ARS'
  closingDay: number;              // Billing statement cutoff day (e.g., 24th of each month)
  dueDay: number;                  // Payment due day (e.g., 4th of the following month)
  creditLimit: number;             // Total approved credit limit
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a multi-installment purchase linked to a specific credit card.
 */
export interface InstallmentPurchase {
  id: string;                      // UUIDv4
  creditCardId: string;            // Foreign key to CreditCard entity
  description: string;
  totalAmount: number;             // Total purchase price
  currency?: Currency;             // Defaults to 'ARS'
  installmentAmount: number;       // Calculated exactly or adjusted for rounding (totalAmount / totalInstallments)
  totalInstallments: number;       // e.g., 3, 6, 12
  purchaseDate: string;            // ISO 8601 date string (YYYY-MM-DD)
  firstBillingYearMonth: string;   // ISO string format YYYY-MM (calculated via projection logic)
  category?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Summary output structure for monthly projections and simulations.
 */
export interface MonthlyProjectionItem {
  yearMonth: string;               // Format: YYYY-MM
  projectedIncome: number;
  projectedFixedExpenses: number;
  projectedInstallments: number;
  availableCashBeforeNewPurchase: number;
  availableCashAfterNewPurchase: number;
  isViable: boolean;
}

export interface ProjectionSummary {
  simulatedInstallmentAmount: number;
  firstImpactYearMonth: string;
  isTotalViable: boolean;
  monthlyDetails: MonthlyProjectionItem[];
}
