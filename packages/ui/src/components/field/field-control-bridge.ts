import {
  DEFAULT_FIELD_ROOT_STATE,
  DEFAULT_VALIDITY_STATE,
} from "@base-ui/react/internals/field-constants";
import { useFieldRootContext } from "@base-ui/react/internals/field-root-context";
import { useRegisterFieldControl } from "@base-ui/react/internals/field-register-control";
import { useFormContext } from "@base-ui/react/internals/form-context";
import {
  useLabelableContext,
  useLabelableId,
} from "@base-ui/react/internals/labelable-provider";
import * as React from "react";

/*
 * Kit-internal Field adapter for controls whose own foundation (the React Aria
 * date, time and color controls) owns the value and, for date and time fields,
 * segments and constraint validation; the component index does not export it.
 * It connects such a control to an enclosing Field the way Base UI's own
 * Select does: FieldLabel names the control, FieldDescription and FieldError
 * describe it, Field and Form see its value and validity, and FieldError shows
 * the control's validation message.
 */

/** Validation result reported by the control's own validation owner. */
export type FieldControlValidation = {
  isInvalid: boolean;
  validationDetails: ValidityState;
  validationErrors: string[];
};

/**
 * For a control without constraints of its own, such as a color picker: the
 * proxy input checks `required` natively.
 */
export const noOwnerValidation: FieldControlValidation = {
  isInvalid: false,
  validationDetails: {
    badInput: false,
    customError: false,
    patternMismatch: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    tooLong: false,
    tooShort: false,
    typeMismatch: false,
    valid: true,
    valueMissing: false,
  },
  validationErrors: [],
};

export type FieldControlBridge = {
  /** Explicit `aria-describedby` ids, then FieldDescription and FieldError ids. */
  describedBy: string | undefined;
  /** The control's own disabled state or a disabled Field or Fieldset. */
  disabled: boolean;
  inField: boolean;
  /** Application-controlled Field state: Field `invalid` or a Form error. */
  invalid: boolean;
  /** Explicit `aria-labelledby`, otherwise the FieldLabel id. */
  labelledBy: string | undefined;
  /** A Field `name` takes precedence over the control's own name. */
  name: string | undefined;
  /** `false` while the Field reports an error. */
  valid: boolean | null;
};

export function useFieldControlBridge({
  "aria-describedby": ariaDescribedBy,
  "aria-labelledby": ariaLabelledBy,
  disabled,
  name,
}: {
  "aria-describedby"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  disabled?: boolean | undefined;
  name?: string | undefined;
}): FieldControlBridge {
  const field = useFieldRootContext();
  const { getDescriptionProps, labelId } = useLabelableContext();
  const describedBy = getDescriptionProps({
    "aria-describedby": ariaDescribedBy,
  })["aria-describedby"];

  return {
    describedBy: describedBy || undefined,
    disabled: Boolean(disabled || field.disabled),
    inField: field.state !== DEFAULT_FIELD_ROOT_STATE,
    invalid: field.invalid === true,
    labelledBy: ariaLabelledBy ?? labelId,
    name: field.name ?? name,
    valid: field.state.valid,
  };
}

const segmentSelector = '[role="spinbutton"], [role="textbox"]';

/**
 * Sets or removes the invalid state on the editable segments in `container`.
 */
export function markFieldErrorSegments(
  container: ParentNode | null | undefined,
  invalid: boolean,
): void {
  for (const segment of container?.querySelectorAll(segmentSelector) ?? []) {
    if (invalid) {
      segment.setAttribute("aria-invalid", "true");
      segment.setAttribute("data-invalid", "true");
    } else {
      segment.removeAttribute("aria-invalid");
      segment.removeAttribute("data-invalid");
    }
  }
}

/**
 * Marks the owner's segments invalid while the Field reports an error that
 * the owner doesn't show itself, such as a Field `validate` result. The owner
 * renders `aria-invalid` and `data-invalid` from its own validation only, so
 * the segments get the same attributes as for the owner's own checks. The
 * owner's validation and the Field's result stay unchanged.
 */
export function useFieldErrorSegments(
  container: React.RefObject<HTMLElement | null>,
  {
    controlled,
    ownerInvalid,
  }: {
    /** The application controls the invalid state. */
    controlled: boolean;
    /** The owner renders its own invalid state. */
    ownerInvalid: boolean;
  },
): void {
  const field = useFieldRootContext();
  const fieldError = !controlled && field.state.valid === false;
  const markedRef = React.useRef(false);

  // The owner re-renders its segments from its own state, so this runs after
  // every render. Attributes the owner renders itself stay untouched.
  React.useLayoutEffect(() => {
    if (ownerInvalid || (!fieldError && !markedRef.current)) return;
    markFieldErrorSegments(container.current, fieldError);
    markedRef.current = fieldError;
  });
}

const validityKeys = Object.keys(DEFAULT_VALIDITY_STATE).filter(
  (key) => key !== "valid",
) as Exclude<keyof ValidityState, "valid">[];

function isSameValidation(
  left: FieldControlValidation,
  right: FieldControlValidation,
): boolean {
  return (
    left === right ||
    (left.isInvalid === right.isInvalid &&
      left.validationErrors.join("\n") === right.validationErrors.join("\n") &&
      validityKeys.every(
        (key) =>
          Boolean(left.validationDetails[key]) ===
          Boolean(right.validationDetails[key]),
      ))
  );
}

export type FieldControlProxyProps = {
  "aria-hidden": true;
  autoComplete: "off";
  className: string;
  disabled: boolean;
  form: string | undefined;
  id: string | undefined;
  inputMode: "none";
  onChange: () => void;
  onFocus: () => void;
  onInvalid: (event: React.FormEvent<HTMLInputElement>) => void;
  ref: React.RefCallback<HTMLInputElement>;
  required: boolean | undefined;
  tabIndex: -1;
  value: string;
};

/**
 * Registers the control with the enclosing Field and Form and returns props
 * for a visually hidden proxy input, or `null` outside a Field. FieldLabel
 * points to the proxy, which passes focus on to the control. Field and Form
 * validation read the proxy's native validity, which mirrors the owner's
 * constraint validation plus `required`.
 */
export function useFieldControlProxy({
  controlled,
  disabled,
  displayValidation,
  focusTarget,
  form,
  name,
  onRevalidate,
  realtimeValidation,
  required,
  value,
}: {
  /** The application controls the invalid state and explains it itself. */
  controlled: boolean;
  disabled: boolean;
  /** The validation the owner currently displays. */
  displayValidation: FieldControlValidation;
  /** The element that receives focus for the Field, such as the first segment. */
  focusTarget: () => HTMLElement | null;
  form: string | undefined;
  name: string | undefined;
  /** Asks the owner to display its current validation. */
  onRevalidate: () => void;
  /** The owner's current validation, displayed or not. */
  realtimeValidation: FieldControlValidation;
  required: boolean | undefined;
  /** Serialized value; an empty string while the control is empty. */
  value: string;
}): FieldControlProxyProps | null {
  const field = useFieldRootContext();
  const { clearErrors } = useFormContext();
  const inField = field.state !== DEFAULT_FIELD_ROOT_STATE;
  const controlId = useLabelableId();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const valueRef = React.useRef(value);
  const focusTargetRef = React.useRef(focusTarget);
  const changeRef = React.useRef(noop);
  const displaysErrorRef = React.useRef(displayValidation.isInvalid);
  const revalidateRef = React.useRef(onRevalidate);
  const controlRef = React.useMemo<React.RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        return focusTargetRef.current();
      },
    }),
    [],
  );
  const getValue = React.useCallback(() => valueRef.current, []);
  const {
    name: fieldName,
    setDirty,
    setFilled,
    setValidityData,
    validation,
    validityData,
  } = field;

  useRegisterFieldControl(
    controlRef,
    controlId,
    value,
    getValue,
    inField && !disabled,
    name,
  );

  React.useLayoutEffect(() => {
    valueRef.current = value;
    focusTargetRef.current = focusTarget;
    displaysErrorRef.current = displayValidation.isInvalid;
    revalidateRef.current = onRevalidate;
    // A value change validates again, like a Base UI control; an error that
    // is already shown follows the value instead of waiting for the next blur.
    changeRef.current = () => {
      clearErrors(fieldName);
      setDirty(value !== (validityData.initialValue ?? ""));
      validation.change(value);
      if (!controlled && displayValidation.isInvalid) onRevalidate();
    };
    // The proxy's native validity mirrors the owner's constraint validation,
    // so Field and Form validation see the result the owner reports.
    inputRef.current?.setCustomValidity(
      realtimeValidation.isInvalid
        ? realtimeValidation.validationErrors.join(" ") || "Invalid value."
        : "",
    );
  });

  React.useLayoutEffect(() => {
    if (inField) setFilled(value !== "");
  }, [inField, setFilled, value]);

  const previousValueRef = React.useRef(value);
  React.useEffect(() => {
    if (previousValueRef.current === value) return;
    previousValueRef.current = value;
    if (inField) changeRef.current();
  }, [inField, value]);

  // Field or Form validation, such as a Form submission, found an error that
  // the owner does not display yet. The owner then displays its own result,
  // which marks the control invalid as well.
  const fieldValid = field.state.valid;
  React.useEffect(() => {
    if (inField && !controlled && fieldValid === false) {
      if (!displaysErrorRef.current) revalidateRef.current();
    }
  }, [controlled, fieldValid, inField]);

  // The owner displays validation after blur, native form submission or
  // reset; the Field shows the same result, so FieldError explains it.
  const displayedRef = React.useRef<FieldControlValidation | null>(null);
  React.useEffect(() => {
    const previous = displayedRef.current;
    displayedRef.current = displayValidation;
    if (!inField || controlled || previous === null) return;
    if (isSameValidation(previous, displayValidation)) return;
    const details = displayValidation.validationDetails;
    setValidityData((current) => ({
      ...current,
      error: displayValidation.validationErrors[0] ?? "",
      errors: displayValidation.validationErrors,
      state: {
        badInput: details.badInput,
        customError: details.customError,
        patternMismatch: details.patternMismatch,
        rangeOverflow: details.rangeOverflow,
        rangeUnderflow: details.rangeUnderflow,
        stepMismatch: details.stepMismatch,
        tooLong: details.tooLong,
        tooShort: details.tooShort,
        typeMismatch: details.typeMismatch,
        valid: !displayValidation.isInvalid,
        valueMissing: details.valueMissing,
      },
      value: valueRef.current,
    }));
  }, [controlled, displayValidation, inField, setValidityData]);

  const validationInputRef = validation.inputRef;
  const setInputRef = React.useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;
      validationInputRef.current = element;
    },
    [validationInputRef],
  );

  if (!inField) return null;

  return {
    "aria-hidden": true,
    autoComplete: "off",
    className: "sr-only",
    disabled,
    form,
    id: controlId,
    inputMode: "none",
    onChange: noop,
    onFocus: () => focusTargetRef.current()?.focus(),
    // The control reports the error itself; the browser bubble would repeat it.
    onInvalid: (event) => event.preventDefault(),
    ref: setInputRef,
    required,
    tabIndex: -1,
    value,
  };
}

function noop(): void {}

/**
 * Whether an editable segment of a React Aria date or time field shows its
 * placeholder, so the field shows no complete value.
 */
export function hasClearedSegment(
  state:
    | {
        segments: readonly { isEditable: boolean; isPlaceholder: boolean }[];
      }
    | null
    | undefined,
): boolean {
  return (
    state?.segments.some(
      (segment) => segment.isEditable && segment.isPlaceholder,
    ) ?? false
  );
}

// The day conversions live with the system so the Calendar, which ships
// without Input, converts days the same way as the date and time fields.
export { nativeDayTime, toNativeDay } from "../../system/date/native-day";

export type SegmentedValueOptions<T> = {
  /** The application controls the value. */
  controlled: boolean;
  /** The owner value of the `value` prop, read while controlled. */
  value: T | null;
  /** The owner value the field starts with while uncontrolled. */
  defaultValue: T | null;
  /** The form value; an empty string while the field holds no value. */
  serialize: (value: T | null) => string;
  /** Reports a value the user set, or `null` when the user cleared it. */
  onValueChange: (value: T | null) => void;
  required: boolean | undefined;
  /** The error of a required field that shows an incomplete value. */
  incompleteMessage: string;
};

export type SegmentedValue<T> = {
  /** A segment shows its placeholder, so the field holds no value. */
  incomplete: boolean;
  /** The owner's `value` while controlled. */
  ownerValue: T | null;
  /** The owner's change callback. */
  onOwnerChange: (value: T | null) => void;
  /** The owner's `validate`: a required field is invalid while incomplete. */
  validate: () => string | undefined;
  /**
   * Called after every render of the field's content with what its segments
   * show: whether a segment is cleared, the owner's value and the value the
   * field holds, which is empty while a segment is cleared.
   */
  sync: (shown: {
    cleared: boolean;
    effective: T | null;
    value: T | null;
  }) => void;
};

/**
 * The value of a segmented date or time field as its segments show it.
 * React Aria keeps the last complete value while the user clears a segment
 * and reports nothing until the field is complete or empty again. The kit
 * treats such a field as empty: its form value is empty, `onValueChange`
 * reports the clear once, and a required field is invalid. When the segments
 * are complete again, the value is reported again, also when React Aria still
 * held it. A controlled field passes the held value on to React Aria while
 * the application holds the clear, so the segments the user left stay as
 * they are.
 */
export function useSegmentedValue<T>({
  controlled,
  defaultValue,
  incompleteMessage,
  onValueChange,
  required,
  serialize,
  value,
}: SegmentedValueOptions<T>): SegmentedValue<T> {
  const [incomplete, setIncomplete] = React.useState(false);
  const [held, setHeld] = React.useState<T | null>(null);
  // The value the application knows: the last one reported, or its own. A
  // new value from the application is known at once, before the content
  // reports what its segments show after the same render.
  const reported = React.useRef<string | null>(null);
  reported.current ??= serialize(controlled ? value : defaultValue);
  const valueKey = controlled ? serialize(value) : null;
  // React Aria resets the segments whenever the value it gets is a new object,
  // so a render with the same value, such as a parent update during an edit,
  // passes the same object on; the value is keyed by its form value.
  const ownValue = React.useMemo(() => value, [valueKey]);
  const [lastValueKey, setLastValueKey] = React.useState(valueKey);
  if (valueKey !== lastValueKey) {
    setLastValueKey(valueKey);
    if (valueKey !== null) reported.current = valueKey;
    // A value from the application ends a held clear.
    if (value !== null) setHeld(null);
  }

  const report = (next: T | null) => {
    const key = serialize(next);
    if (key === reported.current) return;
    reported.current = key;
    onValueChange(next);
  };

  return {
    incomplete,
    ownerValue: controlled ? (ownValue ?? held) : null,
    onOwnerChange: (next) => {
      setHeld(null);
      report(next);
    },
    validate: () => (required && incomplete ? incompleteMessage : undefined),
    sync: ({ cleared, effective, value: shown }) => {
      if (cleared !== incomplete) setIncomplete(cleared);
      if (serialize(effective) === reported.current) return;
      if (controlled && cleared) setHeld(shown);
      report(effective);
    },
  };
}
