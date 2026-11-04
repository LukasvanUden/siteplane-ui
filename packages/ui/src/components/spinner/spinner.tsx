import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import type React from "react";
import { useId } from "react";

// A Server Component: only its name, the kit's "Loading", is a client leaf
// (KitText), which reads the provider's messages.
import { KitText } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

import "./spinner.css";

export type SpinnerVariant =
  | "default"
  | "ring"
  | "dots"
  | "bars"
  | "spokes"
  | "pulse"
  | "comet"
  | "dot-ring";

/**
 * The sizes of a spinner that stands on its own:
 * `sm` 32 px, `md` 48 px, `lg` 56 px and `xl` 64 px. Without one a spinner is
 * 16 px, the size of an icon beside text or inside a Button.
 */
export type SpinnerSize = "sm" | "md" | "lg" | "xl";

/** The variants that draw an svg; the others are a div around their shapes. */
type SpinnerSvgVariant = "default" | "comet" | "dot-ring";

/**
 * The attributes and the ref of the element the variant renders: an svg for
 * `default`, `comet` and `dot-ring`, a div for the others.
 */
export type SpinnerProps<V extends SpinnerVariant = SpinnerVariant> =
  (V extends SpinnerSvgVariant
    ? React.ComponentProps<"svg">
    : React.ComponentProps<"div">) & {
    /**
     * A caption under the spinner, centred on it: 14 px on a 20 px line at
     * `sm` and `md`, 18 px on 28 from `lg`, 16 px below the spinner and 20 px
     * at `xl`. The caption names the spinner, which then drops its own "Loading"
     * name, and is hidden from assistive technology, so the name is read once.
     * The spinner and its caption are one inline unit; a `className` and the
     * other props still go to the spinner itself.
     */
    label?: React.ReactNode;
    /**
     * `sm`, `md`, `lg` or `xl`: 32, 48, 56 or 64 px, and the strokes, dots and
     * bars of every variant grow with it. Unset, the spinner is 16 px.
     */
    size?: SpinnerSize;
    variant?: V;
  };

// A sized spinner is a box of the size, and names the size for the parts that
// draw inside it (a ring's border, a dot, a bar, a spoke), which take their
// share of it: the 16 px spinner's 2 px ring, 8 px dots and 2 px spokes are an
// eighth, a half and an eighth of it.
const spinnerSizeClassNames: Record<SpinnerSize, string> = {
  lg: "size-14",
  md: "size-12",
  sm: "size-8",
  xl: "size-16",
};

const spinnerScaleClassNames: Record<SpinnerSize, string> = {
  lg: "[--sp-spinner-size:--spacing(14)]",
  md: "[--sp-spinner-size:--spacing(12)]",
  sm: "[--sp-spinner-size:--spacing(8)]",
  xl: "[--sp-spinner-size:--spacing(16)]",
};

/**
 * The twelve dots of `dot-ring`, on a circle that fills the 36 by 36 box: each a
 * twelfth of a turn behind the one before it, counter-clockwise from the
 * first at 3 o'clock, and a twelfth fainter. The circle turns clockwise, so
 * the brightest dot leads and the others fade out behind it. A dot is a ninth
 * of the box: 1.8 px in a 16 px spinner, 5.3 px at `md`.
 */
const dotRingDots = Array.from({ length: 12 }, (_, index) => ({
  angle: index * -30,
  opacity: Number(((12 - index) / 12).toFixed(3)),
}));

/** Whether the caption has anything to show, so no group or gap is left behind. */
function hasLabel(label: React.ReactNode): boolean {
  return !(
    label === undefined ||
    label === null ||
    label === false ||
    label === ""
  );
}

export function Spinner<V extends SpinnerVariant = "default">({
  label,
  ...props
}: SpinnerProps<V>): React.ReactElement {
  const labelId = useId();
  const indicatorProps = props as unknown as SpinnerProps<V>;
  if (!hasLabel(label)) return <SpinnerIndicator {...indicatorProps} />;
  return (
    <span
      className="sp-spinner-group"
      data-size={indicatorProps.size}
      data-slot="spinner-group"
    >
      <SpinnerIndicator aria-labelledby={labelId} {...indicatorProps} />
      <span
        aria-hidden="true"
        className="sp-spinner-label"
        data-slot="spinner-label"
        id={labelId}
      >
        {label}
      </span>
    </span>
  );
}

function SpinnerIndicator<V extends SpinnerVariant = "default">(
  allProps: SpinnerProps<V>,
): React.ReactElement {
  const nameId = useId();
  // The variants share one body; each renders its own element type, which the
  // props above already say, so the rest props are read loosely here.
  const {
    className,
    size,
    variant = "default",
    ...props
  } = allProps as React.ComponentProps<"div"> & {
    size?: SpinnerSize;
    variant?: SpinnerVariant;
  };
  const box = size ? spinnerSizeClassNames[size] : undefined;
  const scale = size ? spinnerScaleClassNames[size] : undefined;
  // A spinner that the caller names (an aria-label, also undefined to leave
  // the name out, as a loading Button does, or the caption's
  // aria-labelledby) or hides takes no name of the kit. Else the `spinner`
  // message names it, "Loading" in English, through a hidden label inside it:
  // a text element in an svg, a span in a div. The label's text is a client
  // leaf, so the spinner stays a Server Component and needs no sibling.
  const named =
    "aria-label" in props ||
    "aria-labelledby" in props ||
    props["aria-hidden"] === true ||
    props["aria-hidden"] === "true";
  const nameProps = named ? {} : { "aria-labelledby": nameId };
  const svgName = named ? null : (
    <text display="none" id={nameId}>
      <KitText group="spinner" name="label" />
    </text>
  );
  const htmlName = named ? null : (
    <span hidden id={nameId}>
      <KitText group="spinner" name="label" />
    </span>
  );
  if (variant === "default") {
    return (
      <CircleNotchIcon
        {...nameProps}
        // 16 px like the other variants. Width and height, not a size-*
        // class, so parents that size unsized icons (Button) still apply.
        className={cn(
          slotClass("spinner", props),
          "sp-spinner-default sp-spinner-motion",
          box ?? "h-4 w-4",
          className,
        )}
        data-slot="spinner"
        data-variant="default"
        role="status"
        {...(props as React.ComponentProps<typeof CircleNotchIcon>)}
      >
        {svgName}
      </CircleNotchIcon>
    );
  }

  if (variant === "comet") {
    return (
      <svg
        {...nameProps}
        className={cn(
          slotClass("spinner", props),
          "sp-spinner-motion",
          box ?? "size-4",
          className,
        )}
        data-slot="spinner"
        data-variant="comet"
        fill="none"
        role="status"
        viewBox="0 0 50 50"
        {...(props as React.SVGProps<SVGSVGElement>)}
      >
        <circle
          cx="25"
          cy="25"
          fill="none"
          r="20"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="4"
        />
        {svgName}
      </svg>
    );
  }

  if (variant === "dot-ring") {
    return (
      <svg
        {...nameProps}
        className={cn(
          slotClass("spinner", props),
          "sp-spinner-motion",
          box ?? "size-4",
          className,
        )}
        data-slot="spinner"
        data-variant="dot-ring"
        fill="currentColor"
        role="status"
        viewBox="0 0 36 36"
        {...(props as React.SVGProps<SVGSVGElement>)}
      >
        {dotRingDots.map(({ angle, opacity }) => (
          <circle
            cx="34"
            cy="18"
            key={angle}
            opacity={opacity}
            r="2"
            transform={`rotate(${angle} 18 18)`}
          />
        ))}
        {svgName}
      </svg>
    );
  }

  const shared = {
    ...nameProps,
    "data-slot": "spinner",
    "data-variant": variant,
    role: "status" as const,
    ...props,
  };

  if (variant === "ring") {
    return (
      <div
        className={cn(
          slotClass("spinner", props),
          "sp-spinner-motion inline-block rounded-full border-current/25 border-t-current",
          scale
            ? `${box} ${scale} border-[calc(var(--sp-spinner-size)/8)]`
            : "size-4 border-2",
          className,
        )}
        {...shared}
      >
        {htmlName}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          slotClass("spinner", props),
          "sp-spinner-motion relative inline-grid place-items-center",
          box ?? "size-4",
          className,
        )}
        {...shared}
      >
        <span className="absolute inline-flex size-full rounded-full bg-current opacity-60" />
        <span className="relative inline-flex size-1/2 rounded-full bg-current" />
        {htmlName}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        className={cn(
          slotClass("spinner", props),
          "sp-spinner-motion inline-flex items-center",
          scale ? `${scale} gap-[calc(var(--sp-spinner-size)/4)]` : "gap-1",
          className,
        )}
        {...shared}
      >
        {/* Their delays are the stylesheet's (spinner.css). */}
        {[0, 1, 2].map((index) => (
          <span
            className={cn(
              "rounded-full bg-current",
              box ? "size-[calc(var(--sp-spinner-size)/2)]" : "size-2",
            )}
            key={index}
          />
        ))}
        {htmlName}
      </div>
    );
  }

  if (variant === "bars") {
    return (
      <div
        className={cn(
          slotClass("spinner", props),
          "sp-spinner-motion inline-flex items-center",
          scale
            ? `${scale} h-(--sp-spinner-size) gap-[calc(var(--sp-spinner-size)*3/16)]`
            : "h-4 gap-[3px]",
          className,
        )}
        {...shared}
      >
        {[0, 1, 2, 3].map((index) => (
          <span
            className={cn(
              "h-full origin-center rounded-full bg-current",
              box ? "w-[calc(var(--sp-spinner-size)*3/16)]" : "w-[3px]",
            )}
            key={index}
          />
        ))}
        {htmlName}
      </div>
    );
  }

  return (
    <div
      className={cn(
        slotClass("spinner", props),
        "sp-spinner-motion relative inline-block",
        // A sized root names its size, which each spoke's width reads.
        scale ? `${box} ${scale}` : "size-4",
        className,
      )}
      {...shared}
    >
      {/* Their angles and delays are the stylesheet's (spinner.css). */}
      {Array.from({ length: 8 }, (_, index) => (
        <span
          className={cn(
            "absolute top-0 left-1/2 h-[42%] -translate-x-1/2 rounded-full bg-current [transform-origin:50%_119%]",
            box ? "w-[calc(var(--sp-spinner-size)/8)]" : "w-[2px]",
          )}
          key={index}
        />
      ))}
      {htmlName}
    </div>
  );
}
