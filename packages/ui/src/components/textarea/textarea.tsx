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
import { slotClass } from "../../system/utils/slot-class";
import { useFieldLabelPlacement } from "../field";

import type { KitTextareaProps } from "./textarea-internal";

import "./textarea.css";

export type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> &
  React.RefAttributes<HTMLTextAreaElement> & {
    size?: SiteplaneControlSize | undefined;
    textSize?: FormControlTextSize | undefined;
    variant?: FormControlSurface | undefined;
    unstyled?: boolean | undefined;
    /**
     * The least height as a number of text lines, fractions allowed, instead of
     * the minimum of the size. The textarea still grows with its content. The
     * native `rows` cannot do this: a textarea that sizes to its content
     * ignores it.
     */
    minLines?: number | undefined;
    /**
     * The most height as a number of text lines, fractions allowed: the
     * textarea grows with its content up to it, then scrolls. Unset, it grows
     * without a limit. `minLines` wins where the two disagree.
     */
    maxLines?: number | undefined;
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
    insetEnd = false,
    minLines,
    maxLines,
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

  const isLineCount = (value: number | undefined): value is number =>
    value !== undefined && Number.isFinite(value) && value > 0;
  const hasMinLines = isLineCount(minLines);
  const hasMaxLines = isLineCount(maxLines);
  // The line counts are run-time values. The stylesheet turns them into
  // heights (design-rework.css) and keeps a height where a policy blocks the
  // style attribute: 2.5 lines for minLines, no limit for maxLines.
  const lineStyle =
    hasMinLines || hasMaxLines
      ? ({
          ...(hasMinLines ? { "--textarea-min-lines": minLines } : {}),
          ...(hasMaxLines ? { "--textarea-max-lines": maxLines } : {}),
        } as React.CSSProperties)
      : undefined;

  return (
    <span
      className={
        cn(
          "sp-textarea-control sp-base-textarea",
          !unstyled && surfaceClassNames.formControl,
          !unstyled && formControlSurfaceClassNames[variant],
          resolvedTextSize && formControlTextClassNames[resolvedTextSize],
          className,
        ) || undefined
      }
      data-foundation="textarea"
      data-inset-end={(profile === "input-group" && insetEnd) || undefined}
      data-label-placement={floating ? "floating" : undefined}
      data-max-lines={hasMaxLines ? maxLines : undefined}
      data-min-lines={hasMinLines ? minLines : undefined}
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="textarea-control"
      // Only an explicit textSize replaces the size-based field text.
      data-text-size={textSize}
      data-unstyled={unstyled || undefined}
      data-variant={variant}
      style={lineStyle}
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
              // Field's own props carry no slot; the app's may.
              slotClass("textarea", textareaProps),
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
