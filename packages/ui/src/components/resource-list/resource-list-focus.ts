"use client";

import * as React from "react";

/**
 * Where focus goes when a row of a ResourceList leaves. Kept apart from the
 * component so the choice of the next row can be checked without a DOM.
 */

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled], [type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable=""], [contenteditable="true"]';

/** Whether focus is on nothing. */
function focusIsNowhere(): boolean {
  const active = document.activeElement;
  return (
    !active || active === document.body || active === document.documentElement
  );
}

/** Whether focus is on nothing, or on something that can no longer hold it. */
function focusIsLost(): boolean {
  const active = document.activeElement;
  return (
    !active ||
    focusIsNowhere() ||
    !active.isConnected ||
    active.closest("[inert]") !== null
  );
}

/** Whether the row holds focus: in the row itself or, by React's tree, in a popup it opened. */
function holdsFocus(entry: HTMLElement, within: boolean): boolean {
  return (
    !focusIsNowhere() && (within || entry.contains(document.activeElement))
  );
}

/** The nearest row that stays, after the leaving one or else before it, and the first thing in it that takes focus. */
export function focusTargetNear(entry: HTMLElement): HTMLElement | undefined {
  for (const side of [
    "nextElementSibling",
    "previousElementSibling",
  ] as const) {
    for (let row = entry[side]; row; row = row[side]) {
      if (!row.hasAttribute("data-resource-list-entry")) continue;
      const target = [
        ...row.querySelectorAll<HTMLElement>(focusableSelector),
      ].find(
        (element) =>
          element.getClientRects().length > 0 && !element.closest("[inert]"),
      );
      if (target) return target;
    }
  }
  return undefined;
}

/**
 * A leaving row is inert, so focus inside it would be lost. Focus moves on to
 * the next row when the row starts to leave, whether it sits in the row or in a
 * popup the row opened (React's focus events reach the row from the popup,
 * which is elsewhere in the DOM). Focus that was somewhere when the row started
 * to leave and is nowhere when it is gone, because a popup or a pane closed
 * with the row, moves on then.
 */
export function useFocusHandoff(
  ref: React.RefObject<HTMLElement | null>,
  leaving: boolean,
) {
  const within = React.useRef(false);
  const held = React.useRef(false);

  React.useLayoutEffect(() => {
    const entry = ref.current;
    held.current = leaving && !focusIsNowhere();
    if (leaving && entry && holdsFocus(entry, within.current)) {
      focusTargetNear(entry)?.focus();
    }
  }, [leaving, ref]);

  React.useLayoutEffect(() => {
    const entry = ref.current;
    return () => {
      if (
        entry &&
        (holdsFocus(entry, within.current) || (held.current && focusIsLost()))
      ) {
        focusTargetNear(entry)?.focus();
      }
    };
  }, [ref]);

  return {
    onBlur: () => {
      within.current = false;
    },
    onFocus: () => {
      within.current = true;
    },
  };
}
