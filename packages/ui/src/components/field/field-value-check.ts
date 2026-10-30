"use client";

import {
  DEFAULT_FIELD_ROOT_STATE,
  DEFAULT_VALIDITY_STATE,
} from "@base-ui/react/internals/field-constants";
import {
  type FieldRootContext,
  useFieldRootContext,
} from "@base-ui/react/internals/field-root-context";
import * as React from "react";

/*
 * Kit-internal helpers for a control that saves and cancels its value itself,
 * such as Editable: it checks the value of the Field around it before it
 * saves, and clears that check when it puts the saved value back. Like the
 * control bridge and the error helpers next to it, they read Base UI's Field
 * context, which the pinned @base-ui/react version exports; the component
 * index does not export them.
 */

/** A native control that a Field validates. */
export type FieldCheckedControl = HTMLInputElement | HTMLTextAreaElement;

/**
 * Checks the control's current value as a Form submit checks it: the native
 * constraints, such as `required` or `type="email"`, and the Field's
 * `validate`. Base UI reports a value that is missing only once the value has
 * changed; a save is a submit of this one value, so a required value that was
 * left empty reports itself too. A failed check marks the Field invalid, so
 * FieldError shows the message. Resolves whether the value passed.
 */
export async function checkFieldValue(
  field: Pick<FieldRootContext, "setDirty" | "validation">,
  control: FieldCheckedControl,
): Promise<boolean> {
  // A message an earlier check left would stand in for this check's own: Base
  // UI reads it before the native constraints and `validate`, and clears it
  // only while a change makes the value valid again.
  control.setCustomValidity("");
  if (control.validity.valueMissing) field.setDirty(true);
  // Base UI sets the control's custom validity when the check fails.
  await field.validation.commit(control.value);
  return control.validity.valid;
}

/**
 * Clears what the last check found, as a form reset does: the control drops a
 * custom validity message and the Field returns to unchecked, so no error
 * shows for a value that was put back. `value` is the value the control holds
 * now.
 */
export function clearFieldValueCheck(
  field: Pick<FieldRootContext, "setValidityData">,
  control: FieldCheckedControl,
  value: string,
): void {
  control.setCustomValidity("");
  field.setValidityData((data) => ({
    ...data,
    error: "",
    errors: [],
    state: DEFAULT_VALIDITY_STATE,
    value,
  }));
}

export type FieldValueCheck = {
  /** Whether the control sits inside a Field. */
  inField: boolean;
  /** Whether the Field, or a Fieldset around it, is disabled. */
  disabled: boolean;
  /** `checkFieldValue` for the Field around the control. */
  check: (control: FieldCheckedControl) => Promise<boolean>;
  /** `clearFieldValueCheck` for the Field around the control. */
  clear: (control: FieldCheckedControl, value: string) => void;
};

/** The value check of the Field around a control, or no Field. */
export function useFieldValueCheck(): FieldValueCheck {
  const field = useFieldRootContext();
  const inField = field.state !== DEFAULT_FIELD_ROOT_STATE;
  const fieldRef = React.useRef(field);
  React.useLayoutEffect(() => {
    fieldRef.current = field;
  });
  const check = React.useCallback(
    (control: FieldCheckedControl) =>
      checkFieldValue(fieldRef.current, control),
    [],
  );
  const clear = React.useCallback(
    (control: FieldCheckedControl, value: string) =>
      clearFieldValueCheck(fieldRef.current, control, value),
    [],
  );
  return { check, clear, disabled: Boolean(field.disabled), inField };
}
