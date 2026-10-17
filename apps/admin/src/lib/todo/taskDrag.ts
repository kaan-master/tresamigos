import { useEffect, useRef, useState } from 'react';

const HOLD_MS = 350;
const CANCEL_PX = 14;

export type TaskDrop = { beforeId: string | null; categoryId: string | null; y: number };

export type TaskDrag = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  drop: TaskDrop | null;
};

function dropFromPoint(clientY: number, grouped: boolean, skipId: string): TaskDrop | null {
  const sections = document.querySelectorAll<HTMLElement>('.task-section[data-drop-cat]');
  let fallback: TaskDrop | null = null;
  for (const section of sections) {
    const raw = section.dataset.dropCat;
    const categoryId = grouped ? (raw ? raw : null) : null;
    const box = section.getBoundingClientRect();
    const rows = [...section.querySelectorAll<HTMLElement>('.task-row[data-open="1"]')]
      .filter((row) => row.dataset.taskId !== skipId);
    if (clientY < box.top) {
      if (fallback) return fallback;
      return { beforeId: rows[0]?.dataset.taskId ?? null, categoryId, y: box.top + 8 };
    }
    let local: TaskDrop | null = null;
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return { beforeId: row.dataset.taskId ?? null, categoryId, y: rect.top };
      }
      local = { beforeId: null, categoryId, y: rect.bottom };
    }
    const atEnd = local ?? { beforeId: null, categoryId, y: box.bottom - 4 };
    if (clientY <= box.bottom) return atEnd;
    fallback = atEnd;
  }
  return fallback;
}

function editingField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const field = target.closest('input, textarea, select');
  return field instanceof HTMLElement && document.activeElement === field;
}

export function useTaskDrag(opts: {
  enabled: boolean;
  grouped: boolean;
  onLift?: () => void;
  onDrop: (id: string, target: { beforeId: string | null; categoryId: string | null }) => void;
}) {
  const [drag, setDrag] = useState<TaskDrag | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const hold = useRef(0);
  const pending = useRef<{
    id: string;
    title: string;
    x: number;
    y: number;
    pointer: number;
    row: HTMLElement;
  } | null>(null);
  const blockClick = useRef(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => {
    window.clearTimeout(hold.current);
    stopRef.current?.();
  }, []);

  useEffect(() => {
    function suppress(event: Event) {
      if (!blockClick.current && !dragRef.current) return;
      event.preventDefault();
      event.stopPropagation();
    }
    document.addEventListener('click', suppress, true);
    document.addEventListener('contextmenu', suppress, true);
    return () => {
      document.removeEventListener('click', suppress, true);
      document.removeEventListener('contextmenu', suppress, true);
    };
  }, []);

  function finish() {
    window.clearTimeout(hold.current);
    hold.current = 0;
    pending.current = null;
    stopRef.current?.();
    stopRef.current = null;
  }

  function listen(pointer: number) {
    function onMove(event: PointerEvent) {
      if (event.pointerId !== pointer) return;
      const start = pending.current;
      const current = dragRef.current;
      if (start && !current) {
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (dx * dx + dy * dy > CANCEL_PX * CANCEL_PX) finish();
        return;
      }
      if (!current) return;
      event.preventDefault();
      if (event.clientY < 64) window.scrollBy(0, -18);
      else if (event.clientY > window.innerHeight - 64) window.scrollBy(0, 18);
      const next = {
        ...current,
        y: event.clientY - 22,
        drop: dropFromPoint(event.clientY, optsRef.current.grouped, current.id),
      };
      dragRef.current = next;
      setDrag(next);
    }
    function onUp(event: PointerEvent) {
      if (event.pointerId !== pointer) return;
      const current = dragRef.current;
      if (current) {
        event.preventDefault();
        const drop = current.drop;
        dragRef.current = null;
        setDrag(null);
        finish();
        window.setTimeout(() => { blockClick.current = false; }, 400);
        if (drop) optsRef.current.onDrop(current.id, { beforeId: drop.beforeId, categoryId: drop.categoryId });
        return;
      }
      finish();
    }
    window.addEventListener('pointermove', onMove, { passive: false, capture: true });
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);
    stopRef.current = () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
    };
  }

  function onRowPointerDown(event: React.PointerEvent<HTMLElement>, task: { id: string; title: string }, canDrag: boolean) {
    if (!opts.enabled || !canDrag || event.button !== 0 || editingField(event.target)) return;
    finish();
    const row = event.currentTarget;
    pending.current = {
      id: task.id,
      title: task.title,
      x: event.clientX,
      y: event.clientY,
      pointer: event.pointerId,
      row,
    };
    listen(event.pointerId);
    hold.current = window.setTimeout(() => {
      const start = pending.current;
      if (!start) return;
      pending.current = null;
      const rect = start.row.getBoundingClientRect();
      try { start.row.setPointerCapture(start.pointer); } catch { /* oudere browsers */ }
      navigator.vibrate?.(15);
      optsRef.current.onLift?.();
      blockClick.current = true;
      const next: TaskDrag = {
        id: start.id,
        title: start.title,
        x: rect.left,
        y: start.y - 22,
        width: rect.width,
        drop: dropFromPoint(start.y, optsRef.current.grouped, start.id),
      };
      dragRef.current = next;
      setDrag(next);
    }, HOLD_MS);
  }

  return {
    drag,
    bindRow(task: { id: string; title: string }, canDrag: boolean) {
      return {
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => onRowPointerDown(event, task, canDrag),
        onContextMenu: (event: React.MouseEvent) => {
          if (dragRef.current || pending.current || blockClick.current) event.preventDefault();
        },
      };
    },
  };
}
