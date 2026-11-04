import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

import "./illustration.css";

/** The drawing: a cloud, a box, a credit card or a few documents. */
export type IllustrationType = "cloud" | "box" | "credit-card" | "documents";

/** `sm` is 120 px high, `md` 128 px and `lg`, the default, 160 px. */
export type IllustrationSize = "sm" | "md" | "lg";

export interface IllustrationProps extends Omit<
  React.ComponentProps<"div">,
  "children" | "title"
> {
  /** Which drawing to show. */
  type: IllustrationType;
  /**
   * The size: `sm` is 120 px high, `md` 128 px and `lg` 160 px. The width follows from the drawing's proportions. An
   * Illustration in the media of an Empty takes the height of the Empty's size
   * instead. `lg` by default.
   */
  size?: IllustrationSize | undefined;
  /**
   * The glyph that floats over the drawing in a frosted disc, such as a
   * magnifier on the cloud or an upload arrow on the box. Pass a Phosphor icon
   * with `aria-hidden="true"`; its size comes from the disc. Without it the
   * drawing stands alone.
   */
  children?: React.ReactNode;
}

/** The small discs that scatter around the large one: x, y and radius. */
const specks = [
  [26, 20, 8],
  [191, 11, 7],
  [210, 46, 10],
  [198, 126, 6],
  [25, 138, 10],
] as const;

/** A rounded rectangle as a path, so a surface and its shade share one shape. */
function roundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  const r = radius;
  return `M${x + r} ${y}H${x + width - r}A${r} ${r} 0 0 1 ${x + width} ${y + r}V${y + height - r}A${r} ${r} 0 0 1 ${x + width - r} ${y + height}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + height - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

/**
 * A shape that is lit from its top start corner: the opaque surface, then the
 * shade that fades out of the corner, then, when the shape asks for it, its
 * hairline edge.
 */
function Lit({
  d,
  edge = true,
  shade,
}: {
  d: string;
  edge?: boolean;
  shade: string;
}) {
  return (
    <>
      <path className="sp-illustration-surface" d={d} />
      <path d={d} fill={`url(#${shade})`} />
      {edge ? <path className="sp-illustration-edge" d={d} /> : null}
    </>
  );
}

/** A cloud of three lobes on a flat base, shaded lobe by lobe. */
function Cloud({ shade }: { shade: string }) {
  const outline =
    "M63.77 115.43A39.77 39.77 0 1 1 72.94 36.95A49.71 49.71 0 0 1 159.16 46.06A34.8 34.8 0 1 1 163.2 115.43Z";
  return (
    <>
      <path className="sp-illustration-surface" d={outline} />
      <circle cx="63.77" cy="75.66" fill={`url(#${shade})`} r="39.77" />
      <circle cx="113.49" cy="65.71" fill={`url(#${shade})`} r="49.71" />
      <circle cx="163.2" cy="80.63" fill={`url(#${shade})`} r="34.8" />
      <path className="sp-illustration-edge" d={outline} />
    </>
  );
}

/** A closed box seen from above and aside, with a slit on its lid. */
function Box({ shade }: { shade: string }) {
  const outline = "M110 12 168 39V109L110 136 52 109V39Z";
  return (
    <>
      <path className="sp-illustration-surface" d={outline} />
      <path className="sp-illustration-depth" d="M52 39 110 66V136L52 109Z" />
      <path d="M110 66 168 39V109L110 136Z" fill={`url(#${shade})`} />
      <path className="sp-illustration-fold" d="M110 29 132 39 110 49 88 39Z" />
      <path className="sp-illustration-edge" d={outline} />
      <path
        className="sp-illustration-edge"
        d="M52 39 110 66 168 39M110 66V136"
      />
    </>
  );
}

/** A card with a chip, two overlapping discs and four groups of digits. */
function CreditCard({ shade }: { shade: string }) {
  return (
    <>
      <Lit d={roundedRect(42, 36, 136, 88, 10)} shade={shade} />
      <path
        className="sp-illustration-fold"
        d={roundedRect(58, 52, 22, 16, 3)}
      />
      <circle className="sp-illustration-fold" cx="146" cy="62" r="10" />
      <circle className="sp-illustration-fold" cx="158" cy="62" r="10" />
      {[58, 84, 110, 136].map((x) => (
        <path
          className="sp-illustration-fold"
          d={roundedRect(x, 98, 20, 5, 2.5)}
          key={x}
        />
      ))}
      <path
        className="sp-illustration-fold"
        d={roundedRect(58, 108, 44, 5, 2.5)}
      />
    </>
  );
}

/** One sheet of paper with a folded corner and three lines of text. */
function Sheet({
  angle = 0,
  shade,
  x,
  y,
}: {
  angle?: number;
  shade: string;
  x: number;
  y: number;
}) {
  const width = 58;
  const height = 76;
  const fold = 14;
  const r = 6;
  const d = `M${x + r} ${y}H${x + width - fold}L${x + width} ${y + fold}V${y + height - r}A${r} ${r} 0 0 1 ${x + width - r} ${y + height}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + height - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  return (
    <g transform={`rotate(${angle} ${x + width / 2} ${y + height / 2})`}>
      <Lit d={d} shade={shade} />
      <path
        className="sp-illustration-fold"
        d={`M${x + width - fold} ${y}V${y + fold}H${x + width}Z`}
      />
      {[28, 40, 52].map((offset, index) => (
        <path
          className="sp-illustration-fold"
          d={roundedRect(x + 12, y + offset, index === 2 ? 22 : 34, 4, 2)}
          key={offset}
        />
      ))}
    </g>
  );
}

function Documents({ shade }: { shade: string }) {
  return (
    <>
      <Sheet angle={-8} shade={shade} x={34} y={46} />
      <Sheet angle={8} shade={shade} x={128} y={46} />
      <Sheet shade={shade} x={81} y={24} />
    </>
  );
}

const drawings = {
  box: Box,
  "credit-card": CreditCard,
  cloud: Cloud,
  documents: Documents,
} as const satisfies Record<
  IllustrationType,
  (props: { shade: string }) => React.ReactElement
>;

/**
 * A drawing for an empty state: a cloud, a box, a credit card or a few
 * documents on a soft disc with a few specks, an optional glyph floating over
 * it in a frosted disc. It is drawn in the kit's surface
 * and edge tokens, so it follows the theme, and it is decoration: it is hidden
 * from assistive technology unless it carries an `aria-label`, which makes it
 * an image. Put it in an EmptyMedia with `variant="illustration"` to give an
 * empty state its picture.
 */
export function Illustration({
  children,
  className,
  size = "lg",
  type,
  ...props
}: IllustrationProps): React.ReactElement {
  const id = React.useId();
  const shade = `${id}-shade`;
  const shadow = `${id}-shadow`;
  const Drawing = drawings[type];
  const labelled = props["aria-label"] !== undefined;
  return (
    <div
      aria-hidden={labelled ? undefined : true}
      className={cn(slotClass("illustration", props), className)}
      data-size={size}
      data-slot="illustration"
      data-type={type}
      role={labelled ? "img" : undefined}
      {...props}
    >
      <svg
        className="sp-illustration-svg"
        data-slot="illustration-svg"
        fill="none"
        focusable="false"
        viewBox="0 0 220 160"
      >
        <defs>
          <linearGradient id={shade} x1="0.1" x2="1" y1="0" y2="1">
            <stop className="sp-illustration-shade-start" offset="0" />
            <stop className="sp-illustration-shade-end" offset="0.4" />
          </linearGradient>
          <filter height="150%" id={shadow} width="130%" x="-15%" y="-15%">
            <feDropShadow
              className="sp-illustration-contact"
              dx="0"
              dy="2"
              stdDeviation="1.5"
            />
            <feDropShadow
              className="sp-illustration-ambient"
              dx="0"
              dy="14"
              stdDeviation="10"
            />
          </filter>
        </defs>
        <circle className="sp-illustration-disc" cx="110" cy="80" r="80" />
        {specks.map(([cx, cy, r]) => (
          <circle
            className="sp-illustration-disc"
            cx={cx}
            cy={cy}
            key={`${cx}-${cy}`}
            r={r}
          />
        ))}
        <g className="sp-illustration-object" filter={`url(#${shadow})`}>
          <Drawing shade={shade} />
        </g>
      </svg>
      {children ? (
        <span className="sp-illustration-badge" data-slot="illustration-badge">
          {children}
        </span>
      ) : null}
    </div>
  );
}
