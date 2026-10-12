"use client";

import { animate } from "motion/react";
import * as React from "react";

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { measureTiming, useLeavingEntries } from "./motion-presence";

/**
 * Numbers that move toward new targets, for the geometry of a chart: the angles
 * of a ring, the points of a line. A component hands over what the data says now
 * and draws what it gets back; it writes no animation loop of its own. The
 * duration and the easing are the `--motion-duration-value` and
 * `--motion-ease-standard` tokens of the chart's own container, read when a run
 * starts (rulebook M1). Reduced motion (M5) shows every target at once, and the
 * first render shows its target, so the server and the client agree.
 */

/** The values at `progress` of the way from `from` to `to` (0 is `from`, 1 is `to`). */
export function mixValues(
  from: readonly number[],
  to: readonly number[],
  progress: number,
): number[] {
  return to.map((end, index) => {
    const start = from[index] ?? end;
    return start + (end - start) * progress;
  });
}

// Two numbers that say the same. NaN is the same as NaN here: a target that
// holds one is still the target the run heads for, and is not a new one on
// every render.
const sameNumber = (a: number, b: number) =>
  a === b || (Number.isNaN(a) && Number.isNaN(b));

/** Whether two lists hold the same numbers in the same order, NaN matching NaN. */
export function sameValues(
  a: readonly number[],
  b: readonly number[],
): boolean {
  return (
    a.length === b.length &&
    a.every((value, index) => sameNumber(value, b[index]!))
  );
}

function sameKeys(
  a: readonly string[] | undefined,
  b: readonly string[] | undefined,
): boolean {
  if (a === undefined || b === undefined) return a === b;
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/**
 * Where the values shown before start in a list of values that is not the same
 * list any more. With keys, a value follows its key: a key that is new starts
 * at 0, so a new share grows out of nothing, or at the number `starts` names for
 * its place in the new list. Without keys the lists must be as long as each
 * other; otherwise there is no way to tell which is which and `null` says the
 * new values are shown at once.
 */
export function alignValues(
  fromKeys: readonly string[] | undefined,
  from: readonly number[],
  toKeys: readonly string[] | undefined,
  count: number,
  starts?: readonly number[],
): number[] | null {
  if (fromKeys && toKeys) {
    const byKey = new Map(fromKeys.map((key, index) => [key, from[index]!]));
    return toKeys.map((key, index) => byKey.get(key) ?? starts?.[index] ?? 0);
  }
  return from.length === count ? [...from] : null;
}

/** One run of values toward a target. */
export type TweenRun = {
  /** Where the run starts, aligned with `to`. */
  from: readonly number[];
  keys: readonly string[] | undefined;
  /** Whether anything moves; false when the target is shown at once. */
  moving: boolean;
  to: readonly number[];
};

/** What a run shows at `progress`: its target at rest, the mix on its way. */
export function shownValues(
  run: TweenRun,
  progress: number,
): readonly number[] {
  return progress >= 1 || !run.moving
    ? run.to
    : mixValues(run.from, run.to, progress);
}

/**
 * The run for a new target, which starts from what is shown now so that a
 * target that changes on the way carries on from where the values are. `null`
 * when the target is the one the run already heads for.
 */
export function nextRun(
  run: TweenRun,
  progress: number,
  target: readonly number[],
  keys: readonly string[] | undefined,
  reduced: boolean,
  starts?: readonly number[],
): TweenRun | null {
  if (sameValues(target, run.to) && sameKeys(keys, run.keys)) return null;
  const from = reduced
    ? null
    : alignValues(
        run.keys,
        shownValues(run, progress),
        keys,
        target.length,
        starts,
      );
  return {
    from: from ?? target,
    keys,
    moving: from !== null && !sameValues(from, target),
    to: target,
  };
}

export type TweenOptions = {
  /** The element whose motion tokens set the timing: the chart. The document root by default. */
  container?: React.RefObject<Element | null>;
  /**
   * Names the values when their number changes, so each follows its own key:
   * one that is new grows from 0. Without keys a change in the number of values
   * shows the new values at once.
   */
  keys?: readonly string[];
  /**
   * Where each value starts whose key is new, in the order of the target. 0 for
   * each by default, so a new value grows from nothing; a value that should
   * appear where it is starts at its own target.
   */
  starts?: readonly number[];
};

/**
 * Moves the values toward their target when it changes, and returns what to
 * draw this frame. At rest it returns `target` itself (the same array), which
 * tells a component that nothing moves. A target equal in content to the last
 * one starts nothing, so a component may pass a fresh array on every render.
 */
export function useTweenedValues(
  target: readonly number[],
  { container, keys, starts }: TweenOptions = {},
): readonly number[] {
  const reduced = useReducedMotionPreference();
  const [run, setRun] = React.useState<TweenRun>(() => ({
    from: target,
    keys,
    moving: false,
    to: target,
  }));
  const [progress, setProgress] = React.useState(1);

  // A new target: start a run from what is shown now.
  const next = nextRun(run, progress, target, keys, reduced, starts);
  if (next) {
    setRun(next);
    setProgress(next.moving ? 0 : 1);
  }

  React.useLayoutEffect(() => {
    if (!run.moving) return;
    const controls = animate(0, 1, {
      ...measureTiming(
        container?.current ?? null,
        "--motion-duration-value",
        "--motion-ease-standard",
      ),
      onComplete: () => setProgress(1),
      onUpdate: setProgress,
    });
    return () => controls.stop();
  }, [container, run]);

  return !run.moving || progress >= 1
    ? target
    : mixValues(run.from, run.to, progress);
}

/** A single number that moves toward its target; see `useTweenedValues`. */
export function useTweenedValue(
  target: number,
  options?: Pick<TweenOptions, "container">,
): number {
  const targets = React.useMemo(() => [target], [target]);
  return useTweenedValues(targets, options)[0] ?? target;
}

/** One keyed row as it is drawn: its number so far, and whether it is on its way out. */
export type TweenedRow<T> = {
  key: string;
  leaving: boolean;
  row: T;
  value: number;
};

/** What a keyed row is without a number of its own: the entries as `useLeavingEntries` lists them. */
type RowEntry<T> = { element: { row: T }; leaving: boolean };

/**
 * The numbers a list of rows heads for and the numbers its new rows start from.
 * A row that is there heads for the number `read` gives, one that is leaving for
 * the number it has while it is absent (`absent`, 0 by default), and a row that
 * is new starts from that same number.
 */
export function rowNumbers<T>(
  entries: readonly RowEntry<T>[],
  read: (row: T) => number,
  absent?: (row: T) => number,
): { starts: number[]; targets: number[] } {
  const away = (entry: RowEntry<T>) => (absent ? absent(entry.element.row) : 0);
  return {
    starts: entries.map(away),
    targets: entries.map((entry) =>
      entry.leaving ? away(entry) : read(entry.element.row),
    ),
  };
}

/**
 * Moves the number of each keyed row toward the one `read` gives for the new
 * rows: a row that is new grows from 0, a row that is gone shrinks to 0 and
 * then leaves the list. `absent` gives another number for a row to start from
 * and to end at, for a number that is not a size: a row that should appear or
 * disappear where it stands has its own place for it, and one that stays glides
 * to its new place. The rows come back in order, a leaving row staying right
 * after the row it followed. Draw `value`; keep reading the data from the rows
 * you gave.
 */
export function useTweenedRows<T extends { id: string }>(
  rows: readonly T[],
  read: (row: T) => number,
  {
    absent,
    ...options
  }: Pick<TweenOptions, "container"> & {
    /** The number a row has while it is not there: where a new row starts and where a leaving row ends. 0 by default. */
    absent?: (row: T) => number;
  } = {},
): TweenedRow<T>[] {
  const reduced = useReducedMotionPreference();
  const present = rows.map((row) => ({ key: row.id, row }));
  const { entries, remove } = useLeavingEntries(present, !reduced);
  const keys = entries.map((entry) => String(entry.key));
  const { starts, targets } = rowNumbers(entries, read, absent);
  const values = useTweenedValues(targets, { ...options, keys, starts });

  // The rows that left have shrunk to nothing: they go.
  const settled = values === targets;
  React.useEffect(() => {
    if (!settled) return;
    for (const entry of entries) if (entry.leaving) remove(entry.key);
  });

  return entries.map((entry, index) => ({
    key: String(entry.key),
    leaving: entry.leaving,
    row: entry.element.row,
    value: values[index] ?? 0,
  }));
}
