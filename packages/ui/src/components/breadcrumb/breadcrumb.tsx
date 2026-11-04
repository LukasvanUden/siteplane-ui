"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { OverflowGlyph } from "../../system/styles/overflow-glyph";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export function Breadcrumb(props: React.ComponentProps<"nav">) {
  const messages = useSiteplaneMessages("breadcrumb");
  return (
    <nav
      aria-label={messages.label}
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

/**
 * A step of the trail back to a parent page. It is navigation, not a link in
 * text: it rests in the muted colour and takes the foreground on hover, by
 * colour alone, with no underline.
 * A link in a sentence or of its own is the link Button (rulebook T9).
 */
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
      {children ?? (
        <CaretRightIcon aria-hidden="true" className="rtl:-scale-x-100" />
      )}
    </li>
  );
}

/**
 * The levels a trail leaves out. The dots are the overflow dots of every
 * "more" trigger of the kit (OverflowGlyph, 20 px). They are hidden from
 * assistive technology, which reads "More" in their place; inside a menu
 * trigger, the trigger's `aria-label` names the button instead.
 */
export function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const messages = useSiteplaneMessages("breadcrumb");
  return (
    <span
      className={cn(
        // Inside a menu trigger the ellipsis keeps the muted link color and,
        // like the links, turns to the foreground color on hover or while open.
        slotClass("breadcrumb-ellipsis", props),
        "text-muted-foreground in-aria-expanded:text-foreground in-[button:hover]:text-foreground",
        className,
      )}
      data-slot="breadcrumb-ellipsis"
      {...props}
    >
      <OverflowGlyph className="opacity-100" />
      <span className="sr-only">{messages.more}</span>
    </span>
  );
}
