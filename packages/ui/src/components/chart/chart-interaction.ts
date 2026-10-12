"use client";

import { bisectCenter } from "d3-array";
import * as React from "react";

/**
 * The key `step` places from `current` (1 forward, -1 back). A chart starts at
 * the first key when nothing is active, or the active key is no longer there.
 * `wrap` cycles through the ends, as the PieChart does; otherwise the ends hold.
 */
export function stepKey(
  keys: readonly string[],
  current: string | null,
  step: 1 | -1,
  wrap: boolean,
): string | null {
  if (keys.length === 0) return null;
  const index = current === null ? -1 : keys.indexOf(current);
  if (index < 0) return keys[0] ?? null;
  const next = index + step;
  return wrap
    ? (keys[(next + keys.length) % keys.length] ?? null)
    : (keys[Math.min(keys.length - 1, Math.max(0, next))] ?? null);
}

/** The first or the last key. */
export function edgeKey(
  keys: readonly string[],
  edge: "start" | "end",
): string | null {
  return (edge === "start" ? keys[0] : keys[keys.length - 1]) ?? null;
}

/** `current` while it is still in `keys`, otherwise null: the tooltip closes. */
export function retainKey(
  keys: readonly string[],
  current: string | null,
): string | null {
  return current !== null && keys.includes(current) ? current : null;
}

/** The index of the position nearest to `value`, for positions in ascending order. -1 for none. */
export function nearestIndex(
  positions: readonly number[],
  value: number,
): number {
  if (positions.length === 0 || Number.isNaN(value)) return -1;
  return bisectCenter(positions, value);
}

function isKeyboardFocus(element: HTMLElement): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

export type ChartInteractionOptions = {
  /** The items in keyboard order. */
  keys: readonly string[];
  /** The item under a point, in client coordinates: one lookup for the whole plot. */
  itemAt: (clientX: number, clientY: number) => string | null;
  /** Whether the arrow keys cycle through the ends (a ring) or stop there (an axis). */
  wrap?: boolean;
  /** `x` steps with ArrowLeft and ArrowRight, `y` with ArrowUp and ArrowDown. */
  axis?: "x" | "y";
};

export type ChartInteraction = {
  /** The active item, named by its key, not its place, so it stays put when the data around it changes. */
  activeKey: string | null;
  /**
   * Whether the active item was chosen on purpose, by the keyboard or a tap,
   * and not by a mouse passing over the plot: the chart reads it out to
   * assistive technology.
   */
  announce: boolean;
  /** A tap or pen press pins the item until the next press elsewhere or Escape. */
  pinned: boolean;
  clear: () => void;
  /**
   * The handlers of the one focus stop that holds the plot. A chart with no
   * items has nothing to step through, and is no focus stop.
   */
  triggerProps: {
    tabIndex?: 0;
    onFocus: React.FocusEventHandler<HTMLElement>;
    onBlur: React.FocusEventHandler<HTMLElement>;
    onPointerMove: React.PointerEventHandler<HTMLElement>;
    onPointerLeave: React.PointerEventHandler<HTMLElement>;
    onPointerDown: React.PointerEventHandler<HTMLElement>;
    onKeyDown: React.KeyboardEventHandler<HTMLElement>;
  };
};

/**
 * The state and the handlers that make a plot interactive: the active item
 * under a mouse, a tap that pins, Escape, and the arrow keys, Home and End on
 * one focus stop. The chart looks the item up (`itemAt`) and draws its own
 * tooltip content; this hook owns the rest, for every chart. The tooltip sits
 * beside the active item, whichever way it became active.
 */
export function useChartInteraction({
  keys,
  itemAt,
  wrap = false,
  axis = "x",
}: ChartInteractionOptions): ChartInteraction {
  // The active item is named by its key, not its place, so the tooltip stays on
  // the same item when the data around it changes.
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  // A tap or pen press keeps its tooltip open until the next press elsewhere or
  // Escape. Hovering with a mouse still closes it when the pointer leaves.
  const [pinned, setPinned] = React.useState(false);
  // The keyboard and a tap choose an item on purpose, and the chart reads it
  // out; a mouse that passes over the plot does not.
  const [announce, setAnnounce] = React.useState(false);
  const clear = () => {
    setActiveKey(null);
    setPinned(false);
    setAnnounce(false);
  };
  // Only an item of the chart can be active: a point lookup that finds a row
  // with nothing to show, such as in a chart with no numbers, finds none.
  const own = (key: string | null) => retainKey(keys, key);

  // An item whose key is gone from the data closes its tooltip.
  if (activeKey !== null && retainKey(keys, activeKey) === null) {
    setActiveKey(null);
    setPinned(false);
    setAnnounce(false);
  }

  const back = axis === "x" ? "ArrowLeft" : "ArrowUp";
  const forward = axis === "x" ? "ArrowRight" : "ArrowDown";
  return {
    activeKey,
    announce,
    pinned,
    clear,
    triggerProps: {
      ...(keys.length > 0 ? { tabIndex: 0 as const } : {}),
      onFocus: (event) => {
        // Keyboard focus starts at the first item. A press selects the item it
        // hits instead, so focus must not overwrite it.
        if (isKeyboardFocus(event.currentTarget)) {
          setActiveKey(edgeKey(keys, "start"));
          setAnnounce(true);
        }
      },
      onBlur: clear,
      onPointerMove: (event) => {
        if (event.pointerType !== "mouse" || pinned) return;
        setActiveKey(own(itemAt(event.clientX, event.clientY)));
        setAnnounce(false);
      },
      onPointerLeave: (event) => {
        if (event.pointerType === "mouse" && !pinned) {
          setActiveKey(null);
          setAnnounce(false);
        }
      },
      onPointerDown: (event) => {
        // A tap or pen press pins the item it hits.
        if (event.pointerType === "mouse") return;
        const key = own(itemAt(event.clientX, event.clientY));
        setActiveKey(key);
        setPinned(key !== null);
        setAnnounce(key !== null);
      },
      onKeyDown: (event) => {
        if (event.key === forward || event.key === back) {
          event.preventDefault();
          const step = event.key === forward ? 1 : -1;
          setActiveKey((old) => stepKey(keys, old, step, wrap));
          setAnnounce(true);
        }
        if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          setActiveKey(edgeKey(keys, event.key === "Home" ? "start" : "end"));
          setAnnounce(true);
        }
        if (event.key === "Escape") clear();
      },
    },
  };
}
