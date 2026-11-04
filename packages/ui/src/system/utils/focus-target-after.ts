const tabbableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.closest("[inert], [aria-hidden='true']")) return false;
  return element.getClientRects().length > 0;
}

/**
 * The element that takes focus when a part that held it leaves the page, such
 * as an Alert or a Notification that its close dismisses: the next tabbable
 * element after the part in document order, or the one before it at the end
 * of the page, so focus never falls back to the body.
 */
export function focusTargetAfter(root: HTMLElement): HTMLElement | null {
  const candidates = Array.from(
    root.ownerDocument.querySelectorAll<HTMLElement>(tabbableSelector),
  ).filter((element) => !root.contains(element) && isTabbable(element));
  const following = candidates.find(
    (element) =>
      root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  if (following) return following;
  const preceding = candidates.filter(
    (element) =>
      root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING,
  );
  return preceding.at(-1) ?? null;
}

/**
 * Moves the focus past a part that is about to leave while it holds it, to
 * `focusTargetAfter`. Call it before the part closes; a part that does not
 * hold the focus keeps it where it is.
 */
export function moveFocusPast(root: HTMLElement | null): void {
  if (!root?.contains(root.ownerDocument.activeElement)) return;
  focusTargetAfter(root)?.focus({ preventScroll: true });
}
