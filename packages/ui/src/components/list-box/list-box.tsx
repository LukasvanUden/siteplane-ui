"use client";

import * as React from "react";
import {
  ListBox as ListBoxPrimitive,
  ListBoxItem as ListBoxItemPrimitive,
  type Selection,
} from "react-aria-components";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  type ChoiceIndicatorPosition,
  ChoiceMenuItemCheck,
  choiceIndicatorPosition,
  menuRowStack,
} from "../../system/styles/choice-menu-item";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button, type ButtonBaseProps } from "../button";

import "./list-box.css";

export type ListBoxSelectionAppearance = "check" | "row";

type ListBoxVisualContextValue = {
  selectionAppearance: ListBoxSelectionAppearance;
  size: SiteplaneControlSize;
};

const ListBoxVisualContext =
  React.createContext<ListBoxVisualContextValue | null>(null);

function getSelectionValue(selection: Selection): string | undefined {
  if (selection === "all") return undefined;
  const value = selection.values().next().value;
  return value === undefined ? undefined : String(value);
}

// The text that typing finds: the row's own text, without its description,
// as a Select option leaves its description out.
function getTextValue(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : React.isValidElement<{ children?: React.ReactNode }>(child) &&
            child.type !== ListBoxItemDescription
          ? getTextValue(child.props.children)
          : "",
    )
    .join(" ")
    .trim();
}

export interface ListBoxProps extends Omit<
  React.ComponentProps<"div">,
  "aria-orientation" | "defaultValue" | "role"
> {
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  selectionAppearance?: ListBoxSelectionAppearance | undefined;
  size?: SiteplaneControlSize | undefined;
  value?: string | undefined;
}

export function ListBox({
  children,
  className,
  defaultValue,
  onValueChange,
  selectionAppearance = "check",
  size,
  value,
  ...props
}: ListBoxProps): React.ReactElement {
  const controlled = value !== undefined;
  const resolvedSize = useResolvedControlSize(size);
  const visualContext = React.useMemo(
    () => ({ selectionAppearance, size: resolvedSize }),
    [resolvedSize, selectionAppearance],
  );

  return (
    <ListBoxVisualContext.Provider value={visualContext}>
      <ListBoxPrimitive
        {...(props as React.ComponentProps<typeof ListBoxPrimitive>)}
        className={cn("sp-list-box sp-base-list-box", className)}
        data-foundation="list-box"
        data-selection-appearance={selectionAppearance}
        data-size={resolvedSize}
        data-slot="list-box"
        {...(controlled || defaultValue === undefined
          ? {}
          : { defaultSelectedKeys: [defaultValue] })}
        disallowEmptySelection
        onSelectionChange={(selection) => {
          const nextValue = getSelectionValue(selection);
          if (nextValue !== undefined) onValueChange?.(nextValue);
        }}
        orientation="vertical"
        {...(controlled ? { selectedKeys: [value] } : {})}
        selectionBehavior="replace"
        selectionMode="single"
        shouldFocusWrap
      >
        {children}
      </ListBoxPrimitive>
    </ListBoxVisualContext.Provider>
  );
}

export interface ListBoxItemProps extends Omit<
  ButtonBaseProps,
  | "align"
  | "aria-disabled"
  | "aria-selected"
  | "onClick"
  | "onKeyDown"
  | "role"
  | "render"
  | "size"
  | "tabIndex"
  | "value"
  | "variant"
  | "width"
> {
  "data-slot"?: string;
  /**
   * Where a row shows that it is chosen, with `selectionAppearance="check"`:
   * at the end of the row, the default of every list of the kit, or at the
   * start.
   */
  indicatorPosition?: ChoiceIndicatorPosition | undefined;
  textValue?: string;
  value: string;
}

export function ListBoxItem({
  "data-slot": dataSlot = "list-box-item",
  children,
  className,
  disabled = false,
  indicatorPosition,
  multiline = true,
  textValue,
  value,
  ...props
}: ListBoxItemProps): React.ReactElement {
  const context = React.useContext(ListBoxVisualContext);

  if (!context) {
    throw new Error("ListBoxItem must be rendered inside ListBox.");
  }
  // The kit's one default (I8): the check ends the row.
  const position = choiceIndicatorPosition(indicatorPosition);
  const check =
    context.selectionAppearance === "check" ? (
      <ChoiceMenuItemCheck
        className={cn(
          "sp-list-box-check shrink-0",
          position === "end" && "ms-auto",
        )}
        data-slot="list-box-check"
      />
    ) : null;

  return (
    <Button
      {...props}
      align="start"
      className={cn(
        "group sp-list-box-item",
        // The row owns the selected state (list-box.css); its check draws
        // through the shared check motion (motion.css), which reads that state
        // from the row.
        context.selectionAppearance === "check" && "sp-check-item",
        className,
      )}
      data-indicator-position={check ? position : undefined}
      data-selection-appearance={context.selectionAppearance}
      data-slot={dataSlot}
      disabled={disabled}
      multiline={multiline}
      render={
        <ListBoxItemPrimitive
          id={value}
          isDisabled={disabled}
          textValue={textValue ?? getTextValue(children)}
        />
      }
      size={context.size}
      variant="ghost"
      width="full"
    >
      {/* The label starts at the row's padding and the check ends the row,
          as in Select, Combobox and the menus (I8, Lukas, 31 October 2026).
          It is the kit's check (choice-menu-item.tsx), sized by the option
          rule of design-rework.css. A stacked description stands under the
          name in one column, as in a Menu row (menuRowStack). */}
      {position === "start" ? check : null}
      {menuRowStack(children)}
      {position === "end" ? check : null}
    </Button>
  );
}

/**
 * The supporting text of a row, such as what a workspace holds beside its
 * name: the regular weight in the tertiary colour at the row's size, after
 * the name, which then takes the title weight, as the description of a Menu
 * row or a Select option (design-rework.css). A direct child of ListBoxItem,
 * after the row's text. Typing finds the row by its name alone, so a row with
 * a description needs no `textValue`.
 */
export function ListBoxItemDescription({
  className,
  stacked,
  ...props
}: React.ComponentProps<"span"> & {
  /**
   * Puts the description under the name instead of after it, in one column
   * beside the row's icon or avatar. The name and the description stay on
   * one line each.
   */
  stacked?: boolean | undefined;
}): React.ReactElement {
  return (
    <span
      className={cn(
        slotClass("list-box-item-description", props),
        "min-w-0 truncate",
        className,
      )}
      data-layout={stacked ? "stacked" : undefined}
      data-slot="list-box-item-description"
      {...props}
    />
  );
}
