/*
 * Kit-internal: the decisions behind Editable's keys, presses and focus, kept
 * apart from the component so they can be checked on their own. Not public
 * API: the editable index does not export this module.
 */

/**
 * What starts editing from the preview: focusing it, a click, a double click,
 * or nothing, so that only the edit trigger does.
 */
export type EditableActivationMode = "focus" | "dblclick" | "click" | "none";

/**
 * What saves a change: Enter and leaving the editable (`both`), Enter alone
 * (`enter`), leaving alone (`blur`), or only the submit trigger (`none`).
 * Leaving an editable that does not save then cancels the change.
 */
export type EditableSubmitMode = "both" | "enter" | "blur" | "none";

/** What an edit ends with. */
export type EditableEnd = "submit" | "cancel";

/** Whether Enter saves in a submit mode. */
export function submitsOnEnter(mode: EditableSubmitMode): boolean {
  return mode === "both" || mode === "enter";
}

/** Whether leaving the editable saves in a submit mode. */
export function submitsOnBlur(mode: EditableSubmitMode): boolean {
  return mode === "both" || mode === "blur";
}

/** The parts of a key press that decide what it does. */
export type EditableKeyPress = {
  ctrlKey: boolean;
  /** True while an input method composes text, as for Japanese. */
  isComposing: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
};

/**
 * What a key press in the field does: `submit`, `cancel`, `block` (nothing,
 * but the browser must not act either) or nothing at all.
 *
 * Escape cancels. In a single-line field Enter saves when the submit mode
 * allows it and Shift and Meta are up; any other Enter is blocked, so that it
 * never submits a form around the editable with a value that is not saved. In
 * a textarea Enter starts a new line, and Cmd+Enter on Apple systems, or
 * Ctrl+Enter elsewhere, saves. An input method that composes text keeps its
 * keys.
 */
export function editableKeyAction(
  press: EditableKeyPress,
  {
    apple,
    multiline,
    submitMode,
  }: { apple: boolean; multiline: boolean; submitMode: EditableSubmitMode },
): EditableEnd | "block" | undefined {
  if (press.isComposing) return undefined;
  if (press.key === "Escape") return "cancel";
  if (press.key !== "Enter") return undefined;
  if (multiline)
    return submitsOnEnter(submitMode) && (apple ? press.metaKey : press.ctrlKey)
      ? "submit"
      : undefined;
  return submitsOnEnter(submitMode) && !press.shiftKey && !press.metaKey
    ? "submit"
    : "block";
}

/** What leaving an editable that is editing does in a submit mode. */
export function editableLeaveAction(mode: EditableSubmitMode): EditableEnd {
  return submitsOnBlur(mode) ? "submit" : "cancel";
}

/** The part of a DOM node that the outside check needs. */
type Container = { contains(other: Node | null): boolean };

/**
 * Whether a press or a focus move lands outside the editable: on a connected
 * node outside `scope` (the editable, or the Field around it with its label,
 * description and error) that is not inside an `ignored` part, such as a Save
 * or Cancel trigger placed elsewhere.
 */
export function isOutsideEditable(
  target: Node | null,
  scope: Container | null,
  ignored: readonly (Container | null | undefined)[],
): boolean {
  if (!target || !scope || !target.isConnected) return false;
  if (scope.contains(target)) return false;
  return !ignored.some((part) => part?.contains(target));
}

/**
 * Whether focus stays where it is when an edit ends instead of returning to
 * the editable: it went to an element outside the editable, such as the field
 * that was clicked or tabbed to. Focus on the page itself, or on a part of the
 * editable that just hid, returns.
 */
export function keepsFocusElsewhere(
  active: Element | null,
  scope: Container,
  body: Element | null,
): boolean {
  return active !== null && active !== body && !scope.contains(active);
}

/** Whether the preview can start editing, so that it takes focus. */
export function previewCanActivate(
  mode: EditableActivationMode,
  interactive: boolean,
): boolean {
  return interactive && mode !== "none";
}

/** Whether an event on the preview starts editing in an activation mode. */
export function previewActivates(
  mode: EditableActivationMode,
  event: "click" | "dblclick" | "focus",
): boolean {
  return mode === event;
}

/**
 * Where focus returns once an edit ends: `finalFocusEl`, else the edit
 * trigger, else the preview.
 */
export function editableFocusReturn<Target>({
  editTrigger,
  finalFocusEl,
  preview,
}: {
  editTrigger: Target | null;
  finalFocusEl: (() => Target | null) | undefined;
  preview: Target | null;
}): Target | null {
  return finalFocusEl?.() ?? editTrigger ?? preview;
}

/**
 * The values once an edit ends. A submit keeps the value and reports it as
 * committed; a cancel puts back the value from when editing started, the empty
 * value too, and reports that one as reverted.
 */
export function finishEdit(
  end: EditableEnd,
  { start, value }: { start: string; value: string },
): { committed?: string; reverted?: string; start: string; value: string } {
  return end === "submit"
    ? { committed: value, start: value, value }
    : { reverted: start, start, value: start };
}

/**
 * The two sides of the swap: what shows at rest (the preview and the pencil)
 * and what shows while editing (the field and its triggers).
 */
export type EditableSide = "rest" | "edit";

/**
 * Where a part of one side is in the swap (rulebook M8): `shown` and `hidden`
 * at rest, `leaving` while it fades out in its old place, out of the flow,
 * and `entering` while it fades in at its new place.
 */
export type EditableSwapPhase = "shown" | "entering" | "leaving" | "hidden";

/**
 * The swap between the sides: the edit state it shows, a count of the swaps,
 * whether it runs, and whether it is in its first frames.
 */
export type EditableSwap = {
  editing: boolean;
  id: number;
  starting: boolean;
  swapping: boolean;
};

/**
 * The swap once the edit state is `editing`: the same while it shows that
 * state, else a new swap, which with reduced motion switches at once (M5).
 */
export function nextSwap(
  swap: EditableSwap,
  editing: boolean,
  reduced: boolean,
): EditableSwap {
  if (swap.editing === editing) return swap;
  return { editing, id: swap.id + 1, starting: !reduced, swapping: !reduced };
}

/** The phase of a side's parts while the edit state is `editing`. */
export function swapPhase(
  side: EditableSide,
  { editing, swapping }: { editing: boolean; swapping: boolean },
): EditableSwapPhase {
  const current = (side === "edit") === editing;
  if (current) return swapping ? "entering" : "shown";
  return swapping ? "leaving" : "hidden";
}

/**
 * The attributes of a part in a phase. A part that leaves is inert and hidden
 * from assistive technology, so nothing can be pressed or focused in it while
 * it fades; a part that enters takes focus and keys at once, also while it is
 * still transparent. `starting` is true in the first frames of a swap, which
 * show where the fade in starts (`data-starting-style`, the kit's swap fade).
 */
export function swapAttributes(
  phase: EditableSwapPhase,
  starting: boolean,
): {
  "aria-hidden"?: true;
  "data-ending-style"?: "";
  "data-starting-style"?: "";
  hidden?: true;
  inert?: true;
} {
  if (phase === "hidden") return { hidden: true };
  if (phase === "leaving")
    return { "aria-hidden": true, "data-ending-style": "", inert: true };
  if (phase === "entering" && starting) return { "data-starting-style": "" };
  return {};
}

/**
 * How long a swap lasts in milliseconds, from its timing: the old side fades
 * out within the leave, the new side fades in after its delay. Durations are
 * in seconds, as the kit's measured transitions give them.
 */
export function swapDuration(timing: {
  enter: { delay?: number; duration?: number };
  leave: { duration?: number };
}): number {
  const enter = (timing.enter.delay ?? 0) + (timing.enter.duration ?? 0);
  return Math.round(Math.max(enter, timing.leave.duration ?? 0) * 1000);
}

/** A box against the Editable, in pixels. */
export type EditableBox = {
  height: number;
  left: number;
  top: number;
  width: number;
};

/**
 * How far the field must move so that its text stands where the value stood:
 * the start of its text on the start of the value, and a single line centred
 * on the value's line, the first line of a textarea on the value's first line.
 * The field's frame then reaches outward around the text by the same amounts,
 * as negative margins on every side.
 */
export function inPlaceAlignment(
  value: EditableBox,
  field: { multiline: boolean; text: EditableBox },
): { x: number; y: number } {
  const x = value.left - field.text.left;
  const y = field.multiline
    ? value.top - field.text.top
    : value.top + value.height / 2 - (field.text.top + field.text.height / 2);
  return { x, y };
}

/** Whether the system is an Apple one, where Cmd stands in for Ctrl. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ?? navigator.platform;
  return /mac|iphone|ipad|ipod/i.test(platform ?? "");
}
