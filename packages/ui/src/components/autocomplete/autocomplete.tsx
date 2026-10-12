"use client";

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import * as React from "react";
import { useFormReset } from "../../system/form/use-form-reset";

import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  type FormControlSurface,
  surfaceClassNames,
} from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { Button } from "../button";
import { Separator } from "../separator";
import { Input } from "../input";
import { KitInput } from "../input/input-internal";
import { ExternalInputOwner } from "../input/input";
import { ScrollArea } from "../scroll-area";
import type {
  KitAutocompleteInputProps,
  KitAutocompleteItemProps,
} from "./autocomplete-internal";

export const Autocomplete: typeof AutocompletePrimitive.Root = <ItemValue,>(
  props: Omit<AutocompletePrimitive.Root.Props<ItemValue>, "items"> & {
    items?: readonly ItemValue[] | undefined;
  },
) => {
  const [resetKey, setResetKey] = React.useState(0);
  const markerRef = useFormReset<HTMLInputElement>(props.form, () => {
    if (props.value === undefined) setResetKey((current) => current + 1);
  });
  return (
    <>
      <AutocompletePrimitive.Root {...props} key={resetKey} />
      <Input
        aria-hidden="true"
        disabled
        form={props.form}
        ref={markerRef}
        type="hidden"
      />
    </>
  );
};

type AutocompleteInputProps = Omit<
  WithStringClassName<AutocompletePrimitive.Input.Props>,
  "size"
> & {
  showTrigger?: boolean;
  showClear?: boolean;
  startAddon?: React.ReactNode;
  size?: SiteplaneControlSize | number | undefined;
  variant?: FormControlSurface | undefined;
  unstyled?: boolean;
  ref?: React.Ref<HTMLInputElement>;
  triggerProps?: WithStringClassName<AutocompletePrimitive.Trigger.Props>;
  clearProps?: WithStringClassName<AutocompletePrimitive.Clear.Props>;
};

export function AutocompleteInput(
  inputProps: AutocompleteInputProps,
): React.ReactElement {
  // Command passes the internal command profile through
  // KitAutocompleteInput (autocomplete-internal.ts), the same function.
  const {
    className,
    disabled,
    showTrigger = false,
    showClear = false,
    startAddon,
    size,
    unstyled = false,
    profile = "combobox",
    variant = "default",
    triggerProps,
    clearProps,
    ...props
  } = inputProps as KitAutocompleteInputProps;
  const visualSize = typeof size === "number" ? undefined : size;
  const nativeSize = typeof size === "number" ? size : undefined;
  const resolvedSize = useResolvedControlSize(visualSize);

  return (
    <AutocompletePrimitive.InputGroup
      className={cn(
        "relative w-full min-w-0 text-foreground",
        profile !== "command" && "not-has-[>*.w-full]:w-fit",
      )}
      data-slot="autocomplete-input-group"
    >
      {startAddon && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 start-px z-10 flex items-center [&_svg]:-mx-0.5"
          data-slot="autocomplete-start-addon"
        >
          {startAddon}
        </div>
      )}
      {/* Autocomplete.Input already connects the input to Field. */}
      <ExternalInputOwner>
        <AutocompletePrimitive.Input
          className={className}
          data-inset-end={showTrigger || showClear ? "" : undefined}
          data-inset-start={startAddon ? "" : undefined}
          data-size={resolvedSize}
          data-slot="autocomplete-input"
          render={
            <KitInput
              insetEnd={showTrigger || showClear}
              insetStart={Boolean(startAddon)}
              nativeInput
              profile={profile}
              size={nativeSize ?? resolvedSize}
              unstyled={unstyled}
              variant={variant}
            />
          }
          disabled={disabled}
          {...props}
        />
      </ExternalInputOwner>
      {showTrigger && (
        <AutocompleteTrigger
          {...triggerProps}
          aria-label={triggerProps?.["aria-label"] ?? "Show suggestions"}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 has-[+[data-slot=autocomplete-clear]]:hidden",
            triggerProps?.className,
          )}
          disabled={disabled || triggerProps?.disabled}
          render={
            triggerProps?.render ?? (
              <Button
                profile="field-action"
                size={resolvedSize === "xl" ? "icon-sm" : "icon-xs"}
                variant="ghost"
              />
            )
          }
        >
          <AutocompletePrimitive.Icon data-slot="autocomplete-icon">
            <ChevronsUpDownIcon className="size-4" />
          </AutocompletePrimitive.Icon>
        </AutocompleteTrigger>
      )}
      {showClear && (
        <AutocompleteClear
          {...clearProps}
          aria-label={clearProps?.["aria-label"] ?? "Clear input"}
          // end-1 replaces AutocompleteClear's own end-0.5 in the merge, so
          // the clear sits 4 px in, like the trigger.
          className={cn(
            "absolute end-1 top-1/2 -translate-y-1/2 has-[+[data-slot=autocomplete-clear]]:hidden",
            clearProps?.className,
          )}
          disabled={disabled || clearProps?.disabled}
          render={
            clearProps?.render ?? (
              <Button
                profile="field-action"
                size={resolvedSize === "xl" ? "icon-sm" : "icon-xs"}
                variant="ghost"
              />
            )
          }
        >
          <XIcon className="size-3" />
        </AutocompleteClear>
      )}
    </AutocompletePrimitive.InputGroup>
  );
}

export function AutocompletePopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  alignOffset,
  align = "start",
  anchor,
  portalProps,
  ...props
}: WithStringClassName<AutocompletePrimitive.Popup.Props> & {
  align?: AutocompletePrimitive.Positioner.Props["align"];
  sideOffset?: AutocompletePrimitive.Positioner.Props["sideOffset"];
  alignOffset?: AutocompletePrimitive.Positioner.Props["alignOffset"];
  side?: AutocompletePrimitive.Positioner.Props["side"];
  anchor?: AutocompletePrimitive.Positioner.Props["anchor"];
  portalProps?: WithStringClassName<AutocompletePrimitive.Portal.Props>;
}): React.ReactElement {
  return (
    <AutocompletePrimitive.Portal {...portalProps}>
      <SiteplaneUIPortalScope>
        <AutocompletePrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          className="z-50 select-none"
          data-slot="autocomplete-positioner"
          side={side}
          sideOffset={sideOffset}
        >
          <AutocompletePrimitive.Popup
            className={cn(
              surfaceClassNames.floatingOverlay,
              "flex max-h-[min(var(--available-height),23rem)] min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) flex-col text-foreground before:rounded-[inherit]",
              className,
            )}
            data-slot="autocomplete-popup"
            {...props}
          >
            {children}
          </AutocompletePrimitive.Popup>
        </AutocompletePrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </AutocompletePrimitive.Portal>
  );
}

export function AutocompleteItem(
  itemProps: WithStringClassName<AutocompletePrimitive.Item.Props>,
): React.ReactElement {
  // Command passes the internal command profile through KitAutocompleteItem
  // (autocomplete-internal.ts), the same function.
  const {
    profile = "default",
    className,
    children,
    ...props
  } = itemProps as KitAutocompleteItemProps;
  return (
    <AutocompletePrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center outline-none data-disabled:pointer-events-none data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        // Rulebook I5: a leading icon sits on the first line of a label that
        // wraps. Such a row lays out as one grid track centred in the
        // min-height, so a one-line label stays centred, and the icon's box
        // is one line high. Command items share it; the command profile puts
        // their shortcut on the first line too.
        "has-[>svg:first-child]:grid has-[>svg:first-child]:auto-cols-[auto_minmax(0,1fr)] has-[>svg:first-child]:grid-flow-col has-[>svg:first-child]:content-center has-[>svg:first-child]:items-start [&>svg:first-child]:min-h-lh",
        className,
      )}
      data-foundation="autocomplete-item"
      data-profile={profile}
      data-slot="autocomplete-item"
      {...props}
    >
      {children}
    </AutocompletePrimitive.Item>
  );
}

export function AutocompleteSeparator({
  className,
  ...props
}: WithStringClassName<AutocompletePrimitive.Separator.Props>): React.ReactElement {
  return (
    <AutocompletePrimitive.Separator
      className={cn("mx-2 my-1 last:hidden", className)}
      data-slot="autocomplete-separator"
      render={<Separator />}
      {...props}
    />
  );
}

export function AutocompleteGroup({
  className,
  ...props
}: WithStringClassName<AutocompletePrimitive.Group.Props>): React.ReactElement {
  return (
    <AutocompletePrimitive.Group
      className={cn("[[role=group]+&]:mt-1.5", className)}
      data-slot="autocomplete-group"
      {...props}
    />
  );
}

export function AutocompleteGroupLabel({
  className,
  ...props
}: WithStringClassName<AutocompletePrimitive.GroupLabel.Props>): React.ReactElement {
  return (
    <AutocompletePrimitive.GroupLabel
      className={cn(
        "px-2 py-1.5 font-medium text-muted-foreground text-xs",
        className,
      )}
      data-slot="autocomplete-group-label"
      {...props}
    />
  );
}

export function AutocompleteEmpty({
  className,
  ...props
}: WithStringClassName<AutocompletePrimitive.Empty.Props>): React.ReactElement {
  return (
    <AutocompletePrimitive.Empty
      className={cn(
        "not-empty:p-2 text-center text-base text-muted-foreground sm:text-sm",
        className,
      )}
      data-slot="autocomplete-empty"
      {...props}
    />
  );
}

export function AutocompleteRow({
  className,
  ...props
}: WithStringClassName<AutocompletePrimitive.Row.Props>): React.ReactElement {
  return (
    <AutocompletePrimitive.Row
      className={className}
      data-slot="autocomplete-row"
      {...props}
    />
  );
}

export function AutocompleteValue({
  ...props
}: AutocompletePrimitive.Value.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Value data-slot="autocomplete-value" {...props} />
  );
}

export function AutocompleteList({
  className,
  ...props
}: WithStringClassName<AutocompletePrimitive.List.Props>): React.ReactElement {
  return (
    <ScrollArea scrollbarGutter scrollFade>
      <AutocompletePrimitive.List
        className={cn(
          "not-empty:scroll-py-1 not-empty:p-1 in-data-has-overflow-y:pe-3",
          className,
        )}
        data-slot="autocomplete-list"
        {...props}
      />
    </ScrollArea>
  );
}

export function AutocompleteClear({
  className,
  render,
  ...props
}: WithStringClassName<AutocompletePrimitive.Clear.Props>): React.ReactElement {
  return (
    <AutocompletePrimitive.Clear
      className={cn("absolute end-0.5 top-1/2 -translate-y-1/2", className)}
      data-slot="autocomplete-clear"
      render={
        render ?? (
          <Button profile="field-action" shape="square" variant="ghost" />
        )
      }
      {...props}
    >
      <XIcon className="size-3" />
    </AutocompletePrimitive.Clear>
  );
}

export function AutocompleteStatus({
  className,
  ...props
}: WithStringClassName<AutocompletePrimitive.Status.Props>): React.ReactElement {
  return (
    <AutocompletePrimitive.Status
      className={cn(
        "px-3 py-2 font-medium text-muted-foreground text-xs empty:m-0 empty:p-0",
        className,
      )}
      data-slot="autocomplete-status"
      {...props}
    />
  );
}

export function AutocompleteCollection({
  ...props
}: AutocompletePrimitive.Collection.Props): React.ReactElement {
  return (
    <AutocompletePrimitive.Collection
      data-slot="autocomplete-collection"
      {...props}
    />
  );
}

export function AutocompleteTrigger({
  className,
  children,
  render,
  ...props
}: WithStringClassName<AutocompletePrimitive.Trigger.Props>): React.ReactElement {
  return (
    <AutocompletePrimitive.Trigger
      className={className}
      data-slot="autocomplete-trigger"
      render={
        render ?? (
          <Button profile="field-action" shape="square" variant="ghost" />
        )
      }
      {...props}
    >
      {children}
    </AutocompletePrimitive.Trigger>
  );
}

export const useAutocompleteFilter: typeof AutocompletePrimitive.useFilter =
  AutocompletePrimitive.useFilter;

export { AutocompletePrimitive };
