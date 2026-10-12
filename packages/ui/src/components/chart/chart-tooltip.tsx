"use client";

import * as React from "react";

import { getMotionTransitionFromCss } from "../../system/motion/css-transition";
import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { focusRingRecipe } from "../../system/recipes/focus-ring.recipe";
import { cn } from "../../system/utils/cn";
import {
  FOLLOW_TRAIL_DURATION,
  MotionNumber,
  useFollowFrames,
  useFollowPoint,
} from "../motion";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../tooltip";
import { useLastValue } from "./chart-cartesian";
import type { ChartInteraction } from "./chart-interaction";
import { ChartSwatch } from "./chart-legend";
import {
  dipsAtFlip,
  placeChartTooltip,
  type ChartBounds,
  type ChartCardSize,
  type ChartTooltipAlign,
} from "./chart-tooltip-place";

export type ChartTooltipProps = {
  interaction: ChartInteraction;
  /** The name of the focus stop that holds the plot. */
  label: string;
  /**
   * The client point of an item, which the card sits beside: where the item's
   * crosshair is, and the top of the plot or the middle of the item, whichever
   * `align` asks for. Null for an item with no place.
   */
  anchorFor: (key: string) => { x: number; y: number } | null;
  /** `start` puts the top of the card at the point (a crosshair that runs from the top of the plot down), `center` its middle. */
  align?: ChartTooltipAlign;
  /** What the card stays inside: the chart, as bklit's card does, or the window, for a ring that has no room beside it. */
  boundary?: "chart" | "viewport";
  /** What the card shows for the active item. Nothing closes it. */
  content: React.ReactNode;
  /**
   * What the card says, in words: read out to assistive technology when the
   * keyboard or a tap makes an item active, through a polite live region. A
   * mouse that passes over the plot is not read out.
   */
  announcement?: string | undefined;
  /**
   * The chart's data in a sentence or two, such as a summary of its values or
   * its empty label: the description of the plot, read when it takes focus.
   */
  description?: string | undefined;
  /**
   * The id of an element that describes the plot as well, such as the one a
   * consumer names with `aria-describedby`. It is read after `description`.
   */
  describedBy?: string | undefined;
  /** The plot. */
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

// What a card guesses its size to be until it is measured: bklit's.
const guessedCard: ChartCardSize = { height: 80, width: 180 };
// How long the card stays stepped back while it changes sides: a third of the
// time the floating panel takes to fade, which is long enough for its opacity
// transition to take it most of the way out of sight and no longer, so that it
// is back in plain sight within about 200 ms, as bklit's is. A time, and not a
// count of frames, so that it looks the same on every display.
const dipDuration = "--motion-duration-moderate";
const dipShare = 1 / 3;
// The room a card keeps from the edge of the window.
const viewportPadding = 8;

function boundsOf(box: DOMRect, boundary: "chart" | "viewport"): ChartBounds {
  if (boundary === "chart")
    return { bottom: box.height, left: 0, right: box.width, top: 0 };
  return {
    bottom: window.innerHeight - box.y - viewportPadding,
    left: viewportPadding - box.x,
    right: window.innerWidth - box.x - viewportPadding,
    top: viewportPadding - box.y,
  };
}

/**
 * The focus stop of a chart and its tooltip: the public Tooltip, whose card sits
 * beside the active item, to its right or on its left near the edge, and glides
 * after the item with the follow motion, whatever moved the item: a mouse, a
 * tap or the keyboard. The plot goes inside; the interaction decides which item
 * is active.
 *
 * For assistive technology the focus stop is the chart: a group that announces
 * itself as a chart, named by the chart's label and described by its summary.
 * The plot inside is a picture that the chart hides from it. While the
 * keyboard or a tap moves between the items, a polite live region reads what
 * the card shows.
 */
export function ChartTooltip({
  interaction,
  label,
  anchorFor,
  align = "start",
  boundary = "chart",
  content,
  announcement,
  description,
  describedBy,
  children,
  className,
  style,
}: ChartTooltipProps): React.ReactElement {
  const tooltipId = React.useId();
  const descriptionId = React.useId();
  const reduced = useReducedMotionPreference();
  const trigger = React.useRef<HTMLElement | null>(null);
  // The trigger is a div; the Trigger part types its ref for a button.
  const setTrigger = React.useCallback((node: HTMLElement | null) => {
    trigger.current = node;
  }, []);
  const { activeKey, announce, clear, triggerProps } = interaction;
  const open = activeKey !== null && Boolean(content);

  // The size of the card as it is measured while it is there: it flips by its
  // width and is centred by its height. Until the first measure it is a guess,
  // and the card does not glide to its measured place.
  const [size, setSize] = React.useState<ChartCardSize | null>(null);
  const onMeasure = React.useCallback(
    (next: ChartCardSize) =>
      setSize((old) =>
        old &&
        Math.abs(next.width - old.width) < 1 &&
        Math.abs(next.height - old.height) < 1
          ? old
          : next,
      ),
    [],
  );

  // Where the item is and what the card stays inside, in the coordinates of the
  // chart itself, so that a page that scrolls takes the card along with it; and
  // from them where the card sits beside the item.
  const box = open ? trigger.current?.getBoundingClientRect() : undefined;
  const point = open && activeKey !== null ? anchorFor(activeKey) : null;
  const place =
    box && point
      ? placeChartTooltip({
          align,
          anchor: { x: point.x - box.x, y: point.y - box.y },
          bounds: boundsOf(box, boundary),
          card: size ?? guessedCard,
        })
      : null;
  // The card leaves where it was while it fades out.
  const left = useLastValue(place ? place.left : null) ?? 0;
  const top = useLastValue(place ? place.top : null) ?? 0;
  const flipped = useLastValue(place ? place.flipped : null) ?? false;

  // A card that changes sides dips in opacity while it crosses its item, so that
  // it is not in plain sight there, as the card of bklit UI does when it flips.
  // The tooltip stays open (M4): the card is told to step back, and the kit's own
  // opacity transition on the floating panel takes it out and back.
  const [dipping, setDipping] = React.useState(false);
  const wasFlipped = React.useRef(flipped);
  const timer = React.useRef<number | undefined>(undefined);
  React.useLayoutEffect(() => {
    const dip = dipsAtFlip({
      flipped,
      measured: size !== null,
      open,
      reduced,
      wasFlipped: wasFlipped.current,
    });
    wasFlipped.current = flipped;
    if (!dip) return;
    window.clearTimeout(timer.current);
    setDipping(true);
    const { duration } = getMotionTransitionFromCss(
      trigger.current ?? document.documentElement,
      dipDuration,
      "--motion-ease-standard",
    );
    timer.current = window.setTimeout(
      () => setDipping(false),
      duration * dipShare * 1000,
    );
  }, [flipped, open, reduced, size]);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        if (!next) clear();
      }}
      // The tooltip is information about the item under the pointer; it never
      // takes the pointer itself, so it cannot close itself.
      disableHoverablePopup
    >
      <TooltipTrigger
        render={<div />}
        ref={setTrigger}
        closeOnClick={false}
        role="group"
        aria-roledescription="chart"
        aria-describedby={
          [description ? descriptionId : undefined, describedBy]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-label={label}
        className={cn(className, focusRingRecipe())}
        style={style}
        {...triggerProps}
      >
        {children}
      </TooltipTrigger>
      {description ? (
        <span
          className="sr-only"
          data-slot="chart-description"
          id={descriptionId}
        >
          {description}
        </span>
      ) : null}
      {/* Present from the start, so that a screen reader hears it change. */}
      <span
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        data-slot="chart-announcer"
      >
        {open && announce && announcement ? announcement : ""}
      </span>
      <ChartTooltipCard
        content={content}
        dipping={dipping}
        id={tooltipId}
        left={left}
        measured={size !== null}
        onMeasure={onMeasure}
        open={open}
        size={size ?? guessedCard}
        top={top}
        trigger={trigger}
      />
    </Tooltip>
  );
}

/**
 * The card of the tooltip. It trails its item: where it sits is a point that
 * follows the place of the card beside the item (the follow motion, with its
 * trail duration), handed to the tooltip's positioner as a virtual anchor at
 * every frame it moves, so the public TooltipPopup stays the owner of the
 * surface, the portal and the collisions with the window. Only this part
 * renders at every frame; the chart and the content do not.
 */
function ChartTooltipCard({
  content,
  dipping,
  id,
  left,
  measured,
  onMeasure,
  open,
  size,
  top,
  trigger,
}: {
  content: React.ReactNode;
  /** The card is crossing its item, from one side of it to the other: it steps back. */
  dipping: boolean;
  id: string;
  /** Where the card heads for: its left and its top, in the coordinates of the chart. */
  left: number;
  /** Whether `size` is the size of the card as measured, and not a guess. */
  measured: boolean;
  onMeasure: (size: ChartCardSize) => void;
  open: boolean;
  size: ChartCardSize;
  top: number;
  trigger: React.RefObject<HTMLElement | null>;
}): React.ReactElement {
  const [popup, setPopup] = React.useState<HTMLDivElement | null>(null);
  // A number that rolls to more digits makes the card wider while it rolls, so
  // the card is watched for as long as it is there.
  React.useLayoutEffect(() => {
    if (!popup) return;
    const measure = () =>
      onMeasure({ height: popup.offsetHeight, width: popup.offsetWidth });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(popup);
    return () => observer.disconnect();
  }, [onMeasure, popup]);

  const follow = useFollowPoint(
    { x: left, y: top },
    {
      active: open && measured,
      container: trigger,
      duration: FOLLOW_TRAIL_DURATION,
    },
  );
  useFollowFrames([follow.x, follow.y]);

  // The anchor is the line the card hangs from: at its left edge, as tall as
  // the card, so the positioner puts the card's top on the top of the line. A
  // point without a height would have it start a little above (the arrow
  // padding, which a card without an arrow does not need).
  const virtual = {
    getBoundingClientRect: () => {
      const origin = trigger.current?.getBoundingClientRect();
      return new DOMRect(
        (origin?.x ?? 0) + follow.x.get(),
        (origin?.y ?? 0) + follow.y.get(),
        0,
        size.height,
      );
    },
  };
  return (
    <TooltipPopup
      align="start"
      anchor={virtual}
      // Dipping takes the card out and back over the panel's own opacity
      // transition, the one an entrance and an exit run on.
      className="data-dipping:opacity-0"
      id={id}
      ref={setPopup}
      role="tooltip"
      side="right"
      sideOffset={0}
      {...(dipping ? { "data-dipping": "" } : {})}
    >
      {content}
    </TooltipPopup>
  );
}

export type ChartTooltipRow = {
  key: string;
  label: string;
  value: string;
  color: string;
};

/**
 * What a card with a heading and rows says, in words, for the chart's live
 * region: the heading, then each row's name and value.
 */
export function chartTooltipText(
  heading: string | undefined,
  rows: readonly Pick<ChartTooltipRow, "label" | "value">[],
): string {
  return [heading, ...rows.map((row) => `${row.label}: ${row.value}`)]
    .filter(Boolean)
    .join(". ");
}

/**
 * The card of a chart with several series: a heading, then one row per series
 * with its dot, its name and its value. The values roll to the next item's.
 */
export function ChartTooltipContent({
  heading,
  rows,
}: {
  heading?: React.ReactNode;
  rows: readonly ChartTooltipRow[];
}): React.ReactElement {
  return (
    <div className="grid gap-1" data-slot="chart-tooltip-content">
      {heading ? <div className="font-medium">{heading}</div> : null}
      {rows.map((row) => (
        <div className="flex items-center gap-2" key={row.key}>
          <ChartSwatch color={row.color} />
          <span className="text-muted-foreground">{row.label}</span>
          <MotionNumber
            className="ms-auto ps-4 font-medium"
            value={row.value}
          />
        </div>
      ))}
    </div>
  );
}
