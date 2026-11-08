"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CaretUpDownIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { baseClass, slotClass, withClass } from "../../system/utils/slot-class";
import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { CheckboxGlyph } from "../../system/styles/checkbox-glyph";
import {
  type ChoiceIndicatorMark,
  type ChoiceIndicatorPosition,
  ChoiceMenuItemCheck,
  choiceIndicatorPosition,
  choiceMenuItemBoxSize,
  menuRowLabel,
  menuRowStack,
} from "../../system/styles/choice-menu-item";
import {
  type FormControlVariant,
  surfaceClassNames,
} from "../../system/styles/surface";
import { KitInput } from "../input/input-internal";
import { ExternalInputOwner } from "../input/input";
import { Button } from "../button";
import { CloseGlyph, KitButton } from "../button/button-internal";
import { Kbd } from "../kbd";
import { PopupListMotion } from "../motion/motion-follow";
import { GlideOnChange, motionGhostAttribute } from "../motion/motion-presence";
import { ScrollArea } from "../scroll-area";
import { Separator } from "../separator";

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

/**
 * What the parts of a Combobox read about its chosen options: ComboboxChips
 * counts itself in, so the root knows the value shows as chips, and
 * ComboboxEmpty reads whether no option is left to choose. Internal, beside
 * the public ComboboxContext.
 */
const ComboboxChosenContext = React.createContext<{
  hidesChosen: boolean;
  nothingLeft: boolean;
  setChips: React.Dispatch<React.SetStateAction<number>>;
} | null>(null);

type ComboboxGroup = { items: readonly unknown[] };

/** Base UI's test for grouped `items`: their first entry holds `items`. */
function isGroupedItems(
  items: readonly unknown[],
): items is readonly ComboboxGroup[] {
  const first = items[0];
  return typeof first === "object" && first !== null && "items" in first;
}

/** Whether `items` hold at least one option. */
function hasOptions(items: readonly unknown[] | undefined): boolean {
  if (!items || items.length === 0) return false;
  return isGroupedItems(items)
    ? items.some((group) => group.items.length > 0)
    : true;
}

/**
 * The options left to choose: `items` without the chosen ones, compared as
 * Base UI compares an option with the value, and without a group that is left
 * empty.
 */
function withoutChosen<Items extends readonly unknown[] | undefined>(
  items: Items,
  chosen: unknown,
  isItemEqualToValue: ((item: never, value: never) => boolean) | undefined,
): Items {
  if (!items || !Array.isArray(chosen) || chosen.length === 0) return items;
  const equal = (item: unknown, value: unknown) =>
    item == null || value == null || !isItemEqualToValue
      ? Object.is(item, value)
      : isItemEqualToValue(item as never, value as never);
  const left = (item: unknown) => !chosen.some((value) => equal(item, value));
  if (isGroupedItems(items))
    return items
      .map((group) => ({ ...group, items: group.items.filter(left) }))
      .filter((group) => group.items.length > 0) as unknown as Items;
  return items.filter(left) as unknown as Items;
}

export type ComboboxProps<
  Value,
  Multiple extends boolean | undefined = false,
> = ComboboxPrimitive.Root.Props<Value, Multiple> & {
  /**
   * Whether a chosen option leaves the list of a multiple Combobox with
   * `items`. It does by default when ComboboxChips shows the value, so a name
   * that is already a chip is not offered again, and the list closes once
   * every option is chosen. Set `false` to keep the chosen options in the
   * list with their check.
   */
  hideSelected?: boolean | undefined;
};

export function Combobox<Value, Multiple extends boolean | undefined = false>({
  defaultOpen,
  hideSelected,
  ...props
}: ComboboxProps<Value, Multiple>): React.ReactElement {
  const chipsRef = React.useRef<Element | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [inputSize, setInputSize] = React.useState<SiteplaneControlSize>();
  const inputSizeValue = React.useMemo(
    () => ({ size: inputSize, setSize: setInputSize }),
    [inputSize],
  );
  const [resetKey, setResetKey] = React.useState(0);
  const { defaultValue, form, isItemEqualToValue, multiple, value } = props;

  // A tag field, whose value ComboboxChips shows, lists only what is not
  // chosen yet: a chosen name leaves the list and comes back when its chip is
  // removed. The options left are the `items` Base UI filters, so its search,
  // keyboard navigation, empty state and filtered items all read the same
  // list. The value is the app's, or the one Base UI keeps, mirrored here.
  const [chips, setChips] = React.useState(0);
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const hide = multiple === true && (hideSelected ?? chips > 0);
  const chosen = value !== undefined ? value : uncontrolledValue;
  const items = React.useMemo(
    () =>
      hide
        ? withoutChosen(props.items, chosen, isItemEqualToValue)
        : props.items,
    [chosen, hide, isItemEqualToValue, props.items],
  );
  // Once every option is chosen the list has nothing to offer, so it closes. A
  // removed chip brings its option back, and the list opens again when the
  // user or the app opens it. The kit keeps the open state for Base UI.
  const nothingLeft = hide && hasOptions(props.items) && !hasOptions(items);
  const [openState, setOpenState] = React.useState(defaultOpen ?? false);
  if (nothingLeft && openState) setOpenState(false);
  const open = (props.open ?? openState) && !nothingLeft;
  const chosenValue = React.useMemo(
    () => ({ hidesChosen: hide, nothingLeft, setChips }),
    [hide, nothingLeft],
  );

  React.useEffect(() => {
    if (value !== undefined) {
      return;
    }

    const handleReset = (event: Event) => {
      const target = event.target;
      const input = inputRef.current;
      if (
        target instanceof HTMLFormElement &&
        (input?.form === target ||
          (form
            ? target.id === form
            : Boolean(input && target.contains(input))))
      ) {
        setResetKey((current) => current + 1);
        setUncontrolledValue(defaultValue);
      }
    };

    document.addEventListener("reset", handleReset, true);
    return () => document.removeEventListener("reset", handleReset, true);
  }, [defaultValue, form, value]);

  return (
    <ComboboxContext.Provider
      value={{ chipsRef, inputRef, multiple: !!multiple }}
    >
      <ComboboxInputSizeContext.Provider value={inputSizeValue}>
        <ComboboxChosenContext.Provider value={chosenValue}>
          <ComboboxPrimitive.Root
            {...props}
            items={items}
            key={resetKey}
            onOpenChange={(nextOpen, eventDetails) => {
              props.onOpenChange?.(nextOpen, eventDetails);
              if (!eventDetails.isCanceled) setOpenState(nextOpen);
            }}
            onValueChange={(nextValue, eventDetails) => {
              props.onValueChange?.(nextValue, eventDetails);
              if (!eventDetails.isCanceled)
                setUncontrolledValue(
                  nextValue as ComboboxProps<Value, Multiple>["defaultValue"],
                );
            }}
            open={open}
          />
        </ComboboxChosenContext.Provider>
      </ComboboxInputSizeContext.Provider>
    </ComboboxContext.Provider>
  );
}

/** Whether a `shortcut` names keys to show. */
function hasShortcutKeys(shortcut: React.ReactNode): boolean {
  return shortcut !== undefined && shortcut !== null && shortcut !== false;
}

/**
 * The width of a keyboard hint (`shortcut` of ComboboxInput and
 * ComboboxChipsInput), which the box around the input keeps: the text ends
 * 8 px before the hint, whatever keys it shows (--sp-combobox-shortcut-size,
 * design-rework.css). The holder is the box that holds the input and the
 * hint.
 */
function useShortcutSize(hasShortcut: boolean) {
  const holderRef = React.useRef<HTMLDivElement>(null);
  const hintRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const holder = holderRef.current;
    const hint = hintRef.current;
    if (!holder || !hint) return;
    const measure = () =>
      holder.style.setProperty(
        "--sp-combobox-shortcut-size",
        `${hint.offsetWidth}px`,
      );
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(hint);
    return () => {
      observer.disconnect();
      holder.style.removeProperty("--sp-combobox-shortcut-size");
    };
  }, [hasShortcut]);

  return { holderRef, hintRef };
}

/**
 * The keyboard hint at the end of a Combobox field: a string in a Kbd, or an
 * element such as a KbdGroup. It repeats what aria-keyshortcuts on the input
 * names, so assistive technology skips it.
 */
function ComboboxShortcut({
  children,
  hintRef,
}: {
  children: React.ReactNode;
  hintRef: React.Ref<HTMLSpanElement>;
}): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className="sp-combobox-shortcut"
      data-slot="combobox-shortcut"
      ref={hintRef}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Kbd>{children}</Kbd>
      ) : (
        children
      )}
    </span>
  );
}

export function ComboboxChipsInput({
  className,
  ref,
  shortcut,
  size,
  ...props
}: Omit<WithStringClassName<ComboboxPrimitive.Input.Props>, "size"> & {
  size?: SiteplaneControlSize | number;
  ref?: React.Ref<HTMLInputElement>;
  /**
   * The keys of the shortcut that focuses the field, shown at the end of the
   * last row of a tag field as a hint, such as `⌘K`, as `ComboboxInput`
   * shows it: a string in a Kbd, or an element such as a KbdGroup. The hint
   * is hidden from assistive technology and below `md`. The application binds
   * the keys and names them with `aria-keyshortcuts`.
   */
  shortcut?: React.ReactNode;
}): React.ReactElement {
  const visualSize = typeof size === "number" ? undefined : size;
  const nativeSize = typeof size === "number" ? size : undefined;
  const resolvedSize = useResolvedControlSize(visualSize);
  useComboboxInputSize(resolvedSize);
  const contextInputRef = React.useContext(ComboboxContext).inputRef;
  const fallbackInputRef = React.useRef<HTMLInputElement | null>(null);
  const inputRef = contextInputRef ?? fallbackInputRef;
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  const hasShortcut = hasShortcutKeys(shortcut);
  const { holderRef, hintRef } = useShortcutSize(hasShortcut);

  const input = (
    <ComboboxPrimitive.Input
      className={cn(
        slotClass("combobox-chips-input", props),
        // The input names its size on the field scale: the chips take its
        // height, padding and text, an Input's of the same size, and a Field
        // reads it for its hint. With the chips' start padding the text
        // starts where an Input's does (design-rework.css); after a chip or
        // the start addon it starts 8 px later, 2 px past the chip gap.
        "sp-field-scale",
        "min-w-12 flex-1 outline-none [[data-slot=combobox-chip]+&]:ps-0.5 [[data-slot=combobox-chip]+*>&]:ps-0.5 [[data-slot=combobox-start-addon]+&]:ps-0.5 [[data-slot=combobox-start-addon]+*>&]:ps-0.5",
        "ps-1",
        className,
      )}
      data-size={resolvedSize}
      data-slot="combobox-chips-input"
      ref={inputRef}
      size={nativeSize}
      {...props}
    />
  );

  // Without a hint the input is a part of the field's row as it always was.
  // With one it stands in a box that fills the rest of the last row, and the
  // hint ends at the box's end (design-rework.css).
  if (!hasShortcut) return input;
  return (
    <div
      className="sp-combobox-chips-input-group relative flex flex-1 items-center"
      data-shortcut=""
      data-size={resolvedSize}
      data-slot="combobox-chips-input-group"
      ref={holderRef}
    >
      {input}
      <ComboboxShortcut hintRef={hintRef}>{shortcut}</ComboboxShortcut>
    </div>
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
  /**
   * The keys of the shortcut that focuses the field, shown at its end as a
   * hint, such as `⌘K`: a string in a Kbd, or an element such as a KbdGroup.
   * The hint is hidden from assistive technology and below `md`. The
   * application binds the keys and names them with `aria-keyshortcuts`.
   */
  shortcut?: React.ReactNode;
  size?: SiteplaneControlSize | number | undefined;
  variant?: FormControlVariant | undefined;
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
  shortcut,
  size,
  style,
  variant = "default",
  triggerProps,
  clearProps,
  ...props
}: ComboboxInputProps): React.ReactElement {
  const messages = useSiteplaneMessages("combobox");
  const visualSize = typeof size === "number" ? undefined : size;
  const nativeSize = typeof size === "number" ? size : undefined;
  const resolvedSize = useResolvedControlSize(visualSize);
  useComboboxInputSize(resolvedSize);
  const contextInputRef = React.useContext(ComboboxContext).inputRef;
  const fallbackInputRef = React.useRef<HTMLInputElement | null>(null);
  const inputRef = contextInputRef ?? fallbackInputRef;
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  const hasShortcut = hasShortcutKeys(shortcut);
  const { holderRef: groupRef, hintRef: shortcutRef } =
    useShortcutSize(hasShortcut);
  // An embedded input is the search field of a popup: it is named for
  // itself, "Search" by default (the combobox messages), and not by the
  // Field's label, which names the trigger that opens the popup; the popup's
  // own name says what is searched. An aria-label or aria-labelledby of the
  // caller names it instead.
  const searchName =
    profile === "embedded"
      ? {
          "aria-label": props["aria-label"] ?? messages.search,
          "aria-labelledby": props["aria-labelledby"],
        }
      : null;

  return (
    <ComboboxPrimitive.InputGroup
      // The field fills its container, like Input; an embedded input spans
      // the popup, as the Command palette's input spans its panel. The
      // group is the field's root: it takes `className` and `style`, as every
      // field does (Lukas, 4 November 2026), so a margin moves the input, its
      // trigger, its clear action and its start addon together.
      className={cn(
        "sp-combobox-input-group sp-field-scale relative flex h-fit w-full text-foreground",
        className,
      )}
      // The group is on the field scale of its size, so the parts beside the
      // input take the field's inline padding and icon (design-rework.css).
      data-inset-end={showTrigger || showClear ? "" : undefined}
      data-shortcut={hasShortcut ? "" : undefined}
      data-size={resolvedSize}
      data-slot="combobox-input-group"
      ref={groupRef}
      style={style}
    >
      {startAddon && (
        <div
          aria-hidden="true"
          className="sp-combobox-start-addon pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center"
          data-slot="combobox-start-addon"
        >
          {startAddon}
        </div>
      )}
      {/* Combobox.Input already connects the input to Field. */}
      <ExternalInputOwner>
        <ComboboxPrimitive.Input
          {...props}
          {...searchName}
          className="sp-combobox-input"
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
      {hasShortcut ? (
        <ComboboxShortcut hintRef={shortcutRef}>{shortcut}</ComboboxShortcut>
      ) : null}
      {showTrigger && (
        <ComboboxTrigger
          {...triggerProps}
          aria-label={triggerProps?.["aria-label"] ?? messages.showOptions}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 has-[+[data-slot=combobox-clear]]:hidden",
            triggerProps?.className,
          )}
          disabled={disabled || triggerProps?.disabled}
          render={
            triggerProps?.render ?? (
              <Button profile="field-action" shape="square" variant="ghost" />
            )
          }
        >
          {/* The span takes the glyph's size from the field action, and the
              caret fills it (design-rework.css); the caret names no size. */}
          <ComboboxPrimitive.Icon
            aria-hidden="true"
            className="sp-combobox-icon"
            data-slot="combobox-icon"
          >
            <CaretUpDownIcon aria-hidden="true" />
          </ComboboxPrimitive.Icon>
        </ComboboxTrigger>
      )}
      {showClear && (
        <ComboboxClear
          {...clearProps}
          aria-label={clearProps?.["aria-label"] ?? messages.clear}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 has-[+[data-slot=combobox-clear]]:hidden",
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
              // Its surface, corners and cap are the popup rules of
              // design-rework.css that Select and Autocomplete share.
              "flex min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) flex-col before:rounded-[inherit]",
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

/**
 * The top row of a popup that holds its search field, an embedded
 * ComboboxInput, above the list (Lukas,
 * 31 October 2026): 2 px above and below the field, 4 px beside an sm one,
 * and a hairline under that space, as under the Command palette's input. The
 * band is the popup band of design-rework.css, which the Command palette's
 * input and footer share.
 */
export function ComboboxHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const size = React.useContext(ComboboxInputSizeContext)?.size;
  return (
    <div
      className={cn(slotClass("combobox-header", props), "shrink-0", className)}
      data-size={size}
      data-slot="combobox-header"
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * The bottom row of a popup that holds its actions, such as Reset and Select
 * all in kit Buttons, at the two ends of the row, 12 px from its edges, under
 * a hairline, as the Command palette's footer
 * has it (the popup band of design-rework.css). The Buttons in it take the
 * step of the field: xs beside an sm one, sm beside a larger one.
 */
export function ComboboxFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  // The footer Buttons are xs beside an sm field and sm beside a
  // larger one; a Button that names its size keeps it.
  const fieldSize = useResolvedControlSize(
    React.useContext(ComboboxInputSizeContext)?.size,
  );
  const buttonSize = fieldSize === "sm" ? "xs" : "sm";
  // Its row, the 12 px between its parts and its text are the popup footer
  // rule of design-rework.css, which the Menu and the Command share.
  return (
    <div
      className={cn(slotClass("combobox-footer", props), "shrink-0", className)}
      data-slot="combobox-footer"
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement<{ size?: unknown }>(child) &&
        child.type === Button &&
        child.props.size === undefined
          ? React.cloneElement(child, { size: buttonSize })
          : child,
      )}
    </div>
  );
}

export function ComboboxItem({
  className,
  children,
  indicator: indicatorProp,
  indicatorPosition,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: WithStringClassName<ComboboxPrimitive.Item.Props> & {
  /**
   * The mark of a selected option, the choice SelectItem offers: the check,
   * the Checkbox's box, which shows on every option and fills on a selected
   * one, for a list people pick several options from, or none. A multiple
   * Combobox takes the box and any other the check, as a Select does, unless
   * its chips show the value and a chosen option leaves the list.
   */
  indicator?: ChoiceIndicatorMark | undefined;
  /**
   * Where the item shows its mark: at the end of the row, the check's default
   * in every list of the kit, or at the start, the box's default.
   */
  indicatorPosition?: ChoiceIndicatorPosition | undefined;
}): React.ReactElement {
  const { multiple } = React.useContext(ComboboxContext);
  const hidesChosen =
    React.useContext(ComboboxChosenContext)?.hidesChosen ?? false;
  const indicator =
    indicatorProp ?? (multiple && !hidesChosen ? "checkbox" : "check");
  const touchPointerRef = React.useRef<{
    id: number;
    moved: boolean;
    x: number;
    y: number;
  } | null>(null);
  // The kit's one default (I8): the check ends the row at its 10 px end
  // padding, and the label starts at the row's
  // padding, an avatar, logo or icon before the name, as in a Select option;
  // the label keeps one line. The Checkbox's box leads the row, and so does a
  // check placed at the start, in a column as wide as the icons. A row without
  // a mark is its label alone, from the row's padding.
  const position =
    indicator === "none"
      ? undefined
      : choiceIndicatorPosition(indicatorPosition, indicator);
  const end = position === "end";
  const checkbox = indicator === "checkbox";
  // The box takes the size its field gives it, the Combobox's input, as the
  // box of a multiple Select's option does beside its trigger.
  const boxSize = choiceMenuItemBoxSize(
    useResolvedControlSize(React.useContext(ComboboxInputSizeContext)?.size),
  );
  const mark =
    indicator === "none" ? null : (
      <ComboboxPrimitive.ItemIndicator
        className={cn(
          checkbox
            ? "sp-combobox-item-checkbox inline-flex shrink-0 items-center justify-center"
            : "sp-combobox-item-indicator",
          end ? "col-start-2" : "col-start-1",
          !checkbox && "flex min-h-lh items-center",
        )}
        data-size={checkbox ? boxSize : undefined}
        data-slot={
          checkbox ? "combobox-item-checkbox" : "combobox-item-indicator"
        }
        keepMounted
      >
        {checkbox ? <CheckboxGlyph size={boxSize} /> : <ChoiceMenuItemCheck />}
      </ComboboxPrimitive.ItemIndicator>
    );
  // A stacked description stands under the name in one column, as in a Menu
  // row, whichever side the mark takes: menuRowLabel stacks it in a row whose
  // label keeps one line, and menuRowStack in a row led by its mark, whose
  // other labels stay as they are, so a text label still wraps (I5).
  const label = (
    <div
      className={cn(
        "sp-combobox-item-label flex min-w-0 items-center gap-2",
        mark && !end && "col-start-2",
      )}
      data-slot="combobox-item-label"
    >
      {end ? menuRowLabel(children) : menuRowStack(children)}
    </div>
  );

  return (
    <ComboboxPrimitive.Item
      className={cn(
        slotClass("combobox-item", props),
        // Its height, padding, gap, corners, text and icon sizes, and its
        // columns by the place of its mark, are the option rule's that Select
        // items share (design-rework.css).
        "grid in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] items-center outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
        // Rulebook I5: a check at the start sits on the first line of a text
        // label that wraps. The row's one track is centred in the min-height,
        // so a one-line label stays centred, and the check's box is one line
        // high. A label that leads with an avatar or an icon keeps the row
        // centre, and so does a check at the end of the row, a control after
        // the text. The Checkbox's box keeps the row centre, as beside a
        // Checkbox's label.
        !end &&
          indicator === "check" &&
          "[&:not(:has(>[data-slot=combobox-item-label]>*))]:content-center [&:not(:has(>[data-slot=combobox-item-label]>*))]:items-start",
        className,
      )}
      // The columns of a row by its mark and the mark's place
      // (design-rework.css).
      data-indicator={indicator === "check" ? undefined : indicator}
      data-indicator-position={position}
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
      {end ? label : mark}
      {end ? mark : label}
    </ComboboxPrimitive.Item>
  );
}

/**
 * The supporting text of an option, such as a count beside a team or a
 * handle beside a name: the description of a Select option, in the regular
 * weight and the tertiary colour after the name, which then takes the label
 * weight (design-rework.css). Place it after the option's text in
 * ComboboxItem.
 */
export function ComboboxItemDescription({
  className,
  stacked,
  ...props
}: React.ComponentProps<"span"> & {
  /**
   * Puts the description under the name instead of after it, in one column
   * beside the option's avatar or icon, as a list of services shows each name
   * over its duration and price. The name and the description stay on one
   * line each.
   */
  stacked?: boolean | undefined;
}): React.ReactElement {
  return (
    <span
      className={cn(
        slotClass("combobox-item-description", props),
        "min-w-0 truncate",
        className,
      )}
      data-layout={stacked ? "stacked" : undefined}
      data-slot="combobox-item-description"
      {...props}
    />
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
        "last:hidden",
        className,
      )}
      data-slot="combobox-separator"
      render={<Separator />}
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
      className={cn(slotClass("combobox-group-label", props), className)}
      data-slot="combobox-group-label"
      {...props}
    />
  );
}

export function ComboboxEmpty({
  children,
  className,
  ...props
}: WithStringClassName<ComboboxPrimitive.Empty.Props>): React.ReactElement {
  // When every option is a chip the list closes (Combobox); its empty state,
  // a live region, stays silent instead of saying that a search found nothing.
  const nothingLeft =
    React.useContext(ComboboxChosenContext)?.nothingLeft ?? false;
  return (
    <ComboboxPrimitive.Empty
      className={cn(
        slotClass("combobox-empty", props),
        "not-empty:p-2 text-center text-muted-foreground",
        className,
      )}
      data-slot="combobox-empty"
      {...props}
    >
      {nothingLeft ? null : children}
    </ComboboxPrimitive.Empty>
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
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();
  const filtered = ComboboxPrimitive.useFilteredItems();
  return (
    <>
      <ScrollArea
        className="grid h-auto min-h-0 flex-1 overflow-hidden [&>.sp-scroll-area-viewport]:h-auto [&>.sp-scroll-area-viewport]:max-h-(--sp-rw-combobox-list-max-height) [&>.sp-scroll-area-viewport]:min-h-0"
        ref={scrollAreaRef}
        scrollbarGutter
        scrollFade
        // The input holds the focus and the arrow keys move through the
        // options, so the list is no tab stop between the input and the
        // popup's footer.
        tabbable={false}
      >
        <ComboboxPrimitive.List
          className={cn(
            slotClass("combobox-list", props),
            "not-empty:scroll-py-1 not-empty:px-1 not-empty:py-1",
            className,
          )}
          data-slot="combobox-list"
          {...props}
        />
      </ScrollArea>
      {/* An option that a search or a chosen value takes out of the list
          fades and closes its row, the rows below glide, and the popup
          follows its height, as in every list of a popup that filters
          (rulebook M6, M7). */}
      <PopupListMotion
        change={[filtered, props.children]}
        reduced={reduced}
        scrollArea={() => scrollAreaRef.current}
      />
    </>
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
  variant?: FormControlVariant | undefined;
  layout?: "input" | "standalone" | undefined;
}): React.ReactElement {
  const { chipsRef } = React.useContext(ComboboxContext);
  // The value shows as chips, so a chosen option leaves the list (Combobox,
  // `hideSelected`).
  const setChips = React.useContext(ComboboxChosenContext)?.setChips;
  React.useLayoutEffect(() => {
    if (!setChips) return;
    setChips((count) => count + 1);
    return () => setChips((count) => count - 1);
  }, [setChips]);

  return (
    <ComboboxPrimitive.Chips
      className={cn(
        slotClass("combobox-chips", props),
        // A field of chips is on the field scale of its input's size
        // (design-rework.css).
        layout === "input" && "sp-field-scale",
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
          // The icon sits 4 px after the chips' start padding, at an Input's
          // inline padding, and the first chip or the text follows 8 px after
          // it, 2 px past the chip gap; the start addon rules size the icon
          // and give it the tone of a field's leading icon
          // (design-rework.css).
          className="sp-combobox-start-addon flex shrink-0 items-center ps-1 has-[+[data-slot=combobox-chip]]:pe-0.5 [&_svg]:pointer-events-none"
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
  // The remove action is named by the chip.remove message with the chip's
  // value, such as "Remove Mara Ellis", so each one in a row of chips is
  // distinct and a translation sets its own word order. A name in removeProps
  // replaces that whole name.
  const messages = useSiteplaneMessages("chip");
  const labelId = React.useId();
  const ownRemoveId = React.useId();
  const removeId = removeProps?.id ?? ownRemoveId;
  const named =
    removeProps?.["aria-label"] !== undefined ||
    removeProps?.["aria-labelledby"] !== undefined;

  // A chip comes, goes and glides with the value (ComboboxValue).
  return (
    <ComboboxPrimitive.Chip
      // A chip is a pill like a Badge and a Tag: it carries the Badge
      // foundation, the chip surface of a Tag (the white surface with the
      // hairline) and a remove action, and takes its size from its field
      // (design-rework.css, the pill block and the chip surface).
      data-foundation="badge"
      data-removable=""
      data-slot="combobox-chip"
      data-variant="secondary"
      render={render}
      {...props}
      // A className of the app's replaces the chip's own classes; the slot's
      // and the foundation's classes stay either way.
      className={withClass(
        props.className ?? "flex min-w-0 max-w-full items-center outline-none",
        slotClass("combobox-chip", props, render),
        baseClass("badge", props, render),
      )}
    >
      {startAddon && (
        <span
          aria-hidden="true"
          className="sp-combobox-chip-start-addon flex shrink-0 items-center"
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
        aria-label={named ? undefined : messages.remove(chipText(children))}
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
  const messages = useSiteplaneMessages("chip");
  return (
    <ComboboxPrimitive.ChipRemove
      // Inside a ComboboxChip the chip passes the whole name, with its value.
      aria-label={messages.remove("")}
      data-slot="combobox-chip-remove"
      // The chip remove action, the one a Tag shows: a 14 px ghost action with
      // a 10 px cross in an sm field, 16 px with 12 px at md and lg and 24 px
      // with 16 px at xl; the chips name the size of its cross
      // (design-rework.css).
      render={
        render ?? (
          <KitButton profile="chip-remove" size="icon-2xs" variant="ghost" />
        )
      }
      {...props}
      // A className of the app's replaces the action's own classes; the
      // slot's class stays either way. The chip places the action (3 px after
      // the value and 4 px from its end, as a Tag does). The chassis keeps the
      // kit's action at its width; an element of the app's render takes
      // shrink-0 for that.
      className={withClass(
        props.className ?? (render ? "shrink-0" : undefined),
        slotClass("combobox-chip-remove", props, render),
      )}
    >
      {/* The X of every chip remove action: the kit's action sizes it, and in
          an element of the app's render it is 1em, as an icon is. */}
      <CloseGlyph />
    </ComboboxPrimitive.ChipRemove>
  );
}

export const useComboboxFilter: typeof ComboboxPrimitive.useFilter =
  ComboboxPrimitive.useFilter;

/**
 * The items the search shows, Base UI's filtered items: all of them while the
 * query is empty, less the chosen ones where they leave the list
 * (`hideSelected`). A Select all action in a ComboboxFooter adds these to the
 * value. Call it in a component inside Combobox.
 */
export const useComboboxFilteredItems: typeof ComboboxPrimitive.useFilteredItems =
  ComboboxPrimitive.useFilteredItems;

export { ComboboxPrimitive };
