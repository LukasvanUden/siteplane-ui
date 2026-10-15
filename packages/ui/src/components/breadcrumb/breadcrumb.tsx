"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import * as React from "react";

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
  // The trail wraps by default; design-rework.css owns the wrap, so a header
  // bar can keep it on one line (Dashboard Shell).
  return (
    <ol
      className={cn(
        slotClass("breadcrumb-list", props),
        "wrap-break-word flex items-center gap-1.5 text-muted-foreground text-sm sm:gap-2.5",
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
  // A crumb can shrink below its text, so a long one never runs past the
  // trail: the current page ends with an ellipsis, a link wraps.
  return (
    <li
      className={cn(
        slotClass("breadcrumb-item", props),
        "inline-flex min-w-0 items-center gap-1.5",
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
  children,
  title,
  ...props
}: React.ComponentProps<"span">) {
  // The current page stays on one line and ends with an ellipsis when the
  // trail has no room for it; plain text keeps its full value in title (K5).
  return (
    <span
      aria-current="page"
      className={cn(
        slotClass("breadcrumb-page", props),
        "min-w-0 truncate font-normal text-foreground",
        className,
      )}
      data-slot="breadcrumb-page"
      title={title ?? plainText(children)}
      {...props}
    >
      {children}
    </span>
  );
}

/** The text of children made of strings and numbers only, such as `Invoice {id}`. */
function plainText(children: React.ReactNode): string | undefined {
  const parts = React.Children.toArray(children);
  const text = parts.every(
    (part) => typeof part === "string" || typeof part === "number",
  )
    ? parts.join("")
    : "";
  return text === "" ? undefined : text;
}

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  // The default chevron points to the next level, at the inline end: it
  // mirrors in a right-to-left page.
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
      {children ?? <ChevronRightIcon className="rtl:-scale-x-100" />}
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
