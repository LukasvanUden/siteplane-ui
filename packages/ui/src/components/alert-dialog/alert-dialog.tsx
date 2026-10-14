"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type React from "react";
import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export const AlertDialogCreateHandle: typeof AlertDialogPrimitive.createHandle =
  AlertDialogPrimitive.createHandle;
export const AlertDialog: typeof AlertDialogPrimitive.Root =
  AlertDialogPrimitive.Root;
// Base UI's own Portal type, with className narrowed to a string.
export const AlertDialogPortal: React.ForwardRefExoticComponent<
  WithStringClassName<Omit<AlertDialogPrimitive.Portal.Props, "ref">> &
    React.RefAttributes<HTMLDivElement>
> = AlertDialogPrimitive.Portal;

export function AlertDialogTrigger(
  props: WithStringClassName<AlertDialogPrimitive.Trigger.Props>,
): React.ReactElement {
  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      {...props}
      className={cn(slotClass("alert-dialog-trigger", props), props.className)}
    />
  );
}
export function AlertDialogBackdrop({
  className,
  ...props
}: WithStringClassName<AlertDialogPrimitive.Backdrop.Props>): React.ReactElement {
  return (
    <AlertDialogPrimitive.Backdrop
      className={cn(
        slotClass("alert-dialog-backdrop", props),
        surfaceClassNames.overlayBackdrop,
        className,
      )}
      data-slot="alert-dialog-backdrop"
      {...props}
    />
  );
}
export function AlertDialogViewport({
  className,
  ...props
}: WithStringClassName<AlertDialogPrimitive.Viewport.Props>): React.ReactElement {
  return (
    <AlertDialogPrimitive.Viewport
      className={cn(
        slotClass("alert-dialog-viewport", props),
        surfaceClassNames.dialogOverlayViewport,
        className,
      )}
      data-slot="alert-dialog-viewport"
      {...props}
    />
  );
}
/**
 * The width of an AlertDialog popup on the modal scale, as Dialog's: `xs`
 * 400 px, `sm` 440 px (the default), `md` 600 px and `lg` 880 px.
 */
export type AlertDialogSize = "xs" | "sm" | "md" | "lg";

export function AlertDialogPopup({
  className,
  size = "sm",
  portalProps,
  ...props
}: WithStringClassName<AlertDialogPrimitive.Popup.Props> & {
  /**
   * The popup width, as Dialog's: `xs` 400 px, `sm` 440 px (the default),
   * `md` 600 px or `lg` 880 px, from the `sm` breakpoint up. A `max-w-*`
   * class in `className` still wins.
   */
  size?: AlertDialogSize;
  portalProps?: WithStringClassName<AlertDialogPrimitive.Portal.Props>;
}): React.ReactElement {
  return (
    <AlertDialogPortal {...portalProps}>
      <SiteplaneUIPortalScope>
        <AlertDialogBackdrop />
        <AlertDialogViewport>
          {/* Small screens show the alert dialog at the bottom edge, where it
              slides in. */}
          <AlertDialogPrimitive.Popup
            className={cn(
              slotClass("alert-dialog-popup", props),
              surfaceClassNames.dialogOverlayPopup,
              surfaceClassNames.dialogOverlayPopupMobileStick,
              className,
            )}
            data-slot="alert-dialog-popup"
            data-width={size}
            {...props}
          />
        </AlertDialogViewport>
      </SiteplaneUIPortalScope>
    </AlertDialogPortal>
  );
}
export function AlertDialogHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("alert-dialog-header", props, render),
      "flex-col",
      className,
    ),
    "data-slot": "alert-dialog-header",
  };
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}
export function AlertDialogFooter({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      // Actions that do not fit wrap onto another row with the same gap
      // instead of overflowing a narrow popup.
      slotClass("alert-dialog-footer", props, render),
      "flex flex-wrap",
      // Actions right after the text sit 24 px below it, as in every dialog
      // without content (S12): 8 px here plus the popup's 16 px gap.
      "[[data-slot=alert-dialog-header]+&]:mt-2",
      className,
    ),
    "data-slot": "alert-dialog-footer",
  };
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}
export function AlertDialogTitle({
  className,
  ...props
}: WithStringClassName<AlertDialogPrimitive.Title.Props>): React.ReactElement {
  return (
    <AlertDialogPrimitive.Title
      className={cn(
        slotClass("alert-dialog-title", props),
        "font-heading wrap-anywhere",
        className,
      )}
      data-slot="alert-dialog-title"
      {...props}
    />
  );
}
export function AlertDialogDescription({
  className,
  ...props
}: WithStringClassName<AlertDialogPrimitive.Description.Props>): React.ReactElement {
  return (
    <AlertDialogPrimitive.Description
      className={cn(
        slotClass("alert-dialog-description", props),
        "wrap-anywhere",
        className,
      )}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}
export function AlertDialogClose(
  props: WithStringClassName<AlertDialogPrimitive.Close.Props>,
): React.ReactElement {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-close"
      {...props}
      className={cn(slotClass("alert-dialog-close", props), props.className)}
    />
  );
}

// AlertDialogOverlay and AlertDialogContent are the shadcn names of
// AlertDialogBackdrop and AlertDialogPopup.
export {
  AlertDialogPrimitive,
  AlertDialogBackdrop as AlertDialogOverlay,
  AlertDialogPopup as AlertDialogContent,
};
