"use client";

import type * as React from "react";

import {
  DialogPopup,
  DialogPrimitive as CommandDialogPrimitive,
} from "../dialog";
import { KitDialogPopup } from "../dialog/dialog-internal";
import { menuShortcutClassName } from "../menu/menu-shared";
import {
  type SiteplaneControlSize,
  useSiteplaneUI,
} from "../../system/provider/siteplane-ui-provider";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import {
  Autocomplete,
  type AutocompletePrimitive,
  AutocompleteCollection,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteSeparator,
} from "../autocomplete";
import {
  KitAutocompleteInput,
  KitAutocompleteItem,
} from "../autocomplete/autocomplete-internal";

export {
  Dialog as CommandDialog,
  DialogPortal as CommandDialogPortal,
  DialogCreateHandle as CommandCreateHandle,
  DialogTrigger as CommandDialogTrigger,
  DialogBackdrop as CommandDialogBackdrop,
  DialogViewport as CommandDialogViewport,
} from "../dialog";

export function CommandDialogPopup(
  props: React.ComponentProps<typeof DialogPopup>,
): React.ReactElement {
  const messages = useSiteplaneMessages("command");
  return (
    <KitDialogPopup
      aria-label={messages.label}
      showCloseButton={false}
      profile="command"
      data-slot="command-dialog-popup"
      {...props}
    />
  );
}

export const Command: typeof Autocomplete = <ItemValue,>({
  autoHighlight = "always",
  keepHighlight = true,
  ...props
}: Omit<AutocompletePrimitive.Root.Props<ItemValue>, "items"> & {
  items?: readonly ItemValue[] | undefined;
}): React.ReactElement => {
  return (
    <Autocomplete
      autoHighlight={autoHighlight}
      inline
      keepHighlight={keepHighlight}
      open
      {...props}
    />
  );
};

/**
 * The search row follows the control size, as the results below it do: 48, 60,
 * 64 and 68 px from sm to xl. The default sm keeps the palette's 48 px, md the
 * 60 px that xl had, and lg and xl go on in steps of 4 px (Lukas, 13 October
 * 2026; renamed for the 4 px control ladder on 30 October 2026).
 */
const commandInputHeights = {
  sm: "h-12",
  md: "h-15",
  lg: "h-16",
  xl: "h-17",
} as const satisfies Record<SiteplaneControlSize, string>;

export function CommandInput({
  className,
  placeholder = undefined,
  size,
  ...props
}: React.ComponentProps<typeof AutocompleteInput>): React.ReactElement {
  // The row follows the provider; a size given to the input sizes its text.
  const { controlSize } = useSiteplaneUI();
  const messages = useSiteplaneMessages("command");
  return (
    <div
      className={cn(
        "sp-command-input",
        "relative flex shrink-0 items-center px-5",
        commandInputHeights[controlSize],
      )}
      data-size={controlSize}
      data-slot="command-input"
    >
      <KitAutocompleteInput
        aria-label={messages.search}
        className={className}
        placeholder={placeholder}
        size={size ?? controlSize}
        profile="command"
        unstyled
        {...props}
      />
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof AutocompleteList>): React.ReactElement {
  return (
    <AutocompleteList
      className={cn("not-empty:scroll-py-1 not-empty:p-1", className)}
      data-slot="command-list"
      {...props}
    />
  );
}

export function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof AutocompleteEmpty>): React.ReactElement {
  return (
    <AutocompleteEmpty
      className={cn("not-empty:py-6", className)}
      data-slot="command-empty"
      {...props}
    />
  );
}

export function CommandPanel({
  className,
  children,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("command-panel", props),
        "relative flex min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
      data-slot="command-panel"
      {...props}
    >
      {children}
    </div>
  );
}

export function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof AutocompleteGroup>): React.ReactElement {
  return (
    <AutocompleteGroup
      className={className}
      data-slot="command-group"
      {...props}
    />
  );
}

export function CommandGroupLabel({
  className,
  ...props
}: React.ComponentProps<typeof AutocompleteGroupLabel>): React.ReactElement {
  return (
    <AutocompleteGroupLabel
      className={className}
      data-slot="command-group-label"
      {...props}
    />
  );
}

export function CommandCollection({
  ...props
}: React.ComponentProps<typeof AutocompleteCollection>): React.ReactElement {
  return <AutocompleteCollection data-slot="command-collection" {...props} />;
}

export function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof AutocompleteItem>): React.ReactElement {
  // The rows follow the control size (design-rework.css); a row from md on
  // writes in 16 px, so its icon grows to 18 px.
  const { controlSize } = useSiteplaneUI();
  return (
    <KitAutocompleteItem
      className={cn(
        controlSize !== "sm" && "sm:[&_svg:not([class*='size-'])]:size-4.5",
        className,
      )}
      data-size={controlSize}
      profile="command"
      data-slot="command-item"
      {...props}
    />
  );
}

export function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof AutocompleteSeparator>): React.ReactElement {
  return (
    <AutocompleteSeparator
      className={className}
      data-slot="command-separator"
      {...props}
    />
  );
}

/**
 * The shortcut of a result: the text of a menu row's shortcut, 12/18 at the
 * label weight in the muted colour at 72 %, 4 px inside the row's end, as
 * MenuShortcut writes it (menu-shared.tsx). The footer's key legend keeps the
 * Kbd keycaps.
 */
export function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"kbd">): React.ReactElement {
  return (
    <kbd
      className={cn(
        slotClass("command-shortcut", props),
        menuShortcutClassName,
        className,
      )}
      data-slot="command-shortcut"
      {...props}
    />
  );
}

/**
 * The band under the results: the popup footer of design-rework.css that the
 * Menu and the Combobox share, a hairline over 12 px of room, its parts at
 * the two ends of the row, 12 px apart, in 14/20 text in the quaternary
 * colour.
 */
export function CommandFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("command-footer", props), "shrink-0", className)}
      data-slot="command-footer"
      {...props}
    >
      {children}
    </div>
  );
}

export { CommandDialogPrimitive };
