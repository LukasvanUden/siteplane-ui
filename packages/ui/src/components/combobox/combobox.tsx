"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import { motion, type Transition } from "motion/react";
import * as React from "react";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { useLayoutTransitionFromCss } from "../../system/motion/use-layout-transition";
import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { ChoiceMenuItemCheck } from "../../system/styles/choice-menu-item";
import {
  formControlSurfaceClassNames,
  type FormControlSurface,
  surfaceClassNames,
} from "../../system/styles/surface";
import { KitInput } from "../input/input-internal";
import { ExternalInputOwner } from "../input/input";
import { Button } from "../button";
import { KitButton } from "../button/button-internal";
import { ScrollArea } from "../scroll-area";

const ComboboxChipMotionContext = React.createContext<{
  transition: Transition;
  reducedMotion: boolean;
}>({
  transition: { layout: { duration: 0 } },
  reducedMotion: false,
});

export const ComboboxContext: React.Context<{
  chipsRef: React.RefObject<Element | null> | null;
  inputRef: React.RefObject<HTMLInputElement | null> | null;
  multiple: boolean;
}> = React.createContext<{
  chipsRef: React.RefObject<Element | null> | null;
  inputRef: React.RefObject<HTMLInputElement | null> | null;
  multiple: boolean;
}>({
  chipsRef: null,
  inputRef: null,
  multiple: false,
});

export function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxPrimitive.Root.Props<Value, Multiple>,
): React.ReactElement {
  const chipsRef = React.useRef<Element | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [resetKey, setResetKey] = React.useState(0);

  React.useEffect(() => {
    if (props.value !== undefined) {
      return;
    }

    const handleReset = (event: Event) => {
      const form = event.target;
      const input = inputRef.current;
      if (
        form instanceof HTMLFormElement &&
        (input?.form === form ||
          (props.form
            ? form.id === props.form
            : Boolean(input && form.contains(input))))
      ) {
        setResetKey((current) => current + 1);
      }
    };

    document.addEventListener("reset", handleReset, true);
    return () => document.removeEventListener("reset", handleReset, true);
  }, [props.form, props.value]);

  return (
    <ComboboxContext.Provider
      value={{ chipsRef, inputRef, multiple: !!props.multiple }}
    >
      <ComboboxPrimitive.Root {...props} key={resetKey} />
    </ComboboxContext.Provider>
  );
}

export function ComboboxChipsInput({
  className,
  ref,
  size,
  ...props
}: Omit<WithStringClassName<ComboboxPrimitive.Input.Props>, "size"> & {
  size?: SiteplaneControlSize | number;
  ref?: React.Ref<HTMLInputElement>;
}): React.ReactElement {
  const visualSize = typeof size === "number" ? undefined : size;
  const nativeSize = typeof size === "number" ? size : undefined;
  const resolvedSize = useResolvedControlSize(visualSize);
  const contextInputRef = React.useContext(ComboboxContext).inputRef;
  const fallbackInputRef = React.useRef<HTMLInputElement | null>(null);
  const inputRef = contextInputRef ?? fallbackInputRef;
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  return (
    <ComboboxPrimitive.Input
      className={cn(
        "min-w-12 flex-1 text-base outline-none sm:text-sm [[data-slot=combobox-chip]+&]:ps-0.5",
        resolvedSize === "sm" ? "ps-1.5" : "ps-2",
        className,
      )}
      data-size={resolvedSize}
      data-slot="combobox-chips-input"
      ref={inputRef}
      size={nativeSize}
      {...props}
    />
  );
}

export type ComboboxInputProfile = "default" | "embedded";

export type ComboboxInputProps = Omit<
  WithStringClassName<ComboboxPrimitive.Input.Props>,
  "render" | "size"
> & {
  showTrigger?: boolean;
  showClear?: boolean;
  startAddon?: React.ReactNode;
  size?: SiteplaneControlSize | number | undefined;
  variant?: FormControlSurface | undefined;
  profile?: ComboboxInputProfile;
  ref?: React.Ref<HTMLInputElement>;
  triggerProps?: WithStringClassName<ComboboxPrimitive.Trigger.Props>;
  clearProps?: WithStringClassName<ComboboxPrimitive.Clear.Props>;
};

export function ComboboxInput({
  className,
  disabled,
  profile = "default",
  ref,
  showTrigger = true,
  showClear = false,
  startAddon,
  size,
  variant = "default",
  triggerProps,
  clearProps,
  ...props
}: ComboboxInputProps): React.ReactElement {
  const visualSize = typeof size === "number" ? undefined : size;
  const nativeSize = typeof size === "number" ? size : undefined;
  const resolvedSize = useResolvedControlSize(visualSize);
  const contextInputRef = React.useContext(ComboboxContext).inputRef;
  const fallbackInputRef = React.useRef<HTMLInputElement | null>(null);
  const inputRef = contextInputRef ?? fallbackInputRef;
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  return (
    <ComboboxPrimitive.InputGroup
      className="relative flex h-fit not-has-[>*.w-full]:w-fit w-full text-foreground"
      data-slot="combobox-input-group"
    >
      {startAddon && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 start-px z-10 flex items-center [&_svg]:-mx-0.5"
          data-slot="combobox-start-addon"
        >
          {startAddon}
        </div>
      )}
      {/* Combobox.Input already connects the input to Field. */}
      <ExternalInputOwner>
        <ComboboxPrimitive.Input
          {...props}
          className={className}
          data-inset-end={showTrigger || showClear ? "" : undefined}
          data-inset-start={startAddon ? "" : undefined}
          data-profile="combobox"
          data-profile-mode={profile}
          data-size={resolvedSize}
          data-slot="combobox-input"
          render={
            <KitInput
              insetEnd={showTrigger || showClear}
              insetStart={Boolean(startAddon)}
              nativeInput
              profile="combobox"
              profileMode={profile}
              size={nativeSize ?? resolvedSize}
              unstyled={profile === "embedded"}
              variant={variant}
            />
          }
          disabled={disabled}
          ref={inputRef}
        />
      </ExternalInputOwner>
      {showTrigger && (
        <ComboboxTrigger
          {...triggerProps}
          aria-label={triggerProps?.["aria-label"] ?? "Show options"}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 has-[+[data-slot=combobox-clear]]:hidden",
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
          <ComboboxPrimitive.Icon data-slot="combobox-icon">
            <ChevronsUpDownIcon className="size-4" />
          </ComboboxPrimitive.Icon>
        </ComboboxTrigger>
      )}
      {showClear && (
        <ComboboxClear
          {...clearProps}
          aria-label={clearProps?.["aria-label"] ?? "Clear selection"}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 has-[+[data-slot=combobox-clear]]:hidden",
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
        </ComboboxClear>
      )}
    </ComboboxPrimitive.InputGroup>
  );
}

export function ComboboxTrigger({
  className,
  children,
  render,
  ...props
}: WithStringClassName<ComboboxPrimitive.Trigger.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.Trigger
      className={className}
      data-slot="combobox-trigger"
      render={
        render ?? (
          <Button profile="field-action" shape="square" variant="ghost" />
        )
      }
      {...props}
    >
      {children}
    </ComboboxPrimitive.Trigger>
  );
}

export function ComboboxPopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  alignOffset,
  align = "start",
  anchor: anchorProp,
  portalProps,
  ...props
}: WithStringClassName<ComboboxPrimitive.Popup.Props> & {
  align?: ComboboxPrimitive.Positioner.Props["align"];
  sideOffset?: ComboboxPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: ComboboxPrimitive.Positioner.Props["alignOffset"];
  side?: ComboboxPrimitive.Positioner.Props["side"];
  anchor?: ComboboxPrimitive.Positioner.Props["anchor"];
  portalProps?: WithStringClassName<ComboboxPrimitive.Portal.Props>;
}): React.ReactElement {
  const { chipsRef, multiple } = React.useContext(ComboboxContext);
  const anchor = anchorProp ?? (multiple ? chipsRef : undefined);

  return (
    <ComboboxPrimitive.Portal {...portalProps}>
      <SiteplaneUIPortalScope>
        <ComboboxPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          className="z-50 select-none"
          data-slot="combobox-positioner"
          side={side}
          sideOffset={sideOffset}
        >
          <ComboboxPrimitive.Popup
            className={cn(
              surfaceClassNames.floatingOverlay,
              "flex max-h-[min(var(--available-height),23rem)] min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) flex-col overflow-hidden rounded-lg text-foreground before:rounded-[inherit]",
              className,
            )}
            data-slot="combobox-popup"
            {...props}
          >
            {children}
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </ComboboxPrimitive.Portal>
  );
}

export function ComboboxItem({
  className,
  children,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: WithStringClassName<ComboboxPrimitive.Item.Props>): React.ReactElement {
  const touchPointerRef = React.useRef<{
    id: number;
    moved: boolean;
    x: number;
    y: number;
  } | null>(null);

  return (
    <ComboboxPrimitive.Item
      className={cn(
        "grid min-h-(--anchor-height) in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1 ps-2 pe-4 text-base outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-(--sp-rw-disabled-opacity-action) sm:text-sm [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        // Rulebook I5: the check sits on the first line of a text label that
        // wraps. The row's one track is centred in the min-height, so a
        // one-line label stays centred, and the check's box is one line high.
        // A label that leads with an avatar or an icon keeps the row centre.
        "[&:not(:has(>[data-slot=combobox-item-label]>*))]:content-center [&:not(:has(>[data-slot=combobox-item-label]>*))]:items-start",
        className,
      )}
      data-slot="combobox-item"
      onPointerCancel={(event) => {
        touchPointerRef.current = null;
        onPointerCancel?.(event);
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") {
          touchPointerRef.current = {
            id: event.pointerId,
            moved: false,
            x: event.clientX,
            y: event.clientY,
          };
        }
        onPointerDown?.(event);
      }}
      onPointerMove={(event) => {
        const pointer = touchPointerRef.current;
        if (
          pointer?.id === event.pointerId &&
          (Math.abs(event.clientX - pointer.x) > 8 ||
            Math.abs(event.clientY - pointer.y) > 8)
        ) {
          pointer.moved = true;
        }
        onPointerMove?.(event);
      }}
      onPointerUp={(event) => {
        const pointer = touchPointerRef.current;
        touchPointerRef.current = null;
        onPointerUp?.(event);

        if (pointer?.id !== event.pointerId || pointer.moved) {
          return;
        }

        const item = event.currentTarget;
        let nativeClickFired = false;
        const markNativeClick = () => {
          nativeClickFired = true;
        };
        item.addEventListener("click", markNativeClick, { once: true });
        window.setTimeout(() => {
          item.removeEventListener("click", markNativeClick);
          if (!nativeClickFired && item.isConnected) {
            item.click();
          }
        });
      }}
      {...props}
    >
      <ComboboxPrimitive.ItemIndicator
        className="col-start-1 flex min-h-lh items-center"
        data-slot="combobox-item-indicator"
        keepMounted
      >
        <ChoiceMenuItemCheck />
      </ComboboxPrimitive.ItemIndicator>
      <div
        className="col-start-2 flex min-w-0 items-center gap-2"
        data-slot="combobox-item-label"
      >
        {children}
      </div>
    </ComboboxPrimitive.Item>
  );
}

export function ComboboxSeparator({
  className,
  ...props
}: WithStringClassName<ComboboxPrimitive.Separator.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.Separator
      className={cn("mx-2 my-1 h-px bg-border last:hidden", className)}
      data-slot="combobox-separator"
      {...props}
    />
  );
}

export function ComboboxGroup({
  className,
  ...props
}: WithStringClassName<ComboboxPrimitive.Group.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.Group
      className={cn("[[role=group]+&]:mt-1.5", className)}
      data-slot="combobox-group"
      {...props}
    />
  );
}

export function ComboboxGroupLabel({
  className,
  ...props
}: WithStringClassName<ComboboxPrimitive.GroupLabel.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.GroupLabel
      className={cn(
        "px-2 py-1.5 font-medium text-muted-foreground text-xs",
        className,
      )}
      data-slot="combobox-group-label"
      {...props}
    />
  );
}

export function ComboboxEmpty({
  className,
  ...props
}: WithStringClassName<ComboboxPrimitive.Empty.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.Empty
      className={cn(
        "not-empty:p-2 text-center text-base text-muted-foreground sm:text-sm",
        className,
      )}
      data-slot="combobox-empty"
      {...props}
    />
  );
}

export function ComboboxRow({
  className,
  ...props
}: WithStringClassName<ComboboxPrimitive.Row.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.Row
      className={className}
      data-slot="combobox-row"
      {...props}
    />
  );
}

export function ComboboxValue({
  ...props
}: ComboboxPrimitive.Value.Props): React.ReactElement {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

export function ComboboxList({
  className,
  ...props
}: WithStringClassName<ComboboxPrimitive.List.Props>): React.ReactElement {
  return (
    <ScrollArea
      className="grid h-auto min-h-0 flex-1 overflow-hidden [&>[data-slot=scroll-area-viewport]]:h-auto [&>[data-slot=scroll-area-viewport]]:min-h-0"
      scrollbarGutter
      scrollFade
    >
      <ComboboxPrimitive.List
        className={cn(
          "not-empty:scroll-py-1 not-empty:px-1 not-empty:py-1 in-data-has-overflow-y:pe-3",
          className,
        )}
        data-slot="combobox-list"
        {...props}
      />
    </ScrollArea>
  );
}

export function ComboboxClear({
  className,
  render,
  ...props
}: WithStringClassName<ComboboxPrimitive.Clear.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.Clear
      className={className}
      data-slot="combobox-clear"
      render={
        render ?? (
          <Button profile="field-action" shape="square" variant="ghost" />
        )
      }
      {...props}
    />
  );
}

export function ComboboxStatus({
  className,
  ...props
}: WithStringClassName<ComboboxPrimitive.Status.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.Status
      className={cn(
        "px-3 py-2 font-medium text-muted-foreground text-xs empty:m-0 empty:p-0",
        className,
      )}
      data-slot="combobox-status"
      {...props}
    />
  );
}

export function ComboboxCollection(
  props: ComboboxPrimitive.Collection.Props,
): React.ReactElement {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

export function ComboboxChips({
  className,
  children,
  startAddon,
  variant = "default",
  layout = "input",
  ...props
}: WithStringClassName<ComboboxPrimitive.Chips.Props> & {
  startAddon?: React.ReactNode;
  variant?: FormControlSurface;
  layout?: "input" | "standalone";
}): React.ReactElement {
  const { chipsRef } = React.useContext(ComboboxContext);
  const chipMotion = useLayoutTransitionFromCss(
    chipsRef,
    "--motion-duration-expand",
    "--motion-ease-standard",
  );

  return (
    <ComboboxChipMotionContext.Provider value={chipMotion}>
      <ComboboxPrimitive.Chips
        className={cn(
          layout === "input" && formControlSurfaceClassNames[variant],
          "relative inline-flex w-full flex-wrap outline-none has-disabled:pointer-events-none",
          className,
        )}
        data-slot="combobox-chips"
        data-layout={layout}
        data-variant={variant}
        ref={chipsRef as React.Ref<HTMLDivElement> | null}
        {...props}
      >
        {startAddon && (
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center ps-2 opacity-80 has-[~[data-size=sm]]:has-[+[data-slot=combobox-chip]]:pe-1.5 has-[~[data-size=sm]]:ps-1.5 has-[+[data-slot=combobox-chip]]:pe-2 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-ms-0.5 [&_svg]:-me-1.5"
            data-slot="combobox-start-addon"
          >
            {startAddon}
          </div>
        )}
        {children}
      </ComboboxPrimitive.Chips>
    </ComboboxChipMotionContext.Provider>
  );
}

export function ComboboxChip({
  children,
  removeProps,
  render,
  startAddon,
  ...props
}: WithStringClassName<ComboboxPrimitive.Chip.Props> & {
  removeProps?: WithStringClassName<ComboboxPrimitive.ChipRemove.Props>;
  /**
   * A small decorative avatar or icon before the value, such as the portrait of
   * a person. The chip starts closer to its edge when it has one.
   */
  startAddon?: React.ReactNode;
}): React.ReactElement {
  const { transition, reducedMotion } = React.useContext(
    ComboboxChipMotionContext,
  );
  // The remove action is named "Remove" and the chip's value, such as
  // "Remove Mara Ellis", so each one in a row of chips is distinct.
  const labelId = React.useId();
  const removeId = React.useId();

  return (
    <ComboboxPrimitive.Chip
      className="flex min-w-0 max-w-full items-center outline-none"
      data-slot="combobox-chip"
      render={
        render ?? (
          <motion.div
            layout={reducedMotion ? false : "position"}
            transition={transition}
          />
        )
      }
      {...props}
    >
      {startAddon && (
        <span
          aria-hidden="true"
          className="me-1 flex shrink-0 items-center [&_svg:not([class*='size-'])]:size-3.5"
          data-slot="combobox-chip-start-addon"
        >
          {startAddon}
        </span>
      )}
      {/* A long value ends in an ellipsis on the chip's one line instead of
          wrapping out of its fixed height (rulebook K5). */}
      <span
        className="min-w-0 truncate"
        data-slot="combobox-chip-label"
        id={labelId}
      >
        {children}
      </span>
      <ComboboxChipRemove
        aria-labelledby={`${removeId} ${labelId}`}
        id={removeId}
        {...removeProps}
      />
    </ComboboxPrimitive.Chip>
  );
}

export function ComboboxChipRemove({
  render,
  ...props
}: WithStringClassName<ComboboxPrimitive.ChipRemove.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.ChipRemove
      aria-label="Remove"
      className="me-0.5 shrink-0"
      data-slot="combobox-chip-remove"
      render={
        render ?? (
          <KitButton profile="chip-remove" size="icon-2xs" variant="text" />
        )
      }
      {...props}
    >
      <XIcon className="size-3" />
    </ComboboxPrimitive.ChipRemove>
  );
}

export const useComboboxFilter: typeof ComboboxPrimitive.useFilter =
  ComboboxPrimitive.useFilter;

export { ComboboxPrimitive };
