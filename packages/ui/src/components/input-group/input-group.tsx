"use client";

import { LabelableProvider } from "@base-ui/react/internals/labelable-provider";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  type SiteplaneControlSize,
  SiteplaneControlSizeScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  surfaceClassNames,
  type FormControlTextSize,
  type FormControlVariant,
} from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
import { useFieldLabelPlacement } from "../field";
import type { InputProps } from "../input";
import { KitInput } from "../input/input-internal";
import { type TextareaProps } from "../textarea";
import { KitTextarea } from "../textarea/textarea-internal";
import { FieldHelp, FieldStatus, hasFieldHelp } from "./field-status";

import "./input-group.css";

const inputGroupInteractiveSelector =
  "button, a, input, select, textarea, [contenteditable='true'], [role='button'], [role='combobox'], [role='listbox'], [role='spinbutton'], [data-slot='select-trigger']";

// An addon's cursor, line height, its order and padding by alignment, the
// first-line alignment beside a textarea and the space between what it holds
// are the kit base (design-rework.css): 8 px, and 4 px between field actions
// side by side. design-rework.css sizes the icons it holds, but not the icon
// of a Button in it, which the Button's own icon rule sizes.
const inputGroupAddonVariants = cva(
  "flex h-auto select-none justify-center not-has-[button]:**:[svg:not([class*='opacity-'])]:opacity-80",
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

/** Whether the InputGroup keeps the end of its control clear (`insetEnd`). */
const InputGroupInsetEndContext = React.createContext(false);

/** The control size of the InputGroup, which the controls in it take. */
const InputGroupSizeContext = React.createContext<
  SiteplaneControlSize | undefined
>(undefined);

const controlSizes: ReadonlySet<unknown> = new Set(["sm", "md", "lg", "xl"]);

/**
 * The size an InputGroupInput or InputGroupTextarea among the group's
 * children names, also inside a Fragment, for a group that names none of its
 * own. Read from the children while rendering, so the server markup is
 * already right.
 */
function controlSizeOf(
  children: React.ReactNode,
): SiteplaneControlSize | undefined {
  for (const child of React.Children.toArray(children)) {
    if (
      !React.isValidElement<{ children?: React.ReactNode; size?: unknown }>(
        child,
      )
    )
      continue;
    if (child.type === React.Fragment) {
      const size = controlSizeOf(child.props.children);
      if (size) return size;
      continue;
    }
    if (
      (child.type === InputGroupInput || child.type === InputGroupTextarea) &&
      controlSizes.has(child.props.size)
    )
      return child.props.size as SiteplaneControlSize;
  }
  return undefined;
}

/**
 * The group's children with the status of the field (FieldStatus) right
 * after the text: before the first addon at the inline end (an
 * InputGroupTooltip is one), or at the end. Every child keeps the key it has
 * without the status, so a status that comes or goes moves nothing else.
 */
function withFieldStatus(
  children: React.ReactNode,
  status: React.ReactElement | null,
): React.ReactNode {
  const items = React.Children.toArray(children);
  if (!status) return items;
  const end = items.findIndex(
    (child) =>
      React.isValidElement<{ align?: unknown }>(child) &&
      (child.type === InputGroupTooltip ||
        (child.type === InputGroupAddon && child.props.align === "inline-end")),
  );
  return end < 0
    ? [...items, status]
    : [...items.slice(0, end), status, ...items.slice(end)];
}

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
 *
 * The group is a field of its own size: `size`, or
 * the size of the InputGroupInput or InputGroupTextarea in it, or the
 * provider's. It names that size on its field scale (design-rework.css), so
 * its height, its text, the padding of its addons and their leading icon
 * follow it, and the input or textarea in it takes it. The group shows the
 * status of its field after the text: the help icon of `tooltip`, and the
 * alert icon while the field is invalid (`showInvalidIcon`), in the help
 * icon's place (FieldStatus, input-group.css).
 */
export function InputGroup({
  children,
  className,
  insetEnd = false,
  onMouseDown,
  showInvalidIcon = true,
  size,
  textSize,
  tooltip,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * Keeps the end of the input or textarea clear for an action placed over
   * it, such as a square Button 8 px inside the top-end corner of a textarea.
   * The text ends 8 px before a Button of the control size.
   */
  insetEnd?: boolean | undefined;
  /**
   * While the field is invalid (`aria-invalid` on its control, which an
   * invalid Field sets, or `data-invalid` on the group), an alert icon stands
   * after the text, where the help icon of `tooltip` stands, which gives way
   * to it. It is decorative: the Field ties the error message to the control.
   * A group that keeps its end clear (`insetEnd`), a password field, a group
   * whose end holds a reveal action and a floating field show none. `false`
   * turns it off. Default: `true`.
   */
  showInvalidIcon?: boolean | undefined;
  /** The control size of the field. Default: the provider's control size. */
  size?: SiteplaneControlSize | undefined;
  textSize?: FormControlTextSize | undefined;
  /**
   * A help text behind a help icon after the text, shown in a Tooltip on
   * hover and keyboard focus, as Input's `tooltip`.
   */
  tooltip?: React.ReactNode;
  variant?: FormControlVariant | undefined;
}): React.ReactElement {
  // The room follows the control size, which a Button in the group takes too.
  const controlSize = useResolvedControlSize<SiteplaneControlSize>(undefined);
  const resolvedSize = useResolvedControlSize(size ?? controlSizeOf(children));
  // A floating field shows its error in a bubble at the same end instead.
  const floating = useFieldLabelPlacement() === "floating";
  const alert = showInvalidIcon && !insetEnd && !floating;
  const status =
    alert || hasFieldHelp(tooltip) ? (
      <FieldStatus alert={alert} key="field-status" tooltip={tooltip} />
    ) : null;
  return (
    <div
      className={cn(
        slotClass("input-group", props),
        baseClass("input-group", props),
        "sp-field-scale",
        variant === "soft"
          ? surfaceClassNames.formControlCompositeSoft
          : surfaceClassNames.formControlComposite,
        "has-[textarea]:h-auto has-data-[align=block-end]:flex-col has-data-[align=block-start]:flex-col",
        className,
      )}
      data-foundation="input-group"
      data-inset-end={insetEnd ? controlSize : undefined}
      data-size={resolvedSize}
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

        // A hidden form input, such as the file input of a FileInput or the
        // value of a Select, is never the control a press focuses.
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "input:not([hidden]):not([type='hidden']):not([aria-hidden='true']):not(:disabled), textarea:not(:disabled), [contenteditable='true'], [role='spinbutton']:not([aria-disabled='true'])",
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
          control.closest(".sp-input-segment")
        ) {
          control.select();
        }
      }}
      role="group"
      {...props}
    >
      <InputGroupSizeContext.Provider value={resolvedSize}>
        <InputGroupInsetStartContext.Provider value={opensWithAddon(children)}>
          <InputGroupInsetEndContext.Provider value={insetEnd}>
            {withFieldStatus(children, status)}
          </InputGroupInsetEndContext.Provider>
        </InputGroupInsetStartContext.Provider>
      </InputGroupSizeContext.Provider>
    </div>
  );
}

/**
 * A part of the group beside or around its control: text, an icon or an
 * action. Without padding (`padding="none"`) it is a segment of the group, as
 * a country before a phone number is: a Button or a Select trigger in it
 * fills it at the group's full height, from the group's edge to the input or
 * the divider (design-rework.css), and takes the group's size, as the group's
 * input does, unless it names a size of its own. A dropdown segment is always
 * the kit Select, never a NativeSelect (rulebook K3).
 *
 * A segment stands apart from the value, so it draws the divider unless
 * `divider={false}` (Lukas, 3 November 2026): a control that fills a bare
 * addon, such as a Select, a Copy Button or a Button. Text beside the value,
 * such as a protocol, a domain, a unit or a sign (https://, .com, EUR, $),
 * is muted text on the field's own surface, with no cell and no divider
 * (Lukas, 4 November 2026: "Text im Feld, ohne Linie"; text of more than one
 * character drew the divider), and an icon, a hint or an action is no
 * segment either. A header or footer addon draws its divider when `divider`
 * is set.
 */
export function InputGroupAddon({
  children,
  className,
  align = "inline-start",
  divider,
  padding = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof inputGroupAddonVariants> & {
    divider?: boolean | undefined;
    padding?: "default" | "compact" | "none";
  }): React.ReactElement {
  const groupSize = React.useContext(InputGroupSizeContext);
  const inline = align === "inline-start" || align === "inline-end";
  // Only a segment stands apart from the value.
  const showDivider = divider ?? (inline && padding === "none");
  // A bare addon is a segment: its Select or Button is a control of its own,
  // named by its own label. It takes its own labelable scope, so the Field's
  // label, description and control id stay with the group's input; without it
  // the Select took the input's id and, through the Field's label, its name.
  const segment =
    padding === "none" ? (
      <LabelableProvider>{children}</LabelableProvider>
    ) : null;
  return (
    <div
      className={cn(
        slotClass("input-group-addon", props),
        inputGroupAddonVariants({ align }),
        className,
      )}
      data-align={align}
      data-divider={showDivider || undefined}
      data-padding={padding}
      data-slot="input-group-addon"
      {...props}
    >
      {/* The controls of a segment that name no size take the group's, read
          from the group as its input reads it: a Select trigger or a Button,
          through the kit's control size scope. */}
      {segment === null ? (
        children
      ) : groupSize === undefined ? (
        segment
      ) : (
        <SiteplaneControlSizeScope controlSize={groupSize}>
          {segment}
        </SiteplaneControlSizeScope>
      )}
    </div>
  );
}

export function InputGroupText({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  // The text sits on a 1em line, and the kit font draws descenders below it,
  // so a long text is clipped at the sides only. design-rework.css sizes its
  // icons beside a field control, 16 px, at their place (rulebook I3).
  return (
    <span
      className={cn(
        // The text takes the slot of its host (a Date Range Picker's
        // separator), and its class with it; sp-input-group-text marks the
        // text in every host.
        slotClass(undefined, props),
        "sp-input-group-text flex items-center gap-2 overflow-x-clip whitespace-nowrap text-muted-foreground leading-none [&_svg]:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The help of a field as an addon of its own at the end of the group: a help
 * icon that shows its children in a Tooltip above it on hover and keyboard
 * focus. It is the field action of an end addon, named by `aria-label`, and
 * screen readers hear the help text as its description. The group's `tooltip`
 * places the same help icon right after the text. While the field is
 * invalid, the help icon gives way to the group's alert icon (input-group.css),
 * so the help text is passed in every state.
 */
export function InputGroupTooltip({
  "aria-label": ariaLabel,
  children,
  ...props
}: Omit<
  React.ComponentProps<"div">,
  "aria-label" | "children" | "align" | "divider" | "padding"
> & {
  /** The help text that the tooltip shows. */
  children: React.ReactNode;
  /** The name of the help button. */
  "aria-label"?: string | undefined;
}): React.ReactElement {
  return (
    <InputGroupAddon align="inline-end" {...props}>
      <FieldHelp aria-label={ariaLabel}>{children}</FieldHelp>
    </InputGroupAddon>
  );
}

/**
 * The input of the group. It takes the group's size; the group shows the
 * alert icon of an invalid field (`showInvalidIcon` on InputGroup).
 */
export function InputGroupInput({
  className,
  insetStart,
  size,
  ...props
}: Omit<
  InputProps,
  "profile" | "showInvalidIcon" | "tooltip" | "unstyled"
>): React.ReactElement {
  // An addon before the input takes its start edge.
  const addonBefore = React.useContext(InputGroupInsetStartContext);
  const groupSize = React.useContext(InputGroupSizeContext);
  const controlSize = size ?? groupSize;

  return (
    <KitInput
      {...props}
      className={className}
      insetStart={insetStart || addonBefore}
      profile="input-group"
      showInvalidIcon={false}
      {...(controlSize === undefined ? {} : { size: controlSize })}
      unstyled
    />
  );
}

export function InputGroupSegment({
  className,
  insetStart = false,
  onFocus,
  size,
  width = "2-digit",
  ...props
}: Omit<InputProps, "profile" | "showInvalidIcon" | "tooltip" | "unstyled"> & {
  insetStart?: boolean;
  width?: "2-digit" | "4-digit" | "fill";
}): React.ReactElement {
  const groupSize = React.useContext(InputGroupSizeContext);
  const controlSize = size ?? groupSize;
  // A segment is one part of a field's value; the group shows the alert icon
  // of the field.
  return (
    <KitInput
      {...props}
      className={cn("sp-input-segment", className)}
      data-segment-inset-start={insetStart || undefined}
      data-segment-width={width}
      onFocus={(event) => {
        event.currentTarget.select();
        onFocus?.(event);
      }}
      profile="input-group"
      showInvalidIcon={false}
      {...(controlSize === undefined ? {} : { size: controlSize })}
      unstyled
    />
  );
}

export function InputGroupTextarea({
  className,
  size,
  ...props
}: Omit<TextareaProps, "profile" | "unstyled">): React.ReactElement {
  // A group with insetEnd keeps the end of the textarea clear.
  const insetEnd = React.useContext(InputGroupInsetEndContext);
  const groupSize = React.useContext(InputGroupSizeContext);
  const controlSize = size ?? groupSize;

  return (
    <KitTextarea
      {...props}
      className={className}
      insetEnd={insetEnd}
      profile="input-group"
      size={controlSize}
      unstyled
    />
  );
}
