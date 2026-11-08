"use client";

import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";

import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import {
  type ChoiceIndicatorPosition,
  ChoiceMenuItemContent,
  choiceIndicatorPosition,
  choiceMenuItemClassName,
  choiceMenuItemGridClassNames,
  choiceMenuItemRadioCloseProps,
  choiceMenuItemSwitchCloseProps,
  choiceMenuItemSwitchGridClassName,
  choiceMenuItemSwitchLabelClassName,
  menuRowLabel,
} from "../../system/styles/choice-menu-item";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { switchThumbClassName, switchTrackClassName } from "../switch/switch";
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
} from "../menu/menu-shared";

type ContextMenuTriggerArea = {
  element: HTMLElement | null;
  setElement: (element: HTMLElement | null) => void;
};

// Base UI anchors the popup to the pointer, which has no width. The root
// shares the trigger area so the trigger-based popup widths can measure it.
const ContextMenuTriggerAreaContext =
  React.createContext<ContextMenuTriggerArea | null>(null);

export function ContextMenu(
  props: ContextMenuPrimitive.Root.Props,
): React.ReactElement {
  const [element, setElement] = React.useState<HTMLElement | null>(null);
  const triggerArea = React.useMemo(() => ({ element, setElement }), [element]);
  return (
    <ContextMenuTriggerAreaContext.Provider value={triggerArea}>
      <ContextMenuPrimitive.Root {...props} />
    </ContextMenuTriggerAreaContext.Provider>
  );
}
// Base UI's own Portal type, with className narrowed to a string.
export const ContextMenuPortal: React.ForwardRefExoticComponent<
  WithStringClassName<Omit<ContextMenuPrimitive.Portal.Props, "ref">> &
    React.RefAttributes<HTMLDivElement>
> = ContextMenuPrimitive.Portal;

export function ContextMenuTrigger({
  className,
  children,
  ref,
  ...props
}: WithStringClassName<ContextMenuPrimitive.Trigger.Props>) {
  const setTriggerArea = React.useContext(
    ContextMenuTriggerAreaContext,
  )?.setElement;
  const triggerRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      setTriggerArea?.(element);
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref, setTriggerArea],
  );
  return (
    <ContextMenuPrimitive.Trigger
      className={cn(slotClass("context-menu-trigger", props), className)}
      data-slot="context-menu-trigger"
      ref={triggerRef}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Trigger>
  );
}

function useElementWidth(element: HTMLElement | null): number | undefined {
  const [width, setWidth] = React.useState<number>();
  React.useEffect(() => {
    if (!element) return;
    const measure = () => setWidth(element.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return element ? width : undefined;
}

const contextMenuTriggerAreaWidthClassNames: Record<MenuPopupWidth, string> = {
  ...menuPopupWidthClassNames,
  trigger: "min-w-0 w-(--context-menu-trigger-width) max-w-(--available-width)",
  "at-least-trigger":
    "min-w-(--context-menu-trigger-width) w-max max-w-[min(max(--spacing(80),var(--context-menu-trigger-width)),var(--available-width))]",
};
export function ContextMenuPopup({
  children,
  className,
  sideOffset = 0,
  align = "start",
  alignOffset,
  side = "bottom",
  anchor,
  portalProps,
  width = "auto",
  variant = "default",
  ...props
}: WithStringClassName<ContextMenuPrimitive.Popup.Props> & {
  align?: ContextMenuPrimitive.Positioner.Props["align"];
  sideOffset?: ContextMenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: ContextMenuPrimitive.Positioner.Props["alignOffset"];
  side?: ContextMenuPrimitive.Positioner.Props["side"];
  anchor?: ContextMenuPrimitive.Positioner.Props["anchor"];
  portalProps?: WithStringClassName<ContextMenuPrimitive.Portal.Props>;
  width?: MenuPopupWidth;
  variant?: MenuPopupVariant;
}) {
  // A custom anchor or a submenu trigger has a real width; only the pointer
  // anchor falls back to the trigger area.
  const triggerArea = React.useContext(ContextMenuTriggerAreaContext);
  const measuresTriggerArea =
    triggerArea !== null &&
    anchor === undefined &&
    (width === "trigger" || width === "at-least-trigger");
  const triggerAreaWidth = useElementWidth(
    measuresTriggerArea ? triggerArea.element : null,
  );
  return (
    <ContextMenuPortal {...portalProps}>
      <SiteplaneUIPortalScope>
        <ContextMenuPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          className="sp-context-menu-positioner z-50"
          data-slot="context-menu-positioner"
          side={side}
          sideOffset={sideOffset}
          style={
            triggerAreaWidth === undefined
              ? undefined
              : ({
                  "--context-menu-trigger-width": `${triggerAreaWidth}px`,
                } as React.CSSProperties)
          }
        >
          <ContextMenuPrimitive.Popup
            className={cn(
              slotClass("context-menu-popup", props),
              menuPopupVariantClassNames[variant],
              measuresTriggerArea
                ? contextMenuTriggerAreaWidthClassNames[width]
                : menuPopupWidthClassNames[width],
              className,
            )}
            data-slot="context-menu-popup"
            data-variant={variant === "glass" ? variant : undefined}
            {...props}
          >
            {/* The list of a MenuPopup: 6 px beside the rows, 4 px above and
                below them, one grid column (menu.tsx). */}
            <div className="sp-menu-list grid max-h-(--available-height) w-full grid-cols-1 overflow-y-auto">
              {children}
            </div>
          </ContextMenuPrimitive.Popup>
        </ContextMenuPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </ContextMenuPortal>
  );
}
export function ContextMenuGroup(
  props: WithStringClassName<ContextMenuPrimitive.Group.Props>,
) {
  return (
    <ContextMenuPrimitive.Group
      data-slot="context-menu-group"
      {...props}
      className={cn(slotClass("context-menu-group", props), props.className)}
    />
  );
}
export function ContextMenuItem({
  className,
  children,
  inset,
  variant = "default",
  ...props
}: WithStringClassName<ContextMenuPrimitive.Item.Props> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        slotClass("context-menu-item", props),
        menuItemClassName,
        className,
      )}
      data-inset={inset || undefined}
      data-slot="context-menu-item"
      data-variant={variant}
      {...props}
    >
      {menuRowLabel(children)}
    </ContextMenuPrimitive.Item>
  );
}
export function ContextMenuLinkItem({
  className,
  children,
  inset,
  variant = "default",
  closeOnClick = true,
  ...props
}: WithStringClassName<ContextMenuPrimitive.LinkItem.Props> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <ContextMenuPrimitive.LinkItem
      className={cn(
        slotClass("context-menu-link-item", props),
        menuItemClassName,
        className,
      )}
      closeOnClick={closeOnClick}
      data-inset={inset || undefined}
      data-slot="context-menu-link-item"
      data-variant={variant}
      {...props}
    >
      {menuRowLabel(children)}
    </ContextMenuPrimitive.LinkItem>
  );
}
export function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  variant = "default",
  ...props
}: WithStringClassName<ContextMenuPrimitive.CheckboxItem.Props> & {
  /**
   * `switch` ends the row with the Switch in place of the check. A switch row
   * keeps the menu open when it is pressed, whatever `closeOnClick` says.
   */
  variant?: "default" | "switch";
}) {
  // The check ends the row, as the switch does (I8).
  const position = choiceIndicatorPosition(undefined);
  return (
    <ContextMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        slotClass("context-menu-checkbox-item", props),
        choiceMenuItemClassName,
        variant === "switch"
          ? choiceMenuItemSwitchGridClassName
          : choiceMenuItemGridClassNames[position],
        className,
      )}
      data-indicator-position={position}
      data-slot="context-menu-checkbox-item"
      data-variant={variant}
      {...props}
      {...choiceMenuItemSwitchCloseProps(variant)}
    >
      {variant === "switch" ? (
        <>
          <span className={choiceMenuItemSwitchLabelClassName}>
            {menuRowLabel(children)}
          </span>
          <ContextMenuPrimitive.CheckboxItemIndicator
            className={cn("sp-base-switch", switchTrackClassName)}
            data-foundation="switch"
            data-slot="switch-track"
            keepMounted
          >
            <span
              className={cn("sp-switch-thumb", switchThumbClassName)}
              data-slot="switch-thumb"
            />
          </ContextMenuPrimitive.CheckboxItemIndicator>
        </>
      ) : (
        <ChoiceMenuItemContent
          indicator={ContextMenuPrimitive.CheckboxItemIndicator}
          position={position}
        >
          {children}
        </ChoiceMenuItemContent>
      )}
    </ContextMenuPrimitive.CheckboxItem>
  );
}
export function ContextMenuRadioGroup(
  props: WithStringClassName<ContextMenuPrimitive.RadioGroup.Props>,
) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
      className={cn(
        slotClass("context-menu-radio-group", props),
        props.className,
      )}
    />
  );
}
export function ContextMenuRadioItem({
  className,
  children,
  closeOnClick,
  indicatorPosition,
  ...props
}: WithStringClassName<ContextMenuPrimitive.RadioItem.Props> & {
  /**
   * Whether picking the row closes the menu. It does by default, as a single
   * choice does in a Select; `false` keeps the menu open.
   */
  closeOnClick?: boolean | undefined;
  /**
   * Where the row shows its check: at the end of the row, the default of
   * every list of the kit, while a logo, an avatar or an icon passed first
   * takes the leading slot; or in the leading slot (`start`).
   */
  indicatorPosition?: ChoiceIndicatorPosition | undefined;
}) {
  const position = choiceIndicatorPosition(indicatorPosition);
  return (
    <ContextMenuPrimitive.RadioItem
      className={cn(
        slotClass("context-menu-radio-item", props),
        choiceMenuItemClassName,
        choiceMenuItemGridClassNames[position],
        className,
      )}
      data-indicator-position={position}
      data-slot="context-menu-radio-item"
      {...props}
      {...choiceMenuItemRadioCloseProps(closeOnClick)}
    >
      <ChoiceMenuItemContent
        indicator={ContextMenuPrimitive.RadioItemIndicator}
        position={position}
      >
        {children}
      </ChoiceMenuItemContent>
    </ContextMenuPrimitive.RadioItem>
  );
}
export function ContextMenuGroupLabel({
  className,
  inset,
  ...props
}: WithStringClassName<ContextMenuPrimitive.GroupLabel.Props> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.GroupLabel
      className={cn(
        slotClass("context-menu-label", props),
        menuGroupLabelClassName,
        className,
      )}
      data-inset={inset || undefined}
      data-slot="context-menu-label"
      {...props}
    />
  );
}
export function ContextMenuSeparator({
  className,
  ...props
}: WithStringClassName<ContextMenuPrimitive.Separator.Props>) {
  return (
    <ContextMenuPrimitive.Separator
      className={cn(
        slotClass("context-menu-separator", props),
        menuSeparatorClassName,
        className,
      )}
      data-slot="context-menu-separator"
      {...props}
    />
  );
}
/**
 * The supporting text of a row: the description of a Menu row
 * (MenuItemDescription). A direct child of the row, after its text.
 */
export function ContextMenuItemDescription({
  className,
  stacked,
  ...props
}: React.ComponentProps<"span"> & {
  /**
   * Puts the description under the name instead of after it, in one column
   * beside the row's avatar or icon, as an account list shows a name over its
   * email. The row's name and description stay on one line each.
   */
  stacked?: boolean | undefined;
}) {
  return (
    <span
      className={cn(
        slotClass("context-menu-item-description", props),
        "min-w-0 truncate",
        className,
      )}
      data-layout={stacked ? "stacked" : undefined}
      data-slot="context-menu-item-description"
      {...props}
    />
  );
}
export function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        slotClass("context-menu-shortcut", props),
        menuShortcutClassName,
        className,
      )}
      data-slot="context-menu-shortcut"
      {...props}
    />
  );
}
export function ContextMenuSub(props: ContextMenuPrimitive.SubmenuRoot.Props) {
  return (
    <ContextMenuPrimitive.SubmenuRoot data-slot="context-menu-sub" {...props} />
  );
}
export function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: WithStringClassName<ContextMenuPrimitive.SubmenuTrigger.Props> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      className={cn(
        slotClass("context-menu-sub-trigger", props),
        menuSubTriggerClassName,
        className,
      )}
      data-inset={inset || undefined}
      data-slot="context-menu-sub-trigger"
      {...props}
    >
      {menuRowLabel(children)}
      <CaretRightIcon aria-hidden="true" />
    </ContextMenuPrimitive.SubmenuTrigger>
  );
}
export function ContextMenuSubPopup({
  className,
  sideOffset = 0,
  alignOffset,
  align = "start",
  ...props
}: WithStringClassName<ContextMenuPrimitive.Popup.Props> & {
  align?: ContextMenuPrimitive.Positioner.Props["align"];
  sideOffset?: ContextMenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: ContextMenuPrimitive.Positioner.Props["alignOffset"];
  width?: MenuPopupWidth;
  variant?: MenuPopupVariant;
}) {
  const defaultAlignOffset = align !== "center" ? -5 : undefined;
  // A submenu is anchored to its trigger row, which Base UI measures.
  return (
    <ContextMenuTriggerAreaContext.Provider value={null}>
      <ContextMenuPopup
        align={align}
        alignOffset={alignOffset ?? defaultAlignOffset}
        className={className}
        data-slot="context-menu-sub-content"
        side="inline-end"
        sideOffset={sideOffset}
        {...props}
      />
    </ContextMenuTriggerAreaContext.Provider>
  );
}

export { ContextMenuPrimitive };
