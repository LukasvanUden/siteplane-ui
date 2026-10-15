"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type * as React from "react";

import type { BadgeProps } from "../badge";
import { KitBadge } from "../badge/badge-internal";
import { normalizeFormattedText } from "../../system/locale/formatted-text";
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
> & {
  /**
   * The number of members the group does not show. The count writes it as
   * "+N", from 1,000 on in compact notation ("+1.3K", with the exact number as
   * its title), and gives assistive technology the exact number. Children
   * follow it, such as visually hidden text that says what it counts.
   */
  count?: number | undefined;
  /**
   * The locale that writes `count`. en-US unless set, as in the charts, so the
   * server and the browser write the same text.
   */
  locale?: string | undefined;
};

/** Counts from this many members on take compact notation. */
const COMPACT_FROM = 1000;

/**
 * The count as the group writes it, and as assistive technology reads it: the
 * exact number with its sign, and from 1,000 on the visible text in compact
 * notation, with one fraction digit at most so that the server and the
 * browser round it alike.
 */
function countText(
  count: number,
  locale: string,
): { exact: string; shown: string } {
  const exact = normalizeFormattedText(
    new Intl.NumberFormat(locale, { signDisplay: "exceptZero" }).format(count),
  );
  if (Math.abs(count) < COMPACT_FROM) return { exact, shown: exact };
  const shown = normalizeFormattedText(
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
      notation: "compact",
      signDisplay: "exceptZero",
    }).format(count),
  );
  return { exact, shown };
}

/**
 * The count of the members a group does not show, such as "+2", at the end
 * of an AvatarGroup: a circle of the group's size with the same surface ring
 * as the avatars. A longer count grows as a pill of the same height and never
 * truncates. Pass the number as `count`, or the text as children; either way,
 * give it an accessible name that says what it counts, for example with
 * visually hidden text.
 */
export function AvatarGroupCount({
  children,
  count,
  locale = "en-US",
  ...props
}: AvatarGroupCountProps): React.ReactElement {
  let content: React.ReactNode = children;
  if (count !== undefined) {
    const { exact, shown } = countText(count, locale);
    content = (
      <>
        <span
          aria-hidden="true"
          className="sp-avatar-group-count-value"
          data-slot="avatar-group-count-value"
          title={shown === exact ? undefined : exact}
        >
          {shown}
        </span>
        <span className="sr-only">{exact}</span>
        {children}
      </>
    );
  }
  return (
    <KitBadge
      data-slot="avatar-group-count"
      {...props}
      profile="group-overflow-count"
    >
      {content}
    </KitBadge>
  );
}
