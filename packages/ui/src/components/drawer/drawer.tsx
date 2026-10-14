"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRightIcon, XIcon } from "lucide-react";
import type React from "react";
import { createContext, useContext } from "react";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { surfaceClassNames } from "../../system/styles/surface";
import { KitButton } from "../button/button-internal";
import {
  menuGroupLabelClassName,
  menuSeparatorClassName,
} from "./drawer-menu-shared";
import { type CheckboxProps } from "../checkbox";
import { KitCheckbox } from "../checkbox/checkbox-internal";
import { type RadioGroupProps, type RadioProps } from "../radio-group";
import { KitRadioGroup, KitRadio } from "../radio-group/radio-group-internal";
import { ScrollArea } from "../scroll-area";
import { type SwitchProps } from "../switch";
import { KitSwitch } from "../switch/switch-internal";
import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";

import "./drawer.css";

type DrawerPosition = "right" | "left" | "top" | "bottom";

const DrawerContext: React.Context<{ position: DrawerPosition }> =
  createContext<{ position: DrawerPosition }>({
    position: "bottom",
  });

const directionMap: Record<
  DrawerPosition,
  DrawerPrimitive.Root.Props["swipeDirection"]
> = {
  bottom: "down",
  left: "left",
  right: "right",
  top: "up",
};

export const DrawerCreateHandle: typeof DrawerPrimitive.createHandle =
  DrawerPrimitive.createHandle;

export function Drawer({
  swipeDirection,
  position = "bottom",
  ...props
}: DrawerPrimitive.Root.Props & {
  position?: DrawerPosition;
}): React.ReactElement {
  return (
    <DrawerContext.Provider value={{ position }}>
      <DrawerPrimitive.Root
        swipeDirection={swipeDirection ?? directionMap[position]}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

// Base UI's own Portal type, with className narrowed to a string.
export const DrawerPortal: (
  props: WithStringClassName<Omit<DrawerPrimitive.Portal.Props, "ref">> &
    React.RefAttributes<HTMLDivElement>,
) => React.JSX.Element | null = DrawerPrimitive.Portal;

export function DrawerTrigger(
  props: WithStringClassName<DrawerPrimitive.Trigger.Props>,
): React.ReactElement {
  return (
    <DrawerPrimitive.Trigger
      data-slot="drawer-trigger"
      {...props}
      className={cn(slotClass("drawer-trigger", props), props.className)}
    />
  );
}

export function DrawerClose(
  props: WithStringClassName<DrawerPrimitive.Close.Props>,
): React.ReactElement {
  return (
    <DrawerPrimitive.Close
      data-slot="drawer-close"
      {...props}
      className={cn(slotClass("drawer-close", props), props.className)}
    />
  );
}

export function DrawerSwipeArea({
  className,
  position: positionProp,
  ...props
}: WithStringClassName<DrawerPrimitive.SwipeArea.Props> & {
  position?: DrawerPosition;
}): React.ReactElement {
  const { position: contextPosition } = useContext(DrawerContext);
  const position = positionProp ?? contextPosition;

  return (
    <DrawerPrimitive.SwipeArea
      className={cn(
        slotClass("drawer-swipe-area", props),
        "fixed z-50 touch-none",
        position === "bottom" && "inset-x-0 bottom-0 h-8",
        position === "top" && "inset-x-0 top-0 h-8",
        position === "left" && "inset-y-0 left-0 w-8",
        position === "right" && "inset-y-0 right-0 w-8",
        className,
      )}
      data-slot="drawer-swipe-area"
      {...props}
    />
  );
}

export function DrawerBackdrop({
  className,
  ...props
}: WithStringClassName<DrawerPrimitive.Backdrop.Props>): React.ReactElement {
  return (
    <DrawerPrimitive.Backdrop
      className={cn(
        // The fade is drawer.css's, so reduced motion can make it instant.
        slotClass("drawer-backdrop", props),
        "fixed inset-0 z-50 opacity-[calc(1-var(--drawer-swipe-progress))] data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute",
        className,
      )}
      data-slot="drawer-backdrop"
      {...props}
    />
  );
}

export function DrawerViewport({
  className,
  position,
  variant = "default",
  ...props
}: WithStringClassName<DrawerPrimitive.Viewport.Props> & {
  position?: DrawerPosition;
  variant?: "default" | "straight" | "inset";
}): React.ReactElement {
  return (
    <DrawerPrimitive.Viewport
      className={cn(
        slotClass("drawer-viewport", props),
        "fixed inset-0 z-50 [--bleed:--spacing(12)] [--inset:0px]",
        "touch-none",
        position === "bottom" && "grid grid-rows-[1fr_auto] pt-12",
        position === "top" && "grid grid-rows-[auto_1fr] pb-12",
        position === "left" && "flex justify-start",
        position === "right" && "flex justify-end",
        variant === "inset" && "px-(--inset) sm:[--inset:--spacing(4)]",
        variant === "inset" && position !== "bottom" && "pt-(--inset)",
        variant === "inset" && position !== "top" && "pb-(--inset)",
        className,
      )}
      data-slot="drawer-viewport"
      {...props}
    />
  );
}

export function DrawerPopup({
  className,
  children,
  elevation = "default",
  showCloseButton = false,
  position: positionProp,
  variant = "default",
  width,
  showBar = false,
  closeProps,
  portalProps,
  ...props
}: WithStringClassName<DrawerPrimitive.Popup.Props> & {
  elevation?: "default" | "none";
  showCloseButton?: boolean;
  position?: DrawerPosition;
  variant?: "default" | "straight" | "inset";
  /**
   * Width of a bottom or top panel on a wide screen. `readable` caps it at
   * `max-w-lg` (512 px) and centres it; `full` spans the whole edge. A `straight` panel stays attached along the whole edge, so it is
   * `full` unless you ask for `readable`. Left and right panels keep their own
   * width.
   */
  width?: "readable" | "full";
  showBar?: boolean;
  closeProps?: WithStringClassName<DrawerPrimitive.Close.Props>;
  portalProps?: WithStringClassName<DrawerPrimitive.Portal.Props>;
}): React.ReactElement {
  const { position: contextPosition } = useContext(DrawerContext);
  const position = positionProp ?? contextPosition;
  const resolvedElevation = variant === "straight" ? "none" : elevation;
  const resolvedWidth = width ?? (variant === "straight" ? "full" : "readable");

  return (
    <DrawerPortal {...portalProps}>
      <SiteplaneUIPortalScope>
        <DrawerBackdrop />
        <DrawerViewport position={position} variant={variant}>
          <DrawerPrimitive.Popup
            className={cn(
              slotClass("drawer-popup", props),
              surfaceClassNames.edgeOverlay,
              "flex max-h-full min-h-0 w-full min-w-0 flex-col outline-none will-change-transform [--peek:calc(--spacing(6)-1px)] [--scale-base:calc(max(0,1-(var(--nested-drawers)*var(--stack-step))))] [--scale:clamp(0,calc(var(--scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--shrink:calc(1-var(--scale))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-step:0.05] after:pointer-events-none after:absolute data-swiping:select-none data-nested-drawer-open:overflow-hidden data-nested-drawer-open:bg-[color-mix(in_srgb,var(--sp-rw-surface-color),var(--color-black)_calc(2%*(var(--nested-drawers)-var(--stack-progress))))] data-ending-style:shadow-transparent data-starting-style:shadow-transparent dark:data-nested-drawer-open:bg-[color-mix(in_srgb,var(--sp-rw-surface-color),var(--color-black)_calc(6%*(var(--nested-drawers)-var(--stack-progress))))]",
              "touch-none",
              position === "bottom" &&
                "transform-[translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] data-ending-style:transform-[translateY(calc(100%+env(safe-area-inset-bottom,0px)+var(--inset)))] data-starting-style:transform-[translateY(calc(100%+env(safe-area-inset-bottom,0px)+var(--inset)))] row-start-2 -mb-[max(0px,calc(var(--drawer-snap-point-offset,0px)+clamp(0,1,var(--drawer-snap-point-offset,0px)/1px)*var(--drawer-swipe-movement-y,0px)))] pb-[max(0px,calc(env(safe-area-inset-bottom,0px)+var(--drawer-snap-point-offset,0px)+clamp(0,1,var(--drawer-snap-point-offset,0px)/1px)*var(--drawer-swipe-movement-y,0px)))] after:inset-x-0 after:top-full after:h-(--bleed) has-data-[slot=drawer-bar]:pt-2 data-ending-style:mb-0 data-starting-style:mb-0 data-ending-style:pb-0 data-starting-style:pb-0",
              position === "top" &&
                "data-starting-style:transform-[translateY(calc(-100%-var(--inset)))] data-ending-style:transform-[translateY(calc(-100%-var(--inset)))] transform-[translateY(var(--drawer-swipe-movement-y))] after:inset-x-0 after:bottom-full after:h-(--bleed) has-data-[slot=drawer-bar]:pb-2",
              position === "left" &&
                "data-starting-style:transform-[translateX(calc(-100%-var(--inset)))] data-ending-style:transform-[translateX(calc(-100%-var(--inset)))] transform-[translateX(var(--drawer-swipe-movement-x))] w-[calc(100%-(--spacing(12)))] max-w-md after:inset-y-0 after:end-full after:w-(--bleed) has-data-[slot=drawer-bar]:pe-2",
              position === "right" &&
                "transform-[translateX(var(--drawer-swipe-movement-x))] data-ending-style:transform-[translateX(calc(100%+var(--inset)))] data-starting-style:transform-[translateX(calc(100%+var(--inset)))] col-start-2 w-[calc(100%-(--spacing(12)))] max-w-md after:inset-y-0 after:start-full after:w-(--bleed) has-data-[slot=drawer-bar]:ps-2",
              variant === "default" &&
                cn(
                  position === "bottom" && "before:rounded-t-[inherit]",
                  position === "top" && "before:rounded-b-[inherit]",
                  position === "left" && "before:rounded-e-[inherit]",
                  position === "right" && "before:rounded-s-[inherit]",
                ),
              variant === "inset" && "sm:before:rounded-[inherit]",
              variant === "straight" && "[--stack-step:0]",
              (position === "bottom" || position === "top") &&
                "h-(--drawer-height,auto) [--height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))))] data-nested-drawer-open:h-(--height)",
              // On a wide screen a bottom or top sheet keeps a readable width
              // of 512 px and centres itself; `width="full"` lets it span the
              // whole edge, as a straight sheet does by default.
              (position === "bottom" || position === "top") &&
                resolvedWidth === "readable" &&
                "mx-auto max-w-lg",
              position === "bottom" &&
                "data-nested-drawer-open:transform-[translateY(calc(var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))] origin-[50%_calc(100%-var(--inset))]",
              position === "top" &&
                "data-nested-drawer-open:transform-[translateY(calc(var(--drawer-swipe-movement-y)+var(--stack-peek-offset)+(var(--shrink)*var(--height))))_scale(var(--scale))] origin-[50%_var(--inset)]",
              position === "left" &&
                "data-nested-drawer-open:transform-[translateX(calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)))_scale(var(--scale))] origin-right",
              position === "right" &&
                "data-nested-drawer-open:transform-[translateX(calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)))_scale(var(--scale))] origin-left",
              className,
            )}
            data-position={position}
            data-elevation={resolvedElevation}
            data-slot="drawer-popup"
            data-variant={variant}
            {...props}
          >
            {children}
            {/* The grab strip spans its whole edge; the close button comes
                after it, so it paints and takes clicks above the strip. */}
            {showBar && <DrawerBar />}
            {showCloseButton && (
              <DrawerPrimitive.Close
                aria-label="Close"
                className="absolute end-2 top-2"
                render={
                  <KitButton
                    profile="overlay-dismiss"
                    shape="square"
                    variant="ghost"
                  />
                }
                {...closeProps}
              >
                <XIcon />
              </DrawerPrimitive.Close>
            )}
          </DrawerPrimitive.Popup>
        </DrawerViewport>
      </SiteplaneUIPortalScope>
    </DrawerPortal>
  );
}

// Base UI's bare content part: in it a pointer selects text instead of
// swiping the drawer. The header, footer and panel take it with
// allowSelection.
const SelectableContent = DrawerPrimitive.Content;

export function DrawerHeader({
  className,
  allowSelection = false,
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  allowSelection?: boolean;
}): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("drawer-header", props, render),
      "flex flex-col",
      !allowSelection && "cursor-default",
      className,
    ),
    "data-slot": "drawer-header",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render: allowSelection ? <SelectableContent render={render} /> : render,
  });
}

export function DrawerFooter({
  className,
  allowSelection = true,
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  allowSelection?: boolean;
}): React.ReactElement {
  const defaultProps = {
    className: cn(
      // Actions that do not fit wrap onto another row with the same gap instead
      // of overflowing a narrow panel.
      slotClass("drawer-footer", props, render),
      "flex flex-wrap",
      !allowSelection && "cursor-default",
      className,
    ),
    "data-slot": "drawer-footer",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render: allowSelection ? <SelectableContent render={render} /> : render,
  });
}

export function DrawerTitle({
  className,
  ...props
}: WithStringClassName<DrawerPrimitive.Title.Props>): React.ReactElement {
  return (
    <DrawerPrimitive.Title
      className={cn(
        slotClass("drawer-title", props),
        "font-heading wrap-anywhere",
        className,
      )}
      data-slot="drawer-title"
      {...props}
    />
  );
}

export function DrawerDescription({
  className,
  ...props
}: WithStringClassName<DrawerPrimitive.Description.Props>): React.ReactElement {
  return (
    <DrawerPrimitive.Description
      className={cn(
        slotClass("drawer-description", props),
        "wrap-anywhere",
        className,
      )}
      data-slot="drawer-description"
      {...props}
    />
  );
}

export function DrawerPanel({
  className,
  scrollFade = true,
  scrollable = true,
  allowSelection = true,
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  scrollFade?: boolean;
  scrollable?: boolean;
  allowSelection?: boolean;
}): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("drawer-panel", props, render),
      !allowSelection && "cursor-default",
      className,
    ),
    "data-slot": "drawer-panel",
  };

  const content = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render: allowSelection ? <SelectableContent render={render} /> : render,
  });

  if (scrollable) {
    return (
      <ScrollArea className="touch-auto" scrollFade={scrollFade}>
        {content}
      </ScrollArea>
    );
  }

  return content;
}

export function DrawerBar({
  className,
  position: positionProp,
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  position?: DrawerPosition;
}): React.ReactElement {
  const { position: contextPosition } = useContext(DrawerContext);
  const position = positionProp ?? contextPosition;
  const horizontal = position === "left" || position === "right";
  const defaultProps = {
    "aria-hidden": true as const,
    className: cn(
      slotClass("drawer-bar", props, render),
      "absolute flex cursor-grab touch-none items-center justify-center p-3 active:cursor-grabbing before:rounded-full",
      horizontal
        ? "inset-y-0 before:h-12 before:w-1"
        : "inset-x-0 before:h-1 before:w-12",
      position === "top" && "bottom-0",
      position === "bottom" && "top-0",
      position === "left" && "right-0",
      position === "right" && "left-0",
      className,
    ),
    "data-slot": "drawer-bar",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DrawerMenu({
  className,
  render,
  size,
  ...props
}: useRender.ComponentProps<"nav"> & {
  /**
   * The row size; it follows the provider's control size. `xl` is the touch
   * size for navigation and sheets that are tapped: 48px rows with 16px text
   * and 20px icons. The other sizes keep the compact menu rows, which a touch
   * screen turns into 48px rows as well.
   */
  size?: SiteplaneControlSize;
}): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const defaultProps = {
    className: cn(
      slotClass("drawer-menu", props, render),
      "-m-2 flex flex-col",
      className,
    ),
    "data-size": resolvedSize,
    "data-slot": "drawer-menu",
  };

  return useRender({
    defaultTagName: "nav",
    props: mergeProps<"nav">(defaultProps, props),
    render,
  });
}

export function DrawerMenuItem({
  className,
  variant = "default",
  render,
  disabled,
  ...props
}: useRender.ComponentProps<"button"> & {
  variant?: "default" | "destructive";
}): React.ReactElement {
  return (
    <KitButton
      align="start"
      className={className}
      disabled={disabled}
      multiline
      profile="menu-row"
      render={render}
      variant={variant === "destructive" ? "ghost-destructive" : "text"}
      width="full"
      {...props}
      // Last, so a host that renders the row, such as DrawerClose, cannot swap
      // the slot that the row recipe and the touch size are keyed on.
      data-slot="drawer-menu-item"
    />
  );
}

export function DrawerMenuSeparator({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("drawer-menu-separator", props, render),
      menuSeparatorClassName,
      className,
    ),
    "data-slot": "drawer-menu-separator",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DrawerMenuGroup({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("drawer-menu-group", props, render),
      "flex flex-col",
      className,
    ),
    "data-slot": "drawer-menu-group",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DrawerMenuGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("drawer-menu-group-label", props, render),
      menuGroupLabelClassName,
      className,
    ),
    "data-slot": "drawer-menu-group-label",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DrawerMenuTrigger({
  className,
  children,
  ...props
}: Omit<
  WithStringClassName<DrawerPrimitive.Trigger.Props>,
  "render"
>): React.ReactElement {
  return (
    <DrawerTrigger
      className={className}
      data-slot="drawer-menu-trigger"
      render={
        <KitButton
          align="start"
          multiline
          profile="submenu-trigger"
          variant="text"
          width="full"
        />
      }
      {...props}
    >
      {children}
      <ChevronRightIcon />
    </DrawerTrigger>
  );
}

export function DrawerMenuCheckboxItem({
  variant = "default",
  ...props
}: Omit<CheckboxProps, "profile"> & {
  variant?: "default" | "switch";
}): React.ReactElement {
  if (variant === "switch") {
    return (
      <KitSwitch
        {...(props as SwitchProps)}
        data-slot="drawer-menu-checkbox-item"
        profile="menu-item"
      />
    );
  }

  return (
    <KitCheckbox
      {...props}
      data-slot="drawer-menu-checkbox-item"
      profile="menu-item"
    />
  );
}

export function DrawerMenuRadioGroup({
  className,
  ...props
}: Omit<RadioGroupProps, "profile">): React.ReactElement {
  return (
    <KitRadioGroup
      className={className}
      data-slot="drawer-menu-radio-group"
      profile="menu-item"
      {...props}
    />
  );
}

export function DrawerMenuRadioItem({
  indicatorPosition = "start",
  ...props
}: Omit<RadioProps, "profile"> & {
  value: string;
  /**
   * Where the row shows its check: in the leading slot (`start`), or at the
   * end of the row (`end`) for identity rows that lead with a logo or an
   * avatar, such as the workspaces of a switcher.
   */
  indicatorPosition?: "start" | "end" | undefined;
}): React.ReactElement {
  return (
    <KitRadio
      data-slot="drawer-menu-radio-item"
      indicatorPosition={indicatorPosition}
      profile="menu-item"
      {...props}
    />
  );
}

// DrawerContent is the shadcn name of DrawerPopup, as DialogContent is of
// DialogPopup. Base UI's bare content part is DrawerPrimitive.Content.
export { DrawerPrimitive, DrawerPopup as DrawerContent };
