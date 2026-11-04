"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  type SiteplaneControlSize,
  siteplaneUIDefaults,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  linearIndicatorClassNames,
  linearIndicatorSizeClassNames,
} from "../../system/styles/surface";
import { useFormatLocale } from "../../system/locale/messages-context";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

import "./progress.css";

const PROGRESS_DEFAULT_LOCALE = "en-US";

// Progress interpolates incoming values evenly (linear, 380 ms, the kit's
// linger token) so a stream of updates never brakes at every step; the
// transition is progress.css's, and so is the moving fill of an indeterminate
// bar (`value={null}`). Meter keeps the shared indicator transition.
const progressIndicatorMotionClassName = "min-w-0";

const progressRootVariants = cva(linearIndicatorClassNames.root, {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: { size: linearIndicatorSizeClassNames.root },
});

const progressLabelVariants = cva(linearIndicatorClassNames.label, {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: { size: linearIndicatorSizeClassNames.label },
});

const progressTrackVariants = cva(linearIndicatorClassNames.track, {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: { size: linearIndicatorSizeClassNames.track },
});

const progressValueVariants = cva(linearIndicatorClassNames.value, {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: { size: linearIndicatorSizeClassNames.value },
});

// The circle is 32 px at the default sm, the size lg had before the control
// ladder moved to 4 px steps (Lukas, 30 October 2026), 40 px at md, as xl had,
// and 44 and 48 px at lg and xl.
const progressCircleVariants = cva("relative inline-flex shrink-0", {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: {
    size: { md: "size-10", lg: "size-11", sm: "size-8", xl: "size-12" },
  },
});

/**
 * The display sizes of a ring that holds a figure and a caption: 64, 160, 200,
 * 240 and 280 px across. They are drawn with a stroke of a tenth of the width
 * (6, 16, 20, 24 and 28 px), where the control sizes keep their thinner ring.
 */
export type ProgressCircleDisplay = "xxs" | "xs" | "sm" | "md" | "lg";

const progressCircleDisplayClassNames = {
  lg: "relative inline-flex shrink-0 size-70",
  md: "relative inline-flex shrink-0 size-60",
  sm: "relative inline-flex shrink-0 size-50",
  xs: "relative inline-flex shrink-0 size-40",
  xxs: "relative inline-flex shrink-0 size-16",
} as const satisfies Record<ProgressCircleDisplay, string>;

const progressHalfCircleDisplayClassNames = {
  lg: "relative inline-flex shrink-0 w-70",
  md: "relative inline-flex shrink-0 w-60",
  sm: "relative inline-flex shrink-0 w-50",
  xs: "relative inline-flex shrink-0 w-40",
  xxs: "relative inline-flex shrink-0 w-16",
} as const satisfies Record<ProgressCircleDisplay, string>;

// A half circle is as wide as the full circle of its size and as tall as its
// drawing, the upper 26 of the circle's 48 units (progress.css), so a class
// that sets its width sizes it.
const progressHalfCircleVariants = cva("relative inline-flex shrink-0", {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: {
    size: { md: "w-10", lg: "w-11", sm: "w-8", xl: "w-12" },
  },
});

const ProgressSizeContext = React.createContext<SiteplaneControlSize | null>(
  null,
);

export interface ProgressProps
  extends
    Omit<WithStringClassName<ProgressPrimitive.Root.Props>, "size">,
    VariantProps<typeof progressRootVariants> {
  /**
   * Where the value shows. `right` puts it beside the bar, 12 px after it, and
   * `bottom` below the bar, aligned to its end, at the gap of the size: 8, 10,
   * 12 or 14 px from sm to xl. Both show the value as text (ProgressValue)
   * when the Progress has no children of its own, and set the layout for the
   * children it has. `top-floating` and `bottom-floating` show the value in a
   * label that floats 8 px above or below the end of the fill and moves with
   * it. The value is formatted with `format` and `locale` as the accessible
   * value is, and shows only while it is known.
   */
  labelPlacement?:
    | "none"
    | "right"
    | "bottom"
    | "top-floating"
    | "bottom-floating"
    | undefined;
}

// Where the value shows, or none: none while the progress is indeterminate, as
// it has no value to show.
const ProgressLabelPlacementContext =
  React.createContext<NonNullable<ProgressProps["labelPlacement"]>>("none");

/** Whether the value floats at the end of the fill, above or below the bar. */
function isFloatingPlacement(
  placement: NonNullable<ProgressProps["labelPlacement"]>,
): boolean {
  return placement === "top-floating" || placement === "bottom-floating";
}

export function Progress({
  className,
  children,
  labelPlacement = "none",
  locale: localeProp,
  size,
  value,
  ...props
}: ProgressProps): React.ReactElement {
  // Its own locale, else the provider's, else en-US.
  const locale = useFormatLocale(localeProp, PROGRESS_DEFAULT_LOCALE);
  const resolvedSize = useResolvedControlSize(size);
  const shownPlacement =
    value !== null && Number.isFinite(value) ? labelPlacement : "none";
  return (
    <ProgressSizeContext.Provider value={resolvedSize}>
      <ProgressLabelPlacementContext.Provider value={shownPlacement}>
        <ProgressPrimitive.Root
          className={cn(
            slotClass("progress", props),
            progressRootVariants({ size: resolvedSize }),
            // The value beside the bar centres on it, 12 px away; below it
            // stands at the bar's end.
            labelPlacement === "right" && "flex-row items-center gap-3",
            labelPlacement === "bottom" && "items-end",
            className,
          )}
          data-label-placement={
            labelPlacement === "none" ? undefined : labelPlacement
          }
          data-size={resolvedSize}
          data-slot="progress"
          locale={locale}
          value={value}
          {...props}
        >
          {children ? (
            children
          ) : (
            <>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
              {shownPlacement === "right" || shownPlacement === "bottom" ? (
                <ProgressValue className="shrink-0 font-(--sp-rw-font-weight-label) text-(--sp-rw-fg-secondary) tabular-nums" />
              ) : null}
            </>
          )}
        </ProgressPrimitive.Root>
      </ProgressLabelPlacementContext.Provider>
    </ProgressSizeContext.Provider>
  );
}

export interface ProgressLabelProps
  extends
    Omit<WithStringClassName<ProgressPrimitive.Label.Props>, "size">,
    VariantProps<typeof progressLabelVariants> {}

export function ProgressLabel({
  className,
  size,
  ...props
}: ProgressLabelProps): React.ReactElement {
  const groupSize = React.useContext(ProgressSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  return (
    <ProgressPrimitive.Label
      className={cn(
        slotClass("progress-label", props),
        progressLabelVariants({ size: resolvedSize }),
        className,
      )}
      data-size={resolvedSize}
      data-slot="progress-label"
      {...props}
    />
  );
}

export interface ProgressTrackProps
  extends
    Omit<WithStringClassName<ProgressPrimitive.Track.Props>, "size">,
    VariantProps<typeof progressTrackVariants> {}

export function ProgressTrack({
  className,
  size,
  ...props
}: ProgressTrackProps): React.ReactElement {
  const groupSize = React.useContext(ProgressSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  const labelPlacement = React.useContext(ProgressLabelPlacementContext);
  return (
    <ProgressPrimitive.Track
      className={cn(
        slotClass("progress-track", props),
        progressTrackVariants({ size: resolvedSize }),
        // The floating value stands outside the track, in its fill. The fill
        // is rounded on its own, so nothing else needs the clip.
        isFloatingPlacement(labelPlacement) && "overflow-visible",
        className,
      )}
      data-size={resolvedSize}
      data-slot="progress-track"
      {...props}
    />
  );
}

export function ProgressIndicator({
  children,
  className,
  ...props
}: WithStringClassName<ProgressPrimitive.Indicator.Props>): React.ReactElement {
  const labelPlacement = React.useContext(ProgressLabelPlacementContext);
  return (
    <ProgressPrimitive.Indicator
      className={cn(
        slotClass("progress-indicator", props),
        linearIndicatorClassNames.fill,
        progressIndicatorMotionClassName,
        className,
      )}
      data-slot="progress-indicator"
      {...props}
    >
      {children}
      {!isFloatingPlacement(labelPlacement) ? null : (
        // The floating value (labelPlacement) sits at the end of the fill, so
        // it moves with the fill's own motion. It repeats the value that the
        // progress bar announces, so assistive technology skips it.
        <ProgressPrimitive.Value
          className={slotClass("progress-value-label")}
          data-slot="progress-value-label"
        />
      )}
    </ProgressPrimitive.Indicator>
  );
}

export interface ProgressValueProps
  extends
    Omit<WithStringClassName<ProgressPrimitive.Value.Props>, "size">,
    VariantProps<typeof progressValueVariants> {}

export function ProgressValue({
  className,
  size,
  ...props
}: ProgressValueProps): React.ReactElement {
  const groupSize = React.useContext(ProgressSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  return (
    <ProgressPrimitive.Value
      className={cn(
        slotClass("progress-value", props),
        progressValueVariants({ size: resolvedSize }),
        className,
      )}
      data-size={resolvedSize}
      data-slot="progress-value"
      {...props}
    />
  );
}

export interface ProgressCircleProps
  extends
    Omit<
      WithStringClassName<ProgressPrimitive.Root.Props>,
      "children" | "size" | "value"
    >,
    VariantProps<typeof progressCircleVariants> {
  /**
   * Content inside the ring, such as `ProgressCircleLabel` and
   * `ProgressCircleValue`: centred in a full circle and at the foot of a half
   * circle's arch. Its type steps with the circle's width.
   */
  children?: React.ReactNode;
  /**
   * A ring for display, which holds a figure and a caption, in place of a
   * control-sized one: `xxs` 64 px, `xs` 160 px, `sm` 200 px, `md` 240 px and
   * `lg` 280 px across. Its stroke is a tenth of its width, and the figure and
   * the caption inside step with it. `size` is ignored while it is set.
   */
  display?: ProgressCircleDisplay | undefined;
  /**
   * `half` draws the upper half of the ring, which fills from its left end to
   * its right end. A half circle is as wide as the full circle of its size.
   */
  shape?: "full" | "half" | undefined;
  /**
   * The completion between `min` and `max`. `null` shows an indeterminate
   * circle, an arc that travels around it, while completion is unknown.
   */
  value: number | null;
}

export function ProgressCircle({
  children,
  className,
  display,
  locale: localeProp,
  max = 100,
  min = 0,
  shape = "full",
  size,
  value,
  ...props
}: ProgressCircleProps): React.ReactElement {
  const locale = useFormatLocale(localeProp, PROGRESS_DEFAULT_LOCALE);
  const resolvedSize = useResolvedControlSize(size);
  const range = max - min;
  const numericValue =
    value === null ? null : Number.isFinite(value) ? value : min;
  const percentage =
    numericValue === null || range <= 0
      ? 0
      : Math.min(100, Math.max(0, ((numericValue - min) / range) * 100));
  // A round cap draws a dot even for an empty arc, so an empty circle takes a
  // flat one and shows nothing until it has progress.
  const fillCap = numericValue === null || percentage > 0 ? "round" : "butt";
  const half = shape === "half";
  // The ring is drawn in a box of 48 units with a 4 unit stroke, or, for a
  // display size, in one of 100 units with a 10 unit stroke (a tenth of the
  // width). A half circle shows the upper half of the box and the round caps of
  // its ends.
  const ring = display
    ? { box: 100, halfHeight: 55, radius: 45, stroke: 10 }
    : { box: 48, halfHeight: 26, radius: 20, stroke: 4 };
  const centre = ring.box / 2;

  return (
    <ProgressPrimitive.Root
      className={cn(
        slotClass("progress-circle", props),
        display
          ? (half
              ? progressHalfCircleDisplayClassNames
              : progressCircleDisplayClassNames)[display]
          : (half ? progressHalfCircleVariants : progressCircleVariants)({
              size: resolvedSize,
            }),
        className,
      )}
      data-display={display}
      data-shape={shape}
      data-size={resolvedSize}
      data-slot="progress-circle"
      locale={locale}
      max={max}
      min={min}
      value={numericValue}
      {...props}
    >
      {half ? (
        // The upper half of the box and the round caps of its ends (26 of the
        // 48 units, 55 of the 100). Turned half a turn, each circle starts at
        // the left end and runs clockwise, so a dash of 50 is the arch and the
        // fill is the first half of the percentage.
        <svg
          aria-hidden="true"
          className="w-full"
          viewBox={`0 0 ${ring.box} ${ring.halfHeight}`}
        >
          <g transform={`rotate(180 ${centre} ${centre})`}>
            <circle
              className="fill-none"
              cx={centre}
              cy={centre}
              pathLength="100"
              r={ring.radius}
              strokeDasharray="50 150"
              strokeLinecap="round"
              strokeWidth={ring.stroke}
            />
            <circle
              className="fill-none"
              cx={centre}
              cy={centre}
              pathLength="100"
              r={ring.radius}
              strokeDasharray="50 150"
              strokeDashoffset={50 - percentage / 2}
              strokeLinecap={fillCap}
              strokeWidth={ring.stroke}
            />
          </g>
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="size-full -rotate-90"
          viewBox={`0 0 ${ring.box} ${ring.box}`}
        >
          <circle
            className="fill-none"
            cx={centre}
            cy={centre}
            pathLength="100"
            r={ring.radius}
            strokeWidth={ring.stroke}
          />
          <circle
            className="fill-none"
            cx={centre}
            cy={centre}
            pathLength="100"
            r={ring.radius}
            strokeDasharray="100"
            strokeDashoffset={100 - percentage}
            strokeLinecap={fillCap}
            strokeWidth={ring.stroke}
          />
        </svg>
      )}
      {children === undefined ||
      children === null ||
      typeof children === "boolean" ? null : (
        <div
          className={slotClass("progress-circle-content")}
          data-slot="progress-circle-content"
        >
          {children}
        </div>
      )}
    </ProgressPrimitive.Root>
  );
}

export type ProgressCircleLabelProps =
  WithStringClassName<ProgressPrimitive.Label.Props>;

/**
 * The caption inside a ProgressCircle, above its value. It names the progress
 * for assistive technology, as ProgressLabel does for the bar. At the 64 px
 * display size (`xxs`) the hole has no room for it, so it stands under the ring
 * (under the arch of a half circle), centred on it, and the ring keeps its
 * line as space below it.
 */
export function ProgressCircleLabel({
  className,
  ...props
}: ProgressCircleLabelProps): React.ReactElement {
  return (
    <ProgressPrimitive.Label
      className={cn(slotClass("progress-circle-label", props), className)}
      data-slot="progress-circle-label"
      {...props}
    />
  );
}

export type ProgressCircleValueProps =
  WithStringClassName<ProgressPrimitive.Value.Props>;

/**
 * The value inside a ProgressCircle, formatted with the circle's `format` and
 * `locale`. A function child receives the formatted and the raw value, as in
 * ProgressValue.
 */
export function ProgressCircleValue({
  className,
  ...props
}: ProgressCircleValueProps): React.ReactElement {
  return (
    <ProgressPrimitive.Value
      className={cn(slotClass("progress-circle-value", props), className)}
      data-slot="progress-circle-value"
      {...props}
    />
  );
}

export { ProgressPrimitive };
