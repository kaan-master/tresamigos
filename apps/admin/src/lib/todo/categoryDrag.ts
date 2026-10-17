import { useEffect, useRef, useState } from 'react';

const HOLD_MS = 350;
const CANCEL_PX = 14;

export type CategoryDrag = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  line: number | null;
  lineX: number;
  lineWidth: number;
  beforeId: string | null;
};

function blocked(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('button, input, textarea, select, a')) return true;
  const field = target.closest('input, textarea, select');
  return field instanceof HTMLElement && document.activeElement === field;
}

function dropOnCategories(clientY: number, skipId: string): { beforeId: string | null; y: number; x: number; width: number } | null {
  const heads = [...document.querySelectorAll<HTMLElement>('.task-group-head[data-category-id]')]
    .filter((head) => head.dataset.categoryId !== skipId);
  if (heads.length === 0) return null;
  for (const head of heads) {
    const rect = head.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return { beforeId: head.dataset.categoryId ?? null, y: rect.top, x: rect.left, width: rect.width };
    }
  }
  const last = heads[heads.length - 1];
  const rect = last.getBoundingClientRect();
  return { beforeId: null, y: rect.bottom, x: rect.left, width: rect.width };
}

export function useCategoryDrag(opts: {
  enabled: boolean;
  onDrop: (id: string, beforeId: string | null) => void;
}) {
  const [drag, setDrag] = useState<CategoryDrag | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const hold = useRef(0);
  const pending = useRef<{ id: string; title: string; x: number; y: number; pointer: number; head: HTMLElement } | null>(null);
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
      const spot = dropOnCategories(event.clientY, current.id);
      const next: CategoryDrag = {
        ...current,
        x: event.clientX - current.width / 2,
        y: event.clientY - 22,
        line: spot?.y ?? null,
        lineX: spot?.x ?? current.lineX,
        lineWidth: spot?.width ?? current.lineWidth,
        beforeId: spot?.beforeId ?? null,
      };
      dragRef.current = next;
      setDrag(next);
    }
    function onUp(event: PointerEvent) {
      if (event.pointerId !== pointer) return;
      const current = dragRef.current;
      if (current) {
        event.preventDefault();
        const spot = dropOnCategories(event.clientY, current.id);
        dragRef.current = null;
        setDrag(null);
        finish();
        window.setTimeout(() => { blockClick.current = false; }, 400);
        optsRef.current.onDrop(current.id, spot?.beforeId ?? current.beforeId);
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

  function onPointerDown(event: React.PointerEvent<HTMLElement>, item: { id: string; title: string }) {
    if (!opts.enabled || event.button !== 0 || blocked(event.target)) return;
    finish();
    const head = event.currentTarget;
    pending.current = { id: item.id, title: item.title, x: event.clientX, y: event.clientY, pointer: event.pointerId, head };
    listen(event.pointerId);
    hold.current = window.setTimeout(() => {
      const start = pending.current;
      if (!start) return;
      pending.current = null;
      const rect = start.head.getBoundingClientRect();
      try { start.head.setPointerCapture(start.pointer); } catch { /* oudere browsers */ }
      navigator.vibrate?.(15);
      blockClick.current = true;
      const spot = dropOnCategories(start.y, start.id);
      const next: CategoryDrag = {
        id: start.id,
        title: start.title,
        x: rect.left,
        y: start.y - 22,
        width: rect.width,
        line: spot?.y ?? null,
        lineX: spot?.x ?? rect.left,
        lineWidth: spot?.width ?? rect.width,
        beforeId: spot?.beforeId ?? null,
      };
      dragRef.current = next;
      setDrag(next);
    }, HOLD_MS);
  }

  return {
    drag,
    bindHead(item: { id: string; title: string }) {
      return {
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => onPointerDown(event, item),
        onContextMenu: (event: React.MouseEvent) => {
          if (dragRef.current || pending.current || blockClick.current) event.preventDefault();
        },
      };
    },
  };
}
