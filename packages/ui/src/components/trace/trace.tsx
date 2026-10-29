"use client";

import { ChevronRightIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button } from "../button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../collapsible";
import { MotionShimmer } from "../motion";

import "./trace.css";

/**
 * The state of the work a line reports. A line with no status reports work
 * that is done.
 */
export type TraceStatus = "running" | "error" | "pending";

/*
 * The row of a step that does something: the trigger of a collapsible step
 * and a link. Both are the kit's muted inline Button (rulebook T2), which owns
 * the colours at rest, on hover, press and keyboard focus, the focus outline
 * and the 44 px touch target. The Button's inline profile draws no box, so the
 * row has the height of its line; it is laid out as a flex row that is only as
 * wide as its words, and a long title ends with an ellipsis (K5). A text
 * Button underlines on hover; a step is not text in running prose, so it does
 * not.
 */
const traceRowClassName =
  "flex w-fit max-w-full min-w-0 gap-1 text-start no-underline";

const TraceStatusContext = React.createContext<TraceStatus | undefined>(
  undefined,
);

/**
 * The text of children that are nothing but text: strings and numbers, such as
 * `Ran {command}`. With an element among the children it is undefined, so the
 * server and the browser always agree on it.
 */
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

/** The steps of an agent, as one-line rows with an icon, a title and a status. */
export function Trace({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("trace", props),
        "flex w-full min-w-0 flex-col gap-2",
        className,
      )}
      data-slot="trace"
      {...props}
    />
  );
}

export interface TraceLineProps extends React.ComponentProps<"span"> {
  /**
   * `running` is work in progress (write the title in the present tense),
   * `error` is work that failed (say so in the title) and `pending` is work
   * that has not started. Without a status the line reports work that is done.
   */
  status?: TraceStatus | undefined;
}

/**
 * One step. It is a span, so it is valid inside the button or the link that
 * makes it do something, and it is neither a button nor a tab stop on its own.
 * Its status reaches its title through context.
 */
export function TraceLine({
  className,
  status,
  ...props
}: TraceLineProps): React.ReactElement {
  return (
    <TraceStatusContext.Provider value={status}>
      <span
        className={cn(
          slotClass("trace-line", props),
          "flex w-fit max-w-full min-w-0 items-center gap-2",
          className,
        )}
        data-slot="trace-line"
        data-status={status}
        {...props}
      />
    </TraceStatusContext.Provider>
  );
}

/**
 * A decorative icon slot, hidden from assistive technology. Before the title
 * it names the action; after it, it is an indicator. The glyph is 16 px
 * (rulebook I3) and keeps its full opacity inside a Button.
 */
export function TraceIcon({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn(
        slotClass("trace-icon", props),
        "flex size-4 shrink-0 items-center justify-center [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:m-0 [&_svg]:opacity-100",
        className,
      )}
      data-slot="trace-icon"
      {...props}
    />
  );
}

/**
 * The step in one sentence on one line. A long title ends with an ellipsis and
 * carries its full text in `title` (rulebook K5), taken from text children or
 * given as the prop. While its line runs, the words shimmer.
 */
export function TraceTitle({
  children,
  className,
  title,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  const status = React.useContext(TraceStatusContext);
  return (
    <span
      className={cn(
        slotClass("trace-title", props),
        "min-w-0 truncate",
        className,
      )}
      data-slot="trace-title"
      title={title ?? (plainText(children)?.trim() || undefined)}
      {...props}
    >
      {status === "running" ? (
        <MotionShimmer>{children}</MotionShimmer>
      ) : (
        children
      )}
    </span>
  );
}

/**
 * Secondary text after the title, such as a duration, a count or a hostname.
 * It is one text step smaller than the title. A short value stays whole; a
 * long one, such as a long hostname, ends with an ellipsis like the title and
 * carries its full text in `title`, so the row never widens the thread (K5).
 */
export function TraceDescription({
  children,
  className,
  title,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      className={cn(
        slotClass("trace-description", props),
        "min-w-0 truncate text-(length:--sp-rw-font-12) leading-(--sp-rw-line-18) tabular-nums",
        className,
      )}
      data-slot="trace-description"
      title={title ?? (plainText(children)?.trim() || undefined)}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * A step that expands. It takes the props of Collapsible: `open` with
 * `onOpenChange`, or `defaultOpen`. Steps start closed. To open a step while
 * it runs and let the reader's click win, pass `open ?? running` with the
 * reader's choice kept in state.
 */
export function TraceCollapsible({
  className,
  ...props
}: React.ComponentProps<typeof Collapsible>): React.ReactElement {
  return (
    <Collapsible
      className={cn("flex w-full min-w-0 flex-col", className)}
      data-slot="trace-collapsible"
      {...props}
    />
  );
}

/**
 * The button that opens and closes a step. Put a TraceLine in it; the chevron
 * after the line is added here, and it turns with the shared chevron rule of
 * Collapsible. The trigger is the kit's CollapsibleTrigger, so it keeps that
 * part's slot, `collapsible-trigger`, which the chevron, the cursor and the
 * open state are keyed on. Its title is its accessible name and
 * `aria-expanded` says whether it is open.
 */
export function TraceCollapsibleTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CollapsibleTrigger>): React.ReactElement {
  return (
    <CollapsibleTrigger
      className={cn(traceRowClassName, className)}
      // CollapsibleTrigger stamps its own profile on what it renders; the row
      // keeps the inline profile of its Button.
      data-profile="inline"
      render={<Button profile="inline" profileTone="muted" variant="text" />}
      {...props}
    >
      {children}
      <TraceIcon>
        <ChevronRightIcon
          className="sp-collapsible-chevron"
          data-slot="collapsible-chevron"
          data-turn="quarter"
        />
      </TraceIcon>
    </CollapsibleTrigger>
  );
}

/**
 * The detail of a step. The panel is the kit's CollapsiblePanel, which
 * measures the content and moves the height over the kit's expand motion, so
 * the content enters and leaves with its own presence. `className` styles the
 * content inside the panel; every other prop, such as `keepMounted`, goes to
 * the panel. With `keepMounted` the detail stays mounted while closed, so
 * steps nested in it keep their open state.
 */
export function TraceCollapsibleContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePanel>): React.ReactElement {
  return (
    <CollapsiblePanel {...props}>
      <div
        className={cn(slotClass("trace-collapsible-content"), className)}
        data-slot="trace-collapsible-content"
      >
        {children}
      </div>
    </CollapsiblePanel>
  );
}

/** The words a TraceLink speaks to assistive technology. */
export type TraceLinkLabels = {
  /** Read after the title of a link that opens in a new tab. */
  newTab: string;
};

const defaultTraceLinkLabels: TraceLinkLabels = {
  newTab: "(opens in a new tab)",
};

export interface TraceLinkProps extends React.ComponentProps<"a"> {
  /** Replaces the English words a screen reader hears. */
  labels?: Partial<TraceLinkLabels> | undefined;
}

/**
 * A step that is a link. Put a TraceLine in it. It is the same row as a
 * collapsible step, with the same colours, focus outline and touch target. A
 * link with `target="_blank"` says so to screen readers after its title; show
 * it with an arrow icon after the line.
 */
export function TraceLink({
  children,
  className,
  labels,
  ...props
}: TraceLinkProps): React.ReactElement {
  const text = { ...defaultTraceLinkLabels, ...labels };
  return (
    <Button
      className={cn(traceRowClassName, className)}
      data-slot="trace-link"
      profile="inline"
      profileTone="muted"
      render={<a {...props} />}
      variant="text"
    >
      {children}
      {props.target === "_blank" ? (
        <span className="sr-only"> {text.newTab}</span>
      ) : null}
    </Button>
  );
}
