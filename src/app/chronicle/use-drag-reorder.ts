"use client";

import { useRef, useState, useTransition, type KeyboardEvent, type PointerEvent } from "react";

type Drag = { id: string; startY: number; offset: number; moved: boolean };

/** Where `el` sits in the layout, ignoring a drag's translate. */
function layoutRect(el: HTMLElement, offset: number) {
  const r = el.getBoundingClientRect();
  return { top: r.top - offset, bottom: r.bottom - offset, mid: r.top - offset + r.height / 2 };
}

/**
 * Drag-to-reorder for a vertical list, shared by Today and Tasks. A row is
 * dragged by its handle (mouse or finger); it swaps with a neighbour once
 * the pointer passes the neighbour's middle. The handle's arrow keys move a
 * row one step. `save` gets the new order when a drag ends or a key moves;
 * if it fails the order snaps back and `error` says why. A new `ids` list
 * from the server resets the order.
 */
export function useDragReorder(ids: string[], save: (order: string[]) => Promise<{ error?: string }>) {
  const [order, setOrder] = useState(ids);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const els = useRef(new Map<string, HTMLElement>());

  function onSave(next: string[]) {
    setError(undefined);
    startTransition(async () => {
      const result = await save(next);
      if (result.error) {
        setError(result.error);
        setOrder(ids);
      }
    });
  }

  const key = ids.join();
  const [seen, setSeen] = useState(key);
  if (key !== seen) {
    setSeen(key);
    setOrder(ids);
  }

  function move(id: string, by: -1 | 1) {
    const from = order.indexOf(id);
    const to = from + by;
    if (from < 0 || to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
    onSave(next);
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (!drag) return;
    let { startY } = drag;
    const index = order.indexOf(drag.id);
    const self = els.current.get(drag.id);
    if (!self) return;
    const me = layoutRect(self, drag.offset);
    const offset = e.clientY - startY;
    // Swap with a neighbour; shift the start point by the same distance so
    // the row stays under the pointer.
    const below = els.current.get(order[index + 1]);
    const above = els.current.get(order[index - 1]);
    let next = order;
    if (below && offset > 0 && e.clientY > layoutRect(below, 0).mid) {
      startY += layoutRect(below, 0).bottom - me.bottom;
      next = [...order];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
    } else if (above && offset < 0 && e.clientY < layoutRect(above, 0).mid) {
      startY -= me.top - layoutRect(above, 0).top;
      next = [...order];
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
    }
    if (next !== order) setOrder(next);
    setDrag({ id: drag.id, startY, offset: e.clientY - startY, moved: drag.moved || next !== order });
  }

  function onPointerUp() {
    if (drag?.moved) onSave(order);
    setDrag(null);
  }

  return {
    order,
    draggingId: drag?.id ?? null,
    error,
    move,
    /** Ref callback for a row. */
    rowRef: (id: string) => (el: HTMLElement | null) => {
      if (el) els.current.set(id, el);
      else els.current.delete(id);
    },
    /** Inline style for a row (the dragged one follows the pointer). */
    rowStyle: (id: string) => (drag?.id === id ? { transform: `translateY(${drag.offset}px)` } : undefined),
    /** Props for a row's drag handle. */
    handleProps: (id: string) => ({
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({ id, startY: e.clientY, offset: 0, moved: false });
      },
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          move(id, e.key === "ArrowUp" ? -1 : 1);
        }
      },
    }),
  };
}
