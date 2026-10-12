"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ChevronRightIcon } from "lucide-react";
import type * as React from "react";

import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
} from "../../system/provider/siteplane-ui-provider";
import {
  ChoiceMenuItemCheck,
  choiceMenuItemCheckGridClassName,
  choiceMenuItemClassName,
  choiceMenuItemEndGridClassName,
  choiceMenuItemEndLabelClassName,
  choiceMenuItemLabelClassName,
  choiceMenuItemSwitchGridClassName,
  choiceMenuItemSwitchLabelClassName,
  choiceMenuSwitchSize,
  menuRowLabel,
} from "../../system/styles/choice-menu-item";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import {
  menuGroupLabelClassName,
  menuItemClassName,
  menuPopupVariantClassNames,
  menuPopupWidthClassNames,
  menuSeparatorClassName,
  menuShortcutClassName,
  menuSubTriggerClassName,
  type MenuPopupVariant,
  type MenuPopupWidth,
} from "./menu-shared";
import {
  switchMenuTrackClassName,
  switchThumbClassName,
  switchVariants,
} from "../switch/switch";

export const MenuCreateHandle: typeof MenuPrimitive.createHandle =
  MenuPrimitive.createHandle;
export const Menu: typeof MenuPrimitive.Root = MenuPrimitive.Root;
// Base UI's own Portal type, with className narrowed to a string.
export const MenuPortal: React.ForwardRefExoticComponent<
  WithStringClassName<Omit<MenuPrimitive.Portal.Props, "ref">> &
    React.RefAttributes<HTMLDivElement>
> = MenuPrimitive.Portal;

export function MenuTrigger({
  className,
  children,
  ...props
}: WithStringClassName<MenuPrimitive.Trigger.Props>) {
  return (
    <MenuPrimitive.Trigger
      className={className}
      data-slot="menu-trigger"
      {...props}
    >
      {children}
    </MenuPrimitive.Trigger>
  );
}

export function MenuPopup({
  children,
  className,
  sideOffset = 4,
  align = "center",
  alignOffset,
  side = "bottom",
  anchor,
  portalProps,
  width = "auto",
  variant = "default",
  ...props
}: WithStringClassName<MenuPrimitive.Popup.Props> & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"];
  side?: MenuPrimitive.Positioner.Props["side"];
  anchor?: MenuPrimitive.Positioner.Props["anchor"];
  portalProps?: WithStringClassName<MenuPrimitive.Portal.Props>;
  width?: MenuPopupWidth;
  variant?: MenuPopupVariant;
}) {
  return (
    <MenuPortal {...portalProps}>
      <SiteplaneUIPortalScope>
        <MenuPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          className="z-50"
          data-slot="menu-positioner"
          side={side}
          sideOffset={sideOffset}
        >
          <MenuPrimitive.Popup
            className={cn(
              menuPopupVariantClassNames[variant],
              menuPopupWidthClassNames[width],
              className,
            )}
            data-slot="menu-popup"
            data-variant={variant === "glass" ? variant : undefined}
            {...props}
          >
            <div className="max-h-(--available-height) w-full overflow-y-auto p-1">
              {children}
            </div>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </MenuPortal>
  );
}

export function MenuGroup(
  props: WithStringClassName<MenuPrimitive.Group.Props>,
) {
  return <MenuPrimitive.Group data-slot="menu-group" {...props} />;
}
export function MenuItem({
  className,
  children,
  inset,
  variant = "default",
  ...props
}: WithStringClassName<MenuPrimitive.Item.Props> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <MenuPrimitive.Item
      className={cn(menuItemClassName, className)}
      data-inset={inset || undefined}
      data-slot="menu-item"
      data-variant={variant}
      {...props}
    >
      {menuRowLabel(children)}
    </MenuPrimitive.Item>
  );
}
export function MenuLinkItem({
  className,
  children,
  inset,
  variant = "default",
  closeOnClick = true,
  ...props
}: WithStringClassName<MenuPrimitive.LinkItem.Props> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <MenuPrimitive.LinkItem
      className={cn(menuItemClassName, className)}
      closeOnClick={closeOnClick}
      data-inset={inset || undefined}
      data-slot="menu-link-item"
      data-variant={variant}
      {...props}
    >
      {menuRowLabel(children)}
    </MenuPrimitive.LinkItem>
  );
}
export function MenuCheckboxItem({
  className,
  children,
  checked,
  size,
  variant = "default",
  ...props
}: WithStringClassName<MenuPrimitive.CheckboxItem.Props> & {
  size?: SiteplaneControlSize;
  variant?: "default" | "switch";
}) {
  // The switch keeps the size that fits the compact row.
  const resolvedSize = size ?? choiceMenuSwitchSize;
  return (
    <MenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        choiceMenuItemClassName,
        variant === "switch"
          ? choiceMenuItemSwitchGridClassName
          : choiceMenuItemCheckGridClassName,
        className,
      )}
      data-size={resolvedSize}
      data-slot="menu-checkbox-item"
      data-variant={variant}
      {...props}
    >
      {variant === "switch" ? (
        <>
          <span className={choiceMenuItemSwitchLabelClassName}>
            {menuRowLabel(children)}
          </span>
          <MenuPrimitive.CheckboxItemIndicator
            className={cn(
              switchVariants({ size: resolvedSize }),
              switchMenuTrackClassName,
            )}
            data-foundation="switch"
            keepMounted
          >
            <span className={switchThumbClassName} data-slot="switch-thumb" />
          </MenuPrimitive.CheckboxItemIndicator>
        </>
      ) : (
        <>
          <MenuPrimitive.CheckboxItemIndicator
            className="col-start-1"
            keepMounted
          >
            <ChoiceMenuItemCheck />
          </MenuPrimitive.CheckboxItemIndicator>
          <span className={choiceMenuItemLabelClassName}>{children}</span>
        </>
      )}
    </MenuPrimitive.CheckboxItem>
  );
}
export function MenuRadioGroup(
  props: WithStringClassName<MenuPrimitive.RadioGroup.Props>,
) {
  return <MenuPrimitive.RadioGroup data-slot="menu-radio-group" {...props} />;
}
export function MenuRadioItem({
  className,
  children,
  indicatorPosition = "start",
  ...props
}: WithStringClassName<MenuPrimitive.RadioItem.Props> & {
  /**
   * Where the row shows its check: in the leading slot (`start`), or at the
   * end of the row (`end`) for identity rows that lead with a logo or an
   * avatar, such as the workspaces of a switcher.
   */
  indicatorPosition?: "start" | "end" | undefined;
}) {
  const end = indicatorPosition === "end";
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        choiceMenuItemClassName,
        end ? choiceMenuItemEndGridClassName : choiceMenuItemCheckGridClassName,
        className,
      )}
      data-indicator-position={end ? "end" : undefined}
      data-slot="menu-radio-item"
      {...props}
    >
      {end ? (
        <>
          <span className={choiceMenuItemEndLabelClassName}>
            {menuRowLabel(children)}
          </span>
          <MenuPrimitive.RadioItemIndicator className="col-start-2" keepMounted>
            <ChoiceMenuItemCheck />
          </MenuPrimitive.RadioItemIndicator>
        </>
      ) : (
        <>
          <MenuPrimitive.RadioItemIndicator className="col-start-1" keepMounted>
            <ChoiceMenuItemCheck />
          </MenuPrimitive.RadioItemIndicator>
          <span className={choiceMenuItemLabelClassName}>{children}</span>
        </>
      )}
    </MenuPrimitive.RadioItem>
  );
}
export function MenuGroupLabel({
  className,
  inset,
  ...props
}: WithStringClassName<MenuPrimitive.GroupLabel.Props> & { inset?: boolean }) {
  return (
    <MenuPrimitive.GroupLabel
      className={cn(menuGroupLabelClassName, className)}
      data-inset={inset || undefined}
      data-slot="menu-label"
      {...props}
    />
  );
}
export function MenuSeparator({
  className,
  ...props
}: WithStringClassName<MenuPrimitive.Separator.Props>) {
  return (
    <MenuPrimitive.Separator
      className={cn(menuSeparatorClassName, className)}
      data-slot="menu-separator"
      {...props}
    />
  );
}
export function MenuShortcut({
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(menuShortcutClassName, className)}
      data-slot="menu-shortcut"
      {...props}
    />
  );
}
export function MenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="menu-sub" {...props} />;
}
export function MenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: WithStringClassName<MenuPrimitive.SubmenuTrigger.Props> & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      className={cn(menuSubTriggerClassName, className)}
      data-inset={inset || undefined}
      data-slot="menu-sub-trigger"
      {...props}
    >
      {menuRowLabel(children)}
      <ChevronRightIcon />
    </MenuPrimitive.SubmenuTrigger>
  );
}
export function MenuSubPopup({
  className,
  sideOffset = 0,
  alignOffset,
  align = "start",
  ...props
}: WithStringClassName<MenuPrimitive.Popup.Props> & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"];
  width?: MenuPopupWidth;
  variant?: MenuPopupVariant;
}) {
  const defaultAlignOffset = align !== "center" ? -5 : undefined;
  return (
    <MenuPopup
      align={align}
      alignOffset={alignOffset ?? defaultAlignOffset}
      className={className}
      data-slot="menu-sub-content"
      side="inline-end"
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export {
  MenuPrimitive,
  MenuCreateHandle as DropdownMenuCreateHandle,
  Menu as DropdownMenu,
  MenuPortal as DropdownMenuPortal,
  MenuTrigger as DropdownMenuTrigger,
  MenuPopup as DropdownMenuContent,
  MenuGroup as DropdownMenuGroup,
  MenuItem as DropdownMenuItem,
  MenuCheckboxItem as DropdownMenuCheckboxItem,
  MenuRadioGroup as DropdownMenuRadioGroup,
  MenuRadioItem as DropdownMenuRadioItem,
  MenuGroupLabel as DropdownMenuLabel,
  MenuSeparator as DropdownMenuSeparator,
  MenuShortcut as DropdownMenuShortcut,
  MenuSub as DropdownMenuSub,
  MenuSubTrigger as DropdownMenuSubTrigger,
  MenuSubPopup as DropdownMenuSubContent,
};
