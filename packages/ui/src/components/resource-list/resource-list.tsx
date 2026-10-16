"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { useResolvedDensity } from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button } from "../button";
import { SelectionCheckIcon } from "../action-icons";
import { MotionItem, MotionList, type MotionListProps } from "../motion";
import { useFocusHandoff } from "./resource-list-focus";

export type ResourceListDensity = "default" | "compact";
export type ResourceListVariant = "default" | "soft" | "divided";
export type ResourceListIndicatorTone =
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"
  | "error"
  | "info"
  | "neutral"
  | "success"
  | "warning";
/** @deprecated `muted` is the earlier name of `neutral`. */
export type ResourceListIndicatorDeprecatedTone = "muted";
export type ResourceListIndicatorShape = "bar" | "diamond" | "dot" | "ring";

export interface ResourceListProps extends useRender.ComponentProps<"div"> {
  density?: ResourceListDensity;
  /**
   * Sets the row content flush with the edges of the list, so that it lines up
   * with the content around the list, such as a Filter Bar or a Card heading.
   * The rows reach past the edges by their own padding, which keeps the hover,
   * current and selected fills inset around the content. The container needs
   * that much room, as a Card panel has.
   */
  flush?: boolean;
  /**
   * `soft` groups the rows on a subtle surface. `divided` draws the kit's
   * hairline between two rows, across the row content, and keeps no space
   * above the first row's content or below the last row's: the list reaches
   * past its top and bottom by the row padding, as `flush` makes it reach past
   * its sides. With clickable (`interactive`) rows the line is as wide as their
   * hover surface. A `ResourceListHeader` gets the same line below it.
   */
  variant?: ResourceListVariant;
}

export interface ResourceListItemProps extends useRender.ComponentProps<"div"> {
  active?: boolean;
  disabled?: boolean;
  interactive?: boolean;
  selected?: boolean;
}

export interface ResourceListIndicatorProps extends useRender.ComponentProps<"span"> {
  icon?: React.ReactNode;
  label?: string;
  shape?: ResourceListIndicatorShape;
  /**
   * The mark's color: a status value, `neutral` (the default) or a chart
   * color. `muted` is the deprecated earlier name of `neutral`.
   */
  tone?: ResourceListIndicatorTone | ResourceListIndicatorDeprecatedTone;
}

const resourceListIndicatorShapeClassNames = {
  bar: "h-4 w-1 rounded-full",
  diamond: "size-2 rotate-45 rounded-[2px]",
  dot: "size-1.5 rounded-full",
  ring: "size-2.5 rounded-full border-2 border-current bg-transparent",
} as const satisfies Record<ResourceListIndicatorShape, string>;

/** Rows read this to know they are in a list, which animates them (rulebook M6, M7). */
const ResourceListContext = React.createContext(false);

// The line between two rows of a divided list, and below its header: the
// kit's hairline (rulebook B7), across the row content, in the middle of the
// space between the rows. With clickable rows it is as wide as their hover
// surface (design-rework.css).
const resourceListDivider = (
  <span
    aria-hidden="true"
    className={slotClass("resource-list-divider")}
    data-slot="resource-list-divider"
  />
);

/**
 * Rows that are added, removed or reordered expand, collapse and glide on their
 * own; give each row a stable `key`. When a row that holds focus leaves, focus
 * moves to the next row, or to the previous one at the end.
 */
export function ResourceList({
  children,
  className,
  density,
  flush = false,
  render,
  variant = "default",
  ...props
}: ResourceListProps): React.ReactElement {
  const resolvedDensity = useResolvedDensity(density);

  return (
    <ResourceListContext.Provider value>
      <MotionList
        className={cn(
          // The offset is what lies between the list's edge and the row content:
          // the row's padding (px-3 on ResourceListItem), and on the soft surface
          // its own padding (p-1) as well.
          "grid min-w-0 [--resource-list-flush-offset:--spacing(3)] data-[variant=soft]:rounded-xl data-[variant=soft]:bg-surface-subtle data-[variant=soft]:p-1 data-[variant=soft]:[--resource-list-flush-offset:--spacing(4)]",
          // A flush list reaches past its container by the offset on both sides.
          // The width names the reach as well, so that a width from the consumer
          // widens the list instead of shifting it.
          "data-[flush=true]:-mx-(--resource-list-flush-offset) data-[flush=true]:w-[calc(100%+var(--resource-list-flush-offset)*2)]",
          className,
        )}
        // The kit's compact rules key on the list's own density, never on an
        // ancestor's, such as a compact Card around a default list
        // (design-rework.css).
        data-density={resolvedDensity}
        data-flush={flush || undefined}
        data-slot="resource-list"
        data-variant={variant}
        // The space between rows belongs to the rows, so it collapses with them.
        gap={resolvedDensity === "compact" ? 0.5 : 1}
        // A divided list draws its line in that space, so the line comes and
        // goes with the row after it (rulebook M6, M7).
        separator={variant === "divided" ? resourceListDivider : undefined}
        render={render ?? <div />}
        // The list is a div here; MotionList types its default element, a ul.
        {...(props as unknown as Omit<MotionListProps, "children" | "render">)}
      >
        {children}
      </MotionList>
    </ResourceListContext.Provider>
  );
}

/**
 * The heading of a list, before its rows. Its text starts where the rows' text
 * does, at their size and in the muted color of their metadata; a second
 * child, such as an action, sits at the end. In a list it is an entry like a
 * row: a divided list draws its line below the header, as wide as the lines
 * between the rows, and the first row keeps the space below it that every row
 * keeps below a line.
 */
export function ResourceListHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    "data-slot": "resource-list-header",
    className: cn(
      slotClass("resource-list-header", props, render),
      "flex min-w-0 items-center justify-between gap-3 px-3 text-muted-foreground text-sm",
      className,
    ),
  };
  const header = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
  const inList = React.useContext(ResourceListContext);

  // The entry holds the space and the line after the header, as a row's does.
  return inList ? (
    <MotionItem className="min-w-0" render={<div />}>
      {header}
    </MotionItem>
  ) : (
    header
  );
}

// The row's rendered element decides which ARIA states it supports.
function getRenderedRowElement(
  render: ResourceListItemProps["render"],
): "button" | "link" | "other" | undefined {
  if (render === undefined) return undefined;
  if (!React.isValidElement<{ href?: unknown }>(render)) return "other";
  if (render.type === "a" || render.props.href !== undefined) return "link";
  return render.type === "button" ? "button" : "other";
}

export function ResourceListItem({
  active = false,
  className,
  disabled = false,
  interactive = false,
  render,
  selected,
  ...props
}: ResourceListItemProps): React.ReactElement {
  const renderedElement = getRenderedRowElement(render);
  // A linked row is the current page; any other row is the current item.
  const ariaCurrent: "page" | "true" | undefined = active
    ? renderedElement === "link"
      ? "page"
      : "true"
    : undefined;
  // Only a native button row supports a pressed selection state; links,
  // generic rows and unknown custom elements keep selection visual only.
  const rendersNativeButton =
    interactive &&
    (renderedElement === undefined || renderedElement === "button");
  const defaultProps = {
    "aria-current": ariaCurrent,
    "aria-disabled": disabled || undefined,
    "aria-pressed":
      rendersNativeButton && selected !== undefined ? selected : undefined,
    "data-active": active || undefined,
    "data-disabled": disabled || undefined,
    "data-interactive": interactive || undefined,
    "data-pressed": interactive && (active || selected) ? "" : undefined,
    "data-resource-list-item": "",
    "data-selected": selected || undefined,
    "data-slot": "resource-list-item",
    // A row without an indicator or meta takes no room for it (rulebook S11):
    // the content fills what the other parts leave. The space above and below
    // the content is a kit rule, which a compact list refines. An interactive
    // row is a Button: its chassis centres the parts, and the kit's
    // resource-list rule makes it a row and sets its spacing and text.
    className: cn(
      slotClass("resource-list-item", props, render),
      "min-w-0",
      !interactive &&
        "flex items-center gap-3 px-3 text-left text-sm rounded-lg data-[active=true]:bg-state-selected data-[selected=true]:bg-state-selected data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-(--sp-rw-disabled-opacity-action)",
      className,
    ),
  };

  const row = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render: interactive ? (
      <Button
        align="start"
        disabled={disabled}
        multiline
        render={render}
        variant="ghost"
        width="full"
      />
    ) : (
      render
    ),
  });
  const inList = React.useContext(ResourceListContext);

  // The entry is the box that expands and collapses; the row keeps its own
  // padding, states and focus ring.
  return inList ? (
    <MotionItem
      className="min-w-0"
      data-resource-list-entry=""
      render={<ResourceListEntry />}
    >
      {row}
    </MotionItem>
  ) : (
    row
  );
}

function ResourceListEntry(props: React.ComponentProps<"div">) {
  const entry = React.useRef<HTMLDivElement>(null);
  const focus = useFocusHandoff(entry, Boolean(props.inert));

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(focus, props),
    ref: entry,
  });
}

export function ResourceListIndicator({
  children,
  className,
  icon,
  label,
  render,
  shape = "dot",
  tone: toneProp = "neutral",
  ...props
}: ResourceListIndicatorProps): React.ReactElement {
  const tone = toneProp === "muted" ? "neutral" : toneProp;
  const defaultProps = {
    "aria-hidden": label ? undefined : true,
    "aria-label": label,
    children: icon ?? children,
    "data-slot": "resource-list-indicator",
    "data-shape": shape,
    "data-tone": tone,
    // In a row with a description the mark centres on the first line, and
    // text in the meta sits on it (rulebook I5): two rules in the ResourceList
    // block of design-rework.css.
    className: cn(
      slotClass("resource-list-indicator", props, render),
      "inline-flex shrink-0 items-center justify-center",
      icon
        ? "size-5 rounded-full text-primary-foreground [&>svg]:size-3"
        : resourceListIndicatorShapeClassNames[shape],
      tone === "success" && "bg-success",
      tone === "neutral" && "bg-muted-foreground/30",
      tone === "warning" && "bg-warning",
      tone === "error" && "bg-destructive",
      tone === "info" && "bg-info",
      tone === "chart-1" && "bg-chart-1",
      tone === "chart-2" && "bg-chart-2",
      tone === "chart-3" && "bg-chart-3",
      tone === "chart-4" && "bg-chart-4",
      tone === "chart-5" && "bg-chart-5",
      className,
    ),
    role: label ? "img" : undefined,
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}

export function ResourceListContent({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    "data-slot": "resource-list-content",
    className: cn(
      slotClass("resource-list-content", props, render),
      "grid min-w-0 flex-1 gap-0.5",
      className,
    ),
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

// The text of children that are nothing but text: strings and numbers, and
// the values React renders as nothing. It reads the same on the server and in
// the browser. With an element among the children it is undefined.
function plainText(node: React.ReactNode): string | undefined {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "bigint"
  )
    return `${node}`;
  if (!Array.isArray(node)) return undefined;
  let text = "";
  for (const child of node as React.ReactNode[]) {
    const part = plainText(child);
    if (part === undefined) return undefined;
    text += part;
  }
  return text;
}

/**
 * A title and a description stay on one line and end with an ellipsis, so a
 * dense list keeps its rhythm (rulebook K5, list rows); their title attribute
 * holds the full text. Text children give it while rendering, the same on the
 * server and in the browser. With an element among the children it is read
 * from the rendered text after mount, and again after each render: a Server
 * Component hands element children over as references, which the server and
 * the browser may not resolve alike, so reading them while rendering broke
 * hydration. A title prop of the consumer's own replaces it, and then nothing
 * is read.
 */
function useFullTextTitle(props: {
  children?: React.ReactNode;
  title?: string | undefined;
}): {
  ref: React.RefObject<HTMLSpanElement | null>;
  title: string | undefined;
} {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const text = plainText(props.children);
  const read = text === undefined && !("title" in props);
  const [rendered, setRendered] = React.useState<string>();
  React.useLayoutEffect(() => {
    if (read) setRendered(ref.current?.textContent?.trim() || undefined);
  });
  return {
    ref,
    title: text === undefined ? rendered : text.trim() || undefined,
  };
}

export function ResourceListTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"span">): React.ReactElement {
  const fullText = useFullTextTitle(props);
  const defaultProps = {
    "data-slot": "resource-list-title",
    className: cn(
      slotClass("resource-list-title", props, render),
      "truncate font-(--sp-rw-font-weight-label) text-foreground",
      className,
    ),
    title: fullText.title,
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    ref: fullText.ref,
    render,
  });
}

export function ResourceListDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"span">): React.ReactElement {
  const fullText = useFullTextTitle(props);
  const defaultProps = {
    "data-slot": "resource-list-description",
    className: cn(
      slotClass("resource-list-description", props, render),
      "truncate text-muted-foreground text-xs",
      className,
    ),
    title: fullText.title,
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    ref: fullText.ref,
    render,
  });
}

export function ResourceListMeta({
  children,
  className,
  render,
  selected,
  ...props
}: useRender.ComponentProps<"span"> & {
  selected?: boolean;
}): React.ReactElement {
  const defaultProps = {
    "data-slot": "resource-list-meta",
    className: cn(
      slotClass("resource-list-meta", props, render),
      "inline-flex shrink-0 items-center whitespace-nowrap",
      className,
    ),
    children: (
      <>
        {children}
        {selected !== undefined && (
          // The slot is the indicator of the shared check motion: it holds
          // data-selected only while the row is selected, so the check draws in
          // and back out as the attribute comes and goes.
          <span
            aria-hidden="true"
            data-selected={selected || undefined}
            className="sp-resource-list-selection"
            data-slot="resource-list-selection"
          >
            <SelectionCheckIcon />
          </span>
        )}
      </>
    ),
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}
