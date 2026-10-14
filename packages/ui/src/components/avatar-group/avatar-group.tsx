"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type * as React from "react";

import type { BadgeProps } from "../badge";
import { KitBadge } from "../badge/badge-internal";
import { slotClass } from "../../system/utils/slot-class";
import { cn } from "../../system/utils/cn";

export type AvatarGroupSize = "sm" | "md" | "lg" | "xl";

export interface AvatarGroupProps extends useRender.ComponentProps<"div"> {
  /**
   * The size of every avatar and the count in the group: `sm` 24 px, `md`
   * 32 px (the default, the size of a single Avatar), `lg` 40 px and `xl`
   * 48 px. The avatars overlap by a quarter of it.
   */
  size?: AvatarGroupSize;
}

/**
 * A row of overlapping avatars. The group sizes its avatars and its count;
 * each item after the first overlaps the one before it by a quarter of that
 * size, and every avatar draws a 2 px ring in the color of the surface it
 * sits on, so the circles stay apart on a page, a Card or a Dialog. The kit
 * stylesheet owns the size, the overlap and the ring.
 */
export function AvatarGroup({
  className,
  render,
  size = "md",
  ...props
}: AvatarGroupProps): React.ReactElement {
  const defaultProps = {
    "data-size": size,
    "data-slot": "avatar-group",
    className: cn(slotClass("avatar-group", props, render), className),
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export type AvatarGroupCountProps = Omit<
  BadgeProps,
  "light" | "profile" | "shape" | "size" | "variant"
>;

/**
 * The count of the members a group does not show, such as "+2", at the end
 * of an AvatarGroup: a circle of the group's size with the same surface ring
 * as the avatars. Give it an accessible name that says what it counts, for
 * example with visually hidden text.
 */
export function AvatarGroupCount(
  props: AvatarGroupCountProps,
): React.ReactElement {
  return (
    <KitBadge
      data-slot="avatar-group-count"
      {...props}
      profile="group-overflow-count"
    />
  );
}
