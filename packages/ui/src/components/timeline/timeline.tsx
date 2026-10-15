import { cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { MotionItem, MotionList } from "../motion";

/**
 * Events that are added, removed or reordered animate on their own: a new
 * event expands and fades in, a removed one fades and collapses, and the events
 * around it glide. Give every `TimelineItem` a stable `key`. The 20 px between
 * two events is the list's `gap`, with the connector drawn in it, so it opens
 * and closes with the event after it.
 */
export function Timeline({
  children,
  className,
  ...props
}: React.ComponentProps<"ol">): React.ReactElement {
  return (
    <MotionList
      gap={5}
      render={
        <ol
          className={cn(
            slotClass("timeline", props),
            "flex flex-col",
            className,
          )}
          data-slot="timeline"
          role="list"
          {...props}
        />
      }
      // The connector is positioned against the event, so it runs the full
      // length of it, and it fades with the space. It sits on the centre of the
      // lead column, where every marker is centred (`--timeline-lead`,
      // design-rework.css).
      separator={
        <span
          aria-hidden="true"
          className="sp-timeline-connector absolute top-4 bottom-0 left-[calc(var(--timeline-lead)/2)] w-px -translate-x-1/2"
          data-slot="timeline-connector"
        />
      }
    >
      {children}
    </MotionList>
  );
}

// Marker colors keep at least 3:1 against the page in light and dark themes.
// The halo, the fill of a ring marker and the icon of a filled marker all take
// the surface the timeline sits on (`--timeline-surface`).
const timelineDotVariants = cva(
  "relative z-10 size-2.5 shrink-0 rounded-full bg-(--timeline-marker) ring-4 ring-(--timeline-surface) [--timeline-surface:var(--sp-rw-surface-color,var(--sp-rw-bg-base))]",
  {
    defaultVariants: { tone: "neutral" },
    variants: {
      tone: {
        accent: "[--timeline-marker:var(--sp-rw-fg-accent)]",
        error: "[--timeline-marker:--theme(--color-destructive-foreground)]",
        info: "[--timeline-marker:--theme(--color-info-foreground)]",
        neutral: "[--timeline-marker:--theme(--color-muted-foreground)]",
        success: "[--timeline-marker:--theme(--color-success-foreground)]",
        warning: "[--timeline-marker:--theme(--color-warning-foreground)]",
      },
    },
  },
);

/** The marker color: the kit's status values, `accent` and `neutral`. */
export type TimelineTone =
  "accent" | "error" | "info" | "neutral" | "success" | "warning";
/**
 * @deprecated The earlier marker prop. Use `tone`; its `default` is now
 * `neutral`.
 */
export type TimelineItemVariant =
  "accent" | "default" | "error" | "info" | "success" | "warning";

export type TimelineMarkerShape = "bar" | "diamond" | "dot" | "ring";
const timelineMarkerShapeClassNames = {
  bar: "h-4 w-1.5 rounded-full",
  diamond: "rotate-45 rounded-[2px]",
  dot: "",
  ring: "border-2 border-(--timeline-marker) bg-(--timeline-surface)",
} as const satisfies Record<TimelineMarkerShape, string>;

export interface TimelineItemProps extends Omit<
  React.ComponentProps<"li">,
  // Motion owns these handlers; React's versions have a different signature.
  "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
> {
  /** The marker color. Defaults to `neutral`. */
  tone?: TimelineTone | undefined;
  /**
   * @deprecated Use `tone`, the kit's name where color is the whole
   * variation; `variant="default"` is `tone="neutral"`.
   */
  variant?: TimelineItemVariant | null | undefined;
  marker?: React.ReactNode;
  markerLabel?: string;
  markerShape?: TimelineMarkerShape;
}

export function TimelineItem({
  className,
  tone,
  variant,
  marker,
  markerLabel,
  markerShape = "dot",
  children,
  ...props
}: TimelineItemProps): React.ReactElement {
  const resolvedTone: TimelineTone =
    tone ?? (variant === "default" ? "neutral" : (variant ?? "neutral"));
  return (
    // The item is the clipping box while it enters and leaves, so it carries no
    // padding or margin; the list adds the space to the next event inside it.
    // Every marker is centred in the lead column of the timeline, which a
    // custom marker (`data-marker`) widens for all events.
    <MotionItem
      className={cn("group/timeline-item relative", className)}
      data-marker={marker ? "" : undefined}
      data-marker-shape={marker ? undefined : markerShape}
      data-slot="timeline-item"
      {...props}
    >
      <div className="flex gap-3">
        {/* The lead column is one width for every event (rulebook I9), and a
            box one line high at the top of the text centres every marker
            shape and size on the first line: the title's, or the
            description's when there is no title (rulebook I5). */}
        <span
          className="sp-timeline-marker-box -mt-0.5 flex h-(--sp-rw-line-18) w-(--timeline-lead) shrink-0 items-center justify-center group-has-data-[slot=timeline-title]/timeline-item:h-(--sp-rw-line-21)"
          data-slot="timeline-marker-box"
        >
          <span
            aria-hidden={markerLabel ? undefined : true}
            aria-label={markerLabel}
            className={cn(
              "sp-timeline-marker",
              timelineDotVariants({ tone: resolvedTone }),
              timelineMarkerShapeClassNames[markerShape],
              marker && "grid size-5 place-items-center rounded-full ring-2",
              // Icons take the surface color on a filled marker, so they keep
              // the marker's contrast; a ring shows its icon in the marker color.
              marker &&
                (markerShape === "ring"
                  ? "text-(--timeline-marker)"
                  : "text-(--timeline-surface)"),
            )}
            data-slot="timeline-marker"
            role={markerLabel ? "img" : undefined}
          >
            {marker ? (
              <span
                className={cn(
                  "grid size-full place-items-center leading-none [&>svg]:block [&>svg]:size-3",
                  markerShape === "diamond" && "-rotate-45",
                )}
              >
                {marker}
              </span>
            ) : null}
          </span>
        </span>
        <div className="-mt-0.5 min-w-0 flex-1 pb-1">{children}</div>
      </div>
    </MotionItem>
  );
}

export interface TimelineNowProps extends Omit<
  TimelineItemProps,
  "children" | "marker" | "markerLabel" | "markerShape" | "tone" | "variant"
> {
  /**
   * The text of the marker, shown beside its dot and read by assistive
   * technology. Defaults to "Now"; pass the word in the page's language.
   */
  label?: string;
}

/**
 * Marks the present between two events: the accent dot of an event, its label
 * and a line in the accent across the rest of the row. It is a row of the
 * timeline, `aria-current="time"`, so assistive technology reads it in its
 * place among the events. Give it a stable `key`, as the events have: when the
 * present moves past an event, the marker glides to its new place.
 */
export function TimelineNow({
  label = "Now",
  ...props
}: TimelineNowProps): React.ReactElement {
  return (
    <TimelineItem
      aria-current="time"
      {...props}
      data-slot="timeline-now"
      tone="accent"
    >
      <span
        className={slotClass("timeline-now-label")}
        data-slot="timeline-now-label"
      >
        {label}
      </span>
    </TimelineItem>
  );
}

export function TimelineTitle({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("timeline-title", props),
        "wrap-anywhere",
        className,
      )}
      data-slot="timeline-title"
      {...props}
    />
  );
}

export function TimelineDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("timeline-description", props),
        "wrap-anywhere",
        className,
      )}
      data-slot="timeline-description"
      {...props}
    />
  );
}
