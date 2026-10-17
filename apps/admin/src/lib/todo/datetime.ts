export const WEEKDAYS_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const;
export const MONTHS_NL = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
] as const;

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function isoFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseIsoDate(value: string | null | undefined): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value ?? '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day };
}

export function parseHm(value: string | null | undefined): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? '').trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function formatHm(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function todayIso(now = new Date()): string {
  return isoFromParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function splitDateTime(value: string | null | undefined): { date: string; time: string } {
  const raw = (value ?? '').trim();
  if (!raw) return { date: '', time: '' };
  if (raw.includes('T')) {
    const [date, rest = ''] = raw.split('T');
    return { date: parseIsoDate(date) ? date : '', time: parseHm(rest.slice(0, 5)) ? rest.slice(0, 5) : '' };
  }
  return { date: parseIsoDate(raw) ? raw : '', time: '' };
}

export function joinDateTime(date: string, time: string): string {
  if (!date && !time) return '';
  if (!time) return date;
  return `${date || todayIso()}T${time}`;
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export type MonthCell = { iso: string; day: number; outside: boolean };

export function monthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month - 1, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - mondayOffset);
  const cells: MonthCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    cells.push({
      iso: isoFromParts(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      day: date.getDate(),
      outside: date.getMonth() !== month - 1,
    });
  }
  return cells;
}

export function formatNlDate(value: string, withYear = true): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return '';
  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  return date.toLocaleDateString('nl-NL', withYear
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { day: 'numeric', month: 'short' }).replace(/\./g, '');
}

export function formatNlRange(start: string, end: string): string {
  if (start && end && start !== end) return `${formatNlDate(start, false)} – ${formatNlDate(end, false)}`;
  return formatNlDate(start || end, false);
}

export function clockPoint(index: number, total: number, radius: number): { x: number; y: number; angle: number } {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle };
}
