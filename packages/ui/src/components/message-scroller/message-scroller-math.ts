/**
 * The arithmetic of the Message Scroller, kept apart from the DOM so it can be
 * checked without a browser. Every function takes plain numbers and returns
 * one: the scroller reads the viewport, asks here and writes the answer back.
 * Nothing here is exported from the component's `index.ts`.
 */

/** What the viewport reports about its scroll position. */
export type ScrollMetrics = {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
};

export type ScrollEdge = "start" | "end";

/** Where a thread opens, as the `defaultScrollPosition` prop names it. */
export type ScrollPosition = "end" | "start" | "last-anchor";

/** The furthest the viewport can scroll. */
export function maxScrollTop(
  metrics: Pick<ScrollMetrics, "clientHeight" | "scrollHeight">,
): number {
  return Math.max(0, metrics.scrollHeight - metrics.clientHeight);
}

/**
 * Whether the viewport rests within `threshold` pixels of an edge. A
 * rubber-band overscroll past an edge counts as being at it.
 */
export function isAtEdge(
  metrics: ScrollMetrics,
  edge: ScrollEdge,
  threshold: number,
): boolean {
  return edge === "start"
    ? metrics.scrollTop <= threshold
    : metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop <=
        threshold;
}

/**
 * The edges the viewport can still scroll toward: `start` when there is
 * content above the fold, `end` when there is content below it. An edge the
 * viewport rests at is not scrollable toward, so a thread that fits in its
 * box is scrollable toward neither.
 */
export function scrollableEdges(
  metrics: ScrollMetrics,
  threshold: number,
): { end: boolean; start: boolean } {
  return {
    end: !isAtEdge(metrics, "end", threshold),
    start: !isAtEdge(metrics, "start", threshold),
  };
}

/**
 * Where a turn settles when it starts: its first row near the top of the
 * viewport, with up to `peek` pixels of the row before it above. A previous
 * row shorter than the peek shows whole and no more, so the view never
 * reaches past it.
 */
export function anchorScrollTop(
  itemTop: number,
  previousItemHeight: number,
  peek: number,
): number {
  return itemTop - Math.min(peek, previousItemHeight);
}

/**
 * The scroll position that keeps the row the reader looks at in place when
 * rows are added above it: the old position, moved down by the height the
 * thread has gained.
 */
export function prependScrollTop(
  before: Pick<ScrollMetrics, "scrollHeight" | "scrollTop">,
  nextScrollHeight: number,
): number {
  return before.scrollTop + (nextScrollHeight - before.scrollHeight);
}

/**
 * Whether a growing thread carries the viewport with it. Both must hold: the
 * app asked for it (`autoScroll`) and the reader has not scrolled away since
 * they were last at the live edge (`following`). A reader who scrolled up is
 * never pulled back down.
 */
export function shouldFollow(state: {
  autoScroll: boolean;
  following: boolean;
}): boolean {
  return state.autoScroll && state.following;
}

/**
 * Where a thread opens. `last-anchor` shows the last turn from its first row,
 * where that row would settle (`anchor.target`: near the top, with the peek of
 * the row before it above); it falls back to the end when no row anchors a
 * turn or the last turn, from its first row to the end, already fits in the
 * viewport.
 */
export function openingScrollTop(input: {
  /** The last anchor row: where it settles, and where it starts in scroll space. */
  anchor?: { target: number; top: number } | undefined;
  metrics: Pick<ScrollMetrics, "clientHeight" | "scrollHeight">;
  position: ScrollPosition;
}): number {
  const { anchor, metrics, position } = input;
  const end = maxScrollTop(metrics);
  if (position === "start") return 0;
  if (position === "end" || !anchor) return end;
  if (metrics.scrollHeight - anchor.top <= metrics.clientHeight) return end;
  return Math.min(end, Math.max(0, anchor.target));
}

/**
 * The room a thread needs below its last row so that a turn can settle at
 * `target`: the viewport has to reach `target` and still be filled, which is
 * `target + clientHeight` of scroll height. `naturalScrollHeight` is the
 * height of the rows alone. Whole pixels, rounded up, so the target is
 * reachable.
 */
export function spacerHeight(
  target: number,
  clientHeight: number,
  naturalScrollHeight: number,
): number {
  return Math.max(0, Math.ceil(target + clientHeight - naturalScrollHeight));
}

/** Keys that scroll toward the start and so end the follow. */
const keysTowardStart: ReadonlySet<string> = new Set([
  "ArrowUp",
  "Home",
  "PageUp",
]);

/** Whether a key press scrolls the viewport toward its start. */
export function keyScrollsTowardStart(key: string): boolean {
  return keysTowardStart.has(key);
}

/** Whether a wheel turn scrolls toward the start. */
export function wheelScrollsTowardStart(deltaY: number): boolean {
  return deltaY < 0;
}

/**
 * Whether a touch that began at `startY` and is now at `currentY` drags the
 * content down, which scrolls toward the start. The slop absorbs the jitter
 * of a finger that scrolls the other way.
 */
export function touchScrollsTowardStart(
  startY: number,
  currentY: number,
  slop = 4,
): boolean {
  return currentY - startY > slop;
}
