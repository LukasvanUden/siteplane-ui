"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import { mergeProps } from "@base-ui/react/merge-props";
import type * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  formControlSurfaceClassNames,
  formControlTextClassNames,
  surfaceClassNames,
  type FormControlSurface,
  type FormControlTextSize,
} from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { useFieldLabelPlacement } from "../field";

import type { KitTextareaProps } from "./textarea-internal";

import "./textarea.css";

export type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> &
  React.RefAttributes<HTMLTextAreaElement> & {
    size?: SiteplaneControlSize;
    textSize?: FormControlTextSize;
    variant?: FormControlSurface;
    unstyled?: boolean;
    /**
     * The least height as a number of text lines, fractions allowed, instead of
     * the minimum of the size. The textarea still grows with its content. The
     * native `rows` cannot do this: a textarea that sizes to its content
     * ignores it.
     */
    minLines?: number;
  };

export function Textarea(ownProps: TextareaProps): React.ReactElement {
  // InputGroupTextarea passes the internal input-group profile through
  // KitTextarea (textarea-internal.ts), the same function.
  const {
    className,
    size,
    textSize,
    variant = "default",
    unstyled = false,
    profile = "default",
    minLines,
    ref,
    ...props
  } = ownProps as KitTextareaProps;
  const resolvedSize = useResolvedControlSize(size);
  const resolvedTextSize =
    textSize ??
    (resolvedSize === "lg" || resolvedSize === "xl" ? "base" : undefined);
  // A floating Field lays out the textarea it holds (design-rework.css,
  // "Floating label fields"); a textarea inside an InputGroup keeps the
  // group's layout. A blank placeholder lets CSS tell an empty field.
  const floating =
    useFieldLabelPlacement() === "floating" && profile !== "input-group";
  const textareaProps =
    floating && props.placeholder === undefined
      ? { ...props, placeholder: " " }
      : props;

  const hasMinLines =
    minLines !== undefined && Number.isFinite(minLines) && minLines > 0;

  return (
    <span
      className={
        cn(
          !unstyled && surfaceClassNames.formControl,
          !unstyled && formControlSurfaceClassNames[variant],
          resolvedTextSize && formControlTextClassNames[resolvedTextSize],
          className,
        ) || undefined
      }
      data-foundation="textarea"
      data-label-placement={floating ? "floating" : undefined}
      data-min-lines={hasMinLines ? minLines : undefined}
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="textarea-control"
      // Only an explicit textSize replaces the size-based field text.
      data-text-size={textSize}
      data-unstyled={unstyled || undefined}
      data-variant={variant}
      style={
        hasMinLines
          ? ({ "--textarea-min-lines": minLines } as React.CSSProperties)
          : undefined
      }
    >
      <FieldPrimitive.Control
        ref={ref}
        value={props.value}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        id={props.id}
        name={props.name}
        render={(defaultProps: React.ComponentProps<"textarea">) => (
          <textarea
            className={cn(
              "field-sizing-content w-full outline-none disabled:cursor-not-allowed",
            )}
            data-slot="textarea"
            {...mergeProps(defaultProps, textareaProps)}
          />
        )}
      />
    </span>
  );
}

export { FieldPrimitive };
