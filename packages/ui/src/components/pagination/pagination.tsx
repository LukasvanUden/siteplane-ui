"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
  useSiteplaneUI,
} from "../../system/provider/siteplane-ui-provider";
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

/**
 * The words of a Pagination. `labels` on Pagination replaces them, merged with
 * the English defaults: pass the translation of each one for an application in
 * another language.
 */
export type PaginationLabels = {
  /** The name of the navigation landmark: "pagination" by default. */
  navigation: string;
  /** The text of PaginationPrevious: "Previous" by default. */
  previous: string;
  /** The accessible name of PaginationPrevious: "Go to previous page" by default. */
  previousPage: string;
  /** The text of PaginationNext: "Next" by default. */
  next: string;
  /** The accessible name of PaginationNext: "Go to next page" by default. */
  nextPage: string;
  /** The hidden text of PaginationEllipsis: "More pages" by default. */
  morePages: string;
};

const defaultPaginationLabels: PaginationLabels = {
  navigation: "pagination",
  previous: "Previous",
  previousPage: "Go to previous page",
  next: "Next",
  nextPage: "Go to next page",
  morePages: "More pages",
};

const PaginationContext = React.createContext<{
  labels: PaginationLabels;
  variant: NonNullable<PaginationProps["variant"]>;
}>({ labels: defaultPaginationLabels, variant: "default" });

export interface PaginationProps extends React.ComponentProps<"nav"> {
  animate?: boolean | undefined;
  /** Replaces the English words of the parts, such as Previous and Next. */
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
  const labels = React.useMemo(
    () => ({ ...defaultPaginationLabels, ...labelsProp }),
    [labelsProp],
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
  // The active fill sits under the current page's link. As Base UI and Radix
  // place an indicator, it is measured in one effect with observers created
  // once: when the list mounts, when it resizes, and when the current page or
  // the links change. Each pass reads both boxes before it writes.
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
  return (
    <ul
      className={cn(
        slotClass("pagination-content", props),
        "relative z-0 flex flex-row items-center gap-1 before:pointer-events-none before:absolute before:top-0 before:left-0 before:-z-1 before:h-(--pagination-active-height) before:w-(--pagination-active-width) before:translate-x-(--pagination-active-left) before:translate-y-(--pagination-active-top) before:opacity-0 data-[active-indicator]:before:opacity-100",
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
  /** @deprecated Use `active`. */
  isActive?: boolean;
};

export type PaginationLinkProps = ButtonStandardProps & PaginationActiveProps;

type PaginationDirectionalProps = ButtonBaseProps & PaginationActiveProps;

export function PaginationLink(
  linkProps: PaginationLinkProps,
): React.ReactElement {
  // Previous and Next pass the internal responsive-navigation profile through
  // KitPaginationLink, the same function with the wider props type.
  const {
    active: activeProp,
    className,
    disabled,
    isActive,
    size,
    render,
    ...props
  } = linkProps as KitPaginationLinkProps;
  const { controlSize } = useSiteplaneUI();
  const resolvedSize = size ?? paginationIconSizeByControlSize[controlSize];
  const active = activeProp ?? isActive;
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

// Previous points to the inline start and Next to the inline end, so their
// chevrons mirror in a right-to-left page.
export function PaginationPrevious({
  className,
  size,
  ...props
}: PaginationDirectionalProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const { labels, variant } = React.useContext(PaginationContext);
  return (
    <KitPaginationLink
      aria-label={labels.previousPage}
      className={className}
      profile="responsive-navigation"
      profileMode={variant === "ghost" ? "compact" : "responsive"}
      size={resolvedSize}
      {...props}
    >
      <ChevronLeftIcon className="in-data-[profile-mode=compact]:m-0 rtl:-scale-x-100" />
      <span className="max-sm:hidden in-data-[profile-mode=compact]:hidden">
        {labels.previous}
      </span>
    </KitPaginationLink>
  );
}

export function PaginationNext({
  className,
  size,
  ...props
}: PaginationDirectionalProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const { labels, variant } = React.useContext(PaginationContext);
  return (
    <KitPaginationLink
      aria-label={labels.nextPage}
      className={className}
      profile="responsive-navigation"
      profileMode={variant === "ghost" ? "compact" : "responsive"}
      size={resolvedSize}
      {...props}
    >
      <span className="max-sm:hidden in-data-[profile-mode=compact]:hidden">
        {labels.next}
      </span>
      <ChevronRightIcon className="in-data-[profile-mode=compact]:m-0 rtl:-scale-x-100" />
    </KitPaginationLink>
  );
}

export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  const { labels } = React.useContext(PaginationContext);
  return (
    <span
      aria-hidden
      className={cn(
        slotClass("pagination-ellipsis", props),
        "flex min-w-7 justify-center",
        className,
      )}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon className="size-5 sm:size-4" />
      <span className="sr-only">{labels.morePages}</span>
    </span>
  );
}
