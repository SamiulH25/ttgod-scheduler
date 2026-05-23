export type ExpenseLike = { amountCents: number };

export function sumExpenseCents(
  expenses: ExpenseLike[] | null | undefined,
): number {
  if (!expenses?.length) return 0;
  return expenses.reduce((sum, e) => sum + e.amountCents, 0);
}

export function perPersonShareCents(
  costTotalCents: number | null | undefined,
  costSplitEvenly: boolean,
  payerCount: number,
): number | null {
  if (costTotalCents == null || costTotalCents <= 0) return null;
  if (!costSplitEvenly) return null;
  if (payerCount <= 0) return null;
  return Math.ceil(costTotalCents / payerCount);
}

export function formatMoney(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatCostLine(
  costTotalCents: number | null | undefined,
  costCurrency: string,
  costSplitEvenly: boolean,
  payerCount: number,
): string | null {
  if (costTotalCents == null || costTotalCents <= 0) return null;
  const total = formatMoney(costTotalCents, costCurrency);
  if (!costSplitEvenly) return total;
  const share = perPersonShareCents(costTotalCents, true, payerCount);
  if (share == null) return total;
  return `${total} total · ${formatMoney(share, costCurrency)} each`;
}

export function formatCostLineFromExpenses(
  expenses: ExpenseLike[] | null | undefined,
  costCurrency: string,
  costSplitEvenly: boolean,
  payerCount: number,
): string | null {
  const total = sumExpenseCents(expenses);
  if (total <= 0) return null;
  return formatCostLine(total, costCurrency, costSplitEvenly, payerCount);
}
