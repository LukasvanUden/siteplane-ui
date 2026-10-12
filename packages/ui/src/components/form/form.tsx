"use client";

import { Form as FormPrimitive } from "@base-ui/react/form";
import type React from "react";

import type { WithStringClassName } from "../../system/utils/cn";

export function Form({
  className,
  ...props
}: WithStringClassName<FormPrimitive.Props>): React.ReactElement {
  return <FormPrimitive className={className} data-slot="form" {...props} />;
}

export { FormPrimitive };
