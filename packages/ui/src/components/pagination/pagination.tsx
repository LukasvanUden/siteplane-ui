"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
  useSiteplaneUI,
} from "../../system/provider/siteplane-ui-provider";
import type { PaginationLabels } from "../../system/locale/messages";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import {
  type Button,
  type ButtonBaseProps,
  type ButtonStandardProps,
} from "../button";
import { KitButton, type KitButtonProps } from "../button/button-internal";

const paginationIconSizeByControlSize = {
  sm: "icon-sm",
  md: "icon-md",
  lg: "icon-lg",
  xl: "icon-xl",
} as const satisfies Record<
  SiteplaneControlSize,
  React.ComponentProps<typeof Button>["size"]
>;

export type { PaginationLabels };

// Outside a Pagination the parts read the messages themselves (null here).
const PaginationContext = React.createContext<{
  labels: PaginationLabels;
  variant: NonNullable<PaginationProps["variant"]>;
} | null>(null);

/** The words and the variant of the Pagination around a part. */
function usePagination(): {
  labels: PaginationLabels;
  variant: NonNullable<PaginationProps["variant"]>;
} {
  const messages = useSiteplaneMessages("pagination");
  return (
    React.useContext(PaginationContext) ?? {
      labels: messages,
      variant: "default",
    }
  );
}

export interface PaginationProps extends React.ComponentProps<"nav"> {
  animate?: boolean | undefined;
  /**
   * Replaces words of the parts for this Pagination, such as Previous and
   * Next, merged with the messages of SiteplaneLocaleProvider (English by
   * default).
   */
  labels?: Partial<PaginationLabels> | undefined;
  variant?: "default" | "ghost" | undefined;
}

export function Pagination({
  animate = true,
  children,
  className,
  labels: labelsProp,
  variant = "default",
  ...props
}: PaginationProps): React.ReactElement {
  const messages = useSiteplaneMessages("pagination");
  const labels = React.useMemo(
    () => ({ ...messages, ...labelsProp }),
    [labelsProp, messages],
  );
  const context = React.useMemo(() => ({ labels, variant }), [labels, variant]);
  return (
    <PaginationContext.Provider value={context}>
      <nav
        aria-label={labels.navigation}
        className={cn(
          slotClass("pagination", props),
          "mx-auto flex w-full justify-center",
          className,
        )}
        data-animate={animate ? undefined : "false"}
        data-slot="pagination"
        data-variant={variant}
        {...props}
      >
        {children}
      </nav>
    </PaginationContext.Provider>
  );
}

export function PaginationContent({
  className,
  ref,
  ...props
}: React.ComponentProps<"ul">): React.ReactElement {
  const listRef = React.useRef<HTMLUListElement>(null);
  React.useImperativeHandle(ref, () => listRef.current as HTMLUListElement);
  // The active fill sits under the current page's link. It is measured in one
  // effect with observers created once: when the list mounts, when it resizes,
  // and when the current page or the links change. Each pass reads both boxes
  // before it writes.
  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const updateIndicator = () => {
      const activeLink = list.querySelector<HTMLElement>(
        '[data-slot="pagination-link"][data-active="true"]',
      );
      if (!activeLink) {
        delete list.dataset.activeIndicator;
        return;
      }
      const listRect = list.getBoundingClientRect();
      const activeRect = activeLink.getBoundingClientRect();
      list.style.setProperty(
        "--pagination-active-left",
        `${activeRect.left - listRect.left}px`,
      );
      list.style.setProperty(
        "--pagination-active-top",
        `${activeRect.top - listRect.top}px`,
      );
      list.style.setProperty(
        "--pagination-active-width",
        `${activeRect.width}px`,
      );
      list.style.setProperty(
        "--pagination-active-height",
        `${activeRect.height}px`,
      );
      list.dataset.activeIndicator = "";
    };
    updateIndicator();
    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(list);
    // A page change moves `data-active` to another link; new pages replace the
    // links or their text.
    const changeObserver = new MutationObserver(updateIndicator);
    changeObserver.observe(list, {
      attributeFilter: ["data-active"],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => {
      resizeObserver.disconnect();
      changeObserver.disconnect();
    };
  }, []);
  // The items sit 2 px apart.
  return (
    <ul
      className={cn(
        slotClass("pagination-content", props),
        "relative z-0 flex flex-row items-center gap-0.5 before:pointer-events-none before:absolute before:top-0 before:left-0 before:-z-1 before:h-(--pagination-active-height) before:w-(--pagination-active-width) before:translate-x-(--pagination-active-left) before:translate-y-(--pagination-active-top) before:opacity-0 data-[active-indicator]:before:opacity-100",
        className,
      )}
      data-slot="pagination-content"
      ref={listRef}
      {...props}
    />
  );
}

export function PaginationItem(
  props: React.ComponentProps<"li">,
): React.ReactElement {
  return (
    <li
      data-slot="pagination-item"
      {...props}
      className={cn(slotClass("pagination-item", props), props.className)}
    />
  );
}

type PaginationActiveProps = {
  /** Marks the current page: `aria-current="page"` and the active fill. */
  active?: boolean;
};

export type PaginationLinkProps = ButtonStandardProps & PaginationActiveProps;

type PaginationDirectionalProps = ButtonBaseProps & PaginationActiveProps;

export function PaginationLink(
  linkProps: PaginationLinkProps,
): React.ReactElement {
  // Previous and Next pass the internal responsive-navigation profile through
  // KitPaginationLink, the same function with the wider props type.
  const { active, className, disabled, size, render, ...props } =
    linkProps as KitPaginationLinkProps;
  const { controlSize } = useSiteplaneUI();
  const resolvedSize = size ?? paginationIconSizeByControlSize[controlSize];
  return (
    <KitButton
      aria-current={active ? "page" : undefined}
      className={className}
      data-active={active}
      data-slot="pagination-link"
      disabled={disabled}
      render={render}
      size={resolvedSize}
      variant="ghost"
      {...props}
    />
  );
}

type KitPaginationLinkProps = KitButtonProps & PaginationActiveProps;

const KitPaginationLink = PaginationLink as (
  props: KitPaginationLinkProps,
) => React.ReactElement;

const linkVariants: ReadonlySet<string> = new Set([
  "link",
  "link-accent",
  "link-destructive",
]);

/**
 * Previous and Next. In the default Pagination they are links of their own,
 * the link Button with an arrow and its word, at the two ends of the row
 * (Lukas, 2 November 2026); in the ghost
 * Pagination they are square icon Buttons with a caret beside the pages. A
 * `variant` makes them another Button, such as `default` for raised ones: a
 * Button other than a link shows its word from 640 px and turns square below,
 * and a link shows its arrow alone there. Previous points to the inline start
 * and Next to the inline end, so their glyphs mirror in a right-to-left page.
 */
function PaginationDirection({
  className,
  direction,
  size,
  variant,
  ...props
}: PaginationDirectionalProps & {
  direction: "previous" | "next";
}): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const { labels, variant: paginationVariant } = usePagination();
  const compact = paginationVariant === "ghost";
  const resolvedVariant = variant ?? (compact ? "ghost" : "link");
  const previous = direction === "previous";
  const Glyph = compact
    ? previous
      ? CaretLeftIcon
      : CaretRightIcon
    : previous
      ? ArrowLeftIcon
      : ArrowRightIcon;
  const glyph = (
    <Glyph
      aria-hidden="true"
      className="in-data-[profile-mode=compact]:m-0 rtl:-scale-x-100"
    />
  );
  const word = (
    <span className="max-sm:hidden in-data-[profile-mode=compact]:hidden">
      {previous ? labels.previous : labels.next}
    </span>
  );
  const children = previous ? [glyph, word] : [word, glyph];
  const shared = {
    "aria-label": previous ? labels.previousPage : labels.nextPage,
    className,
    "data-direction": direction,
    size: resolvedSize,
    variant: resolvedVariant,
  };
  // A link keeps the link's own geometry and states (rulebook T9); any other
  // Button takes the responsive navigation profile.
  return linkVariants.has(resolvedVariant) ? (
    <KitPaginationLink {...shared} {...props}>
      {children[0]}
      {children[1]}
    </KitPaginationLink>
  ) : (
    <KitPaginationLink
      {...shared}
      profile="responsive-navigation"
      profileMode={compact ? "compact" : "responsive"}
      {...props}
    >
      {children[0]}
      {children[1]}
    </KitPaginationLink>
  );
}

export function PaginationPrevious(
  props: PaginationDirectionalProps,
): React.ReactElement {
  return <PaginationDirection {...props} direction="previous" />;
}

export function PaginationNext(
  props: PaginationDirectionalProps,
): React.ReactElement {
  return <PaginationDirection {...props} direction="next" />;
}

// The ellipsis is the square of a page link of its size
// (36 px at the default sm), with the glyph of the Button beside it; both are
// the stylesheet's, keyed on the size (design-rework.css, "Pagination").
export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  const { labels } = usePagination();
  const { controlSize } = useSiteplaneUI();
  // The dots are decoration; the words after them say that pages are left
  // out, so the ellipsis itself stays in the accessibility tree.
  return (
    <span
      className={cn(
        slotClass("pagination-ellipsis", props),
        "flex shrink-0 items-center justify-center",
        className,
      )}
      data-size={controlSize}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <DotsThreeIcon aria-hidden="true" />
      <span className="sr-only">{labels.morePages}</span>
    </span>
  );
}

/**
 * Where the reader stands: "Page 3 of 10", in the secondary text with the two
 * numbers a step heavier. It is the status of a compact bar that has no page
 * links, such as the one a table card shows on a phone or beside a page size
 * Select, and takes its words from `labels.pageStatus`. The current page may
 * be an element instead of a number, such as an Input to jump to a page.
 */
export function PaginationStatus({
  className,
  page,
  total,
  ...props
}: React.ComponentProps<"span"> & {
  /** The current page, from 1, or an element that stands for it. */
  page: React.ReactNode;
  /** The number of pages. */
  total: React.ReactNode;
}): React.ReactElement {
  const { labels } = usePagination();
  return (
    <span
      className={cn(slotClass("pagination-status", props), className)}
      data-slot="pagination-status"
      {...props}
    >
      {labels.pageStatus.split(/(\{page\}|\{total\})/).map((part, index) =>
        part === "{page}" || part === "{total}" ? (
          <span
            className="sp-pagination-status-value"
            data-slot="pagination-status-value"
            key={index}
          >
            {part === "{page}" ? page : total}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}
