"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import { DEFAULT_VALIDITY_STATE } from "@base-ui/react/internals/field-constants";
import { useFieldRootContext } from "@base-ui/react/internals/field-root-context";
import { useFormContext } from "@base-ui/react/internals/form-context";
import { LabelableProvider } from "@base-ui/react/internals/labelable-provider";
import * as React from "react";

import { useFormReset } from "../../system/form/use-form-reset";
import { useMediaQuery } from "../../system/hooks/use-media-query";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { FieldHelp, hasFieldHelp } from "../input-group/field-status";
import { MotionReveal } from "../motion";
import { Tooltip, TooltipPopup } from "../tooltip";
import {
  type FieldErrorState,
  FieldErrorStateProvider,
  isFieldErrorShown,
  useFieldErrorState,
} from "./field-error-presence";

export type FieldLabelPlacement = "top" | "floating";

const FieldLabelPlacementContext =
  React.createContext<FieldLabelPlacement>("top");

/**
 * Where the enclosing Field draws its label: "top" above the control (the
 * default, and outside a Field) or "floating" inside it. Controls read it to
 * lay themselves out around a floating label.
 */
export function useFieldLabelPlacement(): FieldLabelPlacement {
  return React.useContext(FieldLabelPlacementContext);
}

/** Whether focus is in the enclosing Field (see `fieldHoldsFocus`). */
const FieldFocusContext = React.createContext(false);

/**
 * Focus is in a field while it is in its control, in an action inside it such
 * as a password's show/hide button, or in an open popup of it, whose trigger
 * inside the field is then expanded.
 */
function fieldHoldsFocus(field: HTMLElement): boolean {
  return (
    field.contains(field.ownerDocument.activeElement) ||
    field.querySelector('[aria-expanded="true"]') !== null
  );
}

/**
 * The space between a Field's label, control, description and error is
 * `--field-gap` (6 px; 0 px at sm and 2 px from md
 * when the label holds a checkbox, radio or switch, so its hint follows the
 * label). FieldError reads the same value, so the space
 * it adds opens and closes with the error instead of appearing in one step.
 * The description and the error write the hint text of the size of the
 * Field's control, which every field names on its root (sp-field-scale,
 * design-rework.css).
 *
 * `labelPlacement="floating"` draws the label inside the control: at rest it
 * stands in for the placeholder, and it glides to the top once the field has
 * focus or a value (design-rework.css, "Floating label fields").
 *
 * The Field follows whether focus is in it (`fieldHoldsFocus`): its error
 * tooltip shows only then, so one bubble shows at a time. With
 * `validationMode="onBlur"`, from the Field or its Form, leaving the field
 * validates it in full, so a required field that is left empty warns. Base UI
 * reports a missing value only once the value has changed; the Field asks Base
 * UI's own validate action instead.
 *
 * `requiredIndicator` marks the label of a required field with a red asterisk
 * (design-rework.css). It is a choice per form; the control's own `required`
 * stays the one source, so the asterisk shows only while the control is
 * required.
 *
 * A native reset of the form around the Field returns it to how it was before
 * the form's first submit (FieldFormReset).
 */
export function Field({
  actionsRef,
  children,
  className,
  labelPlacement = "top",
  onBlur,
  onFocus,
  ref,
  requiredIndicator = false,
  ...props
}: WithStringClassName<FieldPrimitive.Root.Props> & {
  labelPlacement?: FieldLabelPlacement;
  /** Marks the label with a red asterisk while the control is required. */
  requiredIndicator?: boolean | undefined;
}): React.ReactElement {
  const formValidationMode = useFormContext().validationMode;
  const validatesOnBlur =
    (props.validationMode ?? formValidationMode) === "onBlur";
  const actions = React.useRef<FieldPrimitive.Root.Actions | null>(null);
  // The caller's actionsRef reaches the same validate action.
  React.useImperativeHandle(
    actionsRef,
    () => ({ validate: () => actions.current?.validate() }),
    [],
  );

  // Whether focus is in the field, and what leaving it does.
  const fieldRef = React.useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = React.useState(false);
  const focusedRef = React.useRef(false);
  const validatesOnBlurRef = React.useRef(validatesOnBlur);
  React.useLayoutEffect(() => {
    validatesOnBlurRef.current = validatesOnBlur;
  });
  const follow = React.useCallback((holds: boolean) => {
    const left = focusedRef.current && !holds;
    focusedRef.current = holds;
    setFocused(holds);
    if (left && validatesOnBlurRef.current) actions.current?.validate();
  }, []);
  // Wait until focus has settled: a field action keeps it inside the field,
  // and an opening popup marks its trigger expanded.
  const settle = React.useCallback(() => {
    requestAnimationFrame(() => {
      const field = fieldRef.current;
      if (field) follow(fieldHoldsFocus(field));
    });
  }, [follow]);
  // A control that has focus before hydration, such as an autofocused one.
  React.useLayoutEffect(() => {
    const field = fieldRef.current;
    if (field && fieldHoldsFocus(field)) follow(true);
  }, [follow]);
  // While focus is in the field, a popup of it can close with focus elsewhere,
  // so the field follows the document's focus moves until focus has left.
  React.useEffect(() => {
    if (!focused) return undefined;
    const document = fieldRef.current?.ownerDocument;
    if (!document) return undefined;
    document.addEventListener("focusin", settle);
    document.addEventListener("focusout", settle);
    return () => {
      document.removeEventListener("focusin", settle);
      document.removeEventListener("focusout", settle);
    };
  }, [focused, settle]);
  // The reset is cleared inside the Field root, where its state lives.
  const resetField = React.useRef<(() => void) | null>(null);
  const formResetRef = useFormReset<HTMLDivElement>(undefined, () =>
    resetField.current?.(),
  );
  const setFieldRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      fieldRef.current = element;
      formResetRef.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [formResetRef, ref],
  );

  return (
    <FieldLabelPlacementContext.Provider value={labelPlacement}>
      <FieldFocusContext.Provider value={focused}>
        <FieldPrimitive.Root
          actionsRef={actions}
          className={cn(
            // min-w-0: in a grid or flex form a Field never grows past its
            // track for a long value, such as a Select's nowrap trigger.
            slotClass("field", props),
            // The gap is --field-gap, a kit default of 6 px that a Field whose
            // label holds a choice control refines (design-rework.css).
            "flex min-w-0 flex-col items-start gap-(--field-gap)",
            className,
          )}
          data-label-placement={
            labelPlacement === "floating" ? "floating" : undefined
          }
          data-required-indicator={requiredIndicator ? "" : undefined}
          data-slot="field"
          onBlur={(event) => {
            onBlur?.(event);
            settle();
          }}
          onFocus={(event) => {
            onFocus?.(event);
            follow(true);
          }}
          ref={setFieldRef}
          {...props}
        >
          <FieldFormReset field={fieldRef} handle={resetField} />
          {children}
        </FieldPrimitive.Root>
      </FieldFocusContext.Provider>
    </FieldLabelPlacementContext.Provider>
  );
}

/**
 * A native reset puts the form's values back to their defaults, and Base UI
 * keeps the Field's validity, its touched and dirty marks and the Form's
 * submitted state as they were; it does not follow a reset. The reset clears
 * them, so the Field is as it was before the form's first submit: its error
 * collapses as when the value becomes valid, its controls drop a custom
 * validity message, and the Form validates again on its next submit. Errors
 * the application passes to Form clear with the same reset (Form). It renders
 * nothing.
 */
function FieldFormReset({
  field: fieldElement,
  handle,
}: {
  field: React.RefObject<HTMLDivElement | null>;
  handle: React.RefObject<(() => void) | null>;
}): null {
  const field = useFieldRootContext(false);
  const form = useFormContext();
  React.useLayoutEffect(() => {
    handle.current = () => {
      form.submitAttemptedRef.current = false;
      for (const control of fieldElement.current?.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea") ?? [])
        control.setCustomValidity("");
      field.setValidityData((data) => ({
        ...data,
        error: "",
        errors: [],
        state: DEFAULT_VALIDITY_STATE,
        value: data.initialValue,
      }));
      field.setTouched(false);
      field.setDirty(false);
    };
  });
  return null;
}

/**
 * A label above a field is 14 px on a 20 px line;
 * one beside a checkbox, radio or switch (holding it, next to it or leading the
 * text column next to it) takes the type of the control, since such labels are
 * sentences and wrap (S13).
 * Label and FieldLabel share that rule in design-rework.css. A label of text
 * alone lays out as a block, so a required asterisk follows its last word when
 * it wraps.
 */
export function FieldLabel({
  className,
  tooltip,
  tooltipLabel,
  ...props
}: WithStringClassName<FieldPrimitive.Label.Props> & {
  /**
   * Help for the field: a help icon after the label text, and after the
   * required asterisk, that shows it in a tooltip on hover and keyboard focus,
   * the help icon of the field's own status. It stands beside the label
   * element, so it is no part of the field's name, and it keeps working in a
   * disabled field. A floating label shows none; give its control the help.
   */
  tooltip?: React.ReactNode;
  /**
   * The accessible name of the help icon of `tooltip`, such as "Billing email
   * help". Defaults to "More information".
   */
  tooltipLabel?: string | undefined;
}): React.ReactElement {
  const placement = useFieldLabelPlacement();
  const label = (
    <FieldPrimitive.Label
      className={cn(
        slotClass("field-label", props),
        "items-center gap-2",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
  if (!hasFieldHelp(tooltip) || placement === "floating") return label;
  return (
    <span className="sp-field-label-row" data-slot="field-label-row">
      {label}
      <FieldHelp aria-label={tooltipLabel} slot="field-label-help">
        {tooltip}
      </FieldHelp>
    </span>
  );
}

export function FieldItem({
  className,
  ...props
}: WithStringClassName<FieldPrimitive.Item.Props>): React.ReactElement {
  return (
    <FieldPrimitive.Item
      className={cn(slotClass("field-item", props), "flex", className)}
      data-slot="field-item"
      {...props}
    />
  );
}

/**
 * The hint of a Field. Its start padding (design-rework.css) puts it under the
 * label text when the label holds a choice control (S13), and holds an icon
 * that leads it beside the text, centred on the first line (I5).
 */
export function FieldDescription({
  className,
  ...props
}: WithStringClassName<FieldPrimitive.Description.Props>): React.ReactElement {
  return (
    <FieldPrimitive.Description
      className={cn(
        slotClass("field-description", props),
        "text-muted-foreground",
        className,
      )}
      data-slot="field-description"
      {...props}
    />
  );
}

export type FieldErrorVariant = "inline" | "tooltip";

/**
 * The message of a failed validation. It expands with a fade when it appears
 * and collapses while it still shows its last message when it goes, so the
 * form below it never jumps. Showing and hiding follow Base UI's Field.Error.
 *
 * The block's negative margin takes back the Field's gap and the message's own
 * padding gives it again, so the space opens and closes with the block.
 *
 * `variant="tooltip"` shows the same message in a bubble beside the control
 * instead, so nothing below it moves. It is the default in a floating Field,
 * and `inline` everywhere else.
 *
 * An icon that leads the message, such as WarningCircleIcon, stands beside
 * the text as in FieldDescription (design-rework.css).
 */
export function FieldError({
  className,
  match,
  variant,
  ...props
}: WithStringClassName<FieldPrimitive.Error.Props> & {
  /**
   * `inline` reveals the message below the control; `tooltip` shows it in a
   * destructive bubble beside the control, out of the flow. The default is
   * `tooltip` in a floating Field and `inline` otherwise.
   */
  variant?: FieldErrorVariant | undefined;
}): React.ReactElement {
  const state = useFieldErrorState();
  const placement = useFieldLabelPlacement();
  const resolvedVariant =
    variant ?? (placement === "floating" ? "tooltip" : "inline");

  if (resolvedVariant === "tooltip")
    return (
      <FieldErrorTooltip
        className={className}
        shown={isFieldErrorShown(match, state)}
        state={state}
        {...props}
      />
    );

  return (
    <MotionReveal
      className="-mt-(--field-gap)"
      open={isFieldErrorShown(match, state)}
    >
      <FieldErrorStateProvider {...state}>
        {/* The motion component decides whether the error is shown, so the
            element itself always is. */}
        <FieldPrimitive.Error
          className={cn(
            // Its text and its start padding are the description's, which
            // follow the size of the Field's control and its choice indent
            // (design-rework.css).
            slotClass("field-error", props),
            "pt-(--field-gap) text-destructive-foreground",
            className,
          )}
          data-slot="field-error"
          match
          {...props}
        />
      </FieldErrorStateProvider>
    </MotionReveal>
  );
}

/** Parts of a Field that are not its control. */
const fieldParts = new Set([
  "field-error-anchor",
  "field-error-description",
  "field-description",
  "field-label",
  "motion-reveal",
]);

/**
 * The visible control of the Field around `element`: its first child that is
 * no label, description, error or bare input (such as a Select's hidden form
 * input), or the Field itself.
 */
function fieldControlOf(element: Element | null): Element | null {
  const field = element?.closest('[data-slot="field"]') ?? null;
  if (!field) return null;
  for (const child of Array.from(field.children)) {
    if (
      child instanceof HTMLInputElement ||
      child.hasAttribute("hidden") ||
      fieldParts.has(child.getAttribute("data-slot") ?? "")
    )
      continue;
    return child;
  }
  return field;
}

/**
 * The tooltip variant of FieldError: the kit Tooltip, anchored to the Field's
 * control, in the destructive tone with an arrow. It shows while the error is
 * shown and focus is in the field, so at most one bubble shows at a time, as
 * the browser's own validation bubble does; other invalid fields show the
 * invalid frame. It sits at the control's inline end, centred, or below it,
 * start-aligned, on a narrow screen; Base UI places it and flips it when there
 * is no room. It never takes the pointer or focus. The bubble keeps the message
 * of its last shown render while it fades out.
 *
 * The control's error description is a visually hidden Field.Error beside the
 * anchor, there whenever the error is shown, with focus in the field or not;
 * the bubble only presents the same message, so it registers no description
 * of its own and is hidden from assistive technology.
 */
function FieldErrorTooltip({
  className,
  shown,
  state,
  ...props
}: WithStringClassName<FieldPrimitive.Error.Props> & {
  shown: boolean;
  state: FieldErrorState;
}): React.ReactElement {
  // The description keeps a given id; the bubble takes its own.
  const bubbleProps = { ...props, id: undefined };
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  const focused = React.useContext(FieldFocusContext);
  const beside = useMediaQuery("sm");
  const [heldState, setHeldState] = React.useState(state);
  if (
    shown &&
    (heldState.field !== state.field || heldState.form !== state.form)
  )
    setHeldState(state);

  return (
    <>
      {/* Finds the Field in the document; the bubble itself is portalled. */}
      <span
        className="sp-field-error-anchor"
        data-slot="field-error-anchor"
        hidden
        ref={anchorRef}
      />
      {shown ? (
        <FieldPrimitive.Error
          className={cn(slotClass("field-error-description", props), "sr-only")}
          data-slot="field-error-description"
          match
          {...props}
        />
      ) : null}
      <Tooltip open={shown && focused}>
        <TooltipPopup
          align={beside ? "center" : "start"}
          anchor={() => fieldControlOf(anchorRef.current)}
          arrow
          interactive={false}
          side={beside ? "inline-end" : "bottom"}
          tone="error"
        >
          <FieldErrorStateProvider {...heldState}>
            {/* Its own labelable scope keeps the bubble out of the control's
                description. */}
            <LabelableProvider>
              <FieldPrimitive.Error
                aria-hidden="true"
                className={cn(
                  slotClass("field-error", undefined, bubbleProps.render),
                  className,
                )}
                data-slot="field-error"
                data-variant="tooltip"
                match
                {...bubbleProps}
              />
            </LabelableProvider>
          </FieldErrorStateProvider>
        </TooltipPopup>
      </Tooltip>
    </>
  );
}

// Base UI's own Control type, with className narrowed to a string: its ref
// still takes any HTMLElement, as a rendered textarea needs.
export const FieldControl: React.ForwardRefExoticComponent<
  WithStringClassName<Omit<FieldPrimitive.Control.Props, "ref">> &
    React.RefAttributes<HTMLElement>
> = FieldPrimitive.Control;
export const FieldValidity: typeof FieldPrimitive.Validity =
  FieldPrimitive.Validity;

export { FieldPrimitive };
