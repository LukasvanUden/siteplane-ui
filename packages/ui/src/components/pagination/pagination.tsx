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

const PaginationContext = React.createContext<{
  variant: NonNullable<PaginationProps["variant"]>;
}>({ variant: "default" });

export interface PaginationProps extends React.ComponentProps<"nav"> {
  animate?: boolean | undefined;
  variant?: "default" | "ghost" | undefined;
}

export function Pagination({
  animate = true,
  children,
  className,
  variant = "default",
  ...props
}: PaginationProps): React.ReactElement {
  return (
    <PaginationContext.Provider value={{ variant }}>
      <nav
        aria-label="pagination"
        className={cn("mx-auto flex w-full justify-center", className)}
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
    return () => resizeObserver.disconnect();
  });
  return (
    <ul
      className={cn(
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
  return <li data-slot="pagination-item" {...props} />;
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

export function PaginationPrevious({
  className,
  size,
  ...props
}: PaginationDirectionalProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const { variant } = React.useContext(PaginationContext);
  return (
    <KitPaginationLink
      aria-label="Go to previous page"
      className={className}
      profile="responsive-navigation"
      profileMode={variant === "ghost" ? "compact" : "responsive"}
      size={resolvedSize}
      {...props}
    >
      <ChevronLeftIcon className="in-data-[profile-mode=compact]:m-0" />
      <span className="max-sm:hidden in-data-[profile-mode=compact]:hidden">
        Previous
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
  const { variant } = React.useContext(PaginationContext);
  return (
    <KitPaginationLink
      aria-label="Go to next page"
      className={className}
      profile="responsive-navigation"
      profileMode={variant === "ghost" ? "compact" : "responsive"}
      size={resolvedSize}
      {...props}
    >
      <span className="max-sm:hidden in-data-[profile-mode=compact]:hidden">
        Next
      </span>
      <ChevronRightIcon className="in-data-[profile-mode=compact]:m-0" />
    </KitPaginationLink>
  );
}

export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      aria-hidden
      className={cn("flex min-w-7 justify-center", className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon className="size-5 sm:size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
