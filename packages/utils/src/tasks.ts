export function addIsoDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const TASK_STATUSES = [
  { id: 'TODO', label: 'Te doen', color: '#c4c4c4' },
  { id: 'WORKING', label: 'Bezig', color: '#fdab3d' },
  { id: 'STUCK', label: 'Vast', color: '#e2445c' },
  { id: 'DONE', label: 'Klaar', color: '#00c875' },
  { id: 'SKIP', label: 'Niet doen', color: '#676879' },
] as const;

export type TaskStatusId = (typeof TASK_STATUSES)[number]['id'];

export const GROUP_PALETTE = [
  '#579bfc',
  '#a25ddc',
  '#00c875',
  '#ff642e',
  '#fdab3d',
  '#e2445c',
  '#007eb5',
  '#037f4c',
  '#ffcb00',
  '#bb3354',
] as const;

export const DEFAULT_TASK_GROUPS = [
  { name: 'Opvolging', color: '#579bfc' },
  { name: 'Werkvoorbereiding', color: '#a25ddc' },
  { name: 'Uitvoering', color: '#00c875' },
  { name: 'Administratie', color: '#ff642e' },
] as const;

const STATUS_IDS = new Set<string>(TASK_STATUSES.map((status) => status.id));

export function isTaskStatus(value: string): value is TaskStatusId {
  return STATUS_IDS.has(value);
}

/** Status die opgeslagen mag worden, inclusief archief dat niet in de lijst staat. */
export function isStoredTaskStatus(value: string): boolean {
  return isTaskStatus(value) || value === 'ARCHIVED';
}

export function taskStatus(value: string) {
  return TASK_STATUSES.find((status) => status.id === value) ?? TASK_STATUSES[0];
}

export function paletteColor(value: string): string | null {
  return GROUP_PALETTE.find((color) => color.toLowerCase() === value.toLowerCase()) ?? null;
}

/** Inclusive start and due become an exclusive end, ready for the calendar. */
export function taskAgendaRange(startDate: string | null, dueDate: string | null): { start: string; end: string } | null {
  const start = startDate ?? dueDate;
  const due = dueDate ?? startDate;
  if (!start || !due) return null;
  const from = start <= due ? start : due;
  const to = start <= due ? due : start;
  return { start: from, end: addIsoDays(to, 1) };
}

export function isOpenTaskStatus(status: string): boolean {
  return status !== 'DONE' && status !== 'ARCHIVED';
}

/** Zet één item vóór een ander, of achteraan als beforeId leeg is. */
export function placeById<T extends { id: string; sortOrder: number }>(items: T[], id: string, beforeId: string | null): T[] {
  const ordered = [...items].sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  const from = ordered.findIndex((item) => item.id === id);
  if (from < 0) return items;
  const moving = ordered[from];
  const rest = ordered.filter((item) => item.id !== id);
  const index = beforeId == null ? rest.length : rest.findIndex((item) => item.id === beforeId);
  const next = rest.slice();
  next.splice(index < 0 ? rest.length : index, 0, moving);
  if (next.every((item, order) => item.id === ordered[order]?.id)) return items;
  return next.map((item, sortOrder) => (item.sortOrder === sortOrder ? item : { ...item, sortOrder }));
}

export function placeOpenTask<T extends { id: string; categoryId: string | null; sortOrder: number; status: string }>(
  tasks: T[],
  draggedId: string,
  target: { beforeId: string | null; categoryId: string | null },
  grouped: boolean,
  categoryIds: string[] = [],
): T[] {
  const dragged = tasks.find((task) => task.id === draggedId);
  if (!dragged || !isOpenTaskStatus(dragged.status)) return tasks;
  const moved = { ...dragged, categoryId: grouped ? target.categoryId : dragged.categoryId };
  const rest = tasks.filter((task) => task.id !== draggedId);
  const open = rest
    .filter((task) => isOpenTaskStatus(task.status))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const visual = grouped
    ? [
        ...categoryIds.flatMap((id) => open.filter((task) => task.categoryId === id)),
        ...open.filter((task) => !task.categoryId || !categoryIds.includes(task.categoryId)),
      ]
    : open;
  let index = target.beforeId ? visual.findIndex((task) => task.id === target.beforeId) : -1;
  if (index < 0) {
    if (!grouped || !moved.categoryId || !categoryIds.includes(moved.categoryId)) {
      index = visual.length;
    } else {
      const last = [...visual].reverse().find((task) => task.categoryId === moved.categoryId);
      if (last) index = visual.findIndex((task) => task.id === last.id) + 1;
      else {
        const catIndex = categoryIds.indexOf(moved.categoryId);
        index = 0;
        for (let i = 0; i < catIndex; i += 1) index += visual.filter((task) => task.categoryId === categoryIds[i]).length;
      }
    }
  }
  const nextOpen = visual.slice();
  nextOpen.splice(index, 0, moved);
  const numbered = nextOpen.map((task, sortOrder) => (
    task.id === moved.id
      ? { ...moved, sortOrder }
      : task.sortOrder === sortOrder
        ? task
        : { ...task, sortOrder }
  ));
  const previous = [dragged, ...open].sort((left, right) => left.sortOrder - right.sortOrder);
  const unchanged = numbered.length === previous.length
    && numbered.every((task, order) => previous[order]?.id === task.id && previous[order]?.categoryId === task.categoryId);
  if (unchanged) return tasks;
  return [...numbered, ...rest.filter((task) => !isOpenTaskStatus(task.status))];
}

export function isoDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export const TASK_COLUMN_KINDS = ['title', 'category', 'person', 'customer', 'timeline', 'status', 'date', 'plan', 'text', 'number'] as const;
export type TaskColumnKind = (typeof TASK_COLUMN_KINDS)[number];

export type BoardColumn = {
  id: string;
  label: string;
  width: number;
  kind: TaskColumnKind;
};

const COLUMN_MIN = 72;
const COLUMN_MAX = 520;

export const DEFAULT_BOARD_COLUMNS: BoardColumn[] = [
  { id: 'title', label: 'Taak', width: 340, kind: 'title' },
  { id: 'category', label: 'Categorie', width: 156, kind: 'category' },
  { id: 'person', label: 'Collega', width: 124, kind: 'person' },
  { id: 'customer', label: 'Klant', width: 132, kind: 'customer' },
  { id: 'timeline', label: 'Van / tot', width: 148, kind: 'timeline' },
  { id: 'status', label: 'Status', width: 104, kind: 'status' },
  { id: 'date', label: 'Datum', width: 78, kind: 'date' },
  { id: 'plan', label: 'Planning', width: 78, kind: 'plan' },
];

const BUILTIN_IDS = new Set(DEFAULT_BOARD_COLUMNS.map((column) => column.id));

export function clampColumnWidth(value: unknown): number {
  const width = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(width)) return 140;
  return Math.min(COLUMN_MAX, Math.max(COLUMN_MIN, Math.round(width)));
}

export function boardColumns(stored: unknown): BoardColumn[] {
  const list = Array.isArray(stored) ? stored : [];
  const widths = new Map<string, number>();
  const custom: BoardColumn[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const row = item as { id?: unknown; label?: unknown; width?: unknown; kind?: unknown };
    const id = typeof row.id === 'string' ? row.id.trim().slice(0, 40) : '';
    const kind = typeof row.kind === 'string' ? row.kind : '';
    if (!id || !TASK_COLUMN_KINDS.includes(kind as TaskColumnKind)) continue;
    if (BUILTIN_IDS.has(id) && id === kind) {
      widths.set(id, clampColumnWidth(row.width));
      continue;
    }
    if (kind !== 'text' && kind !== 'number') continue;
    if (BUILTIN_IDS.has(id)) continue;
    custom.push({
      id,
      kind,
      label: (typeof row.label === 'string' && row.label.trim() ? row.label.trim() : kind === 'number' ? 'Getal' : 'Tekst').slice(0, 40),
      width: clampColumnWidth(row.width),
    });
  }
  return [
    ...DEFAULT_BOARD_COLUMNS.map((column) => ({ ...column, width: widths.get(column.id) ?? column.width })),
    ...custom,
  ];
}

export function colleagueNames(names: string[]): string {
  const first = names.map((name) => name.trim().split(/\s+/)[0] ?? '').filter(Boolean);
  if (first.length === 0) return '';
  if (first.length === 1) return first[0];
  if (first.length === 2) return `${first[0]} & ${first[1]}`;
  return `${first.slice(0, -1).join(', ')} & ${first[first.length - 1]}`;
}
