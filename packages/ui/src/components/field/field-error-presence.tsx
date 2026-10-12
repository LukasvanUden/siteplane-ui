"use client";

import {
  FieldRootContext,
  useFieldRootContext,
} from "@base-ui/react/internals/field-root-context";
import {
  FormContext,
  useFormContext,
} from "@base-ui/react/internals/form-context";
import type * as React from "react";

/*
 * Kit-internal helpers of FieldError: when the error is shown, and the Field
 * state a leaving error keeps. Like the control bridge next to it, they read
 * Base UI's Field and Form context, which the pinned @base-ui/react version
 * exports; the component index does not export them.
 */

export type FieldErrorMatch = boolean | keyof ValidityState | undefined;

/** The Field and Form state a FieldError reads, as it is at one render. */
export type FieldErrorState = {
  field: FieldRootContext;
  form: FormContext;
};

/**
 * The state of the enclosing Field and Form. Like Base UI's own Field.Error it
 * needs an enclosing Field.
 */
export function useFieldErrorState(): FieldErrorState {
  return { field: useFieldRootContext(false), form: useFormContext() };
}

/**
 * Whether a FieldError shows its message. This is the rule of Base UI's own
 * Field.Error: `match` shows it always, a disabled Field never, a validity key
 * when that check fails, otherwise a failed validation or a Form error for the
 * Field's name. FieldError needs the answer outside the element, because the
 * motion component keeps an error on screen while it leaves.
 */
export function isFieldErrorShown(
  match: FieldErrorMatch,
  { field, form }: Pick<FieldErrorState, "field" | "form">,
): boolean {
  if (match === true) return true;
  if (field.state.disabled) return false;
  if (typeof match === "string")
    return Boolean(field.validityData.state[match]);

  const formError =
    field.name && Object.hasOwn(form.errors, field.name)
      ? form.errors[field.name]
      : null;
  const hasFormError = Array.isArray(formError)
    ? formError.length > 0
    : Boolean(formError);
  return hasFormError || field.validityData.state.valid === false;
}

/**
 * Hands the Field and Form state it is given to everything inside. FieldError
 * passes the state of its latest render. While the error leaves, the motion
 * component keeps rendering the element of that last render, so the message
 * stays what it was and does not change as the Field becomes valid, which the
 * validity and Form state that clears the error would otherwise do.
 */
export function FieldErrorStateProvider({
  children,
  field,
  form,
}: FieldErrorState & { children: React.ReactNode }): React.ReactElement {
  return (
    <FieldRootContext.Provider value={field}>
      <FormContext.Provider value={form}>{children}</FormContext.Provider>
    </FieldRootContext.Provider>
  );
}
