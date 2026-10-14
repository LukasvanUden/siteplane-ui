"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export function Breadcrumb(props: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      {...props}
      className={cn(slotClass("breadcrumb", props), props.className)}
    />
  );
}

export function BreadcrumbList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      className={cn(
        slotClass("breadcrumb-list", props),
        "wrap-break-word flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm sm:gap-2.5",
        className,
      )}
      data-slot="breadcrumb-list"
      {...props}
    />
  );
}

export function BreadcrumbItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      className={cn(
        slotClass("breadcrumb-item", props),
        "inline-flex items-center gap-1.5",
        className,
      )}
      data-slot="breadcrumb-item"
      {...props}
    />
  );
}

export function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  const defaultProps = {
    className: cn(
      slotClass("breadcrumb-link", props, render),
      "hover:text-foreground",
      className,
    ),
    "data-slot": "breadcrumb-link",
  };
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(defaultProps, props),
    render,
  });
}

export function BreadcrumbPage({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-current="page"
      className={cn(
        slotClass("breadcrumb-page", props),
        "font-normal text-foreground",
        className,
      )}
      data-slot="breadcrumb-page"
      {...props}
    />
  );
}

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      aria-hidden="true"
      className={cn(
        slotClass("breadcrumb-separator", props),
        "opacity-80 [&>svg]:size-4",
        className,
      )}
      data-slot="breadcrumb-separator"
      role="presentation"
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  );
}

export function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        // Inside a menu trigger the ellipsis keeps the muted link color and,
        // like the links, turns to the foreground color on hover or while open.
        slotClass("breadcrumb-ellipsis", props),
        "text-muted-foreground in-aria-expanded:text-foreground in-[button:hover]:text-foreground",
        className,
      )}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <MoreHorizontalIcon className="size-4 opacity-100" />
      <span className="sr-only">More</span>
    </span>
  );
}
