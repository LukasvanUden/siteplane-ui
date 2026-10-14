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

const progressCircleVariants = cva("relative inline-flex shrink-0", {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: {
    size: { md: "size-7", lg: "size-8", sm: "size-5", xl: "size-10" },
  },
});

const ProgressSizeContext = React.createContext<SiteplaneControlSize | null>(
  null,
);

export interface ProgressProps
  extends
    Omit<WithStringClassName<ProgressPrimitive.Root.Props>, "size">,
    VariantProps<typeof progressRootVariants> {}

export function Progress({
  className,
  children,
  locale = PROGRESS_DEFAULT_LOCALE,
  size,
  ...props
}: ProgressProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  return (
    <ProgressSizeContext.Provider value={resolvedSize}>
      <ProgressPrimitive.Root
        className={cn(
          slotClass("progress", props),
          progressRootVariants({ size: resolvedSize }),
          className,
        )}
        data-size={resolvedSize}
        data-slot="progress"
        locale={locale}
        {...props}
      >
        {children ? (
          children
        ) : (
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        )}
      </ProgressPrimitive.Root>
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
  return (
    <ProgressPrimitive.Track
      className={cn(
        slotClass("progress-track", props),
        progressTrackVariants({ size: resolvedSize }),
        className,
      )}
      data-size={resolvedSize}
      data-slot="progress-track"
      {...props}
    />
  );
}

export function ProgressIndicator({
  className,
  ...props
}: WithStringClassName<ProgressPrimitive.Indicator.Props>): React.ReactElement {
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
    />
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
   * The completion between `min` and `max`. `null` shows an indeterminate
   * circle, an arc that travels around it, while completion is unknown.
   */
  value: number | null;
}

export function ProgressCircle({
  className,
  locale = PROGRESS_DEFAULT_LOCALE,
  max = 100,
  min = 0,
  size,
  value,
  ...props
}: ProgressCircleProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const range = max - min;
  const numericValue =
    value === null ? null : Number.isFinite(value) ? value : min;
  const percentage =
    numericValue === null || range <= 0
      ? 0
      : Math.min(100, Math.max(0, ((numericValue - min) / range) * 100));

  return (
    <ProgressPrimitive.Root
      className={cn(
        slotClass("progress-circle", props),
        progressCircleVariants({ size: resolvedSize }),
        className,
      )}
      data-size={resolvedSize}
      data-slot="progress-circle"
      locale={locale}
      max={max}
      min={min}
      value={numericValue}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="size-full -rotate-90"
        viewBox="0 0 48 48"
      >
        <circle
          className="fill-none"
          cx="24"
          cy="24"
          pathLength="100"
          r="20"
          strokeWidth="4"
        />
        <circle
          className="fill-none"
          cx="24"
          cy="24"
          pathLength="100"
          r="20"
          strokeDasharray="100"
          strokeDashoffset={100 - percentage}
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
    </ProgressPrimitive.Root>
  );
}

export { ProgressPrimitive };
