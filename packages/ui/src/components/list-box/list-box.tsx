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
import { cn } from "../../system/utils/cn";
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

function getTextValue(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : React.isValidElement<{ children?: React.ReactNode }>(child)
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
        className={cn(className)}
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
  textValue?: string;
  value: string;
}

export function ListBoxItem({
  "data-slot": dataSlot = "list-box-item",
  children,
  className,
  disabled = false,
  multiline = true,
  textValue,
  value,
  ...props
}: ListBoxItemProps): React.ReactElement {
  const context = React.useContext(ListBoxVisualContext);

  if (!context) {
    throw new Error("ListBoxItem must be rendered inside ListBox.");
  }

  return (
    <Button
      {...props}
      align="start"
      className={cn(
        "group siteplane-list-box-item",
        // The row owns the selected state (list-box.css); its check draws
        // through the shared check motion (motion.css), which reads that state
        // from the row.
        context.selectionAppearance === "check" && "siteplane-check-item",
        className,
      )}
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
      {/* The check leads the row, as in Select, Combobox and the menus (I8).
          Every option keeps its slot, so every label starts at the same x. */}
      {context.selectionAppearance === "check" ? (
        <svg
          aria-hidden="true"
          className="siteplane-check-glyph-motion size-3.5 shrink-0 fill-none stroke-current"
          data-slot="list-box-check"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.25"
          viewBox="0 0 24 24"
        >
          <path
            className="siteplane-check-path-motion"
            d="M5.252 12.7 10.2 18.63 18.748 5.37"
          />
        </svg>
      ) : null}
      {children}
    </Button>
  );
}
