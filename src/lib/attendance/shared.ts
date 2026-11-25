export const STATUSES = ['present', 'absent', 'late', 'excused'] as const;
export type AttendanceStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<AttendanceStatus, string> = { present: 'Present', absent: 'Absent', late: 'Late', excused: 'Excused' };

/** Today's date in Kenya as YYYY-MM-DD, whatever the server's clock zone. */
export function todayKE(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
}
export function cleanDay(v: string | undefined): string {
  const t = todayKE();
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) && v <= t ? v : t;
}
export function isWeekend(day: string): boolean {
  const d = new Date(`${day}T12:00:00Z`).getUTCDay();
  return d === 0 || d === 6;
}
