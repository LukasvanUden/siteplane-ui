"use client";

import { Form as FormPrimitive } from "@base-ui/react/form";
import * as React from "react";

import type { WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { cn } from "../../system/utils/cn";

type FormErrors = FormPrimitive.Props["errors"];

/**
 * A native form element with Base UI's consolidated error handling. A native
 * reset, from a reset button or `form.reset()`, clears the `errors` the form
 * was given until new errors arrive, and each Field returns to how it was
 * before the first submit, so no error stays on a value the reset restored.
 */
export function Form({
  className,
  errors,
  onReset,
  ...props
}: WithStringClassName<FormPrimitive.Props>): React.ReactElement {
  // The errors a reset cleared. A new errors object shows again.
  const [clearedErrors, setClearedErrors] = React.useState<FormErrors>();

  return (
    <FormPrimitive
      className={cn(slotClass("form", props), className)}
      data-slot="form"
      errors={
        errors !== undefined && errors === clearedErrors ? undefined : errors
      }
      onReset={(event) => {
        onReset?.(event);
        // Like the controls' own reset, wait until every handler could still
        // cancel it.
        queueMicrotask(() => {
          if (!event.defaultPrevented) setClearedErrors(errors);
        });
      }}
      {...props}
    />
  );
}

export { FormPrimitive };
