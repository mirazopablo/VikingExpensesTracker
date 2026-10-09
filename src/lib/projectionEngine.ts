import { CreditCard, Income, FixedExpense, InstallmentPurchase, ProjectionSummary, MonthlyProjectionItem, Currency } from '../types/financial';

/**
 * Calculates the first billing year-month (YYYY-MM) when an installment purchase will impact cashflow.
 *
 * Rationale:
 * - If purchase day <= closingDay, it belongs to the current statement cycle.
 *   The payment due date is typically the following month (+1 month).
 * - If purchase day > closingDay, it falls into the next statement cycle.
 *   The payment due date is pushed to +2 months from the purchase date.
 */
export function calculateFirstBillingYearMonth(
  purchaseDateStr: string,
  creditCard?: CreditCard
): string {
  const [yearStr, monthStr, dayStr] = purchaseDateStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  let monthOffset = 1; // Default to next month if no credit card closing day specified

  if (creditCard && !isNaN(day)) {
    if (day > creditCard.closingDay) {
      monthOffset = 2; // Purchase after cutoff -> impacts statement due 2 months later
    } else {
      monthOffset = 1; // Purchase on or before cutoff -> impacts statement due next month
    }
  }

  month += monthOffset;
  while (month > 12) {
    month -= 12;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Checks if a specific installment purchase is active and due in a given target Year-Month.
 */
export function isInstallmentActiveInMonth(
  purchase: InstallmentPurchase,
  targetYearMonth: string
): boolean {
  const [startYear, startMonth] = purchase.firstBillingYearMonth.split('-').map(Number);
  const [targetYear, targetMonth] = targetYearMonth.split('-').map(Number);

  const monthsElapsed = (targetYear * 12 + targetMonth) - (startYear * 12 + startMonth);
  return monthsElapsed >= 0 && monthsElapsed < purchase.totalInstallments;
}

/**
 * Simulates a new installment purchase against existing cashflow across all its future installments.
 * Supports dual-currency conversion during projection calculation.
 */
export function simulatePurchaseProjection(
  totalAmount: number,
  totalInstallments: number,
  purchaseDateStr: string,
  creditCardId: string,
  incomes: Income[],
  fixedExpenses: FixedExpense[],
  existingPurchases: InstallmentPurchase[],
  creditCards: CreditCard[],
  safetyMargin: number = 0,
  purchaseCurrency: Currency = 'ARS',
  convertFn?: (amount: number, from: Currency, to: Currency) => number
): ProjectionSummary {
  const card = creditCards.find(c => c.id === creditCardId);
  const firstImpactYearMonth = calculateFirstBillingYearMonth(purchaseDateStr, card);
  const simulatedInstallmentAmount = totalInstallments > 0 ? totalAmount / totalInstallments : 0;

  const [startYear, startMonth] = firstImpactYearMonth.split('-').map(Number);
  const monthlyDetails: MonthlyProjectionItem[] = [];

  const getAmountInCurrency = (amt: number, curr?: Currency) => {
    const itemCurr = curr || 'ARS';
    if (convertFn) return convertFn(amt, itemCurr, purchaseCurrency);
    return itemCurr === purchaseCurrency ? amt : 0;
  };

  const totalMonthlyIncome = incomes.reduce((acc, inc) => acc + getAmountInCurrency(inc.amount, inc.currency), 0);
  const totalActiveFixedExpenses = fixedExpenses
    .filter(fe => fe.isActive)
    .reduce((acc, fe) => acc + getAmountInCurrency(fe.amount, fe.currency), 0);

  let isTotalViable = true;

  for (let k = 0; k < totalInstallments; k++) {
    let currentMonth = startMonth + k;
    let currentYear = startYear;
    while (currentMonth > 12) {
      currentMonth -= 12;
      currentYear += 1;
    }

    const targetYM = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const existingInstallmentsAmount = existingPurchases
      .filter(p => isInstallmentActiveInMonth(p, targetYM))
      .reduce((acc, p) => acc + getAmountInCurrency(p.installmentAmount, p.currency), 0);

    const availableBefore = totalMonthlyIncome - totalActiveFixedExpenses - existingInstallmentsAmount;
    const availableAfter = availableBefore - simulatedInstallmentAmount;
    const isViable = availableAfter >= safetyMargin;

    if (!isViable) {
      isTotalViable = false;
    }

    monthlyDetails.push({
      yearMonth: targetYM,
      projectedIncome: totalMonthlyIncome,
      projectedFixedExpenses: totalActiveFixedExpenses,
      projectedInstallments: existingInstallmentsAmount + simulatedInstallmentAmount,
      availableCashBeforeNewPurchase: availableBefore,
      availableCashAfterNewPurchase: availableAfter,
      isViable
    });
  }

  return {
    simulatedInstallmentAmount,
    firstImpactYearMonth,
    isTotalViable,
    monthlyDetails
  };
}
