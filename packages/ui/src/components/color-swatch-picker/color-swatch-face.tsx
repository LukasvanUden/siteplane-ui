"use client";

import * as React from "react";
import { ColorSwatch as ColorSwatchPrimitive } from "react-aria-components";

import "./color-swatch-picker.css";

/**
 * How a selected swatch shows its selection: a check inside the swatch (the
 * default) or a ring around it, as the swatch rows of image and avatar
 * choosers do.
 */
export type ColorSwatchIndicator = "check" | "ring";

/**
 * The picture of one swatch: the color or image, and the check of the `check`
 * indicator. ColorSwatchPicker items and the swatch trigger of ColorPicker
 * both draw it, so a swatch keeps one appearance wherever it appears. The
 * selection ring, hover, focus and disabled states belong to the swatch box
 * around it (`sp-color-swatch-item`) and are styled in
 * `color-swatch-picker.css`.
 */
export function ColorSwatchFace({
  color,
  image,
  imagePosition,
  imageSize,
  indicator = "check",
  label,
  selected,
}: {
  /** The swatch color; behind an image it shows until the image has loaded. */
  color?: string | undefined;
  image?: string | undefined;
  /** CSS `background-position` of the image; centred by default. */
  imagePosition?: string | undefined;
  /** CSS `background-size` of the image; it covers the swatch by default. */
  imageSize?: string | undefined;
  indicator?: ColorSwatchIndicator | undefined;
  label?: string | undefined;
  selected?: boolean | undefined;
}): React.ReactElement {
  return (
    <>
      {/* An image option is a swatch like any other: the swatch element names
          the option, and the picture lies over its (transparent) color. */}
      <ColorSwatchPrimitive
        aria-hidden="true"
        className="sp-color-swatch-picker-swatch"
        {...(label === undefined ? {} : { colorName: label })}
        data-image={image === undefined ? undefined : ""}
        data-slot="color-swatch-picker-swatch"
        style={{
          backgroundColor: color ?? "transparent",
          ...(image === undefined
            ? {}
            : {
                backgroundImage: `url(${JSON.stringify(image)})`,
                ...(imagePosition === undefined
                  ? {}
                  : { backgroundPosition: imagePosition }),
                ...(imageSize === undefined
                  ? {}
                  : { backgroundSize: imageSize }),
              }),
        }}
      />
      {indicator === "check" ? (
        <span
          aria-hidden="true"
          className="sp-checkbox-indicator sp-color-swatch-picker-indicator"
          data-selected={selected || undefined}
          data-slot="checkbox-indicator"
          style={{
            color: `contrast-color(color-mix(in oklch, ${color ?? "black"} 90%, black))`,
          }}
        >
          <svg
            className="sp-check-glyph-motion"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path
              className="sp-check-path-motion"
              d="M5.252 12.7 10.2 18.63 18.748 5.37"
            />
          </svg>
        </span>
      ) : null}
    </>
  );
}
