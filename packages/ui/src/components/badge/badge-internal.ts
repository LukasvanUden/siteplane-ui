import type * as React from "react";

import { Badge, type BadgeProfile, type BadgeProps } from "./badge";

/*
 * Kit-internal Badge. Not public API: the badge index does not export this
 * module, and its names and profiles may change in any release.
 *
 * `group-overflow-count` is the circular count at the end of an avatar stack.
 * AvatarGroupCount renders it; applications use AvatarGroupCount.
 *
 * `tag-count` is the count after the label of a Tag (`Tag count`), a badge of
 * its own that is as high as its line. Tag renders it and sets its geometry.
 */
export type KitBadgeProfile =
  BadgeProfile | "group-overflow-count" | "tag-count";

export type KitBadgeProps = Omit<BadgeProps, "profile"> & {
  profile?: KitBadgeProfile;
};

/** Badge with the kit's composition profiles; the same component. */
export const KitBadge = Badge as (props: KitBadgeProps) => React.ReactElement;
