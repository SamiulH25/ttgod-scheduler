export type PlanItemForPack = {
  kind: string;
  title: string;
  checklist: string | null;
};

export type ChecklistRow = { label: string; done: boolean };

export function parsePlanChecklist(raw: string | null): ChecklistRow[] {
  if (!raw?.trim()) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    return j
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const label = typeof o.label === "string" ? o.label.trim() : "";
        const done = Boolean(o.done);
        if (!label) return null;
        return { label, done };
      })
      .filter((x): x is ChecklistRow => x != null);
  } catch {
    return [];
  }
}

/**
 * Roll up undone checklist lines from all plan items into one de-duplicated list.
 */
export function rollupPackListFromPlanItems(
  items: PlanItemForPack[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const consider = (label: string, done: boolean) => {
    if (done) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(label);
  };

  for (const item of items) {
    const rows = parsePlanChecklist(item.checklist);
    for (const row of rows) {
      consider(row.label, row.done);
    }
  }

  return out.sort((a, b) => a.localeCompare(b));
}
