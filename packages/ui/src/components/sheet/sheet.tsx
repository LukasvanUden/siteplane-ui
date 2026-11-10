"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type React from "react";
import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { CloseButton } from "../button";
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
  return (
    <SheetPrimitive.Trigger
      data-slot="sheet-trigger"
      {...props}
      className={cn(slotClass("sheet-trigger", props), props.className)}
    />
  );
}

export function SheetClose(
  props: WithStringClassName<SheetPrimitive.Close.Props>,
): React.ReactElement {
  return (
    <SheetPrimitive.Close
      data-slot="sheet-close"
      {...props}
      className={cn(slotClass("sheet-close", props), props.className)}
    />
  );
}

export function SheetBackdrop({
  className,
  ...props
}: WithStringClassName<SheetPrimitive.Backdrop.Props>): React.ReactElement {
  return (
    <SheetPrimitive.Backdrop
      className={cn(
        slotClass("sheet-backdrop", props),
        "sp-sheet-backdrop-motion fixed inset-0 z-50",
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
        slotClass("sheet-viewport", props),
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
    belowOffset = false,
    closeProps,
    portalProps,
    ...props
  } = popupProps as KitSheetPopupProps;
  // Below an offset, a bar above the sheet stays in view and in reach.
  const offsetClassName = belowOffset && "top-(--sheet-offset-top)";
  return (
    <SheetPortal {...portalProps}>
      <SiteplaneUIPortalScope>
        <SheetBackdrop className={offsetClassName || undefined} />
        <SheetViewport
          className={cn(offsetClassName, belowOffset && "overflow-clip")}
          side={side}
          variant={variant}
        >
          <SheetPrimitive.Popup
            className={cn(
              slotClass("sheet-popup", props),
              surfaceClassNames.edgeOverlay,
              "sp-sheet-panel-motion flex max-h-full min-h-0 w-full min-w-0 flex-col outline-none",
              side === "bottom" && "row-start-2",
              side === "right" && "col-start-2",
              // A fullscreen sheet takes the whole viewport (sheet.css).
              (side === "left" || side === "right") &&
                variant !== "fullscreen" &&
                "w-[calc(100%-(--spacing(12)))] max-w-100",
              // An inset sheet takes the dialog's corners from 640 px through
              // the inset Drawer's rule, one owner for both side panels
              // (design-rework.css; C13, 3 November 2026: it drew Tailwind's
              // 2xl radius, 18 px, where the Drawer beside it drew 16).
              profile === "sidebar" && [
                // The Sidebar names the popup after itself, so it would lose
                // the class its slot gives a Sheet popup and with it the
                // Sheet's surface: it drew the floating surface's 1 px
                // translucent border instead, a dark line over the backdrop
                // along the screen's edges (Lukas, 3 November 2026). Its
                // fill is the Sidebar's page background, published as the
                // surface colour, so the rings inside it match the fill.
                "sp-sheet-popup",
                variant !== "fullscreen" && "w-(--sidebar-width)",
                "bg-(--sp-rw-surface-color) p-0 text-[var(--sp-rw-fg-primary)] [--sp-rw-surface-color:var(--sp-rw-bg-base)]",
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
              // The corner close of a slideout: the CloseButton
              // at its sm step, 36 px, which owns its box, glyph and states;
              // the popup places it 12 px inside the top-end corner. The
              // header keeps its text clear of it (design-rework.css).
              // CloseButton names it ("Close" in the provider's messages).
              <SheetClose
                className="absolute end-3 top-3"
                render={<CloseButton size="sm" />}
                {...closeProps}
              />
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
    className: cn(
      slotClass("sheet-header", props, render),
      "flex flex-col",
      className,
    ),
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
  actionLayout,
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  /**
   * `fill` lets the Buttons of the footer share its row in equal widths, as
   * the actions of a Card footer do; a link keeps its own width. No Button
   * gets narrower than its words: they stack when they do not fit side by
   * side, and a label wider than the row wraps. Left unset the actions end
   * the row at their own widths.
   */
  actionLayout?: "fill" | undefined;
}): React.ReactElement {
  const defaultProps = {
    className: cn(
      // Actions that do not fit wrap onto another row with the same gap instead
      // of overflowing a narrow panel.
      slotClass("sheet-footer", props, render),
      "flex flex-wrap",
      className,
    ),
    "data-action-layout": actionLayout,
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
      className={cn(
        slotClass("sheet-title", props),
        "font-heading wrap-anywhere",
        className,
      )}
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
      className={cn(
        slotClass("sheet-description", props),
        "wrap-anywhere",
        className,
      )}
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
    className: cn(slotClass("sheet-panel", props, render), className),
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

// SheetOverlay and SheetContent are aliases of SheetBackdrop and
// SheetPopup.
export {
  SheetPrimitive,
  SheetBackdrop as SheetOverlay,
  SheetPopup as SheetContent,
};
