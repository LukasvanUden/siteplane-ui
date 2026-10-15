import type * as React from "react";

import { surfaceClassNames } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

// The frame's 4 px gap spaces its panels, and a hidden part leaves none. The
// header and the footer take it from their own padding, so the space around
// them stays 16 px on both sides.
export function Frame({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("frame", props),
        "relative flex flex-col gap-1 rounded-2xl bg-muted/72 p-1",
        className,
      )}
      data-slot="frame"
      {...props}
    />
  );
}

export function FramePanel({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("frame-panel", props),
        surfaceClassNames.raised,
        "rounded-xl p-5",
        className,
      )}
      data-slot="frame-panel"
      {...props}
    />
  );
}

// Frame headers and footers are plain blocks, not banner or contentinfo
// landmarks: a page holds many frames.
export function FrameHeader({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("frame-header", props),
        "flex flex-col px-5 pt-4 pb-3",
        className,
      )}
      data-slot="frame-header"
      {...props}
    />
  );
}

export function FrameTitle({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("frame-title", props),
        "font-(--sp-rw-font-weight-strong) text-sm",
        className,
      )}
      data-slot="frame-title"
      {...props}
    />
  );
}

export function FrameDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("frame-description", props),
        "text-muted-foreground text-sm",
        className,
      )}
      data-slot="frame-description"
      {...props}
    />
  );
}

export function FrameFooter({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("frame-footer", props),
        "px-5 pt-3 pb-4",
        className,
      )}
      data-slot="frame-footer"
      {...props}
    />
  );
}
