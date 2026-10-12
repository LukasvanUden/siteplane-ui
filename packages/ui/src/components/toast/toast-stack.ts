"use client";

import * as React from "react";

/*
 * Toast stacks that share a screen corner.
 *
 * A ToastProvider keeps its own toasts and stacks them itself. Two providers at
 * one position would draw their newest toast in the same place, one covering
 * the other completely. Every stack reports how much room it takes. The stack
 * that received a toast last sits at the edge and the others make way for it,
 * one above the other, so every front toast stays readable. A position with a
 * single stack is not moved at all.
 *
 * Providers on the same manager receive every toast twice. Only the first of
 * them is drawn; the others stay in step but are hidden, as if there were one.
 */

/** `--toast-gap` and `--toast-peek` of a toast (`--spacing(3)`), in rem. */
export const TOAST_GAP_REM = 0.75;
export const TOAST_PEEK_REM = 0.75;

/** What a stack needs to know about one of its toasts. */
export interface StackToast {
  id: string;
  height?: number | undefined;
  limited?: boolean | undefined;
  transitionStatus?: "starting" | "ending" | undefined;
}

/**
 * How far a stack reaches from its screen edge, in px, counting the toasts that
 * are on show as they sit now. A collapsed stack is its front toast and a sliver
 * of every toast behind it. An expanded stack lists each toast with a gap
 * between. A toast that is closing or over the limit takes no room.
 */
export function stackExtent(
  toasts: readonly StackToast[],
  expanded: boolean,
  rem = 16,
): number {
  const shown = toasts.filter(
    (toast) => toast.transitionStatus !== "ending" && !toast.limited,
  );
  const [front] = shown;
  if (!front) return 0;
  if (expanded) {
    const heights = shown.reduce((sum, toast) => sum + (toast.height ?? 0), 0);
    return heights + (shown.length - 1) * TOAST_GAP_REM * rem;
  }
  return (front.height ?? 0) + (shown.length - 1) * TOAST_PEEK_REM * rem;
}

/** One stack at a position. */
interface Stack {
  /** Without any toast, a stack takes the edge when it gets its first one. */
  empty: boolean;
  /** Which toast manager feeds it. */
  manager: number;
  /** Higher is later. The stack that received a toast last has the highest rank. */
  rank: number;
  /** When it appeared; the earliest stack of a manager is the one that is drawn. */
  seq: number;
  /** Its extent plus the gap to the stack behind it; 0 when nothing is on show. */
  size: number;
}

const corners = new Map<string, Map<string, Stack>>();
const managers = new WeakMap<object, number>();
const listeners = new Set<() => void>();
let lastRank = 0;
let lastSeq = 0;
let lastManager = 0;
let lastKey = 0;

/** A number for a toast manager; 0 for none. The same manager always gets the same number. */
export function managerId(manager: object | undefined): number {
  if (!manager) return 0;
  let id = managers.get(manager);
  if (id === undefined) managers.set(manager, (id = ++lastManager));
  return id;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** What a stack tells the others each time its toasts change. */
export interface StackReport {
  empty: boolean;
  extent: number;
  gap: number;
  manager: number;
  /** A toast was added since the last report. */
  received: boolean;
}

export function publishStack(
  position: string,
  key: string,
  { empty, extent, gap, manager, received }: StackReport,
): void {
  let corner = corners.get(position);
  if (!corner) corners.set(position, (corner = new Map()));
  const previous = corner.get(key);
  const rank = received ? ++lastRank : (previous?.rank ?? 0);
  const size = extent > 0 ? extent + gap : 0;
  if (
    previous &&
    previous.empty === empty &&
    previous.manager === manager &&
    previous.rank === rank &&
    previous.size === size
  )
    return;
  corner.set(key, {
    empty,
    manager,
    rank,
    seq: previous?.seq ?? ++lastSeq,
    size,
  });
  emit();
}

export function retireStack(position: string, key: string): void {
  const corner = corners.get(position);
  if (!corner?.delete(key)) return;
  if (corner.size === 0) corners.delete(position);
  emit();
}

/** Whether an earlier stack at the position is fed by the same manager. */
function isMirror(
  corner: ReadonlyMap<string, Stack>,
  key: string,
  stack: Stack,
): boolean {
  if (stack.manager === 0) return false;
  for (const [other, candidate] of corner)
    if (
      other !== key &&
      candidate.manager === stack.manager &&
      candidate.seq < stack.seq
    )
      return true;
  return false;
}

/** Whether the stack only repeats what an earlier stack on its manager shows. */
export function isMirrored(position: string, key: string): boolean {
  const corner = corners.get(position);
  const own = corner?.get(key);
  return Boolean(corner && own && isMirror(corner, key, own));
}

/**
 * How far the stack stands back from the edge: the room of every stack that is
 * later. A stack without toasts stays at the edge, so that its first toast
 * enters there instead of gliding in from behind the others.
 */
export function offsetOf(position: string, key: string): number {
  const corner = corners.get(position);
  const own = corner?.get(key);
  if (!corner || !own || own.empty) return 0;
  let offset = 0;
  for (const [other, stack] of corner)
    if (
      other !== key &&
      stack.rank > own.rank &&
      !isMirror(corner, other, stack)
    )
      offset += stack.size;
  return offset;
}

function useHasAttribute(element: Element | null, name: string): boolean {
  const [has, setHas] = React.useState(false);
  React.useEffect(() => {
    if (!element) return;
    const read = () => setHas(element.hasAttribute(name));
    read();
    const observer = new MutationObserver(read);
    observer.observe(element, { attributeFilter: [name], attributes: true });
    return () => observer.disconnect();
  }, [element, name]);
  return has;
}

/**
 * Where a stack stands among the stacks at its position: how far it stands back
 * from the screen edge, in px, so that it clears the stacks that received a toast
 * later, and whether it is only a repeat of the stack of its own manager. It
 * follows the stack's own toasts and whether the viewport is expanded (Base UI
 * sets `data-expanded`).
 */
export function useToastStack(
  position: string,
  manager: object | undefined,
  toasts: readonly StackToast[],
  viewport: Element | null,
): { mirrored: boolean; offset: number } {
  // Not `useId`: separate React roots on one page can hand out the same id.
  const [key] = React.useState(() => `stack-${++lastKey}`);
  const expanded = useHasAttribute(viewport, "data-expanded");
  const known = React.useRef(new Set<string>());

  React.useLayoutEffect(() => {
    const rem =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    // New toasts enter at the front of the list; one that leaves does not
    // change which toast was added last.
    const front = toasts[0]?.id;
    const received = front !== undefined && !known.current.has(front);
    known.current = new Set(toasts.map((toast) => toast.id));
    publishStack(position, key, {
      empty: toasts.length === 0,
      extent: stackExtent(toasts, expanded, rem),
      gap: TOAST_GAP_REM * rem,
      manager: managerId(manager),
      received,
    });
  }, [position, key, manager, toasts, expanded]);

  React.useLayoutEffect(
    () => () => {
      known.current = new Set();
      retireStack(position, key);
    },
    [position, key],
  );

  const offset = React.useSyncExternalStore(
    subscribe,
    () => offsetOf(position, key),
    () => 0,
  );
  const mirrored = React.useSyncExternalStore(
    subscribe,
    () => isMirrored(position, key),
    () => false,
  );
  return { mirrored, offset };
}
