"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  surfaceClassNames,
  type FormControlVariant,
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
    variant?: FormControlVariant | undefined;
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
    /**
     * Whether people can drag the height with the grip in the corner.
     * `vertical`, the default, shows the native grip; a dragged height takes
     * over from the growth with the content, between the least and the most
     * lines. `none` hides the grip, so the textarea only grows with its
     * content.
     */
    resize?: "none" | "vertical" | undefined;
    /**
     * How the height follows the text. `content`, the default, grows the
     * textarea with its text from the least height of its size, or
     * `minLines`, up to `maxLines`. `fixed` keeps the height of the native
     * `rows`, two lines when unset: longer text scrolls, and the grip still
     * drags the height.
     */
    fieldSizing?: "content" | "fixed" | undefined;
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
    resize = "vertical",
    fieldSizing = "content",
    ref,
    style,
    ...props
  } = ownProps as KitTextareaProps;
  // The control is a field of its size (the field scale, design-rework.css):
  // its padding and text follow it, and a Field reads it for its hint. A
  // textarea in an InputGroup takes the group's.
  const resolvedSize = useResolvedControlSize(size);
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
  // `className` and `style` style the field, its outer span, with the line
  // counts (Lukas, 4 November 2026). The textarea of an InputGroup has no box
  // of its own (textarea.css), so its style stays on the native textarea.
  const inGroup = profile === "input-group";
  const rootStyle =
    !inGroup && style !== undefined ? { ...style, ...lineStyle } : lineStyle;

  return (
    <span
      className={
        cn(
          "sp-textarea-control sp-base-textarea",
          profile !== "input-group" && "sp-field-scale",
          !unstyled && surfaceClassNames.formControl,
          className,
        ) || undefined
      }
      data-foundation="textarea"
      data-field-sizing={fieldSizing === "fixed" ? "fixed" : undefined}
      data-inset-end={(profile === "input-group" && insetEnd) || undefined}
      data-label-placement={floating ? "floating" : undefined}
      data-max-lines={hasMaxLines ? maxLines : undefined}
      data-min-lines={hasMinLines ? minLines : undefined}
      data-profile={profile}
      // The vertical grip is the default (design-rework.css); textarea.css
      // takes it away for resize="none".
      data-resize={resize === "none" ? "none" : undefined}
      data-size={resolvedSize}
      data-slot="textarea-control"
      // Only an explicit textSize replaces the text of the size.
      data-text-size={textSize}
      data-unstyled={unstyled || undefined}
      data-variant={variant}
      // A hidden textarea hides its whole control, so no empty field surface
      // stays on the page; the textarea itself stays in the form.
      hidden={props.hidden}
      style={rootStyle}
    >
      {/* The textarea's props go to the Field's control, as an Input's do, so
          the Field's rule decides: its name and its disabled state come first,
          an id the textarea leaves unset keeps the label's target, and its
          description joins the textarea's own aria-describedby. */}
      <FieldPrimitive.Control
        className={cn(
          // Field's own props carry no slot; the app's may.
          slotClass("textarea", textareaProps),
          fieldSizing !== "fixed" && "field-sizing-content",
          "w-full outline-none disabled:cursor-not-allowed",
        )}
        data-slot="textarea"
        {...(textareaProps as FieldPrimitive.Control.Props)}
        {...(inGroup && style !== undefined ? { style } : {})}
        ref={ref}
        render={(controlProps: React.ComponentProps<"textarea">) => (
          <textarea {...controlProps} />
        )}
      />
    </span>
  );
}

export { FieldPrimitive };
