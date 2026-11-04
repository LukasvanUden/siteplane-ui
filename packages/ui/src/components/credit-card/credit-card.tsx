"use client";

import * as React from "react";

import { surfaceClassNames } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

import "./credit-card.css";

/**
 * The thirteen looks of a card. The first six are a
 * full face: clear glass, glass with a soft colour glow in its corner, the
 * brand in a dark and a light shade, and a dark and a light grey. The next
 * four have a dark strip across their lower half under a clear glass, a light
 * grey, a soft brand gradient or a warm tint. The last three have the dark strip
 * on the left and a plain, a gradient or a warm column at the right, where the
 * network mark stands.
 */
export type CreditCardVariant =
  | "transparent"
  | "transparent-gradient"
  | "brand-dark"
  | "brand-light"
  | "gray-dark"
  | "gray-light"
  | "transparent-strip"
  | "gray-strip"
  | "gradient-strip"
  | "salmon-strip"
  | "gray-strip-vertical"
  | "gradient-strip-vertical"
  | "salmon-strip-vertical";

/** The variants that are clear glass, which lies on artwork and takes its look from it. */
const glassVariants: ReadonlySet<CreditCardVariant> = new Set([
  "transparent",
  "transparent-gradient",
  "transparent-strip",
]);

const horizontalStrips: ReadonlySet<CreditCardVariant> = new Set([
  "transparent-strip",
  "gray-strip",
  "gradient-strip",
  "salmon-strip",
]);

const verticalStrips: ReadonlySet<CreditCardVariant> = new Set([
  "gray-strip-vertical",
  "gradient-strip-vertical",
  "salmon-strip-vertical",
]);

export interface CreditCardProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The issuer's name, set as the wordmark at the top start of the card. */
  brand?: React.ReactNode;
  /** The expiry date, at the end of the line of the cardholder's name. */
  expiry?: string | undefined;
  /**
   * The mark of the card network, in a tile at the bottom end of the card. The
   * kit draws two overlapping circles, a generic mark, since it ships no
   * network's own logo; pass the network's mark here. `null` leaves the tile
   * out.
   */
  mark?: React.ReactNode;
  /** The cardholder's name, set in capitals above the number. */
  name?: string | undefined;
  /** The card number, as it is to read, such as "1234 1234 1234 1234". */
  number?: string | undefined;
  /** One of the thirteen looks; `brand-dark` by default. */
  variant?: CreditCardVariant | undefined;
}

/** The generic network mark: two overlapping circles, the overlap at full strength. */
function GenericNetworkMark(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="sp-credit-card-mark-glyph"
      fill="currentColor"
      focusable="false"
      viewBox="0 0 30 19"
    >
      <circle cx="9.4" cy="9.5" opacity="0.5" r="9.4" />
      <circle cx="20.4" cy="9.5" opacity="0.5" r="9.4" />
      <path d="M14.9 1.88A9.4 9.4 0 0 1 14.9 17.12A9.4 9.4 0 0 1 14.9 1.88Z" />
    </svg>
  );
}

/**
 * The contactless symbol: the three waves of Phosphor's contactless payment
 * icon without the circle around them, drawn as a 20 by 24 picture whose
 * waves reach from the top to the bottom, the outer one at its end.
 */
function ContactlessMark(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="sp-credit-card-contactless"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="3"
      viewBox="0 0 20 24"
    >
      <path d="M4.875 7.5A9.5625 9.5625 0 0 1 4.875 16.5" />
      <path d="M10.125 4.5A15.9375 15.9375 0 0 1 10.125 19.5" />
      <path d="M15.375 1.5A22.3125 22.3125 0 0 1 15.375 22.5" />
    </svg>
  );
}

/**
 * A payment card: the issuer's wordmark and the contactless symbol above, the
 * cardholder, the expiry date and the number below, and the card network's
 * mark in a tile at the corner. It keeps the 316 by 190 proportions of a bank
 * card and draws everything in units of its width, so a width from the
 * consumer (a class such as `w-60`) scales the card with its text, its
 * padding and its corners. It is a picture of a card and keeps its colours in
 * both themes; the three clear glass looks take the kit's clear glass, which
 * lies on artwork and shows what is behind it.
 */
export function CreditCard({
  brand,
  className,
  expiry,
  mark,
  name,
  number,
  variant = "brand-dark",
  ...props
}: CreditCardProps): React.ReactElement {
  const glass = glassVariants.has(variant);
  const strip = horizontalStrips.has(variant)
    ? "horizontal"
    : verticalStrips.has(variant)
      ? "vertical"
      : undefined;
  return (
    <div
      className={cn(slotClass("credit-card", props), className)}
      data-slot="credit-card"
      data-variant={variant}
      {...props}
    >
      <div
        className={cn(
          slotClass("credit-card-face"),
          glass && surfaceClassNames.glass,
        )}
        data-glass-tone={glass ? "clear" : undefined}
        data-slot="credit-card-face"
      >
        {strip ? (
          <span
            aria-hidden="true"
            className="sp-credit-card-strip"
            data-slot="credit-card-strip"
            data-strip={strip}
          />
        ) : null}
        {variant === "transparent-gradient" ? (
          <span
            aria-hidden="true"
            className="sp-credit-card-glow"
            data-slot="credit-card-glow"
          />
        ) : null}
        <div className="sp-credit-card-header" data-slot="credit-card-header">
          <p className="sp-credit-card-brand" data-slot="credit-card-brand">
            {brand}
          </p>
          <ContactlessMark />
        </div>
        <div className="sp-credit-card-footer" data-slot="credit-card-footer">
          <div
            className="sp-credit-card-details"
            data-slot="credit-card-details"
          >
            <div className="sp-credit-card-line" data-slot="credit-card-line">
              <p className="sp-credit-card-name" data-slot="credit-card-name">
                {name}
              </p>
              <p
                className="sp-credit-card-expiry"
                data-slot="credit-card-expiry"
              >
                {expiry}
              </p>
            </div>
            <p className="sp-credit-card-number" data-slot="credit-card-number">
              {number}
            </p>
          </div>
          {mark === null ? null : (
            <div className="sp-credit-card-mark" data-slot="credit-card-mark">
              {mark === undefined ? <GenericNetworkMark /> : mark}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
