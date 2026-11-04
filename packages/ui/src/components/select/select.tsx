"use client";

import {
  isGroupedItems,
  resolveSelectedLabel,
} from "@base-ui/react/internals/resolveValueLabel";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { useRender } from "@base-ui/react/use-render";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";
import { useFormReset } from "../../system/form/use-form-reset";
import {
  SiteplaneUIPortalScope,
  useResolvedControlSize,
  type SiteplaneControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { CheckboxGlyph } from "../../system/styles/checkbox-glyph";
import {
  type ChoiceIndicatorPosition,
  ChoiceMenuItemCheck,
  choiceIndicatorPosition,
  choiceMenuItemBoxSize,
  menuRowLabel,
} from "../../system/styles/choice-menu-item";
import { SelectCaretIcon } from "../../system/styles/select-caret";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { dropSlotClass, slotClass } from "../../system/utils/slot-class";
import { KitButton } from "../button/button-internal";
import { useFieldLabelPlacement } from "../field";
import { FieldHelp, hasFieldHelp } from "../input-group/field-status";
import { Separator } from "../separator";
import { Input } from "../input";

/**
 * What the parts of a Select read from its root: the `items`, the function
 * that names an object value, whether several options can be selected, and
 * the size of the trigger, which the box of an option follows.
 */
type SelectItemsSource = {
  items: SelectPrimitive.Root.Props<unknown>["items"];
  itemToStringLabel: ((itemValue: never) => string) | undefined;
  multiple: boolean;
  triggerSize: SiteplaneControlSize | undefined;
  setTriggerSize: (size: SiteplaneControlSize) => void;
};

const SelectItemsContext = React.createContext<SelectItemsSource>({
  items: undefined,
  itemToStringLabel: undefined,
  multiple: false,
  triggerSize: undefined,
  setTriggerSize: () => {},
});

/**
 * The label of every option of a segment trigger, which SelectValue stacks
 * under the label it shows; null outside a segment.
 */
const SelectOptionLabelsContext = React.createContext<
  readonly React.ReactNode[] | null
>(null);

/**
 * The label SelectValue shows for each option, resolved from the Select's
 * `items` as Base UI resolves the selected one. Empty when the options are
 * known only from the SelectItems in the popup.
 */
function selectOptionLabels({
  items,
  itemToStringLabel,
}: SelectItemsSource): React.ReactNode[] {
  if (items == null) return [];
  const toLabel = itemToStringLabel as
    ((itemValue: unknown) => string) | undefined;
  if (!Array.isArray(items))
    return Object.keys(items).map((key) =>
      resolveSelectedLabel(key === "null" ? null : key, items, toLabel),
    );
  const options: readonly unknown[] = isGroupedItems(items)
    ? items.flatMap((group) => group.items)
    : items;
  return options.map((option) =>
    resolveSelectedLabel(
      option !== null && typeof option === "object" && "value" in option
        ? option.value
        : option,
      items,
      toLabel,
    ),
  );
}

export function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
): React.ReactElement {
  const [resetKey, setResetKey] = React.useState(0);
  const markerRef = useFormReset<HTMLInputElement>(props.form, () => {
    if (props.value === undefined) setResetKey((current) => current + 1);
  });
  const { children, items, itemToStringLabel } = props;
  const multiple = props.multiple === true;
  const [triggerSize, setTriggerSize] = React.useState<
    SiteplaneControlSize | undefined
  >(undefined);
  const itemsSource = React.useMemo<SelectItemsSource>(
    () => ({ items, itemToStringLabel, multiple, setTriggerSize, triggerSize }),
    [items, itemToStringLabel, multiple, triggerSize],
  );
  return (
    <>
      <SelectPrimitive.Root data-slot="select" {...props} key={resetKey}>
        <SelectItemsContext.Provider value={itemsSource}>
          {children}
        </SelectItemsContext.Provider>
      </SelectPrimitive.Root>
      <Input
        aria-hidden="true"
        disabled
        form={props.form}
        ref={markerRef}
        type="hidden"
      />
    </>
  );
}

export type SelectTriggerSize = SiteplaneControlSize;
/**
 * The trigger surface. `default` rests raised, as a Button does, like every
 * trigger that opens a list or a picker. `outline` is transparent inside the
 * hairline rim of an outline Button, for a filter bar or a toolbar beside an
 * inset search field. Both take a Button's hover and pressed tints, as every
 * trigger of a list or a picker does (design-rework.css).
 * `ghost` is the text with a caret, for a value in a row, and `segment` a
 * trigger that fills an InputGroupAddon without padding, on the group's
 * surface. A segment is as wide as its widest option and its caret when the
 * Select has `items`, and as wide as its value and caret without them;
 * without a `size` of its own it takes the group's, which the bare addon hands
 * to its controls. The inset and elevated surfaces are gone (Lukas, 4
 * November 2026: "nur Standard und soft").
 */
export type SelectTriggerMode = "default" | "ghost" | "outline" | "segment";

/**
 * The width of a trigger, as in the other fields: `full` fills the container,
 * like Input, and `fit` is as wide as the value and the caret, for a Select
 * that sits in a row, such as a page size beside a pagination. A segment keeps
 * its own width either way.
 */
export type SelectTriggerWidth = "fit" | "full";

/** The Button width of a trigger: a segment and a fit trigger take their content's. */
function selectTriggerButtonWidth(
  mode: SelectTriggerMode,
  width: SelectTriggerWidth | undefined,
): "auto" | "fit" | "full" {
  if (mode === "segment") return "auto";
  return width === "fit" ? "fit" : "full";
}

export interface SelectButtonProps extends useRender.ComponentProps<"button"> {
  size?: SelectTriggerSize;
  /**
   * An icon, avatar or status dot before the value. It sits where an element
   * before a SelectTrigger's SelectValue sits: at the field's inline padding,
   * 8 px before the value.
   */
  startAddon?: React.ReactNode;
  variant?: SelectTriggerMode;
  /**
   * `full` fills the container, like Input. `fit` is as wide as the value and
   * the caret. Default: `full`.
   */
  width?: SelectTriggerWidth | undefined;
}

export function SelectButton({
  className,
  size,
  startAddon,
  variant,
  width,
  render,
  children,
  ...props
}: SelectButtonProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const resolvedMode = variant ?? "default";
  return (
    <KitButton
      align="between"
      // The trigger is a field of its size (the field scale,
      // design-rework.css).
      className={cn("sp-field-scale min-w-0", className)}
      data-select-trigger=""
      data-slot="select-button"
      {...props}
      profile="select-trigger"
      profileMode={resolvedMode}
      render={render}
      size={resolvedSize}
      variant="outline"
      // A segment and a fit trigger are as wide as their value and caret.
      width={selectTriggerButtonWidth(resolvedMode, width)}
    >
      <>
        {startAddon}
        <span
          // While the Combobox that the Button opens marks it as empty, the
          // value takes the field placeholder (design-rework.css).
          className="sp-select-value flex-1 truncate"
          data-slot="select-value"
        >
          {children}
        </span>
        <span className="sp-select-icon" data-slot="select-icon">
          <SelectCaretIcon />
        </span>
      </>
    </KitButton>
  );
}

export function SelectTrigger({
  className,
  size,
  variant,
  width,
  children,
  render,
  ...props
}: WithStringClassName<SelectPrimitive.Trigger.Props> & {
  size?: SelectTriggerSize | undefined;
  variant?: SelectTriggerMode | undefined;
  /**
   * `full` fills the container, like Input, and is at least 144 px wide.
   * `fit` is as wide as the value and the caret. Default: `full`.
   */
  width?: SelectTriggerWidth | undefined;
}): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const resolvedMode = variant ?? "default";
  // A segment of an InputGroup is as wide as its widest option and caret, as
  // a native select is (Lukas, 31 October 2026):
  // SelectValue stacks every option's label under the one it shows.
  // Without `items` it is as wide as its value and caret.
  const segment = resolvedMode === "segment";
  const itemsSource = React.useContext(SelectItemsContext);
  const { setTriggerSize } = itemsSource;
  // The box of a multiple Select's option follows the trigger's size.
  React.useLayoutEffect(() => {
    setTriggerSize(resolvedSize);
  }, [resolvedSize, setTriggerSize]);
  const optionLabels = React.useMemo(() => {
    if (!segment) return null;
    const labels = selectOptionLabels(itemsSource);
    return labels.length > 0 ? labels : null;
  }, [segment, itemsSource]);
  // A floating Field lays out the trigger it holds (design-rework.css,
  // "Floating label fields"); the ghost and segment modes draw no field to
  // hold a label.
  const floating =
    useFieldLabelPlacement() === "floating" &&
    resolvedMode !== "ghost" &&
    !segment;

  return (
    <SelectPrimitive.Trigger
      {...props}
      // The trigger keeps its own slot, so a host's slot class goes (a
      // Tooltip trigger that renders it).
      className={cn(
        slotClass("select-trigger", undefined, render),
        // The trigger is a field of its size: its height, the value's padding,
        // the leading icon, the caret's place and the text follow it (the
        // field scale, design-rework.css), and a Field reads it for its hint.
        "sp-field-scale",
        // A full trigger is at least 144 px wide; a segment and a fit trigger
        // are as wide as what they show.
        !segment && width !== "fit" && "min-w-36",
        dropSlotClass(className, props),
      )}
      data-label-placement={floating ? "floating" : undefined}
      data-profile="select-trigger"
      data-profile-mode={resolvedMode}
      data-select-trigger=""
      data-size={resolvedSize}
      data-slot="select-trigger"
      render={
        render ?? (
          <KitButton
            align="between"
            profile="select-trigger"
            profileMode={resolvedMode}
            size={resolvedSize}
            variant="outline"
            width={selectTriggerButtonWidth(resolvedMode, width)}
          />
        )
      }
    >
      <SelectOptionLabelsContext.Provider value={optionLabels}>
        {children}
      </SelectOptionLabelsContext.Provider>
      <SelectPrimitive.Icon
        aria-hidden="true"
        className="sp-select-icon"
        data-slot="select-icon"
      >
        <SelectCaretIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectValue({
  className,
  render,
  ...props
}: WithStringClassName<SelectPrimitive.Value.Props>): React.ReactElement {
  // In a segment trigger the value shares one grid cell with a hidden stack of
  // every option's label, so the cell is as wide as the widest of them and a
  // new value moves nothing. The stack is hidden from assistive technology,
  // which hears the value alone.
  const optionLabels = React.useContext(SelectOptionLabelsContext);
  const stacked = optionLabels !== null && render === undefined;
  return (
    <SelectPrimitive.Value
      className={cn(
        slotClass("select-value", props),
        "flex-1 truncate",
        stacked && "grid",
        className,
      )}
      data-slot="select-value"
      render={
        stacked
          ? (valueProps) => (
              <span {...valueProps}>
                <span className="col-start-1 row-start-1 truncate">
                  {valueProps.children}
                </span>
                <span
                  aria-hidden="true"
                  className="sp-select-value-options invisible col-start-1 row-start-1 grid"
                  data-slot="select-value-options"
                >
                  {optionLabels.map((label, index) => (
                    <span className="col-start-1 row-start-1" key={index}>
                      {label}
                    </span>
                  ))}
                </span>
              </span>
            )
          : render
      }
      {...props}
    />
  );
}

export function SelectPopup({
  className,
  children,
  side = "bottom",
  // 4 px (Lukas, 30 October 2026), as the
  // Combobox and Autocomplete popups keep it; it was 8 px.
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  anchor,
  portalProps,
  ...props
}: WithStringClassName<SelectPrimitive.Popup.Props> & {
  portalProps?: WithStringClassName<SelectPrimitive.Portal.Props>;
  side?: SelectPrimitive.Positioner.Props["side"];
  sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"];
  align?: SelectPrimitive.Positioner.Props["align"];
  alignOffset?: SelectPrimitive.Positioner.Props["alignOffset"];
  alignItemWithTrigger?: SelectPrimitive.Positioner.Props["alignItemWithTrigger"];
  anchor?: SelectPrimitive.Positioner.Props["anchor"];
}): React.ReactElement {
  return (
    <SelectPrimitive.Portal {...portalProps}>
      <SiteplaneUIPortalScope>
        <SelectPrimitive.Positioner
          align={align}
          alignItemWithTrigger={alignItemWithTrigger}
          alignOffset={alignOffset}
          anchor={anchor}
          className="sp-select-positioner z-50 select-none"
          data-slot="select-positioner"
          side={side}
          sideOffset={sideOffset}
        >
          <SelectPrimitive.Popup
            className={cn(
              slotClass("select-popup", props),
              "sp-floating-panel origin-(--transform-origin) text-foreground outline-none",
              className,
            )}
            data-slot="select-popup"
            {...props}
          >
            {/* The scroll arrows are strips inside the panel, with the fade
                into the list on their ::before (design-rework.css). */}
            <SelectPrimitive.ScrollUpArrow
              className="sp-select-scroll-up-arrow top-0 z-50 hidden h-6 w-full cursor-pointer items-center justify-center data-[visible]:flex"
              data-slot="select-scroll-up-arrow"
            >
              <CaretUpIcon
                aria-hidden="true"
                className="relative size-4.5 sm:size-4"
              />
            </SelectPrimitive.ScrollUpArrow>
            {/* The panel: its surface rule names this element alone, so the
                arrows beside it keep their own look (design-rework.css). */}
            <div
              className={cn(
                "sp-select-surface",
                surfaceClassNames.overlay,
                "h-full min-w-(--anchor-width) w-max max-w-(--available-width) before:rounded-[inherit]",
              )}
            >
              <SelectPrimitive.List
                className="sp-select-list overflow-y-auto"
                data-slot="select-list"
              >
                {children}
              </SelectPrimitive.List>
            </div>
            <SelectPrimitive.ScrollDownArrow
              className="sp-select-scroll-down-arrow bottom-0 z-50 hidden h-6 w-full cursor-pointer items-center justify-center data-[visible]:flex"
              data-slot="select-scroll-down-arrow"
            >
              <CaretDownIcon
                aria-hidden="true"
                className="relative size-4.5 sm:size-4"
              />
            </SelectPrimitive.ScrollDownArrow>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </SelectPrimitive.Portal>
  );
}

/** How an option shows that it is selected. */
export type SelectItemIndicator = "check" | "checkbox" | "none";

export type SelectItemProps =
  WithStringClassName<SelectPrimitive.Item.Props> & {
    /**
     * The mark of a selected option: the check, the Checkbox's box, which shows
     * on every option and fills on a selected one, or none. A multiple Select
     * takes the box and any other the check.
     */
    indicator?: SelectItemIndicator | undefined;
    /**
     * Where the mark sits: at the end of the row, the check's default in every
     * list of the kit, or at the start, the box's default.
     */
    indicatorPosition?: ChoiceIndicatorPosition | undefined;
  };

/**
 * The supporting text of an option, such as a handle beside a name or a count
 * beside a team: the regular weight in the tertiary colour after the name,
 * which then takes the title weight (design-rework.css). A direct child of
 * SelectItem, which places it after the option's text, so typing the name
 * finds the option and the trigger shows the name alone.
 */
export function SelectItemDescription({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      className={cn(
        slotClass("select-item-description", props),
        "min-w-0 truncate",
        className,
      )}
      data-slot="select-item-description"
      {...props}
    />
  );
}

/**
 * The supporting text of the value in the trigger, such as the people that a
 * count of selected teams adds up to: the regular weight in the tertiary
 * colour after the value, which then takes the title weight. Render it in the
 * children of SelectValue.
 */
export function SelectValueDescription({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      className={cn(slotClass("select-value-description", props), className)}
      data-slot="select-value-description"
      {...props}
    />
  );
}

export function SelectItem({
  className,
  children,
  indicator,
  indicatorPosition,
  ...props
}: SelectItemProps): React.ReactElement {
  const { multiple, triggerSize } = React.useContext(SelectItemsContext);
  const mark = indicator ?? (multiple ? "checkbox" : "check");
  // The box in its rows is the Checkbox's sm box beside an sm
  // or md trigger and its md box beside a larger one, as in a Combobox.
  const boxSize = choiceMenuItemBoxSize(useResolvedControlSize(triggerSize));
  // The kit's one default: the check ends the row and the box leads it.
  const position =
    mark === "none"
      ? undefined
      : choiceIndicatorPosition(indicatorPosition, mark);
  const end = position === "end";
  // The descriptions follow the option's text; everything else, a leading
  // icon, avatar or status dot and the name, is the text Base UI shows and
  // types to.
  const content = React.Children.toArray(children);
  const descriptions = content.filter(
    (child) =>
      React.isValidElement(child) && child.type === SelectItemDescription,
  );
  const text = content.filter((child) => !descriptions.includes(child));
  const selection =
    mark === "none" ? null : (
      <SelectPrimitive.ItemIndicator
        className={cn(
          mark === "checkbox"
            ? "sp-select-item-checkbox inline-flex shrink-0 items-center justify-center"
            : "sp-select-item-indicator",
          end && "ms-auto",
        )}
        data-size={mark === "checkbox" ? boxSize : undefined}
        data-slot={
          mark === "checkbox" ? "select-item-checkbox" : "select-item-indicator"
        }
        keepMounted
      >
        {mark === "checkbox" ? (
          <CheckboxGlyph size={boxSize} />
        ) : (
          <ChoiceMenuItemCheck />
        )}
      </SelectPrimitive.ItemIndicator>
    );

  return (
    <SelectPrimitive.Item
      className={cn(
        slotClass("select-item", props),
        // Its height, padding, gap, corners, text and state, the cursor and
        // the fade of a disabled option included, are the option rule's that
        // Combobox and Autocomplete options share (design-rework.css).
        "flex items-center outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-indicator-position={position}
      data-slot="select-item"
      {...props}
    >
      {/* The text starts at the row's inline padding, where the trigger's
          value starts, and the check ends the row, as every list of the kit
          does (Lukas, 31 October 2026); the box of a multiple Select leads
          it. A leading icon, avatar or dot sits before the name. */}
      {end ? null : selection}
      <SelectPrimitive.ItemText
        className="sp-select-item-text flex min-w-0 items-center gap-2"
        data-slot="select-item-text"
      >
        {menuRowLabel(text)}
      </SelectPrimitive.ItemText>
      {descriptions}
      {end ? selection : null}
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({
  className,
  ...props
}: WithStringClassName<SelectPrimitive.Separator.Props>): React.ReactElement {
  return (
    <SelectPrimitive.Separator
      className={cn(slotClass("select-separator", props), className)}
      data-slot="select-separator"
      render={<Separator />}
      {...props}
    />
  );
}

export function SelectGroup(
  props: WithStringClassName<SelectPrimitive.Group.Props>,
): React.ReactElement {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      {...props}
      className={cn(slotClass("select-group", props), props.className)}
    />
  );
}

/**
 * The label of a Select. Like FieldLabel and Label it carries no outer
 * margin: the stack around it spaces it, as a Field's gap does (S10). Its
 * text, 14 px on a 20 px line in the label weight at every width (S13), its
 * colour and its disabled state are the labels' shared rules
 * (design-rework.css).
 */
export function SelectLabel({
  className,
  tooltip,
  tooltipLabel,
  ...props
}: WithStringClassName<SelectPrimitive.Label.Props> & {
  /**
   * Help for the select: a help icon after the label text that shows it in a
   * tooltip on hover and keyboard focus, as FieldLabel's `tooltip` does. It
   * stands beside the label, so it is no part of the trigger's name.
   */
  tooltip?: React.ReactNode;
  /**
   * The accessible name of the help icon of `tooltip`, such as "Plan help".
   * Defaults to "More information", as on FieldLabel.
   */
  tooltipLabel?: string | undefined;
}): React.ReactElement {
  const label = (
    <SelectPrimitive.Label
      className={cn(
        slotClass("select-label", props),
        "items-center gap-2",
        className,
      )}
      data-slot="select-label"
      {...props}
    />
  );
  if (!hasFieldHelp(tooltip)) return label;
  return (
    <span className="sp-field-label-row" data-slot="field-label-row">
      {label}
      <FieldHelp aria-label={tooltipLabel} slot="field-label-help">
        {tooltip}
      </FieldHelp>
    </span>
  );
}

export function SelectGroupLabel({
  className,
  ...props
}: WithStringClassName<SelectPrimitive.GroupLabel.Props>): React.ReactElement {
  return (
    <SelectPrimitive.GroupLabel
      className={cn(slotClass("select-group-label", props), className)}
      data-slot="select-group-label"
      {...props}
    />
  );
}

// SelectContent is an alias of SelectPopup.
export { SelectPrimitive, SelectPopup as SelectContent };
