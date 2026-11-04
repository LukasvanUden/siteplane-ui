"use client";

import type * as React from "react";

import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "../drawer";
import { cn } from "../../system/utils/cn";

/**
 * A Drawer that opens from the right. Its content takes the side, and the swipe
 * direction, from this root, so `position` is set once, here.
 */
export function DetailDrawer(
  props: React.ComponentProps<typeof Drawer>,
): React.ReactElement {
  return <Drawer position="right" {...props} />;
}

export const DetailDrawerTrigger: typeof DrawerTrigger = DrawerTrigger;
export const DetailDrawerClose: typeof DrawerClose = DrawerClose;

/**
 * The popup of the drawer, a straight side panel at most 400 px wide with the
 * look of a Sheet: it floats on the Sheet's shadow, draws no edge line of its
 * own, and its plain header leaves the space under it to the body
 * (design-rework.css). It is the Drawer's popup, so its name ends in `Popup`
 * like the popup of every other overlay.
 */
export function DetailDrawerPopup({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DrawerPopup>): React.ReactElement {
  return (
    <DrawerPopup
      className={cn("max-w-100", className)}
      data-pattern="detail-drawer-content"
      variant="straight"
      {...props}
    >
      {children}
    </DrawerPopup>
  );
}

export function DetailDrawerHeader({
  className,
  ...props
}: React.ComponentProps<typeof DrawerHeader>): React.ReactElement {
  return (
    <DrawerHeader
      className={className}
      data-pattern="detail-drawer-header"
      {...props}
    />
  );
}

export const DetailDrawerTitle: typeof DrawerTitle = DrawerTitle;
export const DetailDrawerDescription: typeof DrawerDescription =
  DrawerDescription;

export function DetailDrawerBody({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPanel>): React.ReactElement {
  return (
    <DrawerPanel
      className={cn("min-h-0 flex-1", className)}
      data-pattern="detail-drawer-body"
      {...props}
    />
  );
}

export function DetailDrawerFooter({
  className,
  ...props
}: React.ComponentProps<typeof DrawerFooter>): React.ReactElement {
  return (
    <DrawerFooter
      className={className}
      data-pattern="detail-drawer-footer"
      {...props}
    />
  );
}
