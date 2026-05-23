"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { springSnappy } from "@/lib/motion-presets";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCostLineFromExpenses,
  formatMoney,
  sumExpenseCents,
} from "@/lib/campaign-cost";
import { canEditExpenses } from "@/lib/event-expenses";
import { settleEvenCents, settleWeightedCents, formatCents } from "@/lib/expense-settle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

export type CampaignExpense = {
  id: string;
  label: string;
  amountCents: number;
  sortOrder: number;
  paidById?: string | null;
  splits?: string | null;
};

type PayerOption = { userId: string; name: string };

type CampaignExpensesTableProps = {
  eventId: string;
  phase: string;
  isHost: boolean;
  costCurrency: string;
  costSplitEvenly: boolean;
  payerCount: number;
  participants?: PayerOption[];
  expenses: CampaignExpense[];
  onUpdated: (event: { expenses: CampaignExpense[]; costCurrency: string; costSplitEvenly: boolean }) => void;
};

export function CampaignExpensesTable({
  eventId,
  phase,
  isHost,
  costCurrency,
  costSplitEvenly,
  payerCount,
  participants = [],
  expenses,
  onUpdated,
}: CampaignExpensesTableProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newDollars, setNewDollars] = useState("");
  const [busy, setBusy] = useState(false);
  const reduced = useReducedMotion();
  const editable = isHost && canEditExpenses(phase);
  const total = sumExpenseCents(expenses);
  const summaryLine = formatCostLineFromExpenses(
    expenses,
    costCurrency,
    costSplitEvenly,
    payerCount,
  );
  const evenPreview =
    costSplitEvenly && payerCount > 0 && total > 0
      ? settleEvenCents(total, payerCount)
      : null;

  async function patchEventSettings(data: {
    costCurrency?: string;
    costSplitEvenly?: boolean;
  }) {
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Failed to update cost settings");
      return;
    }
    const json = await res.json();
    onUpdated({
      expenses: json.event.expenses,
      costCurrency: json.event.costCurrency,
      costSplitEvenly: json.event.costSplitEvenly,
    });
  }

  async function addRow() {
    const label = newLabel.trim();
    const cents = Math.round(parseFloat(newDollars || "0") * 100);
    if (!label) {
      toast.error("Enter an expenditure name");
      return;
    }
    if (Number.isNaN(cents) || cents < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, amountCents: cents }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Failed to add row");
      return;
    }
    const json = await res.json();
    onUpdated({
      expenses: json.event.expenses,
      costCurrency: json.event.costCurrency,
      costSplitEvenly: json.event.costSplitEvenly,
    });
    setNewLabel("");
    setNewDollars("");
    toast.success("Row added");
  }

  async function updateRow(
    expenseId: string,
    data: {
      label?: string;
      amountCents?: number;
      paidById?: string | null;
      splits?: string | null;
    },
  ) {
    const res = await fetch(`/api/events/${eventId}/expenses/${expenseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Failed to update row");
      return;
    }
    const json = await res.json();
    onUpdated({
      expenses: json.event.expenses,
      costCurrency: json.event.costCurrency,
      costSplitEvenly: json.event.costSplitEvenly,
    });
  }

  async function deleteRow(expenseId: string) {
    const res = await fetch(`/api/events/${eventId}/expenses/${expenseId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to delete row");
      return;
    }
    const json = await res.json();
    onUpdated({
      expenses: json.event.expenses,
      costCurrency: json.event.costCurrency,
      costSplitEvenly: json.event.costSplitEvenly,
    });
  }

  if (!canEditExpenses(phase) && expenses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-sm border-2 border-[var(--crayon-stroke)]">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--crayon-stroke)] bg-muted/40">
              <th className="px-3 py-2 text-left font-display font-bold">
                Expenditure
              </th>
              <th className="px-3 py-2 text-right font-display font-bold">
                Cost
              </th>
              {editable && participants.length > 0 && (
                <th className="px-3 py-2 text-left font-display font-bold">Paid by</th>
              )}
              {editable && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td
                  colSpan={editable ? (participants.length > 0 ? 4 : 3) : 2}
                  className="px-3 py-4 text-muted-foreground"
                >
                  {editable
                    ? "Add line items for hotels, tickets, food, and more."
                    : "No expenses listed yet."}
                </td>
              </tr>
            ) : reduced ? (
              expenses.map((row) => (
                <ExpenseRow
                  key={row.id}
                  row={row}
                  currency={costCurrency}
                  editable={editable}
                  participants={participants}
                  onSave={(data) => updateRow(row.id, data)}
                  onDelete={() => deleteRow(row.id)}
                />
              ))
            ) : (
              <AnimatePresence initial={false}>
                {expenses.map((row) => (
                  <ExpenseRowMotion
                    key={row.id}
                    row={row}
                    currency={costCurrency}
                    editable={editable}
                    participants={participants}
                    onSave={(data) => updateRow(row.id, data)}
                    onDelete={() => deleteRow(row.id)}
                  />
                ))}
              </AnimatePresence>
            )}
          </tbody>
          {total > 0 && (
            <tfoot>
              <tr className="border-t-2 border-[var(--crayon-stroke)] font-bold">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right">
                  {formatMoney(total, costCurrency)}
                </td>
                {editable && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {summaryLine && (
        <p className="text-sm text-muted-foreground">{summaryLine}</p>
      )}
      {evenPreview && (
        <p className="paper-flat mt-2 px-3 py-2 text-xs text-[var(--paper-ink)]">
          <span className="font-display font-bold">Even split preview:</span>{" "}
          {evenPreview.map((c, i) => (
            <span key={i} className="tabular-nums">
              {i > 0 ? " · " : ""}
              {formatCents(c, costCurrency)}
            </span>
          ))}{" "}
          across {payerCount} payer{payerCount === 1 ? "" : "s"}
        </p>
      )}

      {editable && (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[140px] flex-1 space-y-1">
              <Label htmlFor="exp-label">New expenditure</Label>
              <Input
                id="exp-label"
                placeholder="e.g. Hotel"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="w-28 space-y-1">
              <Label htmlFor="exp-amt">Amount</Label>
              <Input
                id="exp-amt"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={newDollars}
                onChange={(e) => setNewDollars(e.target.value)}
              />
            </div>
            <Button type="button" size="sm" onClick={addRow} disabled={busy}>
              Add row
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={costSplitEvenly}
                onChange={(e) =>
                  patchEventSettings({ costSplitEvenly: e.target.checked })
                }
              />
              Split evenly between participants
            </label>
            <div className="flex items-center gap-2">
              <Label htmlFor="exp-currency" className="shrink-0">
                Currency
              </Label>
              <Input
                id="exp-currency"
                className="w-20 uppercase"
                maxLength={3}
                defaultValue={costCurrency}
                key={costCurrency}
                onBlur={(e) => {
                  const c = e.target.value.toUpperCase().slice(0, 3);
                  if (c.length === 3 && c !== costCurrency) {
                    patchEventSettings({ costCurrency: c });
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ExpenseRowMotion({
  row,
  currency,
  editable,
  participants,
  onSave,
  onDelete,
}: {
  row: CampaignExpense;
  currency: string;
  editable: boolean;
  participants: PayerOption[];
  onSave: (data: {
    label?: string;
    amountCents?: number;
    paidById?: string | null;
    splits?: string | null;
  }) => void;
  onDelete: () => void;
}) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, x: -16, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={springSnappy}
      className="border-b border-border/50"
    >
      <ExpenseRowCells
        row={row}
        currency={currency}
        editable={editable}
        participants={participants}
        onSave={onSave}
        onDelete={onDelete}
      />
    </motion.tr>
  );
}

function ExpenseRow({
  row,
  currency,
  editable,
  participants,
  onSave,
  onDelete,
}: {
  row: CampaignExpense;
  currency: string;
  editable: boolean;
  participants: PayerOption[];
  onSave: (data: {
    label?: string;
    amountCents?: number;
    paidById?: string | null;
    splits?: string | null;
  }) => void;
  onDelete: () => void;
}) {
  if (!editable) {
    return (
      <tr className="border-b border-border/50">
        <ExpenseRowCells
          row={row}
          currency={currency}
          editable={false}
          participants={participants}
          onSave={onSave}
          onDelete={onDelete}
        />
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/50">
      <ExpenseRowCells
        row={row}
        currency={currency}
        editable
        participants={participants}
        onSave={onSave}
        onDelete={onDelete}
      />
    </tr>
  );
}

function parseSplitWeights(
  raw: string | null | undefined,
  participantIds: string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of participantIds) out[id] = 1;
  if (!raw?.trim()) return out;
  try {
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object") return out;
    for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
      if (participantIds.includes(k) && typeof v === "number" && v > 0) {
        out[k] = v;
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

function ExpenseRowCells({
  row,
  currency,
  editable,
  participants,
  onSave,
  onDelete,
}: {
  row: CampaignExpense;
  currency: string;
  editable: boolean;
  participants: PayerOption[];
  onSave: (data: {
    label?: string;
    amountCents?: number;
    paidById?: string | null;
    splits?: string | null;
  }) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(row.label);
  const [dollars, setDollars] = useState((row.amountCents / 100).toFixed(2));
  const participantIds = participants.map((p) => p.userId);
  const weights = parseSplitWeights(row.splits, participantIds);
  const [splitNote, setSplitNote] = useState(row.splits ?? "");

  const payerName =
    participants.find((p) => p.userId === row.paidById)?.name ?? null;

  if (!editable) {
    return (
      <>
        <td className="px-3 py-2">{row.label}</td>
        <td className="px-3 py-2 text-right">
          {formatMoney(row.amountCents, currency)}
        </td>
        {participants.length > 0 && (
          <td className="px-3 py-2 text-xs text-muted-foreground">
            {payerName ? `Paid by ${payerName}` : "—"}
          </td>
        )}
      </>
    );
  }

  const weightPreview =
    participantIds.length > 0 && row.amountCents > 0
      ? settleWeightedCents(
          row.amountCents,
          participantIds.map((id) => weights[id] ?? 1),
        )
      : null;

  return (
    <>
      <td className="px-2 py-1">
        <Input
          className="h-8 border-dashed font-sans"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            const trimmed = label.trim();
            if (trimmed && trimmed !== row.label) {
              onSave({ label: trimmed });
            }
          }}
        />
      </td>
      <td className="px-2 py-1">
        <Input
          className="h-8 border-dashed text-right font-sans"
          type="number"
          min={0}
          step="0.01"
          value={dollars}
          onChange={(e) => setDollars(e.target.value)}
          onBlur={() => {
            const cents = Math.round(parseFloat(dollars || "0") * 100);
            if (!Number.isNaN(cents) && cents >= 0 && cents !== row.amountCents) {
              onSave({ amountCents: cents });
            }
          }}
        />
      </td>
      {participants.length > 0 && (
        <td className="px-2 py-1">
          <Select
            value={row.paidById ?? "_none"}
            onValueChange={(v) =>
              onSave({ paidById: v === "_none" ? null : v })
            }
          >
            <SelectTrigger className="h-8 font-sans text-xs">
              <SelectValue placeholder="Payer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">—</SelectItem>
              {participants.map((p) => (
                <SelectItem key={p.userId} value={p.userId}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
      )}
      <td className="px-1 py-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDelete}
          aria-label="Delete row"
        >
          <Trash2 className="size-4" />
        </Button>
      </td>
      {participantIds.length > 0 && (
        <td colSpan={4} className="px-2 pb-2">
          <Label className="text-xs text-muted-foreground">
            Split weights (JSON, optional)
          </Label>
          <Input
            className="mt-1 h-8 font-mono text-xs"
            placeholder='{"userId": 2, "userId2": 1}'
            value={splitNote}
            onChange={(e) => setSplitNote(e.target.value)}
            onBlur={() => {
              const trimmed = splitNote.trim();
              const next = trimmed || null;
              if (next !== (row.splits ?? null)) {
                onSave({ splits: next });
              }
            }}
          />
          {weightPreview && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Preview:{" "}
              {weightPreview.map((c, i) => (
                <span key={participantIds[i]}>
                  {i > 0 ? " · " : ""}
                  {formatCents(c, currency)}
                </span>
              ))}
            </p>
          )}
        </td>
      )}
    </>
  );
}
