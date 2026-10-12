"use client";

import type * as React from "react";

import {
  DialogPopup,
  DialogPrimitive as CommandDialogPrimitive,
} from "../dialog";
import { KitDialogPopup } from "../dialog/dialog-internal";
import { Kbd } from "../kbd";
import { Separator } from "../separator";
import { cn } from "../../system/utils/cn";
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
  return (
    <KitDialogPopup
      aria-label="Command palette"
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

export function CommandInput({
  className,
  placeholder = undefined,
  ...props
}: React.ComponentProps<typeof AutocompleteInput>): React.ReactElement {
  return (
    <div
      className="relative flex h-12 shrink-0 items-center px-5"
      data-slot="command-input"
    >
      <KitAutocompleteInput
        aria-label="Search commands"
        className={className}
        placeholder={placeholder}
        size="lg"
        profile="command"
        unstyled
        {...props}
      />
      <Separator className="absolute inset-x-0 bottom-0" />
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
  return (
    <KitAutocompleteItem
      className={className}
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
      className={cn("my-2", className)}
      data-slot="command-separator"
      {...props}
    />
  );
}

export function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"kbd">): React.ReactElement {
  return (
    <Kbd
      className={cn("ms-auto", className)}
      data-command-shortcut=""
      {...props}
    />
  );
}

export function CommandFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-between gap-2 px-5 py-3 text-muted-foreground text-xs",
        className,
      )}
      data-slot="command-footer"
      {...props}
    >
      <Separator className="absolute inset-x-0 top-0" />
      {children}
    </div>
  );
}

export { CommandDialogPrimitive };
