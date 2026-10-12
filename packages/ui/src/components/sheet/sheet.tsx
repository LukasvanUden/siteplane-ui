"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { XIcon } from "lucide-react";
import type React from "react";
import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { KitButton } from "../button/button-internal";
import { ScrollArea } from "../scroll-area";
import type { KitSheetPopupProps } from "./sheet-internal";

import "./sheet.css";

export const Sheet: typeof SheetPrimitive.Root = SheetPrimitive.Root;

// Base UI's own Portal type, with className narrowed to a string.
export const SheetPortal: React.ForwardRefExoticComponent<
  WithStringClassName<Omit<SheetPrimitive.Portal.Props, "ref">> &
    React.RefAttributes<HTMLDivElement>
> = SheetPrimitive.Portal;

export function SheetTrigger(
  props: WithStringClassName<SheetPrimitive.Trigger.Props>,
): React.ReactElement {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

export function SheetClose(
  props: WithStringClassName<SheetPrimitive.Close.Props>,
): React.ReactElement {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

export function SheetBackdrop({
  className,
  ...props
}: WithStringClassName<SheetPrimitive.Backdrop.Props>): React.ReactElement {
  return (
    <SheetPrimitive.Backdrop
      className={cn(
        "siteplane-sheet-backdrop-motion fixed inset-0 z-50",
        className,
      )}
      data-slot="sheet-backdrop"
      {...props}
    />
  );
}

export function SheetViewport({
  className,
  side,
  variant = "default",
  ...props
}: WithStringClassName<SheetPrimitive.Viewport.Props> & {
  side?: "right" | "left" | "top" | "bottom";
  variant?: "default" | "inset" | "fullscreen";
}): React.ReactElement {
  // A fullscreen viewport takes its display and padding from sheet.css.
  const fullscreen = variant === "fullscreen";
  return (
    <SheetPrimitive.Viewport
      className={cn(
        "fixed inset-0 z-50",
        !fullscreen && "grid",
        side === "bottom" && ["grid-rows-[1fr_auto]", !fullscreen && "pt-12"],
        side === "top" && ["grid-rows-[auto_1fr]", !fullscreen && "pb-12"],
        side === "left" && "flex justify-start",
        side === "right" && "flex justify-end",
        variant === "inset" && "sm:p-4",
        className,
      )}
      data-slot="sheet-viewport"
      data-variant={variant}
      {...props}
    />
  );
}

type SheetPopupProps = WithStringClassName<SheetPrimitive.Popup.Props> & {
  showCloseButton?: boolean;
  side?: "right" | "left" | "top" | "bottom";
  variant?: "default" | "inset" | "fullscreen";
  closeProps?: WithStringClassName<SheetPrimitive.Close.Props>;
  portalProps?: WithStringClassName<SheetPrimitive.Portal.Props>;
};

export function SheetPopup(popupProps: SheetPopupProps): React.ReactElement {
  // Sidebar passes the internal sidebar profile through KitSheetPopup
  // (sheet-internal.ts), the same function.
  const {
    className,
    children,
    showCloseButton = true,
    side = "right",
    variant = "default",
    profile = "default",
    closeProps,
    portalProps,
    ...props
  } = popupProps as KitSheetPopupProps;
  return (
    <SheetPortal {...portalProps}>
      <SiteplaneUIPortalScope>
        <SheetBackdrop />
        <SheetViewport side={side} variant={variant}>
          <SheetPrimitive.Popup
            className={cn(
              surfaceClassNames.edgeOverlay,
              "siteplane-sheet-panel-motion flex max-h-full min-h-0 w-full min-w-0 flex-col outline-none",
              side === "bottom" && "row-start-2",
              side === "right" && "col-start-2",
              // A fullscreen sheet takes the whole viewport (sheet.css).
              (side === "left" || side === "right") &&
                variant !== "fullscreen" &&
                "w-[calc(100%-(--spacing(12)))] max-w-md",
              variant === "inset" &&
                "sm:rounded-2xl sm:before:rounded-[inherit]",
              profile === "sidebar" && [
                variant !== "fullscreen" && "w-(--sidebar-width)",
                "bg-[var(--sp-rw-bg-base)] p-0 text-[var(--sp-rw-fg-primary)]",
              ],
              className,
            )}
            data-profile={profile}
            data-variant={variant}
            data-side={side}
            data-slot="sheet-popup"
            {...props}
          >
            {children}
            {showCloseButton && (
              // The corner close of every overlay: the 24 px overlay-dismiss
              // Button 8 px inside the top-end corner. The header keeps its
              // text clear of it (design-rework.css).
              <SheetClose
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
              </SheetClose>
            )}
          </SheetPrimitive.Popup>
        </SheetViewport>
      </SiteplaneUIPortalScope>
    </SheetPortal>
  );
}

export function SheetHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("flex flex-col", className),
    "data-slot": "sheet-header",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function SheetFooter({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      // Actions that do not fit wrap onto another row with the same gap instead
      // of overflowing a narrow panel.
      "flex flex-wrap",
      className,
    ),
    "data-slot": "sheet-footer",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function SheetTitle({
  className,
  ...props
}: WithStringClassName<SheetPrimitive.Title.Props>): React.ReactElement {
  return (
    <SheetPrimitive.Title
      className={cn("font-heading wrap-anywhere", className)}
      data-slot="sheet-title"
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: WithStringClassName<SheetPrimitive.Description.Props>): React.ReactElement {
  return (
    <SheetPrimitive.Description
      className={cn("wrap-anywhere", className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

export function SheetPanel({
  className,
  scrollFade = true,
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  scrollFade?: boolean;
}): React.ReactElement {
  const defaultProps = {
    className,
    "data-slot": "sheet-panel",
  };

  return (
    <ScrollArea scrollFade={scrollFade}>
      {useRender({
        defaultTagName: "div",
        props: mergeProps<"div">(defaultProps, props),
        render,
      })}
    </ScrollArea>
  );
}

// SheetOverlay and SheetContent are the shadcn names of SheetBackdrop and
// SheetPopup.
export {
  SheetPrimitive,
  SheetBackdrop as SheetOverlay,
  SheetPopup as SheetContent,
};
