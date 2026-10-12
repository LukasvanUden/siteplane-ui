"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { useResolvedDensity } from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { Button } from "../button";
import { SelectionCheckIcon } from "../action-icons";
import { MotionItem, MotionList, type MotionListProps } from "../motion";
import { useFocusHandoff } from "./resource-list-focus";

export type ResourceListDensity = "default" | "compact";
export type ResourceListVariant = "default" | "soft";
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

// A row whose content has a description runs over more than one line. There
// the leading mark centres on the first line, and text at the end sits on it,
// as a date does in an inbox (rulebook I5). A control
// at the end, such as a chevron or a button, stays centred on the row, and so
// does every part of a row of one line.
const firstLineMarkClassName =
  "has-[~[data-slot=resource-list-content]>[data-slot=resource-list-description]]:self-start has-[~[data-slot=resource-list-content]>[data-slot=resource-list-description]]:translate-y-[calc((1lh-100%)/2)]";
const firstLineTextClassName =
  "[[data-slot=resource-list-content]:has(>[data-slot=resource-list-description])~&:not(:has(>:not([data-slot=resource-list-selection])))]:self-start [[data-slot=resource-list-content]:has(>[data-slot=resource-list-description])~&:not(:has(>:not([data-slot=resource-list-selection])))]:min-h-5";

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
        data-density={resolvedDensity}
        data-flush={flush || undefined}
        data-slot="resource-list"
        data-variant={variant}
        // The space between rows belongs to the rows, so it collapses with them.
        gap={resolvedDensity === "compact" ? 0.5 : 1}
        render={render ?? <div />}
        // The list is a div here; MotionList types its default element, a ul.
        {...(props as unknown as Omit<MotionListProps, "children" | "render">)}
      >
        {children}
      </MotionList>
    </ResourceListContext.Provider>
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
    // the content fills what the other parts leave. An interactive row is a
    // Button, whose spacing and text the kit's resource-list rule sets.
    className: cn(
      "flex min-w-0 items-center",
      !interactive &&
        "gap-3 px-3 py-2.5 text-left text-sm in-data-[density=compact]:py-2 rounded-lg data-[active=true]:bg-state-selected data-[selected=true]:bg-state-selected data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-(--sp-rw-disabled-opacity-action)",
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
    className: cn(
      "inline-flex shrink-0 items-center justify-center",
      firstLineMarkClassName,
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
    className: cn("grid min-w-0 flex-1 gap-0.5", className),
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

// The plain text of a title or description, for its title attribute. Text
// inside elements counts too, so a highlighted part or a link keeps the full
// value.
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return `${node}`;
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

// A title and a description stay on one line and end with an ellipsis, so a
// dense list keeps its rhythm (rulebook K5, list rows); the title attribute
// shows the full text. A title prop of its own replaces it.
function fullTextTitle(children: React.ReactNode): string | undefined {
  return textOf(children).trim() || undefined;
}

export function ResourceListTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"span">): React.ReactElement {
  const defaultProps = {
    "data-slot": "resource-list-title",
    className: cn("truncate font-medium text-foreground", className),
    title: fullTextTitle(props.children),
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}

export function ResourceListDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"span">): React.ReactElement {
  const defaultProps = {
    "data-slot": "resource-list-description",
    className: cn("truncate text-muted-foreground text-xs", className),
    title: fullTextTitle(props.children),
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
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
      "inline-flex shrink-0 items-center whitespace-nowrap text-sm in-data-[density=compact]:text-xs",
      firstLineTextClassName,
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
