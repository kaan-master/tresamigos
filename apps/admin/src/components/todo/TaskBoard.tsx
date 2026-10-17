import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useNarrow } from '../../lib/todo/narrow';
import { createPortal, flushSync } from 'react-dom';
import { Archive, CalendarDays, Check, ChevronDown, ChevronRight, GripVertical, ListTodo, Plus, Save, Star, Trash2 } from 'lucide-react';
import { DatePick } from './DateTimePick';
import { api } from './api';
import { TaskSlide, type TaskDocument } from './TaskSlide';
import { Alert, PhoneBar, Skeleton, humanError, useTodoUi } from './ui';
import {
  GROUP_PALETTE,
  TASK_STATUSES,
  boardColumns,
  clampColumnWidth,
  colleagueNames,
  isOpenTaskStatus,
  placeById,
  placeOpenTask,
  taskStatus,
  type BoardColumn,
} from '@tresamigos/utils';
import { useCategoryDrag, type CategoryDrag } from '../../lib/todo/categoryDrag';
import { useHoldDrag } from '../../lib/todo/holdDrag';
import { useTaskDrag } from '../../lib/todo/taskDrag';
import './todo.css';

type Customer = { id: string; companyName: string; city?: string };

type Person = { id: string; name: string; avatarData?: string };
type TaskCustomer = { id: string; companyName: string };

type Board = { id: string; name: string; grouped: boolean; starred?: boolean; columns: BoardColumn[]; sortOrder: number };

function normalizeBoard(board: Board): Board {
  return { ...board, columns: boardColumns(board.columns) };
}
type Category = { id: string; name: string; color: string; sortOrder: number; boardId?: string | null };

type TaskComment = { id: string; body: string; createdAt: string; author: Person };
type TaskFile = { id: string; name: string; mime: string; author: Person };
type TaskItem = {
  id: string;
  boardId: string;
  categoryId: string | null;
  title: string;
  notes: string;
  status: string;
  customer: TaskCustomer | null;
  assignee: Person | null;
  assignees?: Person[];
  startDate: string | null;
  dueDate: string | null;
  includeInAgenda: boolean;
  fields?: Record<string, string>;
  sortOrder: number;
  updates?: number;
};

type Menu =
  | { kind: 'status' | 'person' | 'customer' | 'category'; taskId: string; top: number; left: number }
  | { kind: 'dates'; taskId: string; top: number; left: number; draft: { startDate: string; dueDate: string; notes: string } }
  | { kind: 'color'; categoryId: string; top: number; left: number };

type Section = {
  key: string;
  title: string;
  color: string;
  categoryId: string | null;
  tasks: TaskItem[];
};

const AVATAR = ['#579bfc', '#00c875', '#fdab3d', '#e2445c', '#a25ddc', '#ff642e', '#007eb5', '#037f4c'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = (hash + name.charCodeAt(index)) % AVATAR.length;
  return AVATAR[hash];
}

function PersonFace({ person }: { person: Person }) {
  if (person.avatarData) {
    return <span className="task-avatar has-photo"><img src={person.avatarData} alt="" /></span>;
  }
  return <span className="task-avatar" style={{ background: avatarColor(person.name) }}>{initials(person.name)}</span>;
}

function taskPeople(task: { assignee: Person | null; assignees?: Person[] }): Person[] {
  if (task.assignees?.length) return task.assignees;
  return task.assignee ? [task.assignee] : [];
}

function PeopleStack({ people }: { people: Person[] }) {
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  if (people.length === 0) return null;
  const label = colleagueNames(people.map((person) => person.name));
  function show(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    setTip({ x: rect.left + rect.width / 2, y: rect.top });
  }
  return (
    <span
      className="task-faces"
      onMouseEnter={(event) => show(event.currentTarget)}
      onMouseLeave={() => setTip(null)}
    >
      {people.map((person) => <PersonFace key={person.id} person={person} />)}
      {tip ? createPortal(
        <span className="task-people-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">{label}</span>,
        document.body,
      ) : null}
    </span>
  );
}

function forBoard(categories: Category[], boardId: string | null | undefined) {
  if (!boardId) return categories;
  const scoped = categories.filter((item) => item.boardId === boardId);
  const list = scoped.length > 0 || categories.some((item) => item.boardId) ? scoped : categories;
  return [...list].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'nl'));
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function shortDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '');
}

function todayIso(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function placeMenu(rect: DOMRect, width: number, height: number): { top: number; left: number } {
  let left = rect.left;
  if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
  left = Math.max(12, left);
  let top = rect.bottom + 6;
  if (top + height > window.innerHeight - 12) top = Math.max(12, rect.top - height - 6);
  return { top, left };
}

function mergeTask(current: TaskItem, saved: TaskItem, body: Record<string, unknown>): TaskItem {
  return {
    ...current,
    ...('title' in body ? { title: saved.title } : {}),
    ...('notes' in body ? { notes: saved.notes } : {}),
    ...('status' in body ? { status: saved.status } : {}),
    ...('customerId' in body ? { customer: saved.customer } : {}),
    ...('assigneeId' in body || 'assigneeIds' in body ? { assignee: saved.assignee, assignees: saved.assignees } : {}),
    ...('startDate' in body ? { startDate: saved.startDate } : {}),
    ...('dueDate' in body ? { dueDate: saved.dueDate } : {}),
    ...('includeInAgenda' in body ? { includeInAgenda: saved.includeInAgenda } : {}),
    ...('categoryId' in body ? { categoryId: saved.categoryId } : {}),
    ...('fields' in body ? { fields: saved.fields } : {}),
    ...('boardId' in body ? { boardId: saved.boardId, sortOrder: saved.sortOrder } : {}),
  };
}

function TitleCell({ value, disabled, autoFocus, onSave, onOpen }: { value: string; disabled: boolean; autoFocus: boolean; onSave: (next: string) => void; onOpen?: () => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  if (disabled) return <span className="task-title task-title-read">{value}</span>;
  return (
    <input
      className="task-title"
      aria-label="Taaknaam"
      value={text}
      autoFocus={autoFocus}
      onChange={(event) => setText(event.target.value)}
      onDoubleClick={() => onOpen?.()}
      onBlur={(event) => {
        const next = event.currentTarget.value.trim();
        if (!next || next === value) setText(value);
        else onSave(next);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
          onOpen?.();
        }
      }}
    />
  );
}

function InlineName({ value, color, disabled, autoFocus, className, label, onSave, onDone }: {
  value: string;
  color: string;
  disabled: boolean;
  autoFocus: boolean;
  className?: string;
  label: string;
  onSave: (next: string) => void;
  onDone?: () => void;
}) {
  const [text, setText] = useState(value);
  const cancelRef = useRef(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (!autoFocus) return;
    const field = fieldRef.current;
    if (!field) return;
    field.focus();
    field.select();
  }, [autoFocus]);
  const classes = className ?? 'task-group-name';
  const tone = color ? { color } : undefined;
  if (disabled) return <strong className={classes} style={tone}>{value}</strong>;
  return (
    <input
      ref={fieldRef}
      className={classes}
      aria-label={label}
      style={tone}
      value={text}
      autoFocus={autoFocus}
      onChange={(event) => setText(event.target.value)}
      onBlur={(event) => {
        if (cancelRef.current) {
          cancelRef.current = false;
          setText(value);
          onDone?.();
          return;
        }
        const next = event.currentTarget.value.trim();
        if (!next || next === value) setText(value);
        else onSave(next);
        onDone?.();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          cancelRef.current = true;
          setText(value);
          onDone?.();
          event.currentTarget.blur();
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          const next = (fieldRef.current?.value ?? text).trim();
          if (!next || next === value) setText(value);
          else onSave(next);
          onDone?.();
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function sectionsFor(tasks: TaskItem[], categories: Category[], grouped: boolean): Section[] {
  const sorted = [...tasks].sort((left, right) => left.sortOrder - right.sortOrder);
  if (!grouped) return [{ key: 'all', title: '', color: '', categoryId: null, tasks: sorted }];
  const buckets = new Map<string, TaskItem[]>();
  const loose: TaskItem[] = [];
  for (const task of sorted) {
    if (task.categoryId && categories.some((category) => category.id === task.categoryId)) {
      const list = buckets.get(task.categoryId) ?? [];
      list.push(task);
      buckets.set(task.categoryId, list);
    } else {
      loose.push(task);
    }
  }
  const sections: Section[] = categories.map((category) => ({
    key: category.id,
    title: category.name,
    color: category.color,
    categoryId: category.id,
    tasks: buckets.get(category.id) ?? [],
  }));
  sections.push({ key: 'none', title: 'Zonder categorie', color: '#c4c4c4', categoryId: null, tasks: loose });
  return sections;
}


function PhoneTodo({
  boards, tasks, categories, colleagues, customers, documents, canWrite, error, openId, setOpenId, createBoard, removeBoard, createTask, patch, removeTask, togglePlan, onCount, reorderTasks, reorderBoards, starBoard, catDrag, bindHead,
}: {
  boards: Board[] | null;
  tasks: TaskItem[];
  categories: Category[];
  colleagues: Person[];
  customers: Customer[];
  documents: TaskDocument[];
  canWrite: boolean;
  error: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  createBoard: () => Promise<Board | null>;
  removeBoard: (item: Board) => Promise<void>;
  createTask: (categoryId: string | null, title: string, draftKey: string, boardId?: string) => Promise<boolean>;
  patch: (id: string, body: Record<string, unknown>) => Promise<boolean>;
  removeTask: (task: TaskItem) => Promise<void>;
  togglePlan: (task: TaskItem) => Promise<void>;
  onCount: (id: string, delta: number) => void;
  reorderTasks: (boardId: string, id: string, target: { beforeId: string | null; categoryId: string | null }) => Promise<void>;
  reorderBoards: (id: string, beforeId: string | null) => Promise<void>;
  starBoard: (item: Board) => Promise<void>;
  catDrag: CategoryDrag | null;
  bindHead: (item: { id: string; title: string }) => {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onContextMenu: (event: ReactMouseEvent) => void;
  };
}) {
  const [phoneBoardId, setPhoneBoardId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const openTask = tasks.find((item) => item.id === openId) ?? null;
  const orderedBoards = [...(boards ?? [])].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'nl'));
  const phoneBoard = phoneBoardId ? orderedBoards.find((item) => item.id === phoneBoardId) ?? null : null;
  const phoneCategories = forBoard(categories, openTask?.boardId ?? phoneBoard?.id);
  const openReady = Boolean(openTask);
  const { drag, bindRow } = useTaskDrag({
    enabled: canWrite && !openTask,
    grouped: Boolean(phoneBoard?.grouped),
    onDrop: (id, target) => { if (phoneBoard) void reorderTasks(phoneBoard.id, id, target); },
  });
  const { drag: boardDrag, bindChip } = useHoldDrag({
    enabled: canWrite && !openTask,
    onDrop: (id, beforeId) => { void reorderBoards(id, beforeId); },
  });

  useEffect(() => {
    if (openTask) setPhoneBoardId(openTask.boardId);
  }, [openId, openReady]);

  function openBoard(id: string) {
    setPhoneBoardId(id);
    setOpenId(null);
  }

  if (error && !boards) return <Alert tone="error">{error}</Alert>;
  if (!boards) return <Skeleton rows={6} />;

  const mine = phoneBoard ? tasks.filter((task) => task.boardId === phoneBoard.id) : [];
  const sections = phoneBoard ? sectionsFor(mine, phoneCategories, phoneBoard.grouped) : [];
  return (
    <div className={`phone-hold${drag || boardDrag || catDrag ? ' is-reordering' : ''}`}>
      <PhoneBar
        title={phoneBoard ? phoneBoard.name : 'Taken'}
        onBack={phoneBoard ? () => { setPhoneBoardId(null); setOpenId(null); } : undefined}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {phoneBoard ? null : (
        <div className="phone-boards" aria-label="Boards">
          {orderedBoards.map((item) => {
            const count = tasks.filter((task) => task.boardId === item.id).length;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className={`phone-board${boardDrag?.id === item.id ? ' is-lifting' : ''}`}
                data-board-id={item.id}
                {...(canWrite ? bindChip({ id: item.id, title: item.name }) : {})}
                onClick={() => openBoard(item.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openBoard(item.id);
                  }
                }}
              >
                <span className="phone-board-copy">
                  <strong>{item.name}</strong>
                  <small>{count} {count === 1 ? 'taak' : 'taken'}</small>
                </span>
                {canWrite ? (
                  <button
                    type="button"
                    className={`board-star${item.starred ? ' on' : ''}`}
                    aria-pressed={Boolean(item.starred)}
                    aria-label={item.starred ? 'Ster weghalen' : 'Dit board als eerste openen'}
                    title={item.starred ? 'Dit board opent als eerste' : 'Markeer als eerste board'}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => { event.stopPropagation(); void starBoard(item); }}
                  >
                    <Star size={14} fill={item.starred ? 'currentColor' : 'none'} />
                  </button>
                ) : item.starred ? <Star size={14} className="board-star on" aria-label="Eerste board" /> : null}
              </div>
            );
          })}
          {canWrite ? (
            <button type="button" className="phone-board phone-board-new" onClick={() => void createBoard().then((created) => { if (created) openBoard(created.id); })}>
              <Plus size={16} /> Nieuw board
            </button>
          ) : null}
        </div>
      )}
      {phoneBoard ? sections.map((section) => (
        <section key={section.key} className="task-section" data-drop-cat={section.categoryId ?? ''}>
          {phoneBoard.grouped && section.categoryId ? (
            <header
              className={`phone-section task-group-head${catDrag?.id === section.categoryId ? ' is-lifting' : ''}`}
              data-category-id={section.categoryId}
              style={{ color: section.color, ['--group' as string]: section.color }}
              {...(canWrite ? bindHead({ id: section.categoryId, title: section.title }) : {})}
            >
              {canWrite ? <GripVertical size={14} className="task-grip" aria-hidden /> : null}
              {section.title}
            </header>
          ) : phoneBoard.grouped ? <p className="phone-section" style={{ color: section.color }}>{section.title}</p> : null}
          <div className="phone-tasks">
            {section.tasks.map((task) => {
              const status = taskStatus(task.status);
              const category = phoneCategories.find((item) => item.id === task.categoryId);
              const meta = [category?.name, task.dueDate ? shortDay(task.dueDate) : ''].filter(Boolean).join(' · ');
              const open = isOpenTaskStatus(task.status);
              return (
                <div
                  key={task.id}
                  className={`phone-task${open ? ' task-row' : ''}${drag?.id === task.id ? ' is-lifting' : ''}`}
                  data-task-id={task.id}
                  data-open={open ? '1' : undefined}
                  {...(open ? bindRow({ id: task.id, title: task.title }, canWrite) : {})}
                >
                  <button
                    type="button"
                    className="phone-check"
                    aria-label={task.status === 'DONE' ? 'Terug naar te doen' : 'Markeer als klaar'}
                    style={{ borderColor: status.color, background: task.status === 'DONE' ? status.color : 'transparent' }}
                    onClick={() => void patch(task.id, { status: task.status === 'DONE' ? 'TODO' : 'DONE' })}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    {task.status === 'DONE' ? <Check size={12} color="#fff" /> : null}
                  </button>
                  <button type="button" onClick={() => setOpenId(task.id)}>
                    <strong className="phone-task-title"><span>{task.title}</span></strong>
                    {meta || task.includeInAgenda ? <small>{task.includeInAgenda ? <ListTodo size={12} aria-hidden /> : null}{meta}</small> : null}
                  </button>
                  <PeopleStack people={taskPeople(task)} />
                </div>
              );
            })}
          </div>
        </section>
      )) : null}
      {canWrite && phoneBoard ? (
        <form className="phone-compose" onSubmit={(event) => { event.preventDefault(); void createTask(null, draft, 'phone', phoneBoard.id).then((ok) => { if (ok) setDraft(''); }); }}>
          <Plus size={16} />
          <input aria-label="Taak toevoegen" placeholder="Taak toevoegen" value={draft} onChange={(event) => setDraft(event.target.value)} />
        </form>
      ) : null}
      {canWrite && phoneBoard && orderedBoards.length > 1 ? (
        <button type="button" className="phone-board-delete" onClick={() => void removeBoard(phoneBoard)}>
          <Trash2 size={15} /> Board verwijderen
        </button>
      ) : null}
      {drag ? (
        <>
          <div className="task-drag-ghost" style={{ top: drag.y, left: drag.x, width: drag.width }}>{drag.title}</div>
          {drag.drop ? <div className="task-drop-line" style={{ top: drag.drop.y, left: drag.x, width: drag.width }} /> : null}
        </>
      ) : null}
      {boardDrag ? (
        <>
          <div className="task-drag-ghost" style={{ top: boardDrag.y, left: boardDrag.x, width: boardDrag.width, height: boardDrag.height }}>{boardDrag.title}</div>
          {boardDrag.line != null ? <div className="board-drop-line" style={{ top: boardDrag.lineTop, left: boardDrag.line, height: boardDrag.horizontal ? 3 : boardDrag.lineHeight, width: boardDrag.horizontal ? boardDrag.lineWidth : undefined }} /> : null}
        </>
      ) : null}
      {catDrag ? (
        <>
          <div className="task-drag-ghost" style={{ top: catDrag.y, left: catDrag.x, width: catDrag.width }}>{catDrag.title}</div>
          {catDrag.line != null ? <div className="task-drop-line" style={{ top: catDrag.line, left: catDrag.lineX, width: catDrag.lineWidth }} /> : null}
        </>
      ) : null}
      {openTask ? (
        <TaskSlide
          task={openTask}
          categories={phoneCategories}
          colleagues={colleagues}
          customers={customers}
          documents={documents}
          canWrite={canWrite}
          onClose={() => setOpenId(null)}
          onPatch={patch}
          onRemove={() => removeTask(openTask)}
          onPlan={() => togglePlan(openTask)}
          onCount={(delta) => onCount(openTask.id, delta)}
        />
      ) : null}
    </div>
  );
}

export function TodoPanel({ userId }: { userId: string | null }) {
  const highlightId = new URLSearchParams(window.location.search).get('taak');
  const narrow = useNarrow();
  return (
    <main className={narrow ? 'todo-page phone-app' : 'todo-page'}>
      <TaskBoard highlightId={highlightId} userId={userId} />
    </main>
  );
}

function TaskBoard({ highlightId, userId }: { highlightId?: string | null; userId: string | null }) {
  const narrow = useNarrow();
  const { canWrite, confirm, toast } = useTodoUi();
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [colleagues, setColleagues] = useState<Person[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const documents: TaskDocument[] = [];
  const [error, setError] = useState('');
  const [menu, setMenu] = useState<Menu | null>(null);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [focusTitle, setFocusTitle] = useState<string | null>(null);
  const [focusName, setFocusName] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(highlightId ?? null);
  const [dragWidth, setDragWidth] = useState<{ id: string; width: number } | null>(null);
  const [focusBoard, setFocusBoard] = useState<string | null>(null);
  const jumped = useRef(false);
  const boardSave = useRef(0);
  const anchorRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef(menu);
  menuRef.current = menu;
  const menuKey = menu == null ? '' : `${menu.kind}:${'taskId' in menu ? menu.taskId : menu.categoryId}`;

  useEffect(() => {
    void api<{ boards: Board[]; categories: Category[]; tasks: TaskItem[]; colleagues: Person[] }>('/tasks')
      .then((data) => {
        setBoards(data.boards.map(normalizeBoard));
        setCategories(data.categories);
        setTasks(data.tasks);
        setColleagues(data.colleagues);
      })
      .catch((err: unknown) => setError(humanError(err, 'De taken konden niet worden geladen.')));
    void api<Customer[]>('/customers').then(setCustomers).catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    if (!boards?.length) return;
    setBoardId((current) => {
      if (current && boards.some((item) => item.id === current)) return current;
      const highlighted = highlightId ? tasks.find((task) => task.id === highlightId) : undefined;
      if (highlighted && boards.some((item) => item.id === highlighted.boardId)) return highlighted.boardId;
      return boards.find((item) => item.starred)?.id ?? boards[0].id;
    });
  }, [boards, tasks, highlightId]);

  const board = boards?.find((item) => item.id === boardId) ?? boards?.[0] ?? null;

  useEffect(() => {
    if (!highlightId) return;
    setOpenId(highlightId);
  }, [highlightId]);

  useEffect(() => {
    if (jumped.current || !highlightId || !boards || narrow) return;
    const task = tasks.find((item) => item.id === highlightId);
    if (!task) return;
    jumped.current = true;
    window.setTimeout(() => {
      document.querySelector(`[data-task-id="${CSS.escape(highlightId)}"]`)?.scrollIntoView({ block: 'center' });
    }, 40);
  }, [boards, highlightId, narrow, tasks]);

  useEffect(() => {
    if (!menu) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setMenu(null);
    }
    function onPointer(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.task-menu') || target.closest('[data-task-trigger]') || target.closest('.dt-pop')) return;
      setMenu(null);
    }
    function place(event?: Event) {
      const target = event?.target;
      if (target instanceof Element && target.closest('.task-menu')) return;
      const anchor = anchorRef.current;
      if (!anchor?.isConnected) {
        setMenu(null);
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const header = document.querySelector('.ay-topbar')?.getBoundingClientRect().bottom ?? 0;
      const scroller = anchor.closest('.task-scroll')?.getBoundingClientRect();
      const hidden = rect.bottom <= header
        || rect.top >= window.innerHeight
        || rect.right <= 0
        || rect.left >= window.innerWidth
        || (scroller != null && (rect.bottom <= scroller.top || rect.top >= scroller.bottom || rect.right <= scroller.left || rect.left >= scroller.right));
      if (hidden) {
        setMenu(null);
        return;
      }
      const popup = document.querySelector('.task-menu');
      const popupEl = popup instanceof HTMLElement ? popup : null;
      const current = menuRef.current;
      if (!current) return;
      const width = popupEl?.offsetWidth || (current.kind === 'dates' ? 280 : current.kind === 'customer' || current.kind === 'category' || current.kind === 'person' ? 260 : current.kind === 'color' ? 220 : 188);
      const height = popupEl?.offsetHeight || (current.kind === 'dates' ? 280 : current.kind === 'color' ? 80 : 240);
      const next = placeMenu(rect, width, height);
      setMenu((item) => {
        if (!item || (item.top === next.top && item.left === next.left)) return item;
        return { ...item, top: next.top, left: next.left };
      });
    }
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    const frame = requestAnimationFrame(() => place());
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      cancelAnimationFrame(frame);
    };
  }, [menuKey]);

  function taskById(id: string): TaskItem | null {
    return tasks.find((item) => item.id === id) ?? null;
  }

  async function patch(id: string, body: Record<string, unknown>): Promise<boolean> {
    try {
      const saved = await api<TaskItem>(`/tasks/${id}`, 'PATCH', body);
      setTasks((current) => current.map((item) => (item.id === saved.id ? mergeTask(item, saved, body) : item)));
      return true;
    } catch (err: unknown) {
      toast('error', humanError(err, 'De taak kon niet worden opgeslagen.'));
      return false;
    }
  }

  async function createTask(categoryId: string | null, title: string, draftKey: string, boardIdOverride?: string): Promise<boolean> {
    const targetBoardId = boardIdOverride ?? board?.id;
    if (!targetBoardId) return false;
    const name = title.trim();
    if (!name) return false;
    try {
      const created = await api<TaskItem>('/tasks', 'POST', {
        boardId: targetBoardId,
        title: name,
        ...(categoryId ? { categoryId } : {}),
      });
      setTasks((current) => [...current, created]);
      setDraftTitle((current) => ({ ...current, [draftKey]: '' }));
      setFocusTitle(created.id);
      return true;
    } catch (err: unknown) {
      toast('error', humanError(err, 'De taak kon niet worden toegevoegd.'));
      return false;
    }
  }

  async function removeTask(task: TaskItem) {
    const ok = await confirm({
      title: 'Taak verwijderen?',
      body: `“${task.title}” verdwijnt uit de lijst en uit de planning.`,
      confirmLabel: 'Verwijderen',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/tasks/${task.id}`, 'DELETE');
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setOpenId((current) => (current === task.id ? null : current));
      toast('success', 'Taak verwijderd.');
    } catch (err: unknown) {
      toast('error', humanError(err, 'De taak kon niet worden verwijderd.'));
    }
  }

  async function removeBoard(item: Board) {
    if ((boards?.length ?? 0) <= 1) {
      toast('error', 'Het laatste board blijft staan.');
      return;
    }
    const taskCount = tasks.filter((task) => task.boardId === item.id).length;
    const ok = await confirm({
      title: 'Board verwijderen?',
      body: taskCount
        ? `“${item.name}” verdwijnt, samen met ${taskCount} ${taskCount === 1 ? 'taak' : 'taken'}.`
        : `“${item.name}” verdwijnt. Dit kan niet ongedaan worden gemaakt.`,
      confirmLabel: 'Verwijderen',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/tasks/boards/${item.id}`, 'DELETE');
      const next = (boards ?? []).filter((boardItem) => boardItem.id !== item.id);
      setBoards(next);
      setBoardId(next.find((item) => item.starred)?.id ?? next[0]?.id ?? null);
      setTasks((current) => current.filter((task) => task.boardId !== item.id));
      setOpenId((current) => (tasks.some((task) => task.id === current && task.boardId === item.id) ? null : current));
      toast('success', 'Board verwijderd.');
    } catch (err: unknown) {
      toast('error', humanError(err, 'Het board kon niet worden verwijderd.'));
    }
  }

  async function createBoard(): Promise<Board | null> {
    try {
      const payload = await api<Board & { categories?: Category[] }>('/tasks/boards', 'POST', { name: 'Nieuw board' });
      const created = normalizeBoard(payload);
      setBoards((current) => [...(current ?? []), created]);
      if (payload.categories?.length) setCategories((current) => [...current, ...(payload.categories ?? [])]);
      setBoardId(created.id);
      setFocusBoard(created.id);
      return created;
    } catch (err: unknown) {
      toast('error', humanError(err, 'Het board kon niet worden toegevoegd.'));
      return null;
    }
  }

  async function patchBoard(id: string, body: { name?: string; grouped?: boolean; starred?: boolean; columns?: BoardColumn[] }) {
    const ticket = ++boardSave.current;
    setBoards((current) => current?.map((item) => {
      if (body.starred && item.id !== id) return { ...item, starred: false };
      return item.id === id ? { ...item, ...body } : item;
    }) ?? current);
    try {
      const saved = normalizeBoard(await api<Board>(`/tasks/boards/${id}`, 'PATCH', body));
      if (ticket !== boardSave.current) return;
      setBoards((current) => current?.map((item) => {
        if (item.id === id) return { ...item, ...saved };
        if (saved.starred) return { ...item, starred: false };
        return item;
      }) ?? current);
    } catch (err: unknown) {
      if (ticket === boardSave.current) toast('error', humanError(err, 'Het board kon niet worden opgeslagen.'));
    }
  }

  function shownColumns(columns: BoardColumn[]): BoardColumn[] {
    if (!dragWidth) return columns;
    return columns.map((column) => (column.id === dragWidth.id ? { ...column, width: dragWidth.width } : column));
  }

  function startResize(event: ReactPointerEvent<HTMLButtonElement>, column: BoardColumn) {
    if (!board || !canWrite) return;
    event.preventDefault();
    event.stopPropagation();
    const activeBoardId = board.id;
    const startX = event.clientX;
    const startWidth = column.width;
    const columns = board.columns;
    function move(pointer: PointerEvent) {
      setDragWidth({ id: column.id, width: clampColumnWidth(startWidth + pointer.clientX - startX) });
    }
    function up(pointer: PointerEvent) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDragWidth(null);
      const width = clampColumnWidth(startWidth + pointer.clientX - startX);
      if (width === column.width) return;
      void patchBoard(activeBoardId, {
        columns: columns.map((item) => (item.id === column.id ? { ...item, width } : item)),
      });
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function shiftStatus(task: TaskItem, status: string) {
    const previous = tasks.find((item) => item.id === task.id);
    const apply = () => {
      setTasks((current) => current.map((item) => (
        item.id === task.id
          ? { ...item, status, ...(status === 'ARCHIVED' ? { includeInAgenda: false } : {}) }
          : item
      )));
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => { flushSync(apply); });
    } else {
      apply();
    }
    const body = status === 'ARCHIVED' ? { status, includeInAgenda: false } : { status };
    void patch(task.id, body).then((ok) => {
      if (!ok && previous) setTasks((current) => current.map((item) => (item.id === task.id ? previous : item)));
    });
  }

  async function createCategory(taskId?: string) {
    const hostId = board?.id ?? tasks.find((item) => item.id === taskId)?.boardId;
    if (!hostId) return;
    try {
      const created = await api<Category>('/tasks/categories', 'POST', { name: 'Nieuwe categorie', boardId: hostId });
      setCategories((current) => [...current, created]);
      setFocusName(created.id);
      if (taskId) await patch(taskId, { categoryId: created.id });
      setMenu(null);
    } catch (err: unknown) {
      toast('error', humanError(err, 'De categorie kon niet worden toegevoegd.'));
    }
  }

  async function patchCategory(id: string, body: { name?: string; color?: string }) {
    try {
      const saved = await api<Category>(`/tasks/categories/${id}`, 'PATCH', body);
      setCategories((current) => current.map((item) => (item.id === id ? { ...item, ...saved } : item)));
    } catch (err: unknown) {
      toast('error', humanError(err, 'De categorie kon niet worden opgeslagen.'));
    }
  }

  async function removeCategory(category: Category) {
    const ok = await confirm({
      title: 'Categorie verwijderen?',
      body: `“${category.name}” verdwijnt. De taken blijven staan, zonder categorie.`,
      confirmLabel: 'Verwijderen',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/tasks/categories/${category.id}`, 'DELETE');
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setTasks((current) => current.map((task) => (task.categoryId === category.id ? { ...task, categoryId: null } : task)));
      setMenu(null);
    } catch (err: unknown) {
      toast('error', humanError(err, 'De categorie kon niet worden verwijderd.'));
    }
  }

  function openMenu(kind: 'status' | 'person' | 'customer' | 'category' | 'dates', id: string, anchor: HTMLElement) {
    anchorRef.current = anchor;
    const width = kind === 'dates' ? 280 : kind === 'customer' || kind === 'category' || kind === 'person' ? 260 : 188;
    const height = kind === 'dates' ? 280 : 240;
    const place = placeMenu(anchor.getBoundingClientRect(), width, height);
    if (kind === 'dates') {
      const found = taskById(id);
      setMenu({
        kind,
        taskId: id,
        ...place,
        draft: {
          startDate: found?.startDate ?? '',
          dueDate: found?.dueDate ?? '',
          notes: found?.notes ?? '',
        },
      });
      return;
    }
    if (kind === 'customer') setQuery('');
    setMenu({ kind, taskId: id, ...place });
  }

  async function togglePlan(task: TaskItem) {
    if (task.includeInAgenda) {
      await patch(task.id, { includeInAgenda: false });
      return;
    }
    const hasDate = Boolean(task.dueDate || task.startDate);
    const claim = taskPeople(task).length || !userId || userId === 'master' ? {} : { assigneeIds: [userId] };
    await patch(task.id, hasDate ? { includeInAgenda: true, ...claim } : { includeInAgenda: true, dueDate: todayIso(), ...claim });
  }

  async function starBoard(item: Board) {
    await patchBoard(item.id, { starred: !item.starred });
  }

  async function reorderCategories(hostId: string, id: string, beforeId: string | null) {
    const scoped = [...forBoard(categories, hostId)].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'nl'));
    const next = placeById(scoped, id, beforeId);
    if (next === scoped) return;
    const previous = categories;
    setCategories([...categories.filter((item) => item.boardId !== hostId), ...next]);
    try {
      await api('/tasks/categories/reorder', 'POST', { boardId: hostId, orderedIds: next.map((item) => item.id) });
    } catch (err: unknown) {
      setCategories(previous);
      toast('error', humanError(err, 'De volgorde kon niet worden opgeslagen.'));
    }
  }

  const active = menu && menu.kind !== 'color' ? taskById(menu.taskId) : null;
  const activeCategory = active?.categoryId ? categories.find((item) => item.id === active.categoryId) ?? null : null;
  const filteredCustomers = customers.filter((customer) => {
    const haystack = `${customer.companyName} ${customer.city ?? ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const customerDraft = query.trim();
  const canAddCustomer = customerDraft.length > 0 && !customers.some((customer) => customer.companyName.toLowerCase() === customerDraft.toLowerCase());

  async function addCustomer(taskId: string, companyName: string) {
    try {
      const created = await api<Customer>('/customers', 'POST', { companyName });
      setCustomers((current) => [...current, created].sort((left, right) => left.companyName.localeCompare(right.companyName, 'nl')));
      setMenu(null);
      setQuery('');
      await patch(taskId, { customerId: created.id });
    } catch (err: unknown) {
      toast('error', humanError(err, 'De klant kon niet worden toegevoegd.'));
    }
  }
  const boardTasks = board ? tasks.filter((task) => task.boardId === board.id) : [];
  const openTasks = boardTasks.filter((task) => isOpenTaskStatus(task.status));
  const doneTasks = boardTasks.filter((task) => task.status === 'DONE');
  const scopedCategories = forBoard(categories, board?.id);
  const sections = board ? sectionsFor(openTasks, scopedCategories, board.grouped) : [];
  const columns = board ? shownColumns(boardColumns(board.columns)) : [];
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `64px ${columns.map((column) => `${column.width}px`).join(' ')} 32px`,
  };

  async function reorderTask(targetBoardId: string, id: string, target: { beforeId: string | null; categoryId: string | null }) {
    const host = boards?.find((item) => item.id === targetBoardId);
    if (!host) return;
    const scoped = tasks.filter((task) => task.boardId === host.id);
    const previous = tasks;
    const next = placeOpenTask(scoped, id, target, host.grouped, forBoard(categories, host.id).map((item) => item.id));
    if (next === scoped) return;
    const merged = tasks.map((task) => next.find((item) => item.id === task.id) ?? task);
    setTasks(merged);
    try {
      await api('/tasks/reorder', 'POST', {
        boardId: host.id,
        items: next.filter((task) => isOpenTaskStatus(task.status)).sort((left, right) => left.sortOrder - right.sortOrder).map((task) => ({
          id: task.id,
          categoryId: task.categoryId,
        })),
      });
    } catch (err: unknown) {
      setTasks(previous);
      toast('error', humanError(err, 'De volgorde kon niet worden opgeslagen.'));
    }
  }

  async function reorderBoards(id: string, beforeId: string | null) {
    if (!boards) return;
    const next = placeById(boards, id, beforeId);
    if (next === boards) return;
    const previous = boards;
    setBoards(next);
    try {
      await api('/tasks/boards/reorder', 'POST', { orderedIds: next.map((item) => item.id) });
    } catch (err: unknown) {
      setBoards(previous);
      toast('error', humanError(err, 'De volgorde kon niet worden opgeslagen.'));
    }
  }

  const { drag, bindRow } = useTaskDrag({
    enabled: canWrite,
    grouped: Boolean(board?.grouped),
    onLift: () => setMenu(null),
    onDrop: (id, target) => { if (board) void reorderTask(board.id, id, target); },
  });
  const { drag: catDrag, bindHead } = useCategoryDrag({
    enabled: canWrite,
    onDrop: (id, beforeId) => {
      const hostId = categories.find((item) => item.id === id)?.boardId;
      if (hostId) void reorderCategories(hostId, id, beforeId);
    },
  });

  function taskRange(task: TaskItem): string {
    if (task.startDate && task.dueDate && task.startDate !== task.dueDate) return `${shortDay(task.startDate)} – ${shortDay(task.dueDate)}`;
    if (task.dueDate) return shortDay(task.dueDate);
    if (task.startDate) return shortDay(task.startDate);
    return '';
  }

  if (narrow) {
    return (
      <PhoneTodo
        boards={boards}
        tasks={tasks}
        categories={categories}
        colleagues={colleagues}
        customers={customers}
        documents={documents}
        canWrite={canWrite}
        error={error}
        openId={openId}
        setOpenId={setOpenId}
        createBoard={createBoard}
        removeBoard={removeBoard}
        createTask={createTask}
        patch={patch}
        removeTask={removeTask}
        togglePlan={togglePlan}
        reorderTasks={reorderTask}
        reorderBoards={reorderBoards}
        starBoard={starBoard}
        catDrag={catDrag}
        bindHead={bindHead}
        onCount={(id, delta) => setTasks((current) => current.map((item) => (
          item.id === id ? { ...item, updates: Math.max(0, (item.updates ?? 0) + delta) } : item
        )))}
      />
    );
  }

  return (
    <div className={`task-board${drag || catDrag ? ' is-reordering' : ''}`}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {boards === null && !error ? <Skeleton rows={6} /> : null}
      {board ? (
        <>
          <header className="todo-bar">
            <nav className="todo-tabs" aria-label="Boards">
              {boards?.map((item) => (
                <span key={item.id} className={`todo-tab${item.id === board.id ? ' active' : ''}`}>
                  {focusBoard === item.id && canWrite ? (
                    <InlineName
                      value={item.name}
                      color=""
                      disabled={false}
                      autoFocus
                      className="todo-tab-name active"
                      label="Boardnaam"
                      onSave={(name) => { void patchBoard(item.id, { name }); }}
                      onDone={() => setFocusBoard((current) => (current === item.id ? null : current))}
                    />
                  ) : (
                    <button
                      type="button"
                      className="todo-tab-hit"
                      aria-current={item.id === board.id ? 'page' : undefined}
                      onClick={() => setBoardId(item.id)}
                      onDoubleClick={() => {
                        if (!canWrite) return;
                        setBoardId(item.id);
                        setFocusBoard(item.id);
                      }}
                      title={canWrite ? 'Dubbelklik om de naam te wijzigen' : item.name}
                    >
                      {item.name}
                    </button>
                  )}
                  {canWrite ? (
                    <button
                      type="button"
                      className={`todo-star${item.starred ? ' on' : ''}`}
                      aria-pressed={Boolean(item.starred)}
                      aria-label={item.starred ? 'Ster weghalen' : 'Dit board als eerste openen'}
                      title={item.starred ? 'Dit board opent als eerste' : 'Markeer als eerste board'}
                      onClick={() => void starBoard(item)}
                    >
                      <Star size={14} fill={item.starred ? 'currentColor' : 'none'} />
                    </button>
                  ) : item.starred ? <Star size={14} className="todo-star-mark" aria-label="Eerste board" /> : null}
                </span>
              ))}
              {canWrite ? (
                <button type="button" className="todo-add" aria-label="Nieuw board" title="Nieuw board" onClick={() => void createBoard()}>
                  <Plus size={16} />
                </button>
              ) : null}
            </nav>
            <div className="todo-actions">
              {canWrite ? (
                <button
                  type="button"
                  title="Board hernoemen"
                  onClick={() => {
                    setFocusBoard(board.id);
                    window.requestAnimationFrame(() => {
                      const field = document.querySelector<HTMLInputElement>('input.todo-tab-name');
                      field?.focus();
                      field?.select();
                    });
                  }}
                >
                  Hernoemen
                </button>
              ) : null}
              {canWrite && (boards?.length ?? 0) > 1 ? (
                <button type="button" className="icon-only" aria-label="Verwijderen" title="Verwijderen" onClick={() => void removeBoard(board)}>
                  <Trash2 size={15} />
                </button>
              ) : null}
              <button
                type="button"
                className={board.grouped ? 'active' : ''}
                aria-pressed={board.grouped}
                disabled={!canWrite}
                title="Toon de taken per categorie, of weer in één lijst"
                onClick={() => void patchBoard(board.id, { grouped: !board.grouped })}
              >
                Per categorie
              </button>
            </div>
          </header>
          <div className="task-scroll">
            <div className="task-grid task-columns" role="row" style={gridStyle}>
              <span />
              {columns.map((column) => (
                <span key={column.id} className="task-head">
                  {column.label}
                  {canWrite ? (
                    <button
                      type="button"
                      className="task-resize"
                      aria-label={`${column.label} breder of smaller`}
                      title="Sleep om kolombreedte te wijzigen"
                      onPointerDown={(event) => startResize(event, column)}
                    />
                  ) : null}
                </span>
              ))}
              <span />
            </div>
            {[...sections, { key: 'done', title: 'Klaar', color: '#8b909e', categoryId: null, tasks: doneTasks }].map((section) => {
              const isDone = section.key === 'done';
              const shut = !isDone && board.grouped && collapsed[section.key] === true;
              return (
                <section
                  key={section.key}
                  className={`task-section ${isDone ? 'task-done' : ''}`}
                  {...(isDone ? {} : { 'data-drop-cat': section.categoryId ?? '' })}
                >
                  {board.grouped || isDone ? (
                    <header
                      className={`task-group-head${catDrag?.id === section.categoryId ? ' is-lifting' : ''}`}
                      style={{ '--group': section.color } as CSSProperties}
                      {...(section.categoryId ? { 'data-category-id': section.categoryId } : {})}
                      {...(section.categoryId && canWrite ? bindHead({ id: section.categoryId, title: section.title }) : {})}
                    >
                      {section.categoryId && canWrite ? <GripVertical size={16} className="task-grip" aria-hidden /> : null}
                      {isDone ? <span className="task-fold" aria-hidden="true" /> : (
                        <button
                          type="button"
                          className={`task-fold ${shut ? 'shut' : ''}`}
                          aria-expanded={!shut}
                          aria-label={shut ? 'Categorie openen' : 'Categorie inklappen'}
                          onClick={() => setCollapsed((current) => ({ ...current, [section.key]: !shut }))}
                        >
                          <ChevronDown size={16} />
                        </button>
                      )}
                      {section.categoryId ? (
                        <>
                          <button
                            type="button"
                            className="task-swatch"
                            style={{ background: section.color }}
                            aria-label="Kleur van de categorie"
                            data-task-trigger=""
                            disabled={!canWrite}
                            onClick={(event) => {
                              anchorRef.current = event.currentTarget;
                              const place = placeMenu(event.currentTarget.getBoundingClientRect(), 220, 80);
                              setMenu({ kind: 'color', categoryId: section.categoryId as string, ...place });
                            }}
                          />
                          <InlineName
                            value={section.title}
                            color={section.color}
                            disabled={!canWrite}
                            autoFocus={focusName === section.categoryId}
                            label="Categorienaam"
                            onSave={(name) => void patchCategory(section.categoryId as string, { name })}
                          />
                        </>
                      ) : (
                        <strong className="task-group-name" style={{ color: section.color }}>{section.title}</strong>
                      )}
                      <span className="task-count">{section.tasks.length}</span>
                      {canWrite && section.categoryId ? (
                        <span className="task-group-actions">
                          <button
                            type="button"
                            className="task-icon"
                            aria-label="Categorie verwijderen"
                            onClick={() => {
                              const category = categories.find((item) => item.id === section.categoryId);
                              if (category) void removeCategory(category);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </span>
                      ) : null}
                    </header>
                  ) : null}
                  {shut ? null : (
                    <>
                      {section.tasks.map((task) => {
                        const status = taskStatus(task.status);
                        const category = scopedCategories.find((item) => item.id === task.categoryId) ?? null;
                        const tint = task.status === 'DONE' ? '#c5c7d0' : (category?.color ?? '#579bfc');
                        const range = taskRange(task);
                        return (
                          <div
                            key={task.id}
                            className={`task-grid task-row ${highlightId === task.id ? 'is-focus' : ''} ${task.status === 'DONE' ? 'is-done' : ''} ${drag?.id === task.id ? 'is-lifting' : ''}`}
                            data-task-id={task.id}
                            {...(isDone ? {} : { 'data-open': '1' })}
                            style={{ ...gridStyle, viewTransitionName: `task-${task.id}` } as CSSProperties}
                            {...bindRow(task, canWrite && !isDone)}
                          >
                            <div className="task-lead">
                              <button
                                type="button"
                                className={`task-check ${task.status === 'DONE' ? 'on' : ''}`}
                                aria-pressed={task.status === 'DONE'}
                                aria-label={task.status === 'DONE' ? 'Terug naar te doen' : 'Afvinken'}
                                disabled={!canWrite}
                                onClick={() => shiftStatus(task, task.status === 'DONE' ? 'TODO' : 'DONE')}
                              >
                                {task.status === 'DONE' ? <Check size={14} /> : null}
                              </button>
                              <button
                                type="button"
                                className="task-open"
                                aria-label="Taak openen"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => setOpenId(task.id)}
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                            <div className="task-name">
                              {task.includeInAgenda ? <ListTodo size={14} aria-hidden /> : null}
                              <TitleCell
                                value={task.title}
                                disabled={!canWrite}
                                autoFocus={focusTitle === task.id}
                                onSave={(title) => void patch(task.id, { title })}
                                onOpen={() => setOpenId(task.id)}
                              />
                            </div>
                            <button
                              type="button"
                              className="task-pick task-category"
                              data-task-trigger=""
                              disabled={!canWrite}
                              onClick={(event) => openMenu('category', task.id, event.currentTarget)}
                            >
                              <i style={{ background: category?.color ?? '#c4c4c4' }} />
                              <span className={category ? '' : 'muted-person'}>{category?.name || 'Categorie'}</span>
                            </button>
                            <button
                              type="button"
                              className="task-pick"
                              data-task-trigger=""
                              disabled={!canWrite}
                              onClick={(event) => openMenu('person', task.id, event.currentTarget)}
                            >
                              {taskPeople(task).length ? (
                                <PeopleStack people={taskPeople(task)} />
                              ) : (
                                <span className="task-person muted-person">
                                  <span className="task-avatar is-blank">+</span>
                                  <span>Collega</span>
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              className="task-pick task-customer"
                              data-task-trigger=""
                              disabled={!canWrite}
                              onClick={(event) => openMenu('customer', task.id, event.currentTarget)}
                            >
                              <span className={task.customer ? '' : 'muted-person'}>{task.customer?.companyName || 'Klant'}</span>
                            </button>
                            <button
                              type="button"
                              className={`task-timeline ${range ? '' : 'is-blank'}`}
                              data-task-trigger=""
                              disabled={!canWrite}
                              onClick={(event) => openMenu('dates', task.id, event.currentTarget)}
                            >
                              <CalendarDays size={14} />
                              {range || 'Datum'}
                            </button>
                            <button
                              type="button"
                              className="task-status"
                              style={{ background: task.status === 'DONE' ? '#c5c7d0' : status.color }}
                              data-task-trigger=""
                              disabled={!canWrite}
                              onClick={(event) => openMenu('status', task.id, event.currentTarget)}
                            >
                              {status.label}
                            </button>
                            <button
                              type="button"
                              className="task-date"
                              data-task-trigger=""
                              disabled={!canWrite}
                              onClick={(event) => openMenu('dates', task.id, event.currentTarget)}
                            >
                              {task.dueDate ? shortDay(task.dueDate) : task.startDate ? shortDay(task.startDate) : '—'}
                            </button>
                            <button
                              type="button"
                              className={`task-plan ${task.includeInAgenda ? 'on' : ''}`}
                              style={task.includeInAgenda ? { background: tint, borderColor: tint } : undefined}
                              aria-pressed={task.includeInAgenda}
                              aria-label={task.includeInAgenda ? 'Haal uit de planning' : 'Zet in de planning'}
                              title={task.includeInAgenda ? 'Staat in de agenda' : 'Meenemen in de planning'}
                              disabled={!canWrite}
                              onClick={() => void togglePlan(task)}
                            >
                              <ListTodo size={15} />
                            </button>
                            {canWrite && task.status === 'DONE' ? (
                              <button type="button" className="task-icon task-delete" aria-label="Archiveren" title="Archiveren" onClick={() => shiftStatus(task, 'ARCHIVED')}>
                                <Archive size={14} />
                              </button>
                            ) : canWrite ? (
                              <button type="button" className="task-icon task-delete" aria-label="Taak verwijderen" onClick={() => void removeTask(task)}>
                                <Trash2 size={14} />
                              </button>
                            ) : <span />}
                          </div>
                        );
                      })}
                      {isDone && section.tasks.length === 0 ? <p className="muted task-done-empty">Afgevinkte taken komen hier, doorgestreept. Daarna kun je ze archiveren.</p> : null}
                      {!isDone && canWrite ? (
                        <form
                          className="task-grid task-add"
                          style={gridStyle}
                          onSubmit={(event) => {
                            event.preventDefault();
                            void createTask(section.categoryId, draftTitle[section.key] ?? '', section.key);
                          }}
                        >
                          <Plus size={15} />
                          <input
                            className="task-title"
                            aria-label={section.title ? `Nieuwe taak in ${section.title}` : 'Nieuwe taak'}
                            placeholder="Nieuwe taak"
                            value={draftTitle[section.key] ?? ''}
                            onChange={(event) => setDraftTitle((current) => ({ ...current, [section.key]: event.target.value }))}
                          />
                        </form>
                      ) : null}
                    </>
                  )}
                </section>
              );
            })}
          </div>
        </>
      ) : null}

      {drag ? (
        <>
          <div className="task-drag-ghost" style={{ top: drag.y, left: drag.x, width: drag.width }}>{drag.title}</div>
          {drag.drop ? <div className="task-drop-line" style={{ top: drag.drop.y, left: drag.x, width: drag.width }} /> : null}
        </>
      ) : null}
      {catDrag ? (
        <>
          <div className="task-drag-ghost" style={{ top: catDrag.y, left: catDrag.x, width: catDrag.width }}>{catDrag.title}</div>
          {catDrag.line != null ? <div className="task-drop-line" style={{ top: catDrag.line, left: catDrag.lineX, width: catDrag.lineWidth }} /> : null}
        </>
      ) : null}

      {menu?.kind === 'status' && active ? (
        <div className="task-menu" style={{ top: menu.top, left: menu.left }} role="listbox" aria-label="Status">
          {TASK_STATUSES.map((status) => (
            <button
              key={status.id}
              type="button"
              role="option"
              aria-selected={active.status === status.id}
              className="task-status"
              style={{ background: status.color }}
              onClick={() => {
                setMenu(null);
                if (status.id === active.status) return;
                if (status.id === 'DONE' || active.status === 'DONE') shiftStatus(active, status.id);
                else void patch(active.id, { status: status.id });
              }}
            >
              {status.label}
              {active.status === status.id ? <Check size={14} /> : null}
            </button>
          ))}
        </div>
      ) : null}

      {menu?.kind === 'person' && active ? (
        <div className="task-menu task-menu-list" style={{ top: menu.top, left: menu.left }} role="listbox" aria-label="Collega's">
          <button type="button" onClick={() => { setMenu(null); void patch(active.id, { assigneeIds: [] }); }}>
            Niemand
          </button>
          {colleagues.map((person) => {
            const picked = taskPeople(active).some((item) => item.id === person.id);
            return (
              <button
                key={person.id}
                type="button"
                aria-pressed={picked}
                onClick={() => {
                  const ids = taskPeople(active).map((item) => item.id);
                  const next = picked ? ids.filter((id) => id !== person.id) : [...ids, person.id];
                  void patch(active.id, { assigneeIds: next });
                }}
              >
                <PersonFace person={person} />
                <span className="menu-copy">{person.name}</span>
                {picked ? <Check size={14} /> : null}
              </button>
            );
          })}
          {colleagues.length === 0 ? <p>Nog geen collega’s.</p> : null}
        </div>
      ) : null}

      {menu?.kind === 'customer' && active ? (
        <div className="task-menu task-menu-list" style={{ top: menu.top, left: menu.left }} role="listbox" aria-label="Klant">
          <input
            autoFocus
            placeholder="Zoek klant"
            aria-label="Zoek klant"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" onClick={() => { setMenu(null); void patch(active.id, { customerId: null }); }}>
            Geen klant
          </button>
          {filteredCustomers.slice(0, 12).map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => { setMenu(null); void patch(active.id, { customerId: customer.id }); }}
            >
              <span className="menu-copy">
                {customer.companyName}
                {customer.city ? <small>{customer.city}</small> : null}
              </span>
              {active.customer?.id === customer.id ? <Check size={14} /> : null}
            </button>
          ))}
          {canAddCustomer ? (
            <button type="button" onClick={() => { void addCustomer(active.id, customerDraft); }}>
              Klant toevoegen: {customerDraft}
            </button>
          ) : null}
          {filteredCustomers.length === 0 && !canAddCustomer ? <p>Geen klant gevonden.</p> : null}
        </div>
      ) : null}

      {menu?.kind === 'category' && active ? (
        <div className="task-menu task-menu-list task-categories" style={{ top: menu.top, left: menu.left }} role="listbox" aria-label="Categorie">
          <button type="button" onClick={() => { setMenu(null); void patch(active.id, { categoryId: null }); }}>
            Geen categorie
          </button>
          {forBoard(categories, active.boardId).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => { setMenu(null); void patch(active.id, { categoryId: category.id }); }}
            >
              <i className="task-dot" style={{ background: category.color }} />
              <span className="menu-copy">{category.name}</span>
              {active.categoryId === category.id ? <Check size={14} /> : null}
            </button>
          ))}
          {canWrite ? (
            <button type="button" onClick={() => void createCategory(active.id)}>
              <Plus size={14} /> Nieuwe categorie
            </button>
          ) : null}
          {activeCategory && canWrite ? (
            <div className="task-category-edit">
              <InlineName
                value={activeCategory.name}
                color={activeCategory.color}
                disabled={false}
                autoFocus={focusName === activeCategory.id}
                label="Categorienaam"
                onSave={(name) => void patchCategory(activeCategory.id, { name })}
              />
              <div className="task-colors">
                {GROUP_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    className="task-swatch"
                    style={{ background: color }}
                    onClick={() => void patchCategory(activeCategory.id, { color })}
                  >
                    {activeCategory.color === color ? <Check size={14} color="#fff" /> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {menu?.kind === 'dates' && active ? (
        <form
          className="task-menu task-dates"
          style={{ top: menu.top, left: menu.left }}
          onSubmit={(event) => {
            event.preventDefault();
            const startDate = menu.draft.startDate || null;
            const dueDate = menu.draft.dueDate || null;
            void patch(active.id, {
              startDate,
              dueDate,
              notes: menu.draft.notes,
              ...(!startDate && !dueDate && active.includeInAgenda ? { includeInAgenda: false } : {}),
            }).then((ok) => { if (ok) setMenu(null); });
          }}
        >
          <label>
            Van
            <DatePick
              value={menu.draft.startDate}
              ariaLabel="Startdatum"
              placeholder="Kies startdatum"
              onChange={(startDate) => setMenu({ ...menu, draft: { ...menu.draft, startDate } })}
            />
          </label>
          <label>
            Tot en met
            <DatePick
              value={menu.draft.dueDate}
              ariaLabel="Einddatum"
              placeholder="Kies einddatum"
              onChange={(dueDate) => setMenu({ ...menu, draft: { ...menu.draft, dueDate } })}
            />
          </label>
          <label>
            Notitie
            <textarea
              rows={3}
              value={menu.draft.notes}
              onChange={(event) => setMenu({ ...menu, draft: { ...menu.draft, notes: event.target.value } })}
            />
          </label>
          <button type="submit" className="primary"><Save size={16} />Opslaan</button>
        </form>
      ) : null}

      {menu?.kind === 'color' ? (
        <div className="task-menu task-colors" style={{ top: menu.top, left: menu.left }} role="listbox" aria-label="Categoriekleur">
          {GROUP_PALETTE.map((color) => {
            const current = categories.find((category) => category.id === menu.categoryId)?.color;
            return (
              <button
                key={color}
                type="button"
                aria-label={color}
                className="task-swatch"
                style={{ background: color }}
                onClick={() => {
                  setMenu(null);
                  void patchCategory(menu.categoryId, { color });
                }}
              >
                {current === color ? <Check size={14} color="#fff" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {openId ? (() => {
        const slideTask = tasks.find((item) => item.id === openId);
        return slideTask ? (
          <TaskSlide
            task={slideTask}
            categories={forBoard(categories, slideTask.boardId)}
            colleagues={colleagues}
            customers={customers}
            documents={documents}
            canWrite={canWrite}
            onClose={() => setOpenId(null)}
            onPatch={patch}
            onRemove={() => removeTask(slideTask)}
            onPlan={() => togglePlan(slideTask)}
            onCount={(delta) => setTasks((current) => current.map((item) => (
              item.id === slideTask.id ? { ...item, updates: Math.max(0, (item.updates ?? 0) + delta) } : item
            )))}
          />
        ) : null;
      })() : null}
    </div>
  );
}
