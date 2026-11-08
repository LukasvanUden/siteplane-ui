"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../system/utils/cn";
import { moveFocusPast } from "../../system/utils/focus-target-after";
import { slotClass } from "../../system/utils/slot-class";
import { CloseButton } from "../button";
import { MotionReveal } from "../motion";

// The columns are design-rework.css's (Alert): the action takes a column of
// its own only beside a title or description, and every layout places its
// parts by the Alert's own width, never the window's: below 32rem of it an
// inline Alert's action goes under the text and the text spans the empty
// column, so the grid keeps no empty track (rulebook S11). The text column is
// minmax(0, 1fr), so a long value wraps instead of pushing the action out
// (rulebook K5).
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
      // Every status glyph takes the tone of its status dot in both themes
      // (rulebook C4, Lukas, 7 November 2026, as coss): the success and
      // warning dots, the error fill and, for info, the accent fill. The
      // Toast's icon, the Featured Icon's outline and the Timeline marker
      // read the same tokens. The title and the description keep the text
      // colours.
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
 * icon and the close control sit on the title's line. Every layout places
 * the action by its own width: beside the text from 32rem, under it below.
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
        // A close that holds the focus hands it to the next element after the
        // Alert, as a Notification's close does, so it never falls back to the
        // page (system/utils/focus-target-after.ts).
        if (trigger) moveFocusPast(rootRef.current);
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
  return (
    // The Alert places its action by its own width, as every layout does
    // (design-rework.css): from 32rem beside the text, spanning two rows only
    // beside a title and a description; below, under the text, in the text's
    // column (rulebook S11).
    <div
      className={cn(
        slotClass("alert-action", props),
        "flex empty:hidden",
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
  /**
   * The accessible name of the close control: CloseButton's message by
   * default, "Close" in English.
   */
  "aria-label"?: string;
}

/**
 * The × that closes the Alert: the CloseButton at its dense 24 px step, the
 * close of a Dialog and a Notification too. The Alert collapses with the kit's
 * motion, and focus moves to the next element after it instead of to the
 * page.
 */
export function AlertClose({
  "aria-label": ariaLabel,
  className,
  onClick,
  ...props
}: AlertCloseProps): React.ReactElement {
  const context = React.useContext(AlertContext);
  // Its own slot, as the close part of a Dialog, a Drawer or a Toast carries
  // its own; it carried only the slot's class, over the Button's slot.
  return (
    <CloseButton
      className={cn(slotClass("alert-close", props), className)}
      data-slot="alert-close"
      label={ariaLabel}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) context?.close(event.currentTarget);
      }}
      size="2xs"
      type="button"
      {...props}
    />
  );
}
