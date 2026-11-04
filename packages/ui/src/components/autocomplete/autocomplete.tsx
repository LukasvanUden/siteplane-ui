"use client";

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { CaretUpDownIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";
import { useFormReset } from "../../system/form/use-form-reset";
import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";

import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  type FormControlVariant,
  surfaceClassNames,
} from "../../system/styles/surface";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
import { Button } from "../button";
import { Separator } from "../separator";
import { Input } from "../input";
import { KitInput } from "../input/input-internal";
import { ExternalInputOwner } from "../input/input";
import { PopupListMotion } from "../motion/motion-follow";
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
  variant?: FormControlVariant | undefined;
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
    style,
    unstyled = false,
    profile = "combobox",
    variant = "default",
    triggerProps,
    clearProps,
    ...props
  } = inputProps as KitAutocompleteInputProps;
  const messages = useSiteplaneMessages("autocomplete");
  const visualSize = typeof size === "number" ? undefined : size;
  const nativeSize = typeof size === "number" ? size : undefined;
  const resolvedSize = useResolvedControlSize(visualSize);

  return (
    <AutocompletePrimitive.InputGroup
      // The field fills its container, like Input. The group is the field's
      // root: it takes `className` and `style`, as every field does (Lukas,
      // 4 November 2026), so a margin moves the input and the parts beside it
      // together.
      className={cn(
        "sp-autocomplete-input-group sp-field-scale relative w-full min-w-0 text-foreground",
        className,
      )}
      // The group is on the field scale of its size, so the parts beside the
      // input take the field's inline padding and icon, as in a Combobox
      // (design-rework.css).
      data-size={resolvedSize}
      data-slot="autocomplete-input-group"
      style={style}
    >
      {startAddon && (
        <div
          aria-hidden="true"
          className="sp-autocomplete-start-addon pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center"
          data-slot="autocomplete-start-addon"
        >
          {startAddon}
        </div>
      )}
      {/* Autocomplete.Input already connects the input to Field. */}
      <ExternalInputOwner>
        <AutocompletePrimitive.Input
          className={slotClass("autocomplete-input", props)}
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
          aria-label={triggerProps?.["aria-label"] ?? messages.showSuggestions}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 has-[+[data-slot=autocomplete-clear]]:hidden",
            triggerProps?.className,
          )}
          disabled={disabled || triggerProps?.disabled}
          render={
            triggerProps?.render ?? (
              <Button profile="field-action" shape="square" variant="ghost" />
            )
          }
        >
          <AutocompletePrimitive.Icon
            aria-hidden="true"
            className="sp-autocomplete-icon"
            data-slot="autocomplete-icon"
          >
            <CaretUpDownIcon aria-hidden="true" />
          </AutocompletePrimitive.Icon>
        </AutocompleteTrigger>
      )}
      {showClear && (
        <AutocompleteClear
          {...clearProps}
          aria-label={clearProps?.["aria-label"] ?? messages.clear}
          // The field's place for its actions replaces AutocompleteClear's own
          // end-0.5 in the merge, so the clear sits where the trigger does.
          className={cn(
            "absolute end-(--sp-rw-field-action-end) top-1/2 -translate-y-1/2 has-[+[data-slot=autocomplete-clear]]:hidden",
            clearProps?.className,
          )}
          disabled={disabled || clearProps?.disabled}
          render={
            clearProps?.render ?? (
              <Button profile="field-action" shape="square" variant="ghost" />
            )
          }
        >
          <XIcon aria-hidden="true" />
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
          className="sp-autocomplete-positioner z-50 select-none"
          data-slot="autocomplete-positioner"
          side={side}
          sideOffset={sideOffset}
        >
          <AutocompletePrimitive.Popup
            className={cn(
              slotClass("autocomplete-popup", props),
              surfaceClassNames.floatingOverlay,
              // Its surface, text and cap are the popup rules of
              // design-rework.css that Select and Combobox share.
              "flex min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) flex-col before:rounded-[inherit]",
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
        slotClass("autocomplete-item", props),
        baseClass("autocomplete-item", props),
        "flex select-none items-center outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
        // An Autocomplete option takes a Select option's sizes, its icons
        // included (design-rework.css); a Command row keeps its own icon
        // sizes. The colour of the icons is the one rule of every list row,
        // tertiary and primary while highlighted (design-rework.css).
        profile === "command" &&
          "[&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4",
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
      className={cn(
        slotClass("autocomplete-separator", props),
        "last:hidden",
        className,
      )}
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
      className={cn(
        slotClass("autocomplete-group", props),
        "[[role=group]+&]:mt-1.5",
        className,
      )}
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
      className={cn(slotClass("autocomplete-group-label", props), className)}
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
        slotClass("autocomplete-empty", props),
        "not-empty:p-2 text-center text-muted-foreground",
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
      className={cn(slotClass("autocomplete-row", props), className)}
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
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();
  const filtered = AutocompletePrimitive.useFilteredItems();
  return (
    <>
      <ScrollArea
        ref={scrollAreaRef}
        scrollbarGutter
        scrollFade
        // The input holds the focus and the arrow keys move through the
        // options, so the list is no tab stop between the input and the rest
        // of the popup.
        tabbable={false}
      >
        <AutocompletePrimitive.List
          className={cn(
            slotClass("autocomplete-list", props),
            "not-empty:scroll-py-1 not-empty:p-1",
            className,
          )}
          data-slot="autocomplete-list"
          {...props}
        />
      </ScrollArea>
      {/* An option that the search takes out of the list fades and closes
          its row, the rows below glide, and the popup, or the Command's
          panel, follows its height, as in every list of a popup that filters
          (rulebook M6, M7). */}
      <PopupListMotion
        change={[filtered, props.children]}
        reduced={reduced}
        scrollArea={() => scrollAreaRef.current}
      />
    </>
  );
}

export function AutocompleteClear({
  className,
  render,
  ...props
}: WithStringClassName<AutocompletePrimitive.Clear.Props>): React.ReactElement {
  return (
    <AutocompletePrimitive.Clear
      className={cn(
        slotClass("autocomplete-clear", props, render),
        "absolute end-0.5 top-1/2 -translate-y-1/2",
        className,
      )}
      data-slot="autocomplete-clear"
      render={
        render ?? (
          <Button profile="field-action" shape="square" variant="ghost" />
        )
      }
      {...props}
    >
      <XIcon aria-hidden="true" />
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
        slotClass("autocomplete-status", props),
        "px-3 py-2 font-(--sp-rw-font-weight-label) text-muted-foreground text-xs empty:m-0 empty:p-0",
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
      className={cn(
        slotClass("autocomplete-trigger", props, render),
        className,
      )}
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
