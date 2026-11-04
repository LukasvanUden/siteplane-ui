"use client";

import { type DateValue } from "@internationalized/date";
import * as React from "react";
import {
  DateField as DateFieldPrimitive,
  DateInput as DateInputPrimitive,
  DateSegment as DateSegmentPrimitive,
  useLocale,
} from "react-aria-components";

import { normalizeFormattedText } from "../../system/locale/formatted-text";
import { type SiteplaneControlSize } from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { InputGroup } from "../input-group";

// The date field's own rules. Its control, segment row and segments look as in
// every date and time field (input-group.css).
import "./date-field.css";

/*
 * Kit-internal parts of the date field, not public API: the date-field index
 * does not export this module, and its names may change in any release.
 */

type DateSegmentValue = React.ComponentProps<
  typeof DateSegmentPrimitive
>["segment"];

/**
 * One segment of a date field: a day, a month, a year or a literal between
 * them, or, with a time, a time segment of the Time Field's look. A separator
 * cancels the padding of the segments beside it.
 */
export function DateFieldSegment({
  segment,
  timePart,
}: {
  segment: DateSegmentValue;
  /** The time segment or separator this segment is, with a time. */
  timePart?: "segment" | "separator" | undefined;
}): React.ReactElement {
  return (
    <DateSegmentPrimitive
      className={cn(
        "sp-date-field-segment",
        timePart ? "sp-time-segment" : "sp-date-segment",
      )}
      data-literal-kind={
        timePart === "separator" ||
        (!timePart && segment.type === "literal" && /[./-]/.test(segment.text))
          ? "separator"
          : undefined
      }
      data-slot="date-field-segment"
      segment={segment}
    >
      {/* React Aria builds the segments with formatToParts, whose spaces
          differ between the server's ICU and the browser's (Node writes a
          narrow no-break space before the "г." of a bg-BG date, Chrome a
          plain one); the segment shows the text both agree on, or the
          prerendered field fails hydration (React error #418). */}
      {({ text }) => normalizeFormattedText(text)}
    </DateSegmentPrimitive>
  );
}

export type DateInputGroupProps = {
  "aria-label": string;
  className?: string | undefined;
  isDateUnavailable?: ((date: DateValue) => boolean) | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  maxValue?: DateValue | null | undefined;
  minValue?: DateValue | null | undefined;
  /** Reports a complete date the user typed. */
  onChange: (value: DateValue | null) => void;
  /** The date typed segments start from, today by default. */
  placeholderValue?: DateValue | undefined;
  size?: SiteplaneControlSize | undefined;
  value: DateValue | null;
  /**
   * `full` fills its container, `fit` is as wide as its segments, as a Date
   * Field's `width` is. Default: `full`.
   */
  width?: "fit" | "full" | undefined;
};

/**
 * A date typed into segments, a Date Field's parts without a Field of its
 * own: the date input beside the days of a Calendar (`showDateInput`) and in
 * the footers of the date pickers' panels. It reports to nothing around it,
 * neither to a Field nor to a Form nor to the date picker it stands in, so a
 * picker inside a Field keeps one control; its host keeps the date. A day that
 * cannot be chosen marks the field invalid while it is typed.
 */
export function DateInputGroup({
  "aria-label": ariaLabel,
  className,
  isDateUnavailable,
  isDisabled,
  isReadOnly,
  maxValue,
  minValue,
  onChange,
  placeholderValue,
  size,
  value,
  width = "full",
}: DateInputGroupProps): React.ReactElement {
  const { direction } = useLocale();
  // A typed day the host does not take, such as one it does not allow,
  // stays in the field, which shows it invalid, until the host's day
  // changes.
  const [typed, setTyped] = React.useState<DateValue | null>(null);
  const [hostValue, setHostValue] = React.useState(value);
  if (
    value !== hostValue &&
    !(value && hostValue && value.compare(hostValue) === 0)
  ) {
    setHostValue(value);
    setTyped(null);
  }

  // `slot={null}` keeps the date picker around the field out of it: React
  // Aria would otherwise hand the picker's own date field to this one.
  // React Aria's optional props reject `undefined` under
  // exactOptionalPropertyTypes, so unset values are omitted.
  return (
    <DateFieldPrimitive<DateValue>
      aria-label={ariaLabel}
      className="sp-date-field sp-base-date-field contents"
      data-foundation="date-field"
      data-profile="default"
      data-slot="date-field"
      granularity="day"
      {...(isDateUnavailable === undefined ? {} : { isDateUnavailable })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      {...(isReadOnly === undefined ? {} : { isReadOnly })}
      {...(maxValue === undefined ? {} : { maxValue })}
      {...(minValue === undefined ? {} : { minValue })}
      {...(placeholderValue === undefined ? {} : { placeholderValue })}
      onChange={(next) => {
        setTyped(next);
        onChange(next);
      }}
      shouldForceLeadingZeros
      slot={null}
      // The field shows a day it cannot take as it is typed.
      validationBehavior="aria"
      value={typed ?? value}
    >
      <InputGroup
        aria-label={undefined}
        // As in a Date Field, width="fit" is as wide as the segments and
        // never narrower than them in a flex row.
        className={cn(
          "sp-date-field-control",
          width === "fit" && "w-max shrink-0",
          className,
        )}
        // The parts of a date field: its control, segment row and segments.
        data-slot="date-field-control"
        size={size}
      >
        {/* The segments read in the locale's direction, which React Aria's
            arrow keys follow, whatever the page's. */}
        <DateInputPrimitive
          className="sp-date-field-input"
          data-slot="date-field-input"
          dir={direction}
        >
          {(segment) => <DateFieldSegment segment={segment} />}
        </DateInputPrimitive>
      </InputGroup>
    </DateFieldPrimitive>
  );
}
