"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { KitButton } from "../button/button-internal";
import { MotionReveal } from "../motion";

// The columns are design-rework.css's (Alert): the action takes a column of
// its own only from 640 px and only beside a title or description; below
// 640 px it wraps under the text, so the grid keeps no empty track for it
// (rulebook S11). The text column is minmax(0, 1fr), so a long value wraps
// instead of pushing the action out (rulebook K5). A banner or a band lays
// out by its own width instead (design-rework.css, Alert layouts).
const alertVariants = cva("relative grid w-full items-start", {
  defaultVariants: { layout: "inline", variant: "default" },
  variants: {
    // An inline Alert's 16 px icon is one text line high; a banner's and a
    // band's icon size is design-rework.css's.
    layout: {
      band: "",
      banner: "",
      inline: "[&>svg]:h-lh [&>svg]:w-4",
    },
    variant: {
      default: "[&>svg]:text-muted-foreground",
      error: "[&>svg]:text-destructive",
      info: "[&>svg]:text-info",
      success: "[&>svg]:text-success",
      warning: "[&>svg]:text-warning",
    },
  },
});

// Only an error or a warning interrupts a screen reader (role="alert"). The
// default, info and success tones are a polite status, so an Alert rendered
// after an action does not cut into what is being read, and a page with
// several Alerts keeps a single assertive region at most. A `role` passed in
// wins.
const assertiveVariants: ReadonlySet<string> = new Set(["error", "warning"]);

/**
 * - `inline` is a surface in the content flow.
 * - `banner` is a band across the top of a page, above its header, for
 *   something that concerns the whole page: the tone's tint over the full
 *   width, a hairline below it.
 * - `band` is the same band at the top of a Card, directly under its header,
 *   across the card's full width.
 *
 * A banner and a band put the icon, the text and the close control on one
 * row while their own width allows it; below 32rem of their own width the
 * icon and the close control sit on the title's line.
 */
export type AlertLayout = "inline" | "banner" | "band";

export interface AlertProps
  extends
    React.ComponentProps<"div">,
    Pick<VariantProps<typeof alertVariants>, "variant"> {
  layout?: AlertLayout;
  /** Shows the Alert, controlled. Closing collapses it with the kit's motion. */
  open?: boolean;
  /** Shows the Alert at first, uncontrolled. Defaults to `true`. */
  defaultOpen?: boolean;
  /** Called when `AlertClose` closes the Alert, with `false`. */
  onOpenChange?: (open: boolean) => void;
}

interface AlertContextValue {
  close: (trigger: HTMLElement | null) => void;
  layout: AlertLayout;
}

const AlertContext = React.createContext<AlertContextValue | null>(null);

const tabbableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.closest("[inert], [aria-hidden='true']")) return false;
  return element.getClientRects().length > 0;
}

/**
 * The element that takes focus when a closing Alert held it: the next tabbable
 * element after the Alert in document order, or the one before it at the end
 * of the page, so focus never falls back to the body.
 */
function focusTargetAfter(root: HTMLElement): HTMLElement | null {
  const candidates = Array.from(
    root.ownerDocument.querySelectorAll<HTMLElement>(tabbableSelector),
  ).filter((element) => !root.contains(element) && isTabbable(element));
  const following = candidates.find(
    (element) =>
      root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  if (following) return following;
  const preceding = candidates.filter(
    (element) =>
      root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING,
  );
  return preceding.at(-1) ?? null;
}

export function Alert({
  className,
  defaultOpen = true,
  layout = "inline",
  onOpenChange,
  open: openProp,
  variant,
  ...props
}: AlertProps): React.ReactElement | null {
  const resolvedVariant = variant ?? "default";
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  // A banner, a band and an Alert whose open state is set collapse when they
  // close; an inline Alert without one keeps its plain markup.
  const reveals =
    layout !== "inline" || openProp !== undefined || onOpenChange !== undefined;

  const context = React.useMemo<AlertContextValue>(
    () => ({
      close: (trigger) => {
        const root = rootRef.current;
        if (root && trigger && root.contains(document.activeElement)) {
          focusTargetAfter(root)?.focus({ preventScroll: true });
        }
        if (openProp === undefined) setUncontrolledOpen(false);
        onOpenChange?.(false);
      },
      layout,
    }),
    [layout, onOpenChange, openProp],
  );

  const alert = (
    <AlertContext.Provider value={context}>
      <div
        className={cn(
          slotClass("alert", props),
          alertVariants({ layout, variant }),
          className,
        )}
        data-layout={layout === "inline" ? undefined : layout}
        data-slot="alert"
        data-variant={resolvedVariant}
        ref={rootRef}
        role={assertiveVariants.has(resolvedVariant) ? "alert" : "status"}
        {...props}
      />
    </AlertContext.Provider>
  );

  if (!reveals) return open ? alert : null;
  return <MotionReveal open={open}>{alert}</MotionReveal>;
}

export function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("alert-title", props),
        "wrap-anywhere [svg~&]:col-start-2",
        className,
      )}
      data-slot="alert-title"
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("alert-description", props),
        "flex flex-col gap-2.5 wrap-anywhere [svg~&]:col-start-2",
        className,
      )}
      data-slot="alert-description"
      {...props}
    />
  );
}

export function AlertAction({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const layout = React.useContext(AlertContext)?.layout ?? "inline";
  return (
    // Below 640 px the action wraps under the text, in the text's column. From
    // 640 px it sits beside the text and spans two rows only beside a title
    // and a description (rulebook S11). A banner or a band places it by its
    // own width (design-rework.css).
    <div
      className={cn(
        slotClass("alert-action", props),
        "flex empty:hidden",
        layout === "inline" &&
          "max-sm:mt-2 [svg~&]:col-start-2 sm:row-start-1 sm:self-center sm:[[data-slot=alert-title]~[data-slot=alert-description]~&]:row-end-3 sm:[[data-slot=alert-description]~&]:col-start-2 sm:[[data-slot=alert-title]~&]:col-start-2 sm:[svg~[data-slot=alert-description]~&]:col-start-3 sm:[svg~[data-slot=alert-title]~&]:col-start-3",
        className,
      )}
      data-slot="alert-action"
      {...props}
    />
  );
}

export interface AlertCloseProps extends Omit<
  React.ComponentProps<"button">,
  "children"
> {
  /** The accessible name of the close control. Defaults to "Close". */
  "aria-label"?: string;
}

/**
 * The × that closes the Alert: the kit's ghost dismiss control, the same as a
 * Dialog's or a Notification's. The Alert collapses with the kit's motion, and
 * focus moves to the next element after it instead of to the page.
 */
export function AlertClose({
  "aria-label": ariaLabel = "Close",
  className,
  onClick,
  ...props
}: AlertCloseProps): React.ReactElement {
  const context = React.useContext(AlertContext);
  return (
    <KitButton
      aria-label={ariaLabel}
      className={cn(slotClass("alert-close", props), className)}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) context?.close(event.currentTarget);
      }}
      profile="overlay-dismiss"
      shape="square"
      type="button"
      variant="ghost"
      {...props}
    >
      <XIcon aria-hidden="true" />
    </KitButton>
  );
}
