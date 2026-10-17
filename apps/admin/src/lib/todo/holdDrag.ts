import { useEffect, useRef, useState } from 'react';

const HOLD_MS = 350;
const CANCEL_PX = 14;

export type HoldDrag = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  line: number | null;
  lineTop: number;
  lineHeight: number;
  lineWidth: number;
  horizontal: boolean;
  beforeId: string | null;
};

function editingField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const field = target.closest('input, textarea, select');
  return field instanceof HTMLElement && document.activeElement === field;
}

function dropSpot(clientX: number, clientY: number, skipId: string): { beforeId: string | null; x: number; top: number; height: number; width: number; horizontal: boolean } | null {
  const list = document.querySelector('.phone-boards');
  if (list) {
    const rows = [...list.querySelectorAll<HTMLElement>('[data-board-id]')].filter((row) => row.dataset.boardId !== skipId);
    const box = list.getBoundingClientRect();
    const width = Math.max(0, box.width - 32);
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return { beforeId: row.dataset.boardId ?? null, x: box.left + 16, top: rect.top, height: 3, width, horizontal: true };
      }
    }
    const last = rows[rows.length - 1];
    if (!last) return null;
    return { beforeId: null, x: box.left + 16, top: last.getBoundingClientRect().bottom, height: 3, width, horizontal: true };
  }
  const row = document.querySelector('.phone-board-row');
  const chips = [...document.querySelectorAll<HTMLElement>('.phone-board-chip[data-board-id]')].filter((chip) => chip.dataset.boardId !== skipId);
  const box = row?.getBoundingClientRect();
  const top = box?.top ?? chips[0]?.getBoundingClientRect().top ?? 0;
  const height = box?.height ?? chips[0]?.getBoundingClientRect().height ?? 44;
  for (const chip of chips) {
    const rect = chip.getBoundingClientRect();
    if (clientX < rect.left + rect.width / 2) {
      return { beforeId: chip.dataset.boardId ?? null, x: rect.left, top, height, width: 3, horizontal: false };
    }
  }
  const last = chips[chips.length - 1];
  if (!last) return null;
  return { beforeId: null, x: last.getBoundingClientRect().right, top, height, width: 3, horizontal: false };
}

function scrollDuring(clientX: number, clientY: number) {
  if (document.querySelector('.phone-boards')) {
    if (clientY < 72) window.scrollBy(0, -16);
    else if (clientY > window.innerHeight - 96) window.scrollBy(0, 16);
    return;
  }
  const row = document.querySelector('.phone-board-row');
  if (!row) return;
  const box = row.getBoundingClientRect();
  if (clientX < box.left + 36) row.scrollLeft -= 14;
  else if (clientX > box.right - 36) row.scrollLeft += 14;
}

export function useHoldDrag(opts: {
  enabled: boolean;
  onDrop: (id: string, beforeId: string | null) => void;
}) {
  const [drag, setDrag] = useState<HoldDrag | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const hold = useRef(0);
  const pending = useRef<{ id: string; title: string; x: number; y: number; pointer: number; chip: HTMLElement } | null>(null);
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
      scrollDuring(event.clientX, event.clientY);
      const spot = dropSpot(event.clientX, event.clientY, current.id);
      const next: HoldDrag = {
        ...current,
        x: event.clientX - current.width / 2,
        y: event.clientY - current.height / 2,
        line: spot?.x ?? null,
        lineTop: spot?.top ?? current.lineTop,
        lineHeight: spot?.height ?? current.lineHeight,
        lineWidth: spot?.width ?? current.lineWidth,
        horizontal: spot?.horizontal ?? current.horizontal,
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
        const spot = dropSpot(event.clientX, event.clientY, current.id);
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
    if (!opts.enabled || event.button !== 0 || editingField(event.target)) return;
    finish();
    const chip = event.currentTarget;
    pending.current = { id: item.id, title: item.title, x: event.clientX, y: event.clientY, pointer: event.pointerId, chip };
    listen(event.pointerId);
    hold.current = window.setTimeout(() => {
      const start = pending.current;
      if (!start) return;
      pending.current = null;
      const rect = start.chip.getBoundingClientRect();
      try { start.chip.setPointerCapture(start.pointer); } catch { /* oudere browsers */ }
      navigator.vibrate?.(15);
      blockClick.current = true;
      const spot = dropSpot(start.x, start.y, start.id);
      const next: HoldDrag = {
        id: start.id,
        title: start.title,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        line: spot?.x ?? null,
        lineTop: spot?.top ?? rect.top,
        lineHeight: spot?.height ?? rect.height,
        lineWidth: spot?.width ?? rect.width,
        horizontal: spot?.horizontal ?? true,
        beforeId: spot?.beforeId ?? null,
      };
      dragRef.current = next;
      setDrag(next);
    }, HOLD_MS);
  }

  return {
    drag,
    bindChip(item: { id: string; title: string }) {
      return {
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => onPointerDown(event, item),
        onContextMenu: (event: React.MouseEvent) => {
          if (dragRef.current || pending.current || blockClick.current) event.preventDefault();
        },
      };
    },
  };
}
