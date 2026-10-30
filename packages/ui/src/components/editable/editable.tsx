"use client";

import { PencilIcon } from "lucide-react";
import * as React from "react";

import { useTruncated } from "../../system/hooks/use-truncated";
import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { focusRingRecipe } from "../../system/recipes/focus-ring.recipe";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button, type ButtonProps } from "../button";
import {
  type FieldCheckedControl,
  useFieldValueCheck,
} from "../field/field-value-check";
import { Input, type InputProps } from "../input";
import {
  holdPanePlace,
  type PanePlace,
  panePin,
  placeOf,
  swapContainerClassName,
  useHeightFollower,
} from "../motion/motion-follow";
import {
  inSecondFrame,
  keyframeTiming,
  measureSwapTiming,
  playFromSecondFrame,
  swapFadeClassName,
} from "../motion/motion-presence";
import { Textarea, type TextareaProps } from "../textarea";
import {
  type EditableActivationMode,
  type EditableEnd,
  type EditableSide,
  type EditableSubmitMode,
  type EditableSwap,
  editableFocusReturn,
  editableKeyAction,
  editableLeaveAction,
  finishEdit,
  inPlaceAlignment,
  onFontsLoaded,
  isApplePlatform,
  isOutsideEditable,
  keepsFocusElsewhere,
  nextSwap,
  previewActivates,
  previewCanActivate,
  swapAttributes,
  swapDuration,
  swapPhase,
} from "./editable-interaction";

import "./editable.css";

export type { EditableActivationMode, EditableSubmitMode };

/** The words of an Editable's triggers. */
export type EditableLabels = {
  /** The name of the edit trigger, which shows the pencil alone. */
  edit: string;
  /** The text of the submit trigger. */
  submit: string;
  /** The text of the cancel trigger. */
  cancel: string;
};

const defaultEditableLabels: EditableLabels = {
  cancel: "Cancel",
  edit: "Edit",
  submit: "Save",
};

/**
 * The placeholder of the field and of the preview of an empty value: one text
 * for both, or one each.
 */
export type EditablePlaceholder = string | { edit: string; preview: string };

export type EditableProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange" | "placeholder"
> & {
  /** The value, for a controlled Editable; it holds the change being typed. */
  value?: string | undefined;
  /** The value an uncontrolled Editable starts with. */
  defaultValue?: string | undefined;
  /** Called with the value whenever it changes, also while typing. */
  onValueChange?: ((value: string) => void) | undefined;
  /** Called with the value when a change is saved. */
  onValueCommit?: ((value: string) => void) | undefined;
  /** Called with the value that was put back when a change is cancelled. */
  onValueRevert?: ((value: string) => void) | undefined;
  /** Whether the value is being edited, for a controlled edit state. */
  edit?: boolean | undefined;
  /** Whether an uncontrolled Editable starts in its field. */
  defaultEdit?: boolean | undefined;
  /** Called when editing should start (`true`) or end (`false`). */
  onEditChange?: ((edit: boolean) => void) | undefined;
  /**
   * What starts editing from the preview: `focus` (the default) focusing it,
   * `click` a click, `dblclick` a double click, `none` only the edit trigger.
   */
  activationMode?: EditableActivationMode | undefined;
  /**
   * What saves a change: `both` (the default) Enter and leaving the
   * editable, `enter` Enter, `blur` leaving it, `none` only the submit
   * trigger. Leaving an editable that does not save cancels the change.
   */
  submitMode?: EditableSubmitMode | undefined;
  /** Whether the field selects its text when editing starts. */
  selectOnFocus?: boolean | undefined;
  /** The placeholder of the field, and of the preview of an empty value. */
  placeholder?: EditablePlaceholder | undefined;
  disabled?: boolean | undefined;
  /** Shows the value without a way to edit it. */
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  /** Marks the field and the value invalid, as an error from the server does. */
  invalid?: boolean | undefined;
  /** The name the value submits with in a form. */
  name?: string | undefined;
  /** The id of a form the field belongs to, outside it. */
  form?: string | undefined;
  maxLength?: number | undefined;
  /**
   * The element that takes focus once an edit ends, in place of the edit
   * trigger, or of the preview when there is no edit trigger.
   */
  finalFocusEl?: (() => HTMLElement | null) | undefined;
  /** The control size of the field and of the optional Save and Cancel. */
  size?: SiteplaneControlSize | undefined;
  /** Replaces the English words of the triggers. */
  labels?: Partial<EditableLabels> | undefined;
};

type EditableContextValue = {
  activationMode: EditableActivationMode;
  cancel: () => void;
  disabled: boolean;
  editing: boolean;
  empty: boolean;
  form: string | undefined;
  interactive: boolean;
  invalid: boolean;
  labels: EditableLabels;
  maxLength: number | undefined;
  name: string | undefined;
  onFieldKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  placeholder: { edit?: string | undefined; preview?: string | undefined };
  previewFocus: () => void;
  readOnly: boolean;
  refs: {
    cancelTrigger: React.RefObject<HTMLButtonElement | null>;
    editTrigger: React.RefObject<HTMLButtonElement | null>;
    field: React.RefObject<FieldCheckedControl | null>;
    /** The pane of the field, whose frame fades. */
    fieldPane: React.RefObject<HTMLSpanElement | null>;
    /** Where the pencil stood at rest, against the Editable. */
    pencilPlace: React.RefObject<PanePlace | null>;
    preview: React.RefObject<HTMLElement | null>;
    /** Where the value stood at rest, against the Editable. */
    previewPlace: React.RefObject<PanePlace | null>;
    root: React.RefObject<HTMLDivElement | null>;
    submitTrigger: React.RefObject<HTMLButtonElement | null>;
  };
  required: boolean | undefined;
  setValue: (value: string) => void;
  size: SiteplaneControlSize | undefined;
  startEdit: () => void;
  submit: () => void;
  /** The switch between the two sides (rulebook M8, its Editable note). */
  swap: { starting: boolean; swapping: boolean };
  value: string;
};

const EditableContext = React.createContext<EditableContextValue | null>(null);

function useEditableContext(part: string): EditableContextValue {
  const context = React.useContext(EditableContext);
  if (!context) throw new Error(`${part} must be placed within an Editable.`);
  return context;
}

/**
 * How a part takes its turn: `fade` with the kit's swap fade (the pencil and
 * the optional Save and Cancel), `frame` with the fade of the field's frame
 * that the Editable plays (the field, whose own text waits meanwhile) and
 * `text`, never faded, above the field while they switch (the value): the
 * one text that paints until the switch is over. The value shows the field's
 * text colour, so the two texts take turns in one frame, pixel for pixel.
 */
type SwapPartKind = "fade" | "frame" | "text";

/**
 * A part of one side of the switch (rulebook M8, its Editable note). The value
 * never fades or moves: the side that takes over lays out the row at once,
 * and the side that leaves stays pinned in the box it had, out of the flow,
 * until it is gone, the value above the field in both directions; only the
 * field's frame fades in and out around the value's text, and the field's
 * own text takes over in one frame once the switch is over. The part that
 * enters takes focus and keys at once, and a part that leaves is inert. With
 * reduced motion the sides switch at once (M5). `placeRef` keeps the part's
 * place where the Editable reads it.
 */
function useSwapPart<T extends HTMLElement>(
  context: EditableContextValue,
  side: EditableSide,
  kind: SwapPartKind,
  placeRef?: React.RefObject<PanePlace | null>,
  leaveAtOnce = false,
): {
  props: ReturnType<typeof swapAttributes> & {
    className?: string;
    style?: React.CSSProperties;
  };
  phase: ReturnType<typeof swapPhase>;
  ref: React.RefObject<T | null>;
} {
  const ref = React.useRef<T | null>(null);
  const ownPlace = React.useRef<PanePlace | null>(null);
  const place = placeRef ?? ownPlace;
  const turn = swapPhase(side, {
    editing: context.editing,
    swapping: context.swap.swapping,
  });
  const phase = leaveAtOnce && turn === "leaving" ? "hidden" : turn;
  const inFlow = phase === "shown" || phase === "entering";
  const root = context.refs.root;
  // Where the part stands while it is in the flow, which is where it stays
  // when it leaves: measured after each commit, as a new value moves the edit
  // trigger, when the part or the Editable changes size, and when a web font
  // finishes loading, which changes the width of the value beside it. After
  // the commit, so that the Editable's ref is set on the first one too.
  React.useEffect(() => {
    const element = ref.current;
    const container = root.current;
    if (inFlow && element && container)
      place.current = placeOf(element, container);
  });
  React.useEffect(() => {
    const element = ref.current;
    const container = root.current;
    if (!inFlow || !element || !container) return undefined;
    const measure = () => {
      place.current = placeOf(element, container);
    };
    const stopFonts = onFontsLoaded(element.ownerDocument, measure);
    if (typeof ResizeObserver === "undefined") return stopFonts;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(container);
    return () => {
      observer.disconnect();
      stopFonts();
    };
  }, [inFlow, place, root]);
  // A pencil that returns beside a value of several lines stays where it
  // stands at rest while the row follows the shorter height of the closing
  // textarea: centred in the row, it would ride the height down. Its place
  // is measured in the commit that returns it, before the row's height is
  // held, so it is the place for the new value.
  const pencil = side === "rest" && kind === "fade";
  const [entryPlace, setEntryPlace] = React.useState<PanePlace | null>(null);
  const returning = pencil && phase === "entering";
  React.useLayoutEffect(() => {
    if (!returning) {
      setEntryPlace(null);
      return;
    }
    const element = ref.current;
    const container = root.current;
    if (!element || !container) return;
    if (context.refs.field.current?.localName !== "textarea") return;
    setEntryPlace(placeOf(element, container));
    // Once for each return; the field's kind comes through its ref.
  }, [returning, root]);
  const pin = phase === "leaving" ? place.current : entryPlace;
  const pinned = pin !== null && (phase === "leaving" || returning);
  // The returning pencil holds its top in the row rather than being pinned
  // out of it, so the value beside it lays out its lines at once in the width
  // they have at rest. A leaving part is pinned in its box against the
  // Editable.
  const inRow = returning;
  const held = pinned && !inRow;
  React.useLayoutEffect(() => {
    const container = root.current;
    if (!held || !container) return undefined;
    return holdPanePlace(container);
  }, [held, root]);
  // The value's text paints above the field whose frame fades under it,
  // pinned while it leaves and in its place at rest while it returns.
  const above =
    kind === "text" && (phase === "entering" || phase === "leaving");
  return {
    phase,
    props: {
      ...swapAttributes(phase, context.swap.starting),
      ...(kind === "fade" ? { className: swapFadeClassName } : {}),
      ...(pinned && pin
        ? inRow
          ? { style: { alignSelf: "flex-start", marginTop: pin.top } }
          : { style: { ...panePin(pin), ...(above ? { zIndex: 1 } : {}) } }
        : above
          ? { style: { position: "relative", zIndex: 1 } }
          : {}),
    },
    ref,
  };
}

/** The preview's own style with the pin of the switch over it. */
function withPin(
  style: React.CSSProperties | undefined,
  pin: React.CSSProperties | undefined,
): React.CSSProperties | undefined {
  return pin ? { ...style, ...pin } : style;
}

/**
 * The pane of a part that switches: the field's (`editable-field-pane`), whose
 * frame comes and goes around the text, and the pane of the pencil and of the
 * optional Save and Cancel (`editable-trigger-pane`), which fade with the
 * kit's swap fade. The fade sits on the pane rather than on the kit component
 * it holds, because a Button and a field surface keep transitions of their
 * own, for their states.
 */
function EditableSwapPane({
  children,
  context,
  leaveAtOnce = false,
  placeRef,
  side,
  slot,
}: {
  children: React.ReactNode;
  context: EditableContextValue;
  /** Leaves at once instead of fading, as the pencil of an empty value. */
  leaveAtOnce?: boolean;
  /** Keeps the pane's place where the Editable reads it, as the pencil's. */
  placeRef?: React.RefObject<PanePlace | null>;
  side: EditableSide;
  slot: "editable-field-pane" | "editable-trigger-pane";
}): React.ReactElement {
  const field = slot === "editable-field-pane";
  const {
    phase,
    props: { className: swapClassName, style: pin, ...swapProps },
    ref,
  } = useSwapPart<HTMLSpanElement>(
    context,
    side,
    field ? "frame" : "fade",
    placeRef,
    leaveAtOnce,
  );
  const align = useInPlaceAlignment(context, ref, field);
  const setRef = useRefs<HTMLSpanElement>(
    ref,
    field ? context.refs.fieldPane : undefined,
  );
  return (
    <span
      className={cn(`sp-${slot}`, swapClassName)}
      data-slot={slot}
      // While the sides switch the field's own text waits, transparent, under
      // the value's (editable.css).
      data-switching={
        field && (phase === "entering" || phase === "leaving") ? "" : undefined
      }
      ref={setRef}
      style={pin ?? align}
      {...swapProps}
    >
      {children}
    </span>
  );
}

/**
 * The margins that put the field's text where the value stands. The value at
 * rest already stands where the field's text stands (editable.css: the row
 * keeps the field's height and the value its insets), so the margins are
 * none; they only absorb a difference, such as a field a className changed,
 * so the text never moves. A textarea also keeps the pencil's room at its
 * end, the pencil's width and the row's gap, so its text wraps in the width
 * the value wraps in beside the pencil at rest and the lines break the same
 * way. Measured in the commit that shows the field and set on the pane at
 * once, before the Editable measures the height it follows and before
 * anything paints; React then keeps the same margins.
 */
function useInPlaceAlignment(
  context: EditableContextValue,
  ref: React.RefObject<HTMLSpanElement | null>,
  enabled: boolean,
): React.CSSProperties | undefined {
  const [margins, setMargins] = React.useState({ end: 0, x: 0, y: 0 });
  const latest = React.useRef(margins);
  const { editing, refs } = context;
  React.useLayoutEffect(() => {
    const pane = ref.current;
    const root = refs.root.current;
    const control = refs.field.current;
    const place = refs.previewPlace.current;
    const preview = refs.preview.current;
    if (!enabled || !editing || !pane || !root || !control || !place) return;
    const multiline = control.localName === "textarea";
    const inset = preview ? getComputedStyle(preview) : null;
    const value = inset
      ? {
          height: place.height - px(inset.paddingTop) - px(inset.paddingBottom),
          left: place.left + px(inset.paddingLeft),
          top: place.top + px(inset.paddingTop),
          width: place.width - px(inset.paddingLeft) - px(inset.paddingRight),
        }
      : place;
    const pencil = refs.pencilPlace.current;
    const end =
      multiline && pencil
        ? pencil.width + px(getComputedStyle(root).columnGap)
        : 0;
    let next =
      latest.current.end === end ? latest.current : { ...latest.current, end };
    pane.style.marginRight = `${next.x + next.end}px`;
    // Layout rounds to fractions of a pixel, so a second pass settles it.
    for (let pass = 0; pass < 3; pass += 1) {
      const rootBox = root.getBoundingClientRect();
      const box = control.getBoundingClientRect();
      const style = getComputedStyle(control);
      const delta = inPlaceAlignment(value, {
        multiline,
        text: {
          height: box.height,
          left:
            box.left -
            rootBox.left -
            root.clientLeft +
            Number.parseFloat(style.paddingLeft) +
            Number.parseFloat(style.borderLeftWidth),
          top:
            box.top -
            rootBox.top -
            root.clientTop +
            (multiline
              ? Number.parseFloat(style.paddingTop) +
                Number.parseFloat(style.borderTopWidth)
              : 0),
          width: box.width,
        },
      });
      if (Math.abs(delta.x) < 0.05 && Math.abs(delta.y) < 0.05) break;
      next = { end: next.end, x: next.x + delta.x, y: next.y + delta.y };
      Object.assign(pane.style, {
        marginBottom: `${next.y}px`,
        marginLeft: `${next.x}px`,
        marginRight: `${next.x + next.end}px`,
        marginTop: `${next.y}px`,
      });
    }
    if (next !== latest.current) {
      latest.current = next;
      setMargins(next);
    }
  }, [editing, enabled, ref, refs]);
  if (!enabled) return undefined;
  return {
    marginBottom: margins.y,
    marginLeft: margins.x,
    marginRight: margins.x + margins.end,
    marginTop: margins.y,
  };
}

/** A computed length in pixels. */
function px(value: string): number {
  return Number.parseFloat(value) || 0;
}

/**
 * The fade of the field's frame, in (`opening`) or out: the whole frame (its
 * surface, its border, its focus colour) fades at its full size, while its
 * own text waits and the value's text paints above it (Lukas, 29 October
 * 2026). On the kit's motion tokens (M1): the field's state change,
 * `--motion-duration-fast` on `--motion-ease-state`.
 */
function playFrameFade(pane: HTMLElement, opening: boolean): Animation {
  return playFromSecondFrame(
    pane,
    opening
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [{ opacity: 1 }, { opacity: 0 }],
    {
      ...keyframeTiming(pane, "--motion-duration-fast", "--motion-ease-state"),
      fill: "forwards",
    },
  );
}

/** Points every ref at `element` and returns what detaches them again. */
function attachRefs<T>(
  element: T,
  refs: readonly (React.Ref<T> | undefined)[],
): () => void {
  const detach = refs.map((ref) => {
    if (typeof ref === "function") {
      const cleanup = ref(element);
      return typeof cleanup === "function" ? cleanup : () => ref(null);
    }
    if (!ref) return () => {};
    ref.current = element;
    return () => {
      ref.current = null;
    };
  });
  return () => {
    for (const cleanup of detach) cleanup();
  };
}

/** One callback ref for a part's own ref and the refs it is given. */
function useRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): (element: T | null) => (() => void) | undefined {
  // The list holds the same refs in every render; it changes when the caller's
  // ref does.
  return React.useCallback(
    (element: T | null) => (element ? attachRefs(element, refs) : undefined),
    refs,
  );
}

/**
 * A value shown as text that turns into its field in place: the preview
 * shows the value, the edit trigger (a pencil) or the preview itself opens the
 * field with the saved value selected, Enter or a press outside keeps the
 * change, and Escape puts the value back. Focus then returns to the edit
 * trigger. The field stays in the document while it is hidden, so its `name`
 * submits with a form.
 *
 * Inside a kit Field, Enter and leaving check the value first: the native
 * constraints of the field (`required`, `type="email"`) and the Field's
 * `validate`. A value that fails stays in its field, and FieldError shows the
 * message. A cancel clears the check again.
 *
 * The parts are flat, as in the rest of the kit: EditableArea holds
 * EditablePreview and EditableInput (or EditableTextarea), and EditableControl
 * holds EditableEditTrigger, and the optional EditableCancelTrigger and
 * EditableSubmitTrigger, Buttons beside the field. The root carries
 * `data-editing` while the field shows.
 *
 * The text never moves (rulebook M8, its Editable note): the field's text
 * stands where the value stands, the value never fades, and only the field's
 * frame fades in and out around it. Focus and keys reach the field at once;
 * with reduced motion the sides switch at once.
 */
export function Editable({
  activationMode = "focus",
  children,
  className,
  defaultEdit = false,
  defaultValue = "",
  disabled: disabledProp = false,
  edit: editProp,
  finalFocusEl,
  form,
  invalid = false,
  labels,
  maxLength,
  name,
  onEditChange,
  onValueChange,
  onValueCommit,
  onValueRevert,
  placeholder,
  readOnly = false,
  ref,
  required,
  selectOnFocus = true,
  size,
  submitMode = "both",
  value: valueProp,
  ...props
}: EditableProps): React.ReactElement {
  const fieldCheck = useFieldValueCheck();
  // The size the field takes, which the row keeps at rest (editable.css).
  const resolvedSize = useResolvedControlSize(size);
  const disabled = disabledProp || fieldCheck.disabled;
  const interactive = !disabled && !readOnly;
  const words = { ...defaultEditableLabels, ...labels };
  const placeholders =
    typeof placeholder === "string"
      ? { edit: placeholder, preview: placeholder }
      : { edit: placeholder?.edit, preview: placeholder?.preview };

  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const valueControlled = valueProp !== undefined;
  const value = valueControlled ? valueProp : uncontrolledValue;
  const [uncontrolledEdit, setUncontrolledEdit] = React.useState(defaultEdit);
  const editControlled = editProp !== undefined;
  const editing = editControlled ? editProp : uncontrolledEdit;

  // The swap between the two sides (rulebook M8) starts in the render that
  // changes the edit state, so no frame shows either side in a wrong state;
  // with reduced motion there is none (M5).
  const reduced = useReducedMotionPreference();
  const [swap, setSwap] = React.useState<EditableSwap>({
    editing,
    id: 0,
    starting: false,
    swapping: false,
  });
  const currentSwap = nextSwap(swap, editing, reduced);
  if (currentSwap !== swap) setSwap(currentSwap);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const fieldRef = React.useRef<FieldCheckedControl | null>(null);
  const fieldPaneRef = React.useRef<HTMLSpanElement | null>(null);
  const previewRef = React.useRef<HTMLElement | null>(null);
  const previewPlaceRef = React.useRef<PanePlace | null>(null);
  const pencilPlaceRef = React.useRef<PanePlace | null>(null);
  const editTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const submitTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const cancelTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const setRootRef = useRefs<HTMLDivElement>(ref, rootRef);

  // The latest value and edit state, for handlers that run before a render.
  const valueRef = React.useRef(value);
  const editingRef = React.useRef(editing);
  // The value from when editing started, which a cancel puts back.
  const startRef = React.useRef(value);
  // A controlled edit ends once the parent says so; this is how it ends.
  const endingRef = React.useRef<{ end: EditableEnd; restore: boolean }>(null);
  // The field takes focus after the render that shows it; with `defaultEdit`
  // after the first one.
  const focusFieldRef = React.useRef(editing);
  // A save waits for its check; a later save or a cancel replaces it.
  const submissionRef = React.useRef(0);
  // Focus that returns to the preview must not start editing again.
  const quietPreviewRef = React.useRef(false);
  const latest = React.useRef({
    finalFocusEl,
    onEditChange,
    onValueChange,
    onValueCommit,
    onValueRevert,
  });
  React.useLayoutEffect(() => {
    valueRef.current = value;
    latest.current = {
      finalFocusEl,
      onEditChange,
      onValueChange,
      onValueCommit,
      onValueRevert,
    };
  });

  /** The editable and, when it has one, its Field with label and error. */
  const scope = (): HTMLElement | null =>
    rootRef.current?.closest<HTMLElement>('[data-slot="field"]') ??
    rootRef.current;

  const setValue = (next: string) => {
    const limited =
      maxLength != null && maxLength >= 0 ? next.slice(0, maxLength) : next;
    if (limited === valueRef.current) return;
    valueRef.current = limited;
    if (!valueControlled) setUncontrolledValue(limited);
    latest.current.onValueChange?.(limited);
  };

  // Focus returns once the edit has ended; see the effect below.
  const restoreFocusRef = React.useRef(false);
  const restoreFocus = () => {
    restoreFocusRef.current = true;
  };

  const begin = () => {
    editingRef.current = true;
    startRef.current = valueRef.current;
    focusFieldRef.current = true;
  };

  const finish = (end: EditableEnd, restore: boolean) => {
    const result = finishEdit(end, {
      start: startRef.current,
      value: valueRef.current,
    });
    startRef.current = result.start;
    if (result.reverted !== undefined) {
      setValue(result.reverted);
      // No error of the change that was cancelled stays at rest.
      const control = fieldRef.current;
      if (control && fieldCheck.inField)
        fieldCheck.clear(control, result.reverted);
    }
    if (restore) restoreFocus();
    if (result.committed !== undefined)
      latest.current.onValueCommit?.(result.committed);
    if (result.reverted !== undefined)
      latest.current.onValueRevert?.(result.reverted);
  };

  const startEdit = () => {
    if (!interactive || editingRef.current) return;
    if (editControlled) {
      latest.current.onEditChange?.(true);
      return;
    }
    begin();
    setUncontrolledEdit(true);
    latest.current.onEditChange?.(true);
  };

  const end = (how: EditableEnd, restore = true) => {
    if (!editingRef.current) return;
    if (editControlled) {
      endingRef.current = { end: how, restore };
      latest.current.onEditChange?.(false);
      return;
    }
    editingRef.current = false;
    setUncontrolledEdit(false);
    finish(how, restore);
    latest.current.onEditChange?.(false);
  };

  /** Whether the value may be saved; a failed check keeps the field open. */
  const checkValue = async (leaving: boolean): Promise<boolean> => {
    const control = fieldRef.current;
    if (!control) return true;
    if (fieldCheck.inField) return fieldCheck.check(control);
    if (control.checkValidity()) return true;
    // Without a Field the browser shows its own message, unless focus has
    // moved on, which the message would pull back.
    if (!leaving) control.reportValidity();
    return false;
  };

  const submit = async (leaving = false) => {
    if (!interactive || !editingRef.current) return;
    const submission = ++submissionRef.current;
    const valid = await checkValue(leaving);
    if (submission !== submissionRef.current || !editingRef.current) return;
    if (!valid) {
      if (!leaving) fieldRef.current?.focus({ preventScroll: true });
      return;
    }
    end("submit");
  };

  const cancel = () => {
    if (!editingRef.current) return;
    submissionRef.current += 1;
    end("cancel");
  };

  const onFieldKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.defaultPrevented || !editingRef.current) return;
    const action = editableKeyAction(
      {
        ctrlKey: event.ctrlKey,
        isComposing: event.nativeEvent.isComposing || event.keyCode === 229,
        key: event.key,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      },
      {
        apple: isApplePlatform(),
        multiline: event.currentTarget.localName === "textarea",
        submitMode,
      },
    );
    if (!action) return;
    event.preventDefault();
    if (action === "cancel") {
      // The first Escape ends the edit; a surrounding overlay keeps its own.
      event.stopPropagation();
      cancel();
    } else if (action === "submit") void submit();
  };

  // The handlers of the latest render, for the document listeners below.
  const handlers = React.useRef({ cancel, submit, submitMode });
  React.useLayoutEffect(() => {
    handlers.current = { cancel, submit, submitMode };
  });

  // A controlled edit state starts and ends the edit when the parent changes
  // it. A submit that the parent accepted saves; any other end cancels.
  const previousEditing = React.useRef(editing);
  React.useLayoutEffect(() => {
    if (previousEditing.current === editing) return;
    previousEditing.current = editing;
    if (!editControlled) return;
    if (editing) {
      begin();
      return;
    }
    editingRef.current = false;
    const ending = endingRef.current ?? { end: "cancel", restore: true };
    endingRef.current = null;
    finish(ending.end, ending.restore);
  });

  // Focus returns in the frame after the commit that ends the edit: the edit
  // trigger shows again by then, also while it still fades in, and a press
  // outside has moved focus to what it pressed, which keeps it. Editing again
  // before that frame leaves focus in the field.
  React.useLayoutEffect(() => {
    if (editing || !restoreFocusRef.current) return undefined;
    restoreFocusRef.current = false;
    const id = requestAnimationFrame(() => {
      const area = scope();
      if (!area) return;
      const document = area.ownerDocument;
      if (keepsFocusElsewhere(document.activeElement, area, document.body))
        return;
      const target = editableFocusReturn<HTMLElement>({
        editTrigger: editTriggerRef.current,
        finalFocusEl: latest.current.finalFocusEl,
        preview: previewRef.current,
      });
      quietPreviewRef.current = target === previewRef.current;
      target?.focus({ preventScroll: true });
      quietPreviewRef.current = false;
    });
    return () => cancelAnimationFrame(id);
    // The edit state decides; the rest comes through refs.
  }, [editing]);

  // The switch: the side that takes over lays out the row at once and the
  // side that leaves stays pinned in its box, so the Editable's height follows
  // from the start (the kit's height follow), and nothing clips the frame.
  // The frame's fade plays meanwhile, and the switch ends once it and the
  // pencil's fade have run, timed from the motion tokens.
  const follow = useHeightFollower(rootRef);
  const frameFade = React.useRef<Animation | null>(null);
  React.useLayoutEffect(() => {
    if (swap.swapping) follow({ clip: false });
    frameFade.current?.cancel();
    frameFade.current = null;
    const pane = fieldPaneRef.current;
    if (!swap.swapping || !pane) return;
    frameFade.current = playFrameFade(pane, swap.editing);
    // Each switch starts and ends once.
  }, [follow, swap.id, swap.swapping]);
  React.useEffect(() => () => frameFade.current?.cancel(), []);
  React.useEffect(() => {
    if (!swap.starting) return undefined;
    const id = swap.id;
    return inSecondFrame(() =>
      setSwap((current) =>
        current.id === id ? { ...current, starting: false } : current,
      ),
    );
  }, [swap.id, swap.starting]);
  React.useEffect(() => {
    if (!swap.swapping) return undefined;
    const id = swap.id;
    const timer = setTimeout(
      () =>
        setSwap((current) =>
          current.id === id
            ? { ...current, starting: false, swapping: false }
            : current,
        ),
      swapDuration(measureSwapTiming(rootRef.current)),
    );
    return () => clearTimeout(timer);
  }, [swap.id, swap.swapping]);

  // The field takes focus, with its text selected, once it shows.
  React.useLayoutEffect(() => {
    if (!editing || !focusFieldRef.current) return;
    focusFieldRef.current = false;
    const control = fieldRef.current;
    if (!control) return;
    control.focus({ preventScroll: true });
    if (selectOnFocus) control.select();
  });

  // While editing, a press or a focus move outside the editable saves the
  // change when leaving saves, and cancels it otherwise. The Save and Cancel
  // triggers count as inside wherever they are placed. A touch counts once it
  // is a tap: a touch that scrolls the page ends without a click.
  React.useEffect(() => {
    if (!editing) return undefined;
    const document = rootRef.current?.ownerDocument;
    if (!document) return undefined;
    const outside = (target: EventTarget | null) =>
      isOutsideEditable(target instanceof Node ? target : null, scope(), [
        submitTriggerRef.current,
        cancelTriggerRef.current,
      ]);
    const leave = () => {
      if (!editingRef.current) return;
      const { cancel: cancelEdit, submit: submitEdit } = handlers.current;
      if (editableLeaveAction(handlers.current.submitMode) === "submit")
        void submitEdit(true);
      else cancelEdit();
    };
    let tap: ((event: Event) => void) | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (!outside(event.target)) return;
      if (event.pointerType !== "touch") {
        leave();
        return;
      }
      if (tap) document.removeEventListener("click", tap, true);
      tap = (click: Event) => {
        tap = null;
        if (outside(click.target)) leave();
      };
      document.addEventListener("click", tap, { capture: true, once: true });
    };
    const onFocusIn = (event: FocusEvent) => {
      if (outside(event.target)) leave();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      if (tap) document.removeEventListener("click", tap, true);
    };
    // The handlers of the latest render come through their ref.
  }, [editing]);

  const context: EditableContextValue = {
    activationMode,
    cancel,
    disabled,
    editing,
    empty: value.trim() === "",
    form,
    interactive,
    invalid,
    labels: words,
    maxLength,
    name,
    onFieldKeyDown,
    placeholder: placeholders,
    previewFocus: () => {
      if (!quietPreviewRef.current && previewActivates(activationMode, "focus"))
        startEdit();
    },
    readOnly,
    refs: {
      cancelTrigger: cancelTriggerRef,
      editTrigger: editTriggerRef,
      field: fieldRef,
      fieldPane: fieldPaneRef,
      pencilPlace: pencilPlaceRef,
      preview: previewRef,
      previewPlace: previewPlaceRef,
      root: rootRef,
      submitTrigger: submitTriggerRef,
    },
    required,
    setValue,
    size,
    startEdit,
    submit: () => void submit(),
    swap: { starting: currentSwap.starting, swapping: currentSwap.swapping },
    value,
  };

  return (
    <EditableContext.Provider value={context}>
      <div
        className={cn(
          slotClass("editable", props),
          swapContainerClassName,
          className,
        )}
        data-disabled={disabled ? "" : undefined}
        data-editing={editing ? "" : undefined}
        data-invalid={invalid ? "" : undefined}
        data-readonly={readOnly ? "" : undefined}
        data-size={resolvedSize}
        data-slot="editable"
        ref={setRootRef}
        {...props}
      >
        {children}
      </div>
    </EditableContext.Provider>
  );
}

/**
 * Holds the preview and the field, which take turns in one place. While
 * editing it takes the row beside the Save and Cancel triggers.
 */
export function EditableArea({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const context = useEditableContext("EditableArea");
  return (
    <div
      className={cn(slotClass("editable-area", props), className)}
      data-disabled={context.disabled ? "" : undefined}
      data-editing={context.editing ? "" : undefined}
      data-placeholder-shown={context.empty ? "" : undefined}
      data-slot="editable-area"
      {...props}
    />
  );
}

/**
 * The value at rest, on one line that ends with an ellipsis, with the full
 * value as its title while it is cut; beside an EditableTextarea it wraps.
 * An empty value shows the preview placeholder. Children replace the text it
 * shows, such as a formatted value. It is hidden while editing and paints
 * the text above the field while they switch, and takes focus only while it
 * can start editing.
 */
export function EditablePreview({
  children,
  className,
  onClick,
  onDoubleClick,
  onFocus,
  ref,
  style,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  const context = useEditableContext("EditablePreview");
  const text = context.empty
    ? (context.placeholder.preview ?? "")
    : context.value;
  const [truncationRef, truncated] = useTruncated<HTMLSpanElement>(
    !context.editing,
  );
  const {
    props: { className: swapClassName, style: pin, ...swapProps },
    ref: swapRef,
  } = useSwapPart<HTMLSpanElement>(
    context,
    "rest",
    "text",
    context.refs.previewPlace,
  );
  const setRef = useRefs<HTMLSpanElement>(
    ref,
    context.refs.preview as React.RefObject<HTMLSpanElement | null>,
    truncationRef,
    swapRef,
  );
  const activates = previewCanActivate(
    context.activationMode,
    context.interactive,
  );
  return (
    <span
      className={cn(
        slotClass("editable-preview", props),
        focusRingRecipe(),
        swapClassName,
        className,
      )}
      data-activation={activates ? context.activationMode : undefined}
      data-disabled={context.disabled ? "" : undefined}
      data-placeholder-shown={context.empty ? "" : undefined}
      data-readonly={context.readOnly ? "" : undefined}
      data-slot="editable-preview"
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          context.interactive &&
          previewActivates(context.activationMode, "click")
        )
          context.startEdit();
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        if (
          !event.defaultPrevented &&
          context.interactive &&
          previewActivates(context.activationMode, "dblclick")
        )
          context.startEdit();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented && context.interactive)
          context.previewFocus();
      }}
      ref={setRef}
      tabIndex={activates ? 0 : undefined}
      title={truncated ? text : undefined}
      {...props}
      {...swapProps}
      style={withPin(style, pin)}
    >
      {children ?? text}
    </span>
  );
}

export type EditableInputProps = Omit<InputProps, "defaultValue" | "value">;

/**
 * The single-line field: the kit Input, filled with the value. It stays in
 * the document while hidden, so its `name` submits with a form. Enter saves
 * and Escape cancels; Enter never submits a form around it.
 */
export function EditableInput({
  onKeyDown,
  onValueChange,
  ref,
  size,
  ...props
}: EditableInputProps): React.ReactElement {
  const context = useEditableContext("EditableInput");
  const setRef = useRefs<HTMLInputElement>(
    ref,
    context.refs.field as React.RefObject<HTMLInputElement | null>,
  );
  const resolvedSize = size ?? context.size;
  return (
    <EditableSwapPane context={context} side="edit" slot="editable-field-pane">
      <Input
        disabled={context.disabled}
        form={context.form}
        maxLength={context.maxLength}
        name={context.name}
        placeholder={context.placeholder.edit}
        readOnly={context.readOnly}
        required={context.required}
        {...(resolvedSize !== undefined ? { size: resolvedSize } : {})}
        {...(context.invalid ? { "aria-invalid": true } : {})}
        {...props}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          context.onFieldKeyDown(event);
        }}
        onValueChange={(value, details) => {
          onValueChange?.(value, details);
          context.setValue(value);
        }}
        ref={setRef}
        value={context.value}
      />
    </EditableSwapPane>
  );
}

export type EditableTextareaProps = Omit<
  TextareaProps,
  "defaultValue" | "value"
>;

/**
 * The multi-line field: the kit Textarea, filled with the value. Enter starts
 * a new line; Cmd+Enter on Apple systems, or Ctrl+Enter elsewhere, saves, and
 * Escape cancels.
 */
export function EditableTextarea({
  onChange,
  onKeyDown,
  ref,
  size,
  ...props
}: EditableTextareaProps): React.ReactElement {
  const context = useEditableContext("EditableTextarea");
  const setRef = useRefs<HTMLTextAreaElement>(
    ref,
    context.refs.field as React.RefObject<HTMLTextAreaElement | null>,
  );
  return (
    <EditableSwapPane context={context} side="edit" slot="editable-field-pane">
      <Textarea
        disabled={context.disabled}
        form={context.form}
        maxLength={context.maxLength}
        name={context.name}
        placeholder={context.placeholder.edit}
        readOnly={context.readOnly}
        required={context.required}
        size={size ?? context.size}
        {...(context.invalid ? { "aria-invalid": true } : {})}
        {...props}
        onChange={(event) => {
          onChange?.(event);
          context.setValue(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          context.onFieldKeyDown(event);
        }}
        ref={setRef}
        value={context.value}
      />
    </EditableSwapPane>
  );
}

/**
 * Holds the triggers: the edit trigger at rest, and the optional Cancel and
 * Save beside the field while editing. It lays out no box of its own, so its
 * triggers take the Editable's row and spacing.
 */
export function EditableControl({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const context = useEditableContext("EditableControl");
  return (
    <div
      className={cn(slotClass("editable-control", props), className)}
      data-editing={context.editing ? "" : undefined}
      data-slot="editable-control"
      {...props}
    />
  );
}

/**
 * Starts editing: a ghost icon Button with the pencil, named by `labels.edit`
 * or `aria-label`. It is hidden while editing, and disabled while the value
 * cannot be edited. Beside an empty value without a placeholder it stands
 * where the field's caret will be, so it leaves at once instead of fading.
 */
export function EditableEditTrigger({
  "aria-label": ariaLabel,
  children,
  onClick,
  ref,
  ...props
}: ButtonProps): React.ReactElement {
  const context = useEditableContext("EditableEditTrigger");
  const setRef = useRefs<HTMLButtonElement>(ref, context.refs.editTrigger);
  return (
    <EditableSwapPane
      context={context}
      leaveAtOnce={context.empty && !context.placeholder.preview}
      placeRef={context.refs.pencilPlace}
      side="rest"
      slot="editable-trigger-pane"
    >
      <Button
        aria-label={
          ariaLabel ?? (children == null ? context.labels.edit : undefined)
        }
        data-slot="editable-edit-trigger"
        disabled={!context.interactive}
        size="icon-sm"
        variant="ghost"
        {...props}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) context.startEdit();
        }}
        ref={setRef}
      >
        {children ?? <PencilIcon aria-hidden="true" />}
      </Button>
    </EditableSwapPane>
  );
}

/**
 * The words of a Save or Cancel trigger: a Button of the Editable's size that
 * says its word, unless children replace it.
 */
function triggerLook(
  children: React.ReactNode,
  {
    size,
    variant,
    word,
  }: {
    size: SiteplaneControlSize | undefined;
    variant: "accent" | "ghost";
    word: string;
  },
): {
  children: React.ReactNode;
  size?: SiteplaneControlSize;
  variant: "accent" | "ghost";
} {
  return {
    children: children ?? word,
    ...(size !== undefined ? { size } : {}),
    variant,
  };
}

/**
 * Optional: saves the change, an accent Button beside the field that says
 * `labels.submit`, shown while editing. Inside a Field it checks the value
 * first.
 */
export function EditableSubmitTrigger({
  children,
  onClick,
  ref,
  ...props
}: ButtonProps): React.ReactElement {
  const context = useEditableContext("EditableSubmitTrigger");
  const setRef = useRefs<HTMLButtonElement>(ref, context.refs.submitTrigger);
  const { children: content, ...look } = triggerLook(children, {
    size: context.size,
    variant: "accent",
    word: context.labels.submit,
  });
  return (
    <EditableSwapPane
      context={context}
      side="edit"
      slot="editable-trigger-pane"
    >
      <Button
        data-slot="editable-submit-trigger"
        disabled={context.disabled}
        {...look}
        {...props}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) context.submit();
        }}
        ref={setRef}
      >
        {content}
      </Button>
    </EditableSwapPane>
  );
}

/**
 * Optional: cancels the change and puts the value back, a ghost Button beside
 * the field that says `labels.cancel`, shown while editing.
 */
export function EditableCancelTrigger({
  children,
  onClick,
  ref,
  ...props
}: ButtonProps): React.ReactElement {
  const context = useEditableContext("EditableCancelTrigger");
  const setRef = useRefs<HTMLButtonElement>(ref, context.refs.cancelTrigger);
  const { children: content, ...look } = triggerLook(children, {
    size: context.size,
    variant: "ghost",
    word: context.labels.cancel,
  });
  return (
    <EditableSwapPane
      context={context}
      side="edit"
      slot="editable-trigger-pane"
    >
      <Button
        data-slot="editable-cancel-trigger"
        disabled={context.disabled}
        {...look}
        {...props}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) context.cancel();
        }}
        ref={setRef}
      >
        {content}
      </Button>
    </EditableSwapPane>
  );
}
