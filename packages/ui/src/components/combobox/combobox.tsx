"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import * as React from "react";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass, withClass } from "../../system/utils/slot-class";
import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  ChoiceMenuItemCheck,
  choiceMenuItemEndGridClassName,
  choiceMenuItemEndLabelClassName,
  menuRowLabel,
} from "../../system/styles/choice-menu-item";
import {
  formControlSurfaceClassNames,
  type FormControlSurface,
  surfaceClassNames,
} from "../../system/styles/surface";
import { KitInput } from "../input/input-internal";
import { ExternalInputOwner } from "../input/input";
import { Button } from "../button";
import { KitButton } from "../button/button-internal";
import { GlideOnChange, motionGhostAttribute } from "../motion/motion-presence";
import { ScrollArea } from "../scroll-area";

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

/**
 * The control size of the Combobox's input, ComboboxChipsInput's or
 * ComboboxInput's. A popup anchored to a chips field sizes its items by it,
 * because the field grows a row for each line of chips (FB-9). Internal, beside
 * the public ComboboxContext.
 */
const ComboboxInputSizeContext = React.createContext<{
  size: SiteplaneControlSize | undefined;
  setSize: React.Dispatch<
    React.SetStateAction<SiteplaneControlSize | undefined>
  >;
} | null>(null);

/** Gives the Combobox the resolved control size of its input. */
function useComboboxInputSize(size: SiteplaneControlSize) {
  const setSize = React.useContext(ComboboxInputSizeContext)?.setSize;
  React.useLayoutEffect(() => {
    if (!setSize) return;
    setSize(size);
    return () => setSize((current) => (current === size ? undefined : current));
  }, [setSize, size]);
}

export function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxPrimitive.Root.Props<Value, Multiple>,
): React.ReactElement {
  const chipsRef = React.useRef<Element | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [inputSize, setInputSize] = React.useState<SiteplaneControlSize>();
  const inputSizeValue = React.useMemo(
    () => ({ size: inputSize, setSize: setInputSize }),
    [inputSize],
  );
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
      <ComboboxInputSizeContext.Provider value={inputSizeValue}>
        <ComboboxPrimitive.Root {...props} key={resetKey} />
      </ComboboxInputSizeContext.Provider>
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
  useComboboxInputSize(resolvedSize);
  const contextInputRef = React.useContext(ComboboxContext).inputRef;
  const fallbackInputRef = React.useRef<HTMLInputElement | null>(null);
  const inputRef = contextInputRef ?? fallbackInputRef;
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  return (
    <ComboboxPrimitive.Input
      className={cn(
        slotClass("combobox-chips-input", props),
        "min-w-12 flex-1 outline-none [[data-slot=combobox-chip]+&]:ps-0.5",
        // An xl field writes in 16 px, as an xl Input does.
        resolvedSize === "xl" ? "text-base" : "text-base sm:text-sm",
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
  useComboboxInputSize(resolvedSize);
  const contextInputRef = React.useContext(ComboboxContext).inputRef;
  const fallbackInputRef = React.useRef<HTMLInputElement | null>(null);
  const inputRef = contextInputRef ?? fallbackInputRef;
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  return (
    <ComboboxPrimitive.InputGroup
      className="sp-combobox-input-group relative flex h-fit not-has-[>*.w-full]:w-fit w-full text-foreground"
      data-slot="combobox-input-group"
    >
      {startAddon && (
        <div
          aria-hidden="true"
          className="sp-combobox-start-addon pointer-events-none absolute inset-y-0 start-px z-10 flex items-center [&_svg]:-mx-0.5"
          data-slot="combobox-start-addon"
        >
          {startAddon}
        </div>
      )}
      {/* Combobox.Input already connects the input to Field. */}
      <ExternalInputOwner>
        <ComboboxPrimitive.Input
          {...props}
          className={cn("sp-combobox-input", className)}
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
          <ComboboxPrimitive.Icon
            className="sp-combobox-icon"
            data-slot="combobox-icon"
          >
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
      className={cn(slotClass("combobox-trigger", props, render), className)}
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
  // An item is as tall as the one-line field the popup anchors to (the item
  // rule in design-rework.css). A chips field grows a row for each line of
  // chips, so a popup anchored to it names the control size of its input
  // instead, and its items take that size's height (FB-9).
  const contextSize = useResolvedControlSize(undefined);
  const inputSize = React.useContext(ComboboxInputSizeContext)?.size;
  const itemSize =
    anchorProp === undefined && multiple
      ? (inputSize ?? contextSize)
      : undefined;

  return (
    <ComboboxPrimitive.Portal {...portalProps}>
      <SiteplaneUIPortalScope>
        <ComboboxPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          className="sp-combobox-positioner z-50 select-none"
          data-slot="combobox-positioner"
          side={side}
          sideOffset={sideOffset}
        >
          <ComboboxPrimitive.Popup
            className={cn(
              slotClass("combobox-popup", props),
              surfaceClassNames.floatingOverlay,
              "flex max-h-[min(var(--available-height),23rem)] min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) flex-col overflow-hidden rounded-lg text-foreground before:rounded-[inherit]",
              className,
            )}
            data-item-size={itemSize}
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
  indicatorPosition = "start",
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: WithStringClassName<ComboboxPrimitive.Item.Props> & {
  /**
   * Where the item shows its check: in the leading slot (`start`), or at the
   * end of the row (`end`) for identity rows that lead with an avatar or a
   * logo, such as the people of an assignee picker.
   */
  indicatorPosition?: "start" | "end" | undefined;
}): React.ReactElement {
  const touchPointerRef = React.useRef<{
    id: number;
    moved: boolean;
    x: number;
    y: number;
  } | null>(null);
  // An identity row is the end-indicator radio row of the menus (rulebook I8):
  // it takes their grid and label, so its avatar or logo leads in the check's
  // slot, a row of text alone keeps that slot, and the label keeps one line.
  // The check keeps its 8 px inset, now from the end edge.
  const end = indicatorPosition === "end";
  const indicator = (
    <ComboboxPrimitive.ItemIndicator
      className={cn(
        "sp-combobox-item-indicator",
        end ? "col-start-2" : "col-start-1",
        "flex min-h-lh items-center",
      )}
      data-slot="combobox-item-indicator"
      keepMounted
    >
      <ChoiceMenuItemCheck />
    </ComboboxPrimitive.ItemIndicator>
  );
  const label = end ? (
    <div
      className={cn("sp-combobox-item-label", choiceMenuItemEndLabelClassName)}
      data-slot="combobox-item-label"
    >
      {menuRowLabel(children)}
    </div>
  ) : (
    <div
      className="sp-combobox-item-label col-start-2 flex min-w-0 items-center gap-2"
      data-slot="combobox-item-label"
    >
      {children}
    </div>
  );

  return (
    <ComboboxPrimitive.Item
      className={cn(
        slotClass("combobox-item", props),
        "grid in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] cursor-pointer items-center gap-2 rounded-sm py-1 ps-2 text-base outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-(--sp-rw-disabled-opacity-action) sm:text-sm [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        end
          ? cn(choiceMenuItemEndGridClassName, "pe-2")
          : "grid-cols-[1rem_1fr] pe-4",
        // Rulebook I5: the check sits on the first line of a text label that
        // wraps. The row's one track is centred in the min-height, so a
        // one-line label stays centred, and the check's box is one line high.
        // A label that leads with an avatar or an icon keeps the row centre,
        // and so does a check at the end of the row.
        !end &&
          "[&:not(:has(>[data-slot=combobox-item-label]>*))]:content-center [&:not(:has(>[data-slot=combobox-item-label]>*))]:items-start",
        className,
      )}
      data-indicator-position={end ? "end" : undefined}
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
      {end ? label : indicator}
      {end ? indicator : label}
    </ComboboxPrimitive.Item>
  );
}

export function ComboboxSeparator({
  className,
  ...props
}: WithStringClassName<ComboboxPrimitive.Separator.Props>): React.ReactElement {
  return (
    <ComboboxPrimitive.Separator
      className={cn(
        slotClass("combobox-separator", props),
        "mx-2 my-1 h-px bg-border last:hidden",
        className,
      )}
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
      className={cn(
        slotClass("combobox-group", props),
        "[[role=group]+&]:mt-1.5",
        className,
      )}
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
        slotClass("combobox-group-label", props),
        "px-2 py-1.5 font-(--sp-rw-font-weight-label) text-muted-foreground text-xs",
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
        slotClass("combobox-empty", props),
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
      className={cn(slotClass("combobox-row", props), className)}
      data-slot="combobox-row"
      {...props}
    />
  );
}

/** The chips, the input and the start addon of a chips field. */
function chipsParts(chips: Element | null | undefined): HTMLElement[] {
  return chips
    ? [...chips.children].filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          !child.hasAttribute(motionGhostAttribute),
      )
    : [];
}

export function ComboboxValue({
  children,
  ...props
}: ComboboxPrimitive.Value.Props): React.ReactElement {
  const { chipsRef, multiple } = React.useContext(ComboboxContext);
  const reduced = useReducedMotionPreference();
  // The chips of a multiple selection come and go with the value (rulebook M6,
  // M7): a chip that is added fades in, a removed one fades out where it was,
  // and the chips and the input after them glide to their new place. Base UI
  // drops a removed chip at once, so the keyboard order of the chips stays its
  // own; what fades is a picture of it.
  const glide =
    multiple && typeof children === "function"
      ? (value: unknown) => (
          <>
            {children(value)}
            <GlideOnChange
              change={value}
              origin={() => chipsRef?.current as HTMLElement | null}
              parts={() => chipsParts(chipsRef?.current)}
              presence
              reduced={reduced}
            />
          </>
        )
      : children;
  return (
    <ComboboxPrimitive.Value data-slot="combobox-value" {...props}>
      {glide}
    </ComboboxPrimitive.Value>
  );
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
          slotClass("combobox-list", props),
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
      className={cn(slotClass("combobox-clear", props, render), className)}
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
        slotClass("combobox-status", props),
        "px-3 py-2 font-(--sp-rw-font-weight-label) text-muted-foreground text-xs empty:m-0 empty:p-0",
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
  variant?: FormControlSurface | undefined;
  layout?: "input" | "standalone" | undefined;
}): React.ReactElement {
  const { chipsRef } = React.useContext(ComboboxContext);

  return (
    <ComboboxPrimitive.Chips
      className={cn(
        slotClass("combobox-chips", props),
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
          className="sp-combobox-start-addon flex shrink-0 items-center ps-2 opacity-80 has-[~[data-size=sm]]:has-[+[data-slot=combobox-chip]]:pe-1.5 has-[~[data-size=sm]]:ps-1.5 has-[+[data-slot=combobox-chip]]:pe-2 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-ms-0.5 [&_svg]:-me-1.5"
          data-slot="combobox-start-addon"
        >
          {startAddon}
        </div>
      )}
      {children}
    </ComboboxPrimitive.Chips>
  );
}

/** The plain text of a chip's value, for the title of its label. */
function chipText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return `${node}`;
  if (Array.isArray(node)) return node.map(chipText).join("").trim();
  if (React.isValidElement<{ children?: React.ReactNode }>(node))
    return chipText(node.props.children);
  return "";
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
  // The remove action is named "Remove" and the chip's value, such as
  // "Remove Mara Ellis", so each one in a row of chips is distinct.
  const labelId = React.useId();
  const removeId = React.useId();

  // A chip comes, goes and glides with the value (ComboboxValue).
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      render={render}
      {...props}
      // A className of the app's replaces the chip's own classes; the slot's
      // class stays either way.
      className={withClass(
        props.className ?? "flex min-w-0 max-w-full items-center outline-none",
        slotClass("combobox-chip", props, render),
      )}
    >
      {startAddon && (
        <span
          aria-hidden="true"
          className="sp-combobox-chip-start-addon me-1 flex shrink-0 items-center [&_svg:not([class*='size-'])]:size-3.5"
          data-slot="combobox-chip-start-addon"
        >
          {startAddon}
        </span>
      )}
      {/* A long value ends in an ellipsis on the chip's one line, at the
          width the chips give it, and the title carries the full value
          (rulebook K5). The badge label rule owns it (design-rework.css). */}
      <span
        className="sp-combobox-chip-label"
        data-slot="combobox-chip-label"
        id={labelId}
        title={chipText(children) || undefined}
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
      data-slot="combobox-chip-remove"
      render={
        render ?? (
          <KitButton profile="chip-remove" size="icon-2xs" variant="text" />
        )
      }
      {...props}
      // A className of the app's replaces the action's own classes; the
      // slot's class stays either way.
      className={withClass(
        props.className ?? "me-0.5 shrink-0",
        slotClass("combobox-chip-remove", props, render),
      )}
    >
      <XIcon className="size-3" />
    </ComboboxPrimitive.ChipRemove>
  );
}

export const useComboboxFilter: typeof ComboboxPrimitive.useFilter =
  ComboboxPrimitive.useFilter;

export { ComboboxPrimitive };
