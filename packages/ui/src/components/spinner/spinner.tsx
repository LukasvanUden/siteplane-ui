import { Loader2Icon } from "lucide-react";
import type React from "react";

import { cn } from "../../system/utils/cn";

import "./spinner.css";

export type SpinnerVariant =
  "default" | "ring" | "dots" | "bars" | "spokes" | "pulse" | "comet";

/** The variants that draw an svg; the others are a div around their shapes. */
type SpinnerSvgVariant = "default" | "comet";

/**
 * The attributes and the ref of the element the variant renders: an svg for
 * `default` and `comet`, a div for the others.
 */
export type SpinnerProps<V extends SpinnerVariant = SpinnerVariant> =
  (V extends SpinnerSvgVariant
    ? React.ComponentProps<"svg">
    : React.ComponentProps<"div">) & {
    variant?: V;
  };

export function Spinner<V extends SpinnerVariant = "default">(
  allProps: SpinnerProps<V>,
): React.ReactElement {
  // The variants share one body; each renders its own element type, which the
  // props above already say, so the rest props are read loosely here.
  const {
    className,
    variant = "default",
    ...props
  } = allProps as React.ComponentProps<"div"> & { variant?: SpinnerVariant };
  if (variant === "default") {
    return (
      <Loader2Icon
        aria-label="Loading"
        // 16 px like the other variants. Width and height, not a size-*
        // class, so parents that size unsized icons (Button) still apply.
        className={cn(
          "siteplane-spinner-default siteplane-spinner-motion h-4 w-4",
          className,
        )}
        data-slot="spinner"
        data-variant="default"
        role="status"
        {...(props as React.ComponentProps<typeof Loader2Icon>)}
      />
    );
  }

  if (variant === "comet") {
    return (
      <svg
        aria-label="Loading"
        className={cn("siteplane-spinner-motion size-4", className)}
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
      </svg>
    );
  }

  const shared = {
    "aria-label": "Loading",
    "data-slot": "spinner",
    "data-variant": variant,
    role: "status" as const,
    ...props,
  };

  if (variant === "ring") {
    return (
      <div
        className={cn(
          "siteplane-spinner-motion inline-block size-4 rounded-full border-2 border-current/25 border-t-current",
          className,
        )}
        {...shared}
      />
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          "siteplane-spinner-motion relative inline-grid size-4 place-items-center",
          className,
        )}
        {...shared}
      >
        <span className="absolute inline-flex size-full rounded-full bg-current opacity-60" />
        <span className="relative inline-flex size-1/2 rounded-full bg-current" />
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        className={cn(
          "siteplane-spinner-motion inline-flex items-center gap-1",
          className,
        )}
        {...shared}
      >
        {[0, 1, 2].map((index) => (
          <span
            className="size-2 rounded-full bg-current"
            key={index}
            style={{
              animationDelay: `calc(var(--motion-duration-loop) * ${(index * 16) / 100})`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "bars") {
    return (
      <div
        className={cn(
          "siteplane-spinner-motion inline-flex h-4 items-center gap-[3px]",
          className,
        )}
        {...shared}
      >
        {[0, 1, 2, 3].map((index) => (
          <span
            className="h-full w-[3px] origin-center rounded-full bg-current"
            key={index}
            style={{
              animationDelay: `calc(var(--motion-duration-loop) * ${(index * 12) / 100})`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "siteplane-spinner-motion relative inline-block size-4",
        className,
      )}
      {...shared}
    >
      {Array.from({ length: 8 }, (_, index) => (
        <span
          className="absolute top-0 left-1/2 h-[42%] w-[2px] -translate-x-1/2 rounded-full bg-current [transform-origin:50%_119%]"
          key={index}
          style={{
            animationDelay: `calc(var(--motion-duration-loop) * ${(index - 8) / 10})`,
            rotate: `${index * 45}deg`,
          }}
        />
      ))}
    </div>
  );
}
