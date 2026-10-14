"use client";

import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

/** Registers a description's id with the Fieldset it describes. */
type FieldsetDescriptionRegistry = (id: string) => () => void;

const FieldsetDescriptionContext =
  React.createContext<FieldsetDescriptionRegistry | null>(null);

/**
 * A group of related fields. Its FieldsetDescription parts describe it: their
 * ids join the fieldset's `aria-describedby`, after one the application gives.
 */
export function Fieldset({
  "aria-describedby": describedBy,
  className,
  ...props
}: WithStringClassName<FieldsetPrimitive.Root.Props>): React.ReactElement {
  const [descriptionIds, setDescriptionIds] = React.useState<readonly string[]>(
    [],
  );
  const register = React.useCallback<FieldsetDescriptionRegistry>((id) => {
    setDescriptionIds((ids) => [...ids, id]);
    return () =>
      setDescriptionIds((ids) => ids.filter((entry) => entry !== id));
  }, []);
  const ariaDescribedBy =
    [describedBy, ...descriptionIds].filter(Boolean).join(" ") || undefined;

  return (
    <FieldsetDescriptionContext.Provider value={register}>
      <FieldsetPrimitive.Root
        aria-describedby={ariaDescribedBy}
        className={cn(slotClass("fieldset", props), "grid gap-3", className)}
        data-slot="fieldset"
        {...props}
      />
    </FieldsetDescriptionContext.Provider>
  );
}

export function FieldsetLegend({
  className,
  ...props
}: WithStringClassName<FieldsetPrimitive.Legend.Props>): React.ReactElement {
  return (
    <FieldsetPrimitive.Legend
      className={cn(
        slotClass("fieldset-legend", props),
        "font-semibold text-foreground",
        className,
      )}
      data-slot="fieldset-legend"
      {...props}
    />
  );
}

export type FieldsetDescriptionProps = useRender.ComponentProps<"p">;

/**
 * Text that explains the group, for the hint a group of fields shares. It
 * reads like the descriptions of other groups, such as a Card's, and the
 * Fieldset names it in its `aria-describedby`, so a screen reader reads it
 * when focus enters the group. Renders a `<p>`.
 */
export function FieldsetDescription({
  className,
  id,
  render,
  ...props
}: FieldsetDescriptionProps): React.ReactElement {
  const generatedId = React.useId();
  const descriptionId = id ?? generatedId;
  const register = React.useContext(FieldsetDescriptionContext);
  React.useLayoutEffect(
    () => register?.(descriptionId),
    [descriptionId, register],
  );
  const defaultProps = {
    className: cn(
      slotClass("fieldset-description", props, render),
      "wrap-anywhere",
      className,
    ),
    "data-slot": "fieldset-description",
    id: descriptionId,
  };

  return useRender({
    defaultTagName: "p",
    props: mergeProps<"p">(defaultProps, props),
    render,
  });
}

export { FieldsetPrimitive };
