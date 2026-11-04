"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { SelectCaretIcon } from "../../system/styles/select-caret";
import type { FormControlTriggerVariant } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

import "./native-select.css";

export type NativeSelectProps = Omit<
  React.ComponentPropsWithoutRef<"select">,
  "size"
> &
  React.RefAttributes<HTMLSelectElement> & {
    /**
     * The control size, 36, 40, 44 and 48 px from sm to xl; unset, the
     * provider's.
     */
    size?: SiteplaneControlSize | undefined;
    /**
     * The surface. `default` rests raised, as the Select trigger does.
     * `outline` rests transparent inside the hairline rim of an outline
     * Button, for a filter bar or a toolbar beside an inset search field, as
     * the Select trigger's `outline` does. Default: `default`.
     */
    variant?: FormControlTriggerVariant | undefined;
    /**
     * `full` fills the container, like Input. `fit` is as wide as the value
     * and the caret, at the width the browser gives the select, that of its
     * widest option. Default: `full`.
     */
    width?: "fit" | "full" | undefined;
  };

/**
 * The browser's own select on the field scale: the options open in the
 * platform's list, a phone's picker on a phone, and the value is a form
 * value. It looks like the Select trigger, with the same caret, sizes,
 * focus, invalid and disabled states (design-rework.css), so the two stand
 * side by side in a form. Its options are NativeSelectOption and
 * NativeSelectOptGroup children.
 *
 * In a Field it is the Field's control: FieldLabel names it,
 * FieldDescription and FieldError describe it, and the Field reads its value
 * and its validity.
 *
 * It stands on its own, the kit's one native select, which people choose on
 * purpose. It never sits inside another kit part: a select in an InputGroup
 * segment is the kit Select, a SelectTrigger with `variant="segment"` in a
 * bare InputGroupAddon (rulebook K3, Lukas, 2 November 2026).
 */
export function NativeSelect({
  children,
  className,
  ref,
  size,
  style,
  variant = "default",
  width = "full",
  ...props
}: NativeSelectProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span
      className={cn(
        "sp-native-select-wrapper",
        // The select is a field of its size: its height, the value's padding,
        // the caret's place and the text follow it (the field scale), and a
        // Field reads it for its hint.
        "sp-field-scale",
        className,
      )}
      data-size={resolvedSize}
      data-slot="native-select-wrapper"
      // The surface, from the Select trigger's mode rules (design-rework.css).
      data-variant={variant}
      // The width of the field (native-select.css).
      data-width={width}
      // A hidden select hides its whole control.
      hidden={props.hidden}
      // `className` and the consumer's `style` style the field, the wrapper
      // that draws it (Lukas, 4 November 2026); the other props reach the
      // select. The kit sets no style of its own here.
      {...(style === undefined ? {} : { style })}
    >
      {/* The select's props go to the Field's control, as an Input's do, so
          the Field's rule decides: its name and its disabled state come first,
          an id the select leaves unset keeps the label's target, and its
          description joins the select's own aria-describedby. */}
      <FieldPrimitive.Control
        className={slotClass("native-select", props)}
        data-slot="native-select"
        {...(props as FieldPrimitive.Control.Props)}
        ref={ref}
        render={(controlProps: React.ComponentProps<"select">) => (
          <select {...controlProps}>{children}</select>
        )}
      />
      <span
        aria-hidden="true"
        className="sp-select-icon"
        data-slot="select-icon"
      >
        <SelectCaretIcon />
      </span>
    </span>
  );
}

/** An option of a NativeSelect: the native `option`. */
export function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">): React.ReactElement {
  return (
    <option
      className={cn(slotClass("native-select-option", props), className)}
      data-slot="native-select-option"
      {...props}
    />
  );
}

/** A labelled group of options of a NativeSelect: the native `optgroup`. */
export function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">): React.ReactElement {
  return (
    <optgroup
      className={cn(slotClass("native-select-optgroup", props), className)}
      data-slot="native-select-optgroup"
      {...props}
    />
  );
}
