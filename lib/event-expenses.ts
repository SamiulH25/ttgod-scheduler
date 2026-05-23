export const EXPENSE_EDIT_PHASES = ["scheduling", "scheduled"] as const;

export function canEditExpenses(phase: string): boolean {
  return (EXPENSE_EDIT_PHASES as readonly string[]).includes(phase);
}
