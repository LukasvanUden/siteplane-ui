"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { XIcon } from "lucide-react";
import type React from "react";

import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { KitButton } from "../button/button-internal";
import { ScrollArea } from "../scroll-area";
import type { KitDialogPopupProps } from "./dialog-internal";

import "./dialog.css";

export const DialogCreateHandle: typeof DialogPrimitive.createHandle =
  DialogPrimitive.createHandle;
export const Dialog: typeof DialogPrimitive.Root = DialogPrimitive.Root;
// Base UI's own Portal type, with className narrowed to a string.
export const DialogPortal: React.ForwardRefExoticComponent<
  WithStringClassName<Omit<DialogPrimitive.Portal.Props, "ref">> &
    React.RefAttributes<HTMLDivElement>
> = DialogPrimitive.Portal;

export function DialogTrigger(
  props: WithStringClassName<DialogPrimitive.Trigger.Props>,
): React.ReactElement {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

export function DialogClose(
  props: WithStringClassName<DialogPrimitive.Close.Props>,
): React.ReactElement {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export function DialogBackdrop({
  className,
  ...props
}: WithStringClassName<DialogPrimitive.Backdrop.Props>): React.ReactElement {
  return (
    <DialogPrimitive.Backdrop
      className={cn(surfaceClassNames.overlayBackdrop, className)}
      data-slot="dialog-backdrop"
      {...props}
    />
  );
}

export function DialogViewport({
  className,
  ...props
}: WithStringClassName<DialogPrimitive.Viewport.Props>): React.ReactElement {
  return (
    <DialogPrimitive.Viewport
      className={cn(surfaceClassNames.dialogOverlayViewport, className)}
      data-slot="dialog-viewport"
      {...props}
    />
  );
}

/**
 * The width of a Dialog or AlertDialog popup on the modal scale: `xs` 400 px,
 * `sm` 440 px (the default), `md` 600 px and `lg` 880 px. It applies from the
 * `sm` breakpoint up; a smaller screen shows the full-width bottom sheet at
 * every size.
 */
export type DialogSize = "xs" | "sm" | "md" | "lg";

type DialogPopupProps = WithStringClassName<DialogPrimitive.Popup.Props> & {
  showCloseButton?: boolean;
  /**
   * The popup width: `xs` 400 px, `sm` 440 px (the default), `md` 600 px or
   * `lg` 880 px, from the `sm` breakpoint up. A `max-w-*` class in
   * `className` still wins.
   */
  size?: DialogSize;
  closeProps?: WithStringClassName<DialogPrimitive.Close.Props>;
  portalProps?: WithStringClassName<DialogPrimitive.Portal.Props>;
};

export function DialogPopup(popupProps: DialogPopupProps): React.ReactElement {
  // Command and TaskCalendar pass their internal profiles through
  // KitDialogPopup (dialog-internal.ts), the same function. Only the default
  // profile takes a size; the others set their own width.
  const {
    className,
    children,
    showCloseButton = true,
    profile = "default",
    size = "sm",
    closeProps,
    portalProps,
    ...props
  } = popupProps as KitDialogPopupProps;
  return (
    <DialogPortal {...portalProps}>
      <SiteplaneUIPortalScope>
        <DialogBackdrop />
        <DialogViewport
          className={cn(profile === "command" && "siteplane-command-viewport")}
        >
          <DialogPrimitive.Popup
            className={cn(
              profile === "command"
                ? cn(
                    surfaceClassNames.overlayBorderless,
                    "siteplane-command-popup relative flex min-h-0 min-w-0 flex-col",
                  )
                : profile === "composite"
                  ? surfaceClassNames.dialogOverlayCompositePopup
                  : surfaceClassNames.dialogOverlayPopup,
              "outline-none *:data-[slot=form]:contents",
              // AlertDialog shares the popup surface; its own rule lays out
              // its popup as a grid. Small screens show it at the bottom
              // edge, full width, where it slides in. The width of each size
              // is a design-rework.css rule.
              profile === "default" &&
                cn(
                  "flex max-h-full w-full",
                  surfaceClassNames.dialogOverlayPopupMobileStick,
                ),
              className,
            )}
            data-foundation="dialog"
            data-slot="dialog-popup"
            data-profile={profile}
            data-width={profile === "default" ? size : undefined}
            {...props}
          >
            {children}
            {showCloseButton && (
              // The corner close of every overlay: the 24 px overlay-dismiss
              // Button 8 px inside the top-end corner. The header keeps its
              // text clear of it (design-rework.css).
              <DialogPrimitive.Close
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
              </DialogPrimitive.Close>
            )}
          </DialogPrimitive.Popup>
        </DialogViewport>
      </SiteplaneUIPortalScope>
    </DialogPortal>
  );
}

export function DialogHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("flex flex-col", className),
    "data-slot": "dialog-header",
  };
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DialogFooter({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      // Actions that do not fit wrap onto another row with the same gap instead
      // of overflowing a narrow popup.
      "flex flex-wrap",
      // A dialog without content puts 24 px between its text and its actions in
      // every layout (S12): 8 px here plus the footer's own 16 px top padding.
      "[[data-slot=dialog-header]+&]:mt-2",
      className,
    ),
    "data-slot": "dialog-footer",
  };
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DialogTitle({
  className,
  ...props
}: WithStringClassName<DialogPrimitive.Title.Props>): React.ReactElement {
  return (
    <DialogPrimitive.Title
      className={cn("font-heading wrap-anywhere", className)}
      data-slot="dialog-title"
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: WithStringClassName<DialogPrimitive.Description.Props>): React.ReactElement {
  return (
    <DialogPrimitive.Description
      className={cn("wrap-anywhere", className)}
      data-slot="dialog-description"
      {...props}
    />
  );
}

export function DialogPanel({
  className,
  scrollFade = true,
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  scrollFade?: boolean;
}): React.ReactElement {
  const defaultProps = {
    className,
    "data-slot": "dialog-panel",
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

// DialogOverlay and DialogContent are the shadcn names of DialogBackdrop and
// DialogPopup.
export {
  DialogPrimitive,
  DialogBackdrop as DialogOverlay,
  DialogPopup as DialogContent,
};
