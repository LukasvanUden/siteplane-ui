"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  type SiteplaneControlSize,
  siteplaneUIDefaults,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { useFormatLocale } from "../../system/locale/messages-context";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

// The control is at least a thumb high (or wide, vertical): the Slider's size
// block names the thumb (design-rework.css). Its length grows by 16 px a step.
const sliderControlVariants = cva(
  "relative flex cursor-pointer touch-none select-none active:cursor-grabbing before:absolute before:content-[''] data-disabled:cursor-not-allowed data-[orientation=horizontal]:w-full data-[orientation=horizontal]:items-center data-[orientation=horizontal]:before:inset-x-0 data-[orientation=vertical]:h-full data-[orientation=vertical]:items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:before:inset-y-0",
  {
    defaultVariants: { size: siteplaneUIDefaults.controlSize },
    variants: {
      size: {
        md: "data-[orientation=horizontal]:min-w-44 data-[orientation=horizontal]:before:inset-y-[-10px] data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:before:inset-x-[-10px]",
        lg: "data-[orientation=horizontal]:min-w-48 data-[orientation=horizontal]:before:inset-y-[-10px] data-[orientation=vertical]:min-h-48 data-[orientation=vertical]:before:inset-x-[-10px]",
        sm: "data-[orientation=horizontal]:min-w-40 data-[orientation=horizontal]:before:inset-y-[-10px] data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:before:inset-x-[-10px]",
        xl: "data-[orientation=horizontal]:min-w-52 data-[orientation=horizontal]:before:inset-y-[-10px] data-[orientation=vertical]:min-h-52 data-[orientation=vertical]:before:inset-x-[-10px]",
      },
    },
  },
);

const sliderTrackVariants = cva(
  "relative grow cursor-inherit select-none active:cursor-grabbing before:absolute data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=horizontal]:before:inset-x-0.5 data-[orientation=vertical]:before:inset-x-0 data-[orientation=horizontal]:before:inset-y-0 data-[orientation=vertical]:before:inset-y-0.5",
  {
    defaultVariants: { size: siteplaneUIDefaults.controlSize },
    variants: {
      size: {
        md: "",
        lg: "",
        sm: "",
        xl: "",
      },
    },
  },
);

// The thumb's circle grows while it is dragged, on a layer of its own
// (design-rework.css): Base UI measures the thumb's box, scale included, to
// place an edge-aligned thumb, so a scaled box stopped short of its value.
const sliderThumbVariants = cva(
  "block shrink-0 cursor-inherit select-none active:cursor-grabbing before:absolute before:inset-0 before:rounded-[inherit] has-focus-visible:ring-ring/24 data-dragging:cursor-grabbing dark:has-focus-visible:ring-ring/48",
  {
    defaultVariants: { size: siteplaneUIDefaults.controlSize },
    variants: {
      size: {
        md: "",
        lg: "",
        sm: "",
        xl: "",
      },
    },
  },
);

// The value's type is the kit rule's at every size, with the scale labels
// (design-rework.css): 12 px on an 18 px line.
const sliderValueVariants = cva("flex justify-end", {
  defaultVariants: { size: siteplaneUIDefaults.controlSize },
  variants: {
    size: {
      md: "",
      lg: "",
      sm: "",
      xl: "",
    },
  },
});

// The labels line up with the thumb centres through --slider-labels-inset,
// half the thumb, which the Slider's size block names (design-rework.css): the
// scale labels and the values under the control and the floating values above
// it. End labels use it to stay inside the slider box.

// The labels under the control, the scale's and the thumbs' values
// (valueLabel="bottom"), sit under the thumb, across the 8 px gap of the
// Slider's stack.
const sliderLabelsClassName =
  "@container relative mx-(--slider-labels-inset) h-4";

// A label under the control stays on one line at its place (sliderLabelStyle).
// The one at a thumb's value is strong: a scale label the thumb stands on, and
// every value under a thumb.
const sliderLabelClassName = "sp-slider-label absolute top-0 whitespace-nowrap";
const sliderLabelActiveClassName =
  "font-(--sp-rw-font-weight-strong) text-foreground";

// The values under the thumbs are a row of their own kind (Lukas, 31 October
// 2026): 16 px text on a 24 px line in the kit's label weight, so the row is as
// high as its line.
const sliderValueRowClassName =
  "@container relative mx-(--slider-labels-inset) h-6";
const sliderValueClassName = "font-(--sp-rw-font-weight-label) text-foreground";

/** Where a value sits on the scale, in percent, clamped to the range. */
function valuePercent(value: number, min: number, max: number): number {
  return max === min
    ? 0
    : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/**
 * The place of a label under the control: at its value's share of the row,
 * which is inset by half a thumb, so it stands under the centre of a thumb at
 * that value, and the shift that centres it there, clamped so that a label at
 * an end stays inside the slider box. A right-to-left page starts the scale at
 * the right, so it reads the mirrored shift (design-rework.css).
 */
function sliderLabelStyle(
  value: number,
  min: number,
  max: number,
): React.CSSProperties {
  const position = valuePercent(value, min, max);
  const fraction = position / 100;

  return {
    insetInlineStart: `${position}%`,
    "--slider-label-shift": `clamp(${-fraction} * 100cqw - var(--slider-labels-inset), -50%, ${1 - fraction} * 100cqw + var(--slider-labels-inset) - 100%)`,
    "--slider-label-shift-rtl": `clamp(100% - ${1 - fraction} * 100cqw - var(--slider-labels-inset), 50%, ${fraction} * 100cqw + var(--slider-labels-inset))`,
  } as React.CSSProperties;
}

const SliderSizeContext = React.createContext<SiteplaneControlSize | null>(
  null,
);

export interface SliderProps
  extends
    Omit<WithStringClassName<SliderPrimitive.Root.Props>, "size">,
    VariantProps<typeof sliderControlVariants> {
  labels?: readonly { label: React.ReactNode; value: number }[];
  /**
   * Shows the value of each thumb in a label that moves with the thumb,
   * formatted with `format` and `locale`, as the thumb's accessible value is.
   * `floating` puts it above the thumb, on a floating label that takes no
   * space of its own. `bottom` puts it under the thumb, in a row of its own
   * with 16 px text on a 24 px line in the label weight and the text colour,
   * and keeps it inside the slider box at the ends as the scale labels are. A
   * vertical slider shows none.
   */
  valueLabel?: "none" | "floating" | "bottom" | undefined;
}

// Base UI measures an edge-aligned thumb and the indicator from the control
// when they mount, and their resize observer finds no control at that point.
// Mounted inside a hidden container (display: none), they keep a 0 px
// measurement and stay hidden after it shows. The kit remounts them each time
// the control is rendered again.
function useRenderedKey(
  control: React.RefObject<HTMLDivElement | null>,
): number {
  const [renderedKey, setRenderedKey] = React.useState(0);

  React.useEffect(() => {
    const node = control.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    let rendered = node.getClientRects().length > 0;
    const observer = new ResizeObserver(() => {
      const next = node.getClientRects().length > 0;
      if (next && !rendered) setRenderedKey((key) => key + 1);
      rendered = next;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [control]);

  return renderedKey;
}

function toSliderValues(value: number | readonly number[]) {
  return typeof value === "number" ? [value] : [...value];
}

export function Slider({
  "aria-label": ariaLabel,
  className,
  children,
  defaultValue,
  labels,
  locale: localeProp,
  value,
  min = 0,
  max = 100,
  onValueChange,
  orientation = "horizontal",
  size,
  valueLabel = "none",
  ...props
}: SliderProps): React.ReactElement {
  // Its own locale, else the provider's; without either, Base UI's default.
  const locale = useFormatLocale(localeProp, undefined);
  const resolvedSize = useResolvedControlSize(size);
  const controlRef = React.useRef<HTMLDivElement>(null);
  const renderedKey = useRenderedKey(controlRef);

  const values = React.useMemo(() => {
    if (value !== undefined) return toSliderValues(value);
    if (defaultValue !== undefined) return toSliderValues(defaultValue);
    return [min];
  }, [value, defaultValue, min]);
  return (
    <SliderSizeContext.Provider value={resolvedSize}>
      <SliderPrimitive.Root
        className={cn(
          slotClass("slider", props),
          "data-[orientation=horizontal]:w-full",
          className,
        )}
        data-size={resolvedSize}
        data-slot="slider"
        defaultValue={defaultValue}
        locale={locale}
        max={max}
        min={min}
        onValueChange={onValueChange}
        orientation={orientation}
        thumbAlignment="edge"
        value={value}
        {...props}
      >
        {children}
        <SliderPrimitive.Control
          className={cn(
            "sp-slider-control",
            sliderControlVariants({ size: resolvedSize }),
            "data-dragging:cursor-grabbing",
          )}
          data-size={resolvedSize}
          data-slot="slider-control"
          ref={controlRef}
        >
          <SliderPrimitive.Track
            className={cn(
              "sp-slider-track",
              sliderTrackVariants({ size: resolvedSize }),
              "data-dragging:cursor-grabbing",
            )}
            data-size={resolvedSize}
            data-slot="slider-track"
          >
            <SliderPrimitive.Indicator
              // Its motion, and the reduced-motion switch, are the kit's
              // Slider rules (design-rework.css).
              className="sp-slider-indicator select-none data-[orientation=horizontal]:ms-0.5 data-[orientation=vertical]:mb-0.5"
              data-slot="slider-indicator"
              key={`indicator-${renderedKey}`}
            />
            {Array.from({ length: values.length }, (_, index) => (
              <SliderPrimitive.Thumb
                aria-label={ariaLabel}
                className={cn(
                  "sp-slider-thumb",
                  sliderThumbVariants({ size: resolvedSize }),
                  "data-dragging:cursor-grabbing",
                )}
                data-size={resolvedSize}
                data-slot="slider-thumb"
                index={index}
                key={`${index}-${renderedKey}`}
              />
            ))}
          </SliderPrimitive.Track>
          {valueLabel === "floating" && orientation === "horizontal" ? (
            <SliderValueLabels max={max} min={min} />
          ) : null}
        </SliderPrimitive.Control>
        {valueLabel === "bottom" && orientation === "horizontal" ? (
          <SliderBottomValueLabels max={max} min={min} />
        ) : null}
        {labels?.length ? (
          <SliderLabels
            labels={labels}
            max={max}
            min={min}
            orientation={orientation}
          />
        ) : null}
      </SliderPrimitive.Root>
    </SliderSizeContext.Provider>
  );
}

function SliderLabels({
  labels,
  max,
  min,
  orientation,
}: {
  labels: NonNullable<SliderProps["labels"]>;
  max: number;
  min: number;
  orientation: "horizontal" | "vertical";
}) {
  return (
    <SliderPrimitive.Value
      render={(_, state) => (
        <div
          className={cn(
            "sp-slider-labels",
            sliderLabelsClassName,
            "data-[orientation=vertical]:hidden",
          )}
          data-orientation={orientation}
          data-slot="slider-labels"
        >
          {labels.map(({ label, value: labelValue }) => (
            <span
              className={cn(
                sliderLabelClassName,
                "text-muted-foreground",
                state.values.includes(labelValue) && sliderLabelActiveClassName,
              )}
              data-active={state.values.includes(labelValue) || undefined}
              data-slot="slider-label"
              key={labelValue}
              style={sliderLabelStyle(labelValue, min, max)}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    />
  );
}

// The values under the thumbs (valueLabel="bottom"): a row of the scale
// labels' kind with the value of each thumb, placed
// at the thumb's value as a scale label is, so it moves with the thumb, stands
// under its centre and stays inside the slider box at the ends. Each takes the
// medium 16 px text of the row (design-rework.css), with figures of one width,
// so a label keeps its width while the value changes. The labels repeat what
// the thumbs announce, so assistive technology skips them.
function SliderBottomValueLabels({ max, min }: { max: number; min: number }) {
  return (
    <SliderPrimitive.Value
      aria-hidden="true"
      className={cn("sp-slider-labels block", sliderValueRowClassName)}
      data-labels="values"
      data-slot="slider-labels"
    >
      {(formattedValues, values) =>
        values.map((thumbValue, index) => (
          <span
            className={cn(
              sliderLabelClassName,
              sliderValueClassName,
              "tabular-nums",
            )}
            data-active
            data-slot="slider-label"
            // A thumb is its index, as the thumbs themselves are keyed.
            key={index}
            style={sliderLabelStyle(thumbValue, min, max)}
          >
            {formattedValues[index]}
          </span>
        ))
      }
    </SliderPrimitive.Value>
  );
}

// The floating values (valueLabel="floating"): a layer above the control,
// inset by half a thumb at each end, holds a label for each thumb at the
// thumb's place on the scale, so the label follows the centre of its thumb. It
// is not part of the thumb, whose circle grows while it is dragged; centred on
// its thumb, a label wider than the thumb reaches past the slider box at the
// ends, as the Progress floating label does. The labels repeat
// what the thumbs announce, so assistive technology skips them.
function SliderValueLabels({ max, min }: { max: number; min: number }) {
  return (
    <SliderPrimitive.Value
      aria-hidden="true"
      className={cn("sp-slider-value-labels")}
      data-slot="slider-value-labels"
    >
      {(formattedValues, values) =>
        values.map((thumbValue, index) => (
          <span
            className="sp-slider-value-label"
            data-slot="slider-value-label"
            // A thumb is its index, as the thumbs themselves are keyed.
            key={index}
            style={{
              insetInlineStart: `${valuePercent(thumbValue, min, max)}%`,
            }}
          >
            {formattedValues[index]}
          </span>
        ))
      }
    </SliderPrimitive.Value>
  );
}

export interface SliderValueProps
  extends
    Omit<WithStringClassName<SliderPrimitive.Value.Props>, "size">,
    VariantProps<typeof sliderValueVariants> {}

export function SliderValue({
  className,
  size,
  ...props
}: SliderValueProps): React.ReactElement {
  const groupSize = React.useContext(SliderSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);

  return (
    <SliderPrimitive.Value
      className={cn(
        slotClass("slider-value", props),
        sliderValueVariants({ size: resolvedSize }),
        className,
      )}
      data-size={resolvedSize}
      data-slot="slider-value"
      {...props}
    />
  );
}

export { SliderPrimitive };
