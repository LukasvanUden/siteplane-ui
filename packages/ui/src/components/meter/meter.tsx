"use client";

import { Meter as MeterPrimitive } from "@base-ui/react/meter";
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

const METER_DEFAULT_LOCALE = "en-US";

const meterRootVariants = cva(linearIndicatorClassNames.root, {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: { size: linearIndicatorSizeClassNames.root },
});
const meterLabelVariants = cva(cn(linearIndicatorClassNames.label, ""), {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: { size: linearIndicatorSizeClassNames.label },
});
const meterTrackVariants = cva(linearIndicatorClassNames.track, {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: { size: linearIndicatorSizeClassNames.track },
});
const meterValueVariants = cva(linearIndicatorClassNames.value, {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: { size: linearIndicatorSizeClassNames.value },
});

const MeterSizeContext = React.createContext<SiteplaneControlSize | null>(null);

export type MeterTone = "accent" | "success" | "warning" | "error";
/**
 * @deprecated The earlier names of two tones: `default` is `accent` and
 * `destructive` is `error`.
 */
export type MeterDeprecatedTone = "default" | "destructive";

export interface MeterProps
  extends
    Omit<WithStringClassName<MeterPrimitive.Root.Props>, "size">,
    VariantProps<typeof meterRootVariants> {
  /**
   * Colours the filled part with a status tone, for example by strength.
   * `accent`, the default, keeps the progress fill; the fill's value
   * transition also carries a change of tone. `default` and `destructive` are
   * the deprecated earlier names of `accent` and `error`.
   */
  tone?: MeterTone | MeterDeprecatedTone | undefined;
}

export function Meter({
  className,
  children,
  locale = METER_DEFAULT_LOCALE,
  size,
  tone = "accent",
  ...props
}: MeterProps): React.ReactElement {
  const resolvedTone: MeterTone =
    tone === "default" ? "accent" : tone === "destructive" ? "error" : tone;
  const resolvedSize = useResolvedControlSize(size);
  // At its minimum a meter is empty and shows no fill; above it, the fill keeps
  // a minimum width so a small value stays visible.
  // NaN counts as empty, as Base UI draws it at the minimum.
  const empty = !(props.value > (props.min ?? 0));
  return (
    <MeterSizeContext.Provider value={resolvedSize}>
      <MeterPrimitive.Root
        className={cn(meterRootVariants({ size: resolvedSize }), className)}
        data-empty={empty || undefined}
        data-size={resolvedSize}
        data-slot="meter"
        data-tone={resolvedTone === "accent" ? undefined : resolvedTone}
        locale={locale}
        {...props}
      >
        {children ? (
          children
        ) : (
          <MeterTrack>
            <MeterIndicator />
          </MeterTrack>
        )}
      </MeterPrimitive.Root>
    </MeterSizeContext.Provider>
  );
}

export interface MeterLabelProps
  extends
    Omit<WithStringClassName<MeterPrimitive.Label.Props>, "size">,
    VariantProps<typeof meterLabelVariants> {}

export function MeterLabel({
  className,
  size,
  ...props
}: MeterLabelProps): React.ReactElement {
  const groupSize = React.useContext(MeterSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  return (
    <MeterPrimitive.Label
      className={cn(meterLabelVariants({ size: resolvedSize }), className)}
      data-size={resolvedSize}
      data-slot="meter-label"
      {...props}
    />
  );
}

export interface MeterTrackProps
  extends
    Omit<WithStringClassName<MeterPrimitive.Track.Props>, "size">,
    VariantProps<typeof meterTrackVariants> {}

export function MeterTrack({
  className,
  size,
  ...props
}: MeterTrackProps): React.ReactElement {
  const groupSize = React.useContext(MeterSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  return (
    <MeterPrimitive.Track
      className={cn(meterTrackVariants({ size: resolvedSize }), className)}
      data-size={resolvedSize}
      data-slot="meter-track"
      {...props}
    />
  );
}

export function MeterIndicator({
  className,
  ...props
}: WithStringClassName<MeterPrimitive.Indicator.Props>): React.ReactElement {
  return (
    <MeterPrimitive.Indicator
      className={cn(linearIndicatorClassNames.indicator, className)}
      data-slot="meter-indicator"
      {...props}
    />
  );
}

export interface MeterValueProps
  extends
    Omit<WithStringClassName<MeterPrimitive.Value.Props>, "size">,
    VariantProps<typeof meterValueVariants> {}

export function MeterValue({
  className,
  size,
  ...props
}: MeterValueProps): React.ReactElement {
  const groupSize = React.useContext(MeterSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  return (
    <MeterPrimitive.Value
      className={cn(meterValueVariants({ size: resolvedSize }), className)}
      data-size={resolvedSize}
      data-slot="meter-value"
      {...props}
    />
  );
}

export { MeterPrimitive };
