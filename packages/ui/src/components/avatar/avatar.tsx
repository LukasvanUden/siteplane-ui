"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import type React from "react";

import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export type AvatarStatus = "online" | "away" | "busy" | "offline";

export type AvatarProps = WithStringClassName<AvatarPrimitive.Root.Props> & {
  /** Presence dot at the bottom-end corner of the avatar. */
  status?: AvatarStatus | undefined;
  /** Accessible name of the dot; defaults to the English status name. */
  statusLabel?: string | undefined;
};

const avatarStatusLabels: Record<AvatarStatus, string> = {
  away: "Away",
  busy: "Busy",
  offline: "Offline",
  online: "Online",
};

const avatarStatusClassNames: Record<AvatarStatus, string> = {
  away: "bg-warning",
  busy: "bg-destructive",
  offline: "bg-muted-foreground",
  online: "bg-success",
};

export function Avatar({
  className,
  status,
  statusLabel,
  ...props
}: AvatarProps): React.ReactElement {
  const root = (
    <AvatarPrimitive.Root
      className={cn(
        slotClass("avatar", props),
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden align-middle",
        className,
      )}
      data-slot="avatar"
      {...props}
    />
  );
  if (!status) return root;
  // The avatar clips its image to the circle, so the dot sits beside it in a
  // wrapper that takes the avatar's size. The dot is a quarter of the avatar,
  // so it scales with every avatar size: 8 px at 32 px, 9 px at 36 px, 10 px at
  // 40 px. A 1.5 px ring in the colour of the surface separates it from the
  // photo: it reads --sp-rw-surface-color, which Card, Dialog, Popover and the
  // other surfaces publish, and falls back to the page background. Set
  // --avatar-status-ring on a surface that does not publish its colour.
  return (
    <span
      className="sp-avatar-status-root relative inline-flex shrink-0 align-middle"
      data-slot="avatar-status-root"
    >
      {root}
      <span
        aria-label={statusLabel ?? avatarStatusLabels[status]}
        className={cn(
          "sp-avatar-status",
          "absolute end-0 bottom-0 size-1/4 rounded-full ring-[1.5px] ring-(--avatar-status-ring,var(--sp-rw-surface-color,var(--sp-rw-bg-base)))",
          avatarStatusClassNames[status],
        )}
        data-slot="avatar-status"
        data-status={status}
        role="img"
      />
    </span>
  );
}

export function AvatarImage({
  className,
  ...props
}: WithStringClassName<AvatarPrimitive.Image.Props>): React.ReactElement {
  return (
    <AvatarPrimitive.Image
      className={cn(slotClass("avatar-image", props), "size-full", className)}
      data-slot="avatar-image"
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: WithStringClassName<AvatarPrimitive.Fallback.Props>): React.ReactElement {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        slotClass("avatar-fallback", props),
        "flex size-full items-center justify-center",
        className,
      )}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

export { AvatarPrimitive };
