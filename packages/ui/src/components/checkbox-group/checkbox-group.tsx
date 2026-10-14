"use client";

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group";
import type React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { CheckboxSizeContext } from "../checkbox";

export interface CheckboxGroupProps extends Omit<
  WithStringClassName<CheckboxGroupPrimitive.Props>,
  "size"
> {
  size?: SiteplaneControlSize;
}

export function CheckboxGroup({
  className,
  size,
  ...props
}: CheckboxGroupProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);

  return (
    <CheckboxSizeContext.Provider value={resolvedSize}>
      <CheckboxGroupPrimitive
        // The 8 px default is a utility, so a gap in className replaces it.
        className={cn(
          slotClass("checkbox-group", props),
          "flex flex-col items-start gap-2",
          className,
        )}
        data-size={resolvedSize}
        data-slot="checkbox-group"
        {...props}
      />
    </CheckboxSizeContext.Provider>
  );
}

export { CheckboxGroupPrimitive };
