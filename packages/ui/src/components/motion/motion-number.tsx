"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import * as React from "react";

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { cn } from "../../system/utils/cn";
import {
  defaultNumberLocales,
  digitGlyphs,
  localeKey,
  mod,
  numberCells,
  numberTokens,
  numberTrend,
  stringTokens,
  tokensValue,
  wheelRange,
  wheelTarget,
  type NumberCell,
} from "./motion-number-cells";
import {
  glyphPresence,
  measureTiming,
  useClipWhileAnimating,
  useLeavingEntries,
} from "./motion-presence";

export interface MotionNumberProps extends Omit<
  useRender.ComponentProps<"span">,
  "children"
> {
  /**
   * The value to show. A number is formatted with `locales` and `format`; a
   * string is shown as it is, and its digits roll like the digits of a number.
   */
  value: number | string;
  /**
   * The locale a number is formatted in, as `Intl.NumberFormat` takes it.
   * `en-US` by default, so that the server and the client always agree.
   */
  locales?: Intl.LocalesArgument;
  /** `Intl.NumberFormat` options for a number: currency, percent, compact notation, signs, units. */
  format?: Intl.NumberFormatOptions;
}

type NumberModel = {
  cells: NumberCell[];
  glyphs: readonly string[];
  /** What the value is, to tell which way it moved. */
  scalar: number;
  /** The text as a whole: what assistive technology reads. */
  text: string;
};

function useNumberModel(
  value: number | string,
  locales: Intl.LocalesArgument,
  format: Intl.NumberFormatOptions | undefined,
): NumberModel {
  // The content of the locales and the format is their identity: a new object
  // with the same content is the same number, so the memo keys on the content.
  const localesId = localeKey(locales);
  const formatId = format ? JSON.stringify(format) : "";
  return React.useMemo(() => {
    const tokens =
      typeof value === "number"
        ? numberTokens(value, locales, format)
        : stringTokens(value, locales);
    return {
      cells: numberCells(tokens),
      glyphs: digitGlyphs(locales),
      scalar: typeof value === "number" ? value : tokensValue(tokens),
      text: tokens.map((token) => token.text).join(""),
    };
  }, [value, localesId, formatId]);
}

// A digit rolls through a window one line tall. Its glyphs fade at the edges
// while it rolls, and only then: at rest the digit is plain text.
const wheelWindowClassName =
  "absolute inset-0 overflow-y-clip [mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)]";

type Roll = {
  base: number;
  count: number;
  from: number;
  to: number;
  /**
   * The width of the place when the roll starts and when it ends: the digits of
   * a font without tabular figures differ in width.
   */
  widthFrom: number;
  widthTo: number;
};

/**
 * One digit place: the digit as plain text at rest, and while it rolls an
 * endless wheel of the ten digits. The wheel's position is a number that never
 * wraps (9 is followed by 10, which reads 0), so it rolls on in the direction of
 * the trend, and a change that arrives while it still rolls goes on from where
 * the wheel is instead of from the digit it was heading for. The width of the
 * place follows the roll from the old digit's width to the new one's, so a font
 * whose digits differ in width does not make the number jump.
 */
function Wheel({
  digit,
  glyphs,
  reduced,
  trend,
}: {
  digit: number;
  glyphs: readonly string[];
  reduced: boolean;
  trend: 1 | -1;
}): React.ReactElement {
  const position = useMotionValue(digit);
  const [roll, setRoll] = React.useState<Roll | null>(null);
  const sizer = React.useRef<HTMLSpanElement>(null);
  const windowRef = React.useRef<HTMLSpanElement>(null);
  const settled = React.useRef(digit);
  const restWidth = React.useRef(0);
  const running = React.useRef<AnimationPlaybackControls | null>(null);

  // The rows move up as the position rises: row `base` is at the top at 0%.
  const base = roll?.base ?? 0;
  const count = roll?.count ?? 1;
  const y = useTransform(
    position,
    (value) => `${(-(value - base) / count) * 100}%`,
  );
  const width = useTransform(position, (value) =>
    roll
      ? roll.widthFrom +
        ((roll.widthTo - roll.widthFrom) * (value - roll.from)) /
          (roll.to - roll.from)
      : 0,
  );

  // A new digit: roll to it from wherever the wheel is, or show it at once.
  React.useLayoutEffect(() => {
    if (settled.current === digit) return;
    settled.current = digit;
    running.current?.stop();
    // At rest the wheel stands at any whole place that reads as its digit; the
    // places stay small. While it still rolls it goes on from where it is.
    if (!roll) position.jump(mod(position.get(), 10));
    const from = position.get();
    const to = wheelTarget(from, digit, trend);
    if (reduced || to === from) {
      position.jump(digit);
      setRoll(null);
    } else {
      setRoll({
        ...wheelRange(from, to),
        from,
        to,
        widthFrom: roll ? width.get() : restWidth.current,
        widthTo: sizer.current?.getBoundingClientRect().width ?? 0,
      });
    }
  }, [digit, position, reduced, trend]);

  // At rest: how wide the digit is, which is where the next roll starts.
  React.useLayoutEffect(() => {
    if (!roll)
      restWidth.current = sizer.current?.getBoundingClientRect().width ?? 0;
  });

  // The roll: the position follows its target over the value duration.
  React.useLayoutEffect(() => {
    if (!roll) return;
    const target = roll.to;
    running.current = animate(position, target, {
      ...measureTiming(
        windowRef.current,
        "--motion-duration-value",
        "--motion-ease-standard",
      ),
      // The wheel stays where it stopped until the plain digit takes over: the
      // last row shown is the digit.
      onComplete: () => {
        running.current = null;
        setRoll(null);
      },
    });
    return () => running.current?.stop();
  }, [position, roll]);

  return (
    <motion.span
      className="relative inline-block"
      {...(roll ? { style: { width } } : {})}
    >
      {/* The digit gives the place its baseline while it rolls. */}
      <span className={roll ? "invisible" : undefined} ref={sizer}>
        {glyphs[digit]}
      </span>
      {roll ? (
        <span
          aria-hidden="true"
          className={wheelWindowClassName}
          data-slot="motion-number-wheel"
          ref={windowRef}
        >
          <motion.span className="block text-center" style={{ y }}>
            {Array.from({ length: roll.count }, (_, row) => (
              <span className="block" key={roll.base + row}>
                {glyphs[mod(roll.base + row, 10)]}
              </span>
            ))}
          </motion.span>
        </span>
      ) : null}
    </motion.span>
  );
}

/**
 * One character of the number. A place that appears opens its width and fades
 * in, a place that goes closes and fades out, so the characters beside it glide.
 * A digit that changes rolls; a character that changes is a new place.
 */
function Glyph({
  appear,
  cell,
  glyphs,
  leaving,
  onGone,
  reduced,
  trend,
}: {
  appear: boolean;
  cell: NumberCell;
  glyphs: readonly string[];
  leaving: boolean;
  onGone: (key: React.Key) => void;
  reduced: boolean;
  trend: 1 | -1;
}): React.ReactElement {
  const clip = useClipWhileAnimating<HTMLSpanElement>("width");
  // The places of the first render are at rest; later ones animate in.
  const entering = React.useRef(appear).current;
  const presence = glyphPresence({
    appear: entering,
    leaving,
    reduced,
    resolve: () =>
      measureTiming(
        clip.ref.current,
        "--motion-duration-value",
        "--motion-ease-standard",
      ),
  });

  return (
    <motion.span
      {...presence}
      className="relative inline-block whitespace-pre"
      data-slot={
        cell.kind === "digit" ? "motion-number-digit" : "motion-number-char"
      }
      onAnimationComplete={(definition) => {
        if (leaving && definition === "collapsed") onGone(cell.key);
      }}
      ref={clip.ref}
    >
      {cell.kind === "digit" ? (
        <Wheel
          digit={cell.value}
          glyphs={glyphs}
          reduced={reduced}
          trend={trend}
        />
      ) : (
        cell.text
      )}
    </motion.span>
  );
}

/**
 * A number that rolls to its new value, for figures that change in place:
 * totals, rates, counts. Each digit slides like an odometer wheel to the new
 * digit, upward when the number rises and downward when it falls; characters
 * that come and go (a sign, a separator, a new leading digit) open and close
 * their width; tabular figures keep everything from jittering. The first
 * render and the server show the final text, and reduced motion is instant.
 * Assistive technology reads the final value once, with no live announcement.
 */
export function MotionNumber({
  className,
  format,
  locales = defaultNumberLocales,
  render,
  value,
  ...props
}: MotionNumberProps): React.ReactElement {
  const reduced = useReducedMotionPreference();
  const model = useNumberModel(value, locales, format);
  // Places that mount after the first render animate in.
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
  }, []);

  // Which way the number moved, from the value of the last commit.
  const before = React.useRef(model.scalar);
  const trend = numberTrend(before.current, model.scalar);
  React.useLayoutEffect(() => {
    before.current = model.scalar;
  });

  const { entries, remove } = useLeavingEntries(model.cells, !reduced);

  const defaultProps = {
    children: (
      <>
        <span className="sr-only">{model.text}</span>
        <span aria-hidden="true" data-slot="motion-number-glyphs">
          {entries.map((entry) => (
            <Glyph
              appear={mounted.current}
              cell={entry.element}
              glyphs={model.glyphs}
              key={entry.key}
              leaving={entry.leaving}
              onGone={remove}
              reduced={reduced}
              trend={trend}
            />
          ))}
        </span>
      </>
    ),
    className: cn(
      "relative inline-block whitespace-nowrap tabular-nums",
      className,
    ),
    "data-slot": "motion-number",
    // The places of a number are boxes of their own, which a right-to-left
    // parent would put in reverse order. A number reads from left to right in
    // every writing direction, and the number as a whole sits where the layout
    // puts it. (`dir` isolates it from the text around it, too.)
    dir: "ltr",
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}
