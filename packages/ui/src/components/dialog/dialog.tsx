"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { XIcon } from "lucide-react";
import * as React from "react";

import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
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
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...props}
      className={cn(slotClass("dialog-trigger", props), props.className)}
    />
  );
}

export function DialogClose(
  props: WithStringClassName<DialogPrimitive.Close.Props>,
): React.ReactElement {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
      className={cn(slotClass("dialog-close", props), props.className)}
    />
  );
}

export function DialogBackdrop({
  className,
  ...props
}: WithStringClassName<DialogPrimitive.Backdrop.Props>): React.ReactElement {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        slotClass("dialog-backdrop", props),
        surfaceClassNames.overlayBackdrop,
        className,
      )}
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
      className={cn(
        slotClass("dialog-viewport", props),
        surfaceClassNames.dialogOverlayViewport,
        className,
      )}
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

// The elements a browser can focus with Tab, as Base UI's focus manager finds
// them: the candidates that are enabled, rendered, outside an inert or hidden
// subtree and not taken out of the tab order.
const tabbableCandidates =
  'a[href],button,input,select,textarea,summary,details,iframe,object,embed,[tabindex],[contenteditable]:not([contenteditable="false"]),audio[controls],video[controls]';

function firstTabbable(popup: HTMLElement): HTMLElement | null {
  for (const element of popup.querySelectorAll<HTMLElement>(
    tabbableCandidates,
  )) {
    if (
      element.tabIndex < 0 ||
      element.matches(":disabled") ||
      (element instanceof HTMLInputElement && element.type === "hidden") ||
      element.closest("[inert], [hidden]") ||
      element.getClientRects().length === 0 ||
      getComputedStyle(element).visibility === "hidden"
    )
      continue;
    return element;
  }
  return null;
}

/** Whether every scrolling box between the element and the popup shows it whole. */
function startsInView(element: HTMLElement, popup: HTMLElement): boolean {
  const box = element.getBoundingClientRect();
  for (
    let parent = element.parentElement;
    parent && popup.contains(parent);
    parent = parent.parentElement
  ) {
    if (
      parent.scrollHeight <= parent.clientHeight &&
      parent.scrollWidth <= parent.clientWidth
    )
      continue;
    // Content that overflows a box which does not clip it stays in view.
    const { overflowX, overflowY } = getComputedStyle(parent);
    if (overflowX === "visible" && overflowY === "visible") continue;
    const area = parent.getBoundingClientRect();
    if (
      box.top < area.top ||
      box.bottom > area.bottom ||
      box.left < area.left ||
      box.right > area.right
    )
      return false;
  }
  return true;
}

/**
 * Where focus goes when the dialog opens. Base UI focuses the first tabbable
 * element and scrolls it into view, so a dialog whose content scrolls opened
 * at its end when that element sat below the fold, such as a field under long
 * terms (stress finding S-14). When the first tabbable element starts out of
 * view, the popup itself takes focus, as Base UI does for a touch open and as
 * the WAI-ARIA dialog pattern advises for long content: the dialog opens at its
 * top, a screen reader reads its title, and Tab moves on to that element. A
 * dialog whose first tabbable element shows keeps Base UI's default.
 */
function kitInitialFocus(
  popup: HTMLElement | null,
  openType: string,
): HTMLElement | true {
  if (!popup) return true;
  if (openType === "touch") return popup;
  const first = firstTabbable(popup);
  return first && !startsInView(first, popup) ? popup : true;
}

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
    initialFocus,
    ref: givenRef,
    ...props
  } = popupProps as KitDialogPopupProps;
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      popupRef.current = node;
      if (typeof givenRef === "function") givenRef(node);
      else if (givenRef) givenRef.current = node;
    },
    [givenRef],
  );
  return (
    <DialogPortal {...portalProps}>
      <SiteplaneUIPortalScope>
        <DialogBackdrop />
        <DialogViewport
          className={cn(profile === "command" && "sp-command-viewport")}
        >
          <DialogPrimitive.Popup
            className={cn(
              slotClass("dialog-popup", props),
              baseClass("dialog", props),
              profile === "command"
                ? cn(
                    surfaceClassNames.overlayBorderless,
                    "sp-command-popup relative flex min-h-0 min-w-0 flex-col",
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
            initialFocus={
              initialFocus ??
              ((openType) => kitInitialFocus(popupRef.current, openType))
            }
            ref={ref}
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
    className: cn(
      slotClass("dialog-header", props, render),
      "flex flex-col",
      className,
    ),
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
      slotClass("dialog-footer", props, render),
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
      className={cn(
        slotClass("dialog-title", props),
        "font-heading wrap-anywhere",
        className,
      )}
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
      className={cn(
        slotClass("dialog-description", props),
        "wrap-anywhere",
        className,
      )}
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
    className: cn(slotClass("dialog-panel", props, render), className),
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
