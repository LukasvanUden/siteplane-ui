"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  type SiteplaneControlSize,
  siteplaneUIDefaults,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

const sliderControlVariants = cva(
  "relative flex cursor-pointer touch-none select-none active:cursor-grabbing before:absolute before:content-[''] data-disabled:cursor-not-allowed data-[orientation=horizontal]:w-full data-[orientation=horizontal]:items-center data-[orientation=horizontal]:before:inset-x-0 data-[orientation=vertical]:h-full data-[orientation=vertical]:items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:before:inset-y-0",
  {
    defaultVariants: { size: siteplaneUIDefaults.controlSize },
    variants: {
      size: {
        md: "data-[orientation=horizontal]:min-h-6 data-[orientation=horizontal]:min-w-44 data-[orientation=horizontal]:before:inset-y-[-10px] data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:min-w-6 data-[orientation=vertical]:before:inset-x-[-10px]",
        lg: "data-[orientation=horizontal]:min-h-7 data-[orientation=horizontal]:min-w-48 data-[orientation=horizontal]:before:inset-y-[-12px] data-[orientation=vertical]:min-h-48 data-[orientation=vertical]:min-w-7 data-[orientation=vertical]:before:inset-x-[-12px]",
        sm: "data-[orientation=horizontal]:min-h-5 data-[orientation=horizontal]:min-w-40 data-[orientation=horizontal]:before:inset-y-[-8px] data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:min-w-5 data-[orientation=vertical]:before:inset-x-[-8px]",
        xl: "data-[orientation=horizontal]:min-h-8 data-[orientation=horizontal]:min-w-52 data-[orientation=horizontal]:before:inset-y-[-14px] data-[orientation=vertical]:min-h-52 data-[orientation=vertical]:min-w-8 data-[orientation=vertical]:before:inset-x-[-14px]",
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

const sliderThumbVariants = cva(
  "block shrink-0 cursor-inherit select-none active:cursor-grabbing before:absolute before:inset-0 before:rounded-[inherit] has-focus-visible:ring-ring/24 data-dragging:scale-120 data-dragging:cursor-grabbing dark:has-focus-visible:ring-ring/48",
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
// (design-rework.css): 12 px on an 18 px line, as the lg slider shows it.
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

// The inset lines labels up with the thumb centers; end labels may use it to
// stay inside the slider box. The labels tuck 4 px under the control's hit
// area, across the 8 px gap of the Slider's stack.
const sliderLabelsVariants = cva(
  "@container relative -mt-3 mx-(--slider-labels-inset) h-4",
  {
    defaultVariants: { size: siteplaneUIDefaults.controlSize },
    variants: {
      size: {
        md: "[--slider-labels-inset:--spacing(2.5)] sm:[--slider-labels-inset:--spacing(2)]",
        lg: "[--slider-labels-inset:--spacing(3)] sm:[--slider-labels-inset:--spacing(2.5)]",
        sm: "[--slider-labels-inset:--spacing(2.25)] sm:[--slider-labels-inset:--spacing(2)]",
        xl: "[--slider-labels-inset:--spacing(3.5)] sm:[--slider-labels-inset:--spacing(3)]",
      },
    },
  },
);

const SliderSizeContext = React.createContext<SiteplaneControlSize | null>(
  null,
);

export interface SliderProps
  extends
    Omit<WithStringClassName<SliderPrimitive.Root.Props>, "size">,
    VariantProps<typeof sliderControlVariants> {
  labels?: readonly { label: React.ReactNode; value: number }[];
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
  value,
  min = 0,
  max = 100,
  onValueChange,
  orientation = "horizontal",
  size,
  ...props
}: SliderProps): React.ReactElement {
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
        </SliderPrimitive.Control>
        {labels?.length ? (
          <SliderLabels
            labels={labels}
            max={max}
            min={min}
            orientation={orientation}
            size={resolvedSize}
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
  size,
}: {
  labels: NonNullable<SliderProps["labels"]>;
  max: number;
  min: number;
  orientation: "horizontal" | "vertical";
  size: SiteplaneControlSize;
}) {
  return (
    <SliderPrimitive.Value
      render={(_, state) => (
        <div
          className={cn(
            "sp-slider-labels",
            sliderLabelsVariants({ size }),
            "data-[orientation=vertical]:hidden",
          )}
          data-orientation={orientation}
          data-slot="slider-labels"
        >
          {labels.map(({ label, value: labelValue }) => {
            const position =
              max === min
                ? 0
                : Math.min(
                    100,
                    Math.max(0, ((labelValue - min) / (max - min)) * 100),
                  );
            const fraction = position / 100;

            return (
              <span
                className={cn(
                  "absolute top-0 whitespace-nowrap text-muted-foreground",
                  state.values.includes(labelValue) &&
                    "font-semibold text-foreground",
                )}
                key={labelValue}
                style={{
                  left: `${position}%`,
                  // Centered under its value, clamped to the slider box.
                  translate: `clamp(${-fraction} * 100cqw - var(--slider-labels-inset), -50%, ${1 - fraction} * 100cqw + var(--slider-labels-inset) - 100%)`,
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      )}
    />
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
