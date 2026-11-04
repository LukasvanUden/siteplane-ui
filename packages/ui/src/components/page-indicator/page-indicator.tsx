"use client";

import * as React from "react";

import type { PageIndicatorLabels } from "../../system/locale/messages";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button } from "../button";

import "./page-indicator.css";

/** A row of dots, or a line of segments that share the container's width. */
export type PageIndicatorVariant = "dot" | "line";

/**
 * md: 8 px dots 12 px apart, or 6 px segments 8 px apart. lg: 10 px dots
 * 16 px apart, or 8 px segments 12 px apart.
 */
export type PageIndicatorSize = "md" | "lg";

export type { PageIndicatorLabels };

export interface PageIndicatorProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The number of pages, one mark each. */
  count: number;
  /** The current page, counted from 1. */
  page: number;
  /** Called with the page a person picks, counted from 1. */
  onPageChange?: ((page: number) => void) | undefined;
  /** `dot`, the default, or `line`. */
  variant?: PageIndicatorVariant | undefined;
  /** `md`, the default, or `lg`. */
  size?: PageIndicatorSize | undefined;
  /** Sets the marks on a translucent pill, for an indicator on an image. */
  framed?: boolean | undefined;
  /**
   * Replaces the names of the group and of its pages for this indicator, each
   * one on its own, over the messages of SiteplaneLocaleProvider (English by
   * default).
   */
  labels?: Partial<PageIndicatorLabels> | undefined;
}

/**
 * Shows which of a few pages is current, as a row of dots or a line of
 * segments, and goes to another page on a click. Each page is the public
 * Button as a square inline action, the bare mark in a larger target: the
 * Button owns its cursor and its states, and keyboard focus draws the kit
 * outline around the mark (page-indicator.css). The application keeps the
 * page in state and changes the content when `onPageChange` fires.
 */
export function PageIndicator({
  className,
  count,
  framed = false,
  labels: labelsProp,
  onPageChange,
  page,
  size = "md",
  variant = "dot",
  ...props
}: PageIndicatorProps): React.ReactElement {
  const messages = useSiteplaneMessages("pageIndicator");
  const labels: PageIndicatorLabels = {
    group: labelsProp?.group ?? messages.group,
    page: labelsProp?.page ?? messages.page,
  };
  const pages = Array.from(
    { length: Math.max(0, Math.floor(count)) },
    (_, index) => index + 1,
  );
  return (
    <div
      aria-label={labels.group}
      className={cn(slotClass("page-indicator", props), className)}
      data-framed={framed ? "" : undefined}
      data-size={size}
      data-slot="page-indicator"
      data-variant={variant}
      role="group"
      {...props}
    >
      {pages.map((value) => {
        const current = value === page;
        return (
          <Button
            aria-current={current ? "page" : undefined}
            aria-label={labels.page(value)}
            // The Button widens its target to 44 px on a touch screen. The
            // marks stand closer than that, so the target keeps the width of
            // its mark's share of the row and only grows in height, as the
            // Buttons of a Group do.
            className="pointer-coarse:after:min-w-auto"
            data-current={current ? "" : undefined}
            data-slot="page-indicator-item"
            key={value}
            onClick={() => {
              if (!current) onPageChange?.(value);
            }}
            profile="inline"
            shape="square"
            size="icon-2xs"
            variant="link"
          >
            <span
              className="sp-page-indicator-mark"
              data-slot="page-indicator-mark"
            />
          </Button>
        );
      })}
    </div>
  );
}
