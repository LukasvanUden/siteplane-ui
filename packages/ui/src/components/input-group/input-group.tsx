"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  formControlSurfaceClassNames,
  formControlTextClassNames,
  surfaceClassNames,
  type FormControlTextSize,
  type FormControlVariant,
} from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import type { InputProps } from "../input";
import { KitInput } from "../input/input-internal";
import { type TextareaProps } from "../textarea";
import { KitTextarea } from "../textarea/textarea-internal";

import "./input-group.css";

const inputGroupInteractiveSelector =
  "button, a, input, select, textarea, [contenteditable='true'], [role='button'], [role='combobox'], [role='listbox'], [role='spinbutton'], [data-slot='select-trigger']";

// An addon's cursor, line height, its order and padding by alignment, and the
// first-line alignment beside a textarea are the kit base (design-rework.css).
// The addon sizes and spaces the icons it holds, but not the icon of a Button
// in it, which the Button's own icon rule sizes.
const inputGroupAddonVariants = cva(
  "flex h-auto select-none justify-center gap-2 in-[[data-foundation=input-group]:has([data-slot=input-control],[data-slot=textarea-control],[role=spinbutton])]:[&_svg:not([class*='size-']):where(:not([data-chassis]>[data-slot=button-content]>svg))]:size-4 not-has-[button]:**:[svg:not([class*='opacity-'])]:opacity-80",
  {
    defaultVariants: {
      align: "inline-start",
    },
    variants: {
      align: {
        "block-end": "w-full justify-start",
        "block-start": "w-full justify-start",
        "inline-end": "",
        "inline-start": "",
      },
    },
  },
);

/** Whether the InputGroup opens with an addon (see `opensWithAddon`). */
const InputGroupInsetStartContext = React.createContext(false);

/**
 * Whether an InputGroupAddon at the inline start, its default alignment, is
 * among the group's children, also inside a Fragment: an icon or a text
 * prefix before the input. Read from the children while rendering, so the
 * server markup is already right.
 */
function opensWithAddon(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (
      !React.isValidElement<{ align?: unknown; children?: React.ReactNode }>(
        child,
      )
    )
      return false;
    if (child.type === React.Fragment)
      return opensWithAddon(child.props.children);
    return (
      child.type === InputGroupAddon &&
      (child.props.align ?? "inline-start") === "inline-start"
    );
  });
}

/**
 * A group that opens with an addon tells its input, whose start edge then
 * adjoins the addon (Input `insetStart`). In a floating Field that input keeps
 * the label above the group: a floating field takes no leading icon.
 */
export function InputGroup({
  children,
  className,
  onMouseDown,
  textSize,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  textSize?: FormControlTextSize | undefined;
  variant?: FormControlVariant | undefined;
}): React.ReactElement {
  return (
    <div
      className={cn(
        variant === "soft"
          ? surfaceClassNames.formControlCompositeSoft
          : cn(
              surfaceClassNames.formControlComposite,
              formControlSurfaceClassNames[variant],
            ),
        "has-[textarea]:h-auto has-data-[align=block-end]:flex-col has-data-[align=block-start]:flex-col",
        textSize && formControlTextClassNames[textSize],
        className,
      )}
      data-foundation="input-group"
      data-slot="input-group"
      data-text-size={textSize}
      data-variant={variant}
      onMouseDown={(event) => {
        onMouseDown?.(event);
        if (
          event.defaultPrevented ||
          (event.target as HTMLElement).closest(inputGroupInteractiveSelector)
        ) {
          return;
        }

        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "input:not([hidden]):not([type='hidden']):not(:disabled), textarea:not(:disabled), [contenteditable='true'], [role='spinbutton']:not([aria-disabled='true'])",
          ),
        );
        const control =
          controls.find(
            (candidate) =>
              event.clientX <= candidate.getBoundingClientRect().right,
          ) ?? controls.at(-1);
        if (!control) return;

        event.preventDefault();
        control.focus();
        if (
          control instanceof HTMLInputElement &&
          control.closest(".siteplane-input-segment")
        ) {
          control.select();
        }
      }}
      role="group"
      {...props}
    >
      <InputGroupInsetStartContext.Provider value={opensWithAddon(children)}>
        {children}
      </InputGroupInsetStartContext.Provider>
    </div>
  );
}

export function InputGroupAddon({
  className,
  align = "inline-start",
  divider = false,
  padding = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof inputGroupAddonVariants> & {
    divider?: boolean;
    padding?: "default" | "compact" | "none";
  }): React.ReactElement {
  return (
    <div
      className={cn(inputGroupAddonVariants({ align }), className)}
      data-align={align}
      data-divider={divider || undefined}
      data-padding={padding}
      data-slot="input-group-addon"
      {...props}
    />
  );
}

export function InputGroupText({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  // The text sits on a 1em line, and the kit font draws descenders below it,
  // so a long text is clipped at the sides only.
  return (
    <span
      className={cn(
        "flex items-center gap-2 overflow-x-clip whitespace-nowrap text-muted-foreground leading-none in-[[data-foundation=input-group]:has([data-slot=input-control],[data-slot=textarea-control])]:[&_svg:not([class*='size-'])]:size-4.5 sm:in-[[data-foundation=input-group]:has([data-slot=input-control],[data-slot=textarea-control])]:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupInput({
  className,
  insetStart,
  ...props
}: Omit<InputProps, "profile" | "unstyled">): React.ReactElement {
  // An addon before the input takes its start edge.
  const addonBefore = React.useContext(InputGroupInsetStartContext);

  return (
    <KitInput
      {...props}
      className={className}
      insetStart={insetStart || addonBefore}
      profile="input-group"
      unstyled
    />
  );
}

export function InputGroupSegment({
  className,
  insetStart = false,
  onFocus,
  width = "2-digit",
  ...props
}: Omit<InputProps, "profile" | "unstyled"> & {
  insetStart?: boolean;
  width?: "2-digit" | "4-digit" | "fill";
}): React.ReactElement {
  return (
    <KitInput
      {...props}
      className={cn("siteplane-input-segment", className)}
      data-segment-inset-start={insetStart || undefined}
      data-segment-width={width}
      onFocus={(event) => {
        event.currentTarget.select();
        onFocus?.(event);
      }}
      profile="input-group"
      unstyled
    />
  );
}

export function InputGroupTextarea({
  className,
  ...props
}: Omit<TextareaProps, "profile" | "unstyled">): React.ReactElement {
  return (
    <KitTextarea
      {...props}
      className={className}
      profile="input-group"
      unstyled
    />
  );
}
