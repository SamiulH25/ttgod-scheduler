export type AttendanceStatus =
  | "unknown"
  | "attended"
  | "missed"
  | "excused";

export type AttendanceRow = { status: string };

export type AttendanceSummary = {
  total: number;
  attended: number;
  missed: number;
  excused: number;
  unknown: number;
};

const COUNTED: Record<string, keyof Omit<AttendanceSummary, "total">> = {
  attended: "attended",
  missed: "missed",
  excused: "excused",
  unknown: "unknown",
};

export function summarizeAttendance(rows: AttendanceRow[]): AttendanceSummary {
  const summary: AttendanceSummary = {
    total: rows.length,
    attended: 0,
    missed: 0,
    excused: 0,
    unknown: 0,
  };
  for (const row of rows) {
    const key = COUNTED[row.status] ?? "unknown";
    summary[key] += 1;
  }
  return summary;
}

export function isValidAttendanceStatus(s: string): s is AttendanceStatus {
  return s === "unknown" || s === "attended" || s === "missed" || s === "excused";
}
