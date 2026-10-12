"use client";

import {
  CalendarDate,
  endOfMonth,
  GregorianCalendar,
  isSameMonth,
  isSameYear,
  startOfMonth,
  toCalendar,
  toCalendarDate,
} from "@internationalized/date";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import {
  Button as CalendarButtonPrimitive,
  Calendar as CalendarPrimitive,
  CalendarCell as CalendarCellPrimitive,
  CalendarGrid as CalendarGridPrimitive,
  CalendarGridBody as CalendarGridBodyPrimitive,
  CalendarGridHeader as CalendarGridHeaderPrimitive,
  CalendarHeaderCell as CalendarHeaderCellPrimitive,
  CalendarMonthPicker as CalendarMonthPickerPrimitive,
  type CalendarState,
  CalendarStateContext,
  type CalendarProps as CalendarPrimitiveProps,
  CalendarYearPicker as CalendarYearPickerPrimitive,
  type DateValue,
  RangeCalendar as RangeCalendarPrimitive,
  type RangeCalendarState,
  RangeCalendarStateContext,
  type RangeValue,
  useLocale,
} from "react-aria-components";

import { nativeDayTime, toNativeDay } from "../../system/date/native-day";
import { isInvalidAriaValue } from "../../system/form/aria-invalid";
import { SiteplaneLocaleProvider } from "../../system/locale/siteplane-locale-provider";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { Button } from "../button";
import { Popover, PopoverPopup, PopoverTrigger } from "../popover";

import "./calendar.css";

export type CalendarSelectionMode = "multiple" | "range" | "single";
type PointCalendarSelectionMode = Exclude<CalendarSelectionMode, "range">;

/**
 * A range of days, from its first day to its last. An end is unset while the
 * range is incomplete.
 */
export type DateRange = {
  from?: Date | undefined;
  to?: Date | undefined;
};

/**
 * Days that can't be chosen: one date, a test, or a rule. A rule matches the
 * days after `after`, the days before `before`, the days from `from` to `to`
 * (both included), and the weekdays in `dayOfWeek` (0 Sunday to 6 Saturday).
 */
export type CalendarDayMatcher =
  | Date
  | ((date: Date) => boolean)
  | {
      after?: Date | undefined;
      before?: Date | undefined;
      dayOfWeek?: readonly number[] | undefined;
      from?: Date | undefined;
      to?: Date | undefined;
    };

/**
 * The calendar options of Calendar and of every date picker's
 * `calendarProps`. Dates are native `Date` values; only their day counts.
 */
export type CalendarOptions = {
  /**
   * The month the calendar shows first. While it is set, it wins over the
   * month of the selected date.
   */
  defaultMonth?: Date | undefined;
  /**
   * `true` disables the whole calendar. A matcher, or a list of matchers,
   * makes the days it matches unavailable; they can't be chosen.
   */
  disabled?:
    boolean | CalendarDayMatcher | readonly CalendarDayMatcher[] | undefined;
  /** The last month the calendar allows. */
  endMonth?: Date | undefined;
  /** The first month the calendar allows. */
  startMonth?: Date | undefined;
};

/**
 * A quick choice of a range calendar: a label, and the range it selects.
 */
export type CalendarRangeShortcut = {
  label: string;
  value: { from: Date; to: Date };
};

type CalendarBaseProps = CalendarOptions & {
  "aria-describedby"?: string | undefined;
  /** Marks the selected days as invalid. */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  className?: string | undefined;
  /** Formats this calendar in another locale than the surrounding one. */
  locale?: string | undefined;
  /**
   * The month the calendar shows, as any day in it. Set it from
   * `onMonthChange` to control the month, for example for a Today button.
   */
  month?: Date | undefined;
  /**
   * Reports the first day of the month that takes focus, when the user moves
   * to another month.
   */
  onMonthChange?: ((month: Date) => void) | undefined;
  /** Keeps the selection as it is; the user can still move through months. */
  readOnly?: boolean | undefined;
  size?: SiteplaneControlSize | undefined;
};

export type CalendarSingleProps = CalendarBaseProps & {
  selectionMode?: "single" | undefined;
  /** The selected day; `null` is no selection. */
  value?: Date | null | undefined;
  defaultValue?: Date | null | undefined;
  onValueChange?: ((value: Date) => void) | undefined;
};

export type CalendarMultipleProps = CalendarBaseProps & {
  selectionMode: "multiple";
  /** The selected days. */
  value?: readonly Date[] | undefined;
  defaultValue?: readonly Date[] | undefined;
  onValueChange?: ((value: Date[]) => void) | undefined;
};

export type CalendarRangeProps = CalendarBaseProps & {
  selectionMode: "range";
  /** The selected range; a range without both ends selects nothing. */
  value?: DateRange | null | undefined;
  defaultValue?: DateRange | null | undefined;
  onValueChange?: ((value: { from: Date; to: Date }) => void) | undefined;
  /**
   * Shows consecutive months side by side, with one selection and one
   * Previous and Next pair.
   */
  numberOfMonths?: number | undefined;
  /**
   * Quick choices such as "Last week", as links in the accent colour between
   * the heading and the days. A choice selects its range and shows the month it
   * starts in. One that starts or ends on a date the calendar does not allow
   * (outside `startMonth` and `endMonth`, or unavailable) is disabled. A
   * calendar with several months shows them once, above the months.
   */
  shortcuts?: readonly CalendarRangeShortcut[] | undefined;
};

export type CalendarProps =
  CalendarMultipleProps | CalendarRangeProps | CalendarSingleProps;

/** The React Aria day of a native date; only its day counts. */
export function fromNativeDate(date: Date): CalendarDate {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

/**
 * The native date, at local midnight, of a React Aria day in any calendar
 * system. A day that the locale shows in another calendar system, such as the
 * focused day of a Thai calendar, reads its year in the Gregorian calendar.
 */
export function toNativeDate(value: DateValue): Date {
  return toNativeDay(
    toCalendar(toCalendarDate(value), new GregorianCalendar()),
  );
}

function matchesDay(date: Date, matcher: CalendarDayMatcher): boolean {
  if (matcher instanceof Date) {
    return nativeDayTime(matcher) === nativeDayTime(date);
  }
  if (typeof matcher === "function") return matcher(date);

  const time = nativeDayTime(date);
  const dayTime = (day: Date | undefined) =>
    day === undefined ? undefined : nativeDayTime(day);
  const after = dayTime(matcher.after);
  const before = dayTime(matcher.before);
  const from = dayTime(matcher.from);
  const to = dayTime(matcher.to);

  return (
    (after !== undefined && time > after) ||
    (before !== undefined && time < before) ||
    (from !== undefined && to !== undefined && time >= from && time <= to) ||
    (matcher.dayOfWeek?.includes(date.getDay()) ?? false)
  );
}

/**
 * Whether `disabled` of the calendar options rules out `date`: every day of a
 * disabled calendar, and the days a matcher matches. Pickers check typed
 * dates with it, so typing and picking follow one rule.
 */
export function isCalendarDayDisabled(
  date: Date,
  disabled: CalendarOptions["disabled"],
): boolean {
  if (disabled === undefined || disabled === false) return false;
  if (disabled === true) return true;
  const matchers: readonly CalendarDayMatcher[] = Array.isArray(disabled)
    ? disabled
    : [disabled as CalendarDayMatcher];

  return matchers.some((matcher) => matchesDay(date, matcher));
}

/**
 * The first allowed day of `startMonth` and the last of `endMonth`, as React
 * Aria bounds. Unset options are left out.
 */
export function calendarMonthBounds({
  endMonth,
  startMonth,
}: Pick<CalendarOptions, "endMonth" | "startMonth">): {
  maxValue?: CalendarDate;
  minValue?: CalendarDate;
} {
  return {
    ...(endMonth === undefined
      ? {}
      : { maxValue: endOfMonth(fromNativeDate(endMonth)) }),
    ...(startMonth === undefined
      ? {}
      : { minValue: startOfMonth(fromNativeDate(startMonth)) }),
  };
}

/**
 * The React Aria props of the options and states every selection mode shares.
 * Unset options are left out, so a date picker's own calendar settings, which
 * reach the calendar through React Aria's context, still apply.
 */
function useSharedCalendarProps({
  "aria-invalid": ariaInvalid,
  defaultMonth,
  disabled,
  endMonth,
  month,
  onMonthChange,
  readOnly,
  startMonth,
}: CalendarBaseProps) {
  // The day with keyboard focus, as the Calendar content last rendered it.
  const focusedDateRef = useRef<CalendarDate | null>(null);
  const controlledMonth =
    month === undefined ? undefined : fromNativeDate(month);
  // While `month` is controlled, the focused day stays the Calendar's own
  // inside that month, so the arrow keys move through its days; a `month` in
  // another month moves the focus there.
  const [focused, setFocused] = useState<CalendarDate | undefined>(
    controlledMonth,
  );
  const focusedValue =
    controlledMonth === undefined
      ? undefined
      : focused !== undefined && isSameMonth(focused, controlledMonth)
        ? focused
        : controlledMonth;
  const onFocusChange = (date: CalendarDate) => {
    if (controlledMonth !== undefined) setFocused(date);

    const previous = focusedDateRef.current;

    if (previous && !isSameMonth(date, previous)) {
      onMonthChange?.(toNativeDate(startOfMonth(date)));
    }
  };
  const dayMatcher =
    typeof disabled === "boolean" || disabled === undefined
      ? undefined
      : disabled;

  return {
    focusedDateRef,
    props: {
      ...(disabled === true ? { isDisabled: true } : {}),
      ...(dayMatcher === undefined
        ? {}
        : {
            isDateUnavailable: (date: DateValue) =>
              isCalendarDayDisabled(toNativeDate(date), dayMatcher),
          }),
      ...(readOnly === undefined ? {} : { isReadOnly: readOnly }),
      ...(ariaInvalid === undefined
        ? {}
        : { isInvalid: isInvalidAriaValue(ariaInvalid) }),
      ...calendarMonthBounds({ endMonth, startMonth }),
      ...(focusedValue === undefined ? {} : { focusedValue }),
      ...(defaultMonth === undefined || controlledMonth !== undefined
        ? {}
        : { defaultFocusedValue: fromNativeDate(defaultMonth) }),
      ...(controlledMonth === undefined && onMonthChange === undefined
        ? {}
        : { onFocusChange }),
    },
  };
}

export function Calendar(props: CalendarRangeProps): React.ReactElement;
export function Calendar(props: CalendarMultipleProps): React.ReactElement;
export function Calendar(props: CalendarSingleProps): React.ReactElement;
export function Calendar({
  locale,
  ...props
}: CalendarProps): React.ReactElement {
  const calendar =
    props.selectionMode === "range" ? (
      <CalendarRangeRoot {...props} />
    ) : (
      <CalendarRoot {...props} />
    );

  return locale ? (
    <SiteplaneLocaleProvider locale={locale}>
      {calendar}
    </SiteplaneLocaleProvider>
  ) : (
    calendar
  );
}

// The props the Calendar maps to React Aria itself; the rest (the accessible
// names and descriptions and data attributes) reach the React Aria root as
// they are.
const calendarOwnProps = new Set<string>([
  "aria-invalid",
  "className",
  "defaultMonth",
  "defaultValue",
  "disabled",
  "endMonth",
  "locale",
  "month",
  "numberOfMonths",
  "onMonthChange",
  "onValueChange",
  "readOnly",
  "selectionMode",
  "shortcuts",
  "size",
  "startMonth",
  "value",
]);

function passThroughProps(
  props: CalendarProps,
): Partial<
  Record<"aria-describedby" | "aria-label" | "aria-labelledby", string>
> {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !calendarOwnProps.has(key)),
  );
}

type PointCalendarPrimitiveProps = Omit<
  CalendarPrimitiveProps<CalendarDate, PointCalendarSelectionMode>,
  "children"
>;

// The selection of a single or multiple calendar in React Aria's days.
function pointSelectionProps(
  props: CalendarMultipleProps | CalendarSingleProps,
): PointCalendarPrimitiveProps {
  if (props.selectionMode === "multiple") {
    const { defaultValue, onValueChange, value } = props;

    return {
      ...(value === undefined ? {} : { value: value.map(fromNativeDate) }),
      ...(defaultValue === undefined
        ? {}
        : { defaultValue: defaultValue.map(fromNativeDate) }),
      ...(onValueChange === undefined
        ? {}
        : {
            onChange: (next: readonly DateValue[]) =>
              onValueChange(next.map(toNativeDate)),
          }),
    } as PointCalendarPrimitiveProps;
  }

  const { defaultValue, onValueChange, value } = props;

  return {
    ...(value === undefined
      ? {}
      : { value: value ? fromNativeDate(value) : null }),
    ...(defaultValue === undefined
      ? {}
      : { defaultValue: defaultValue ? fromNativeDate(defaultValue) : null }),
    ...(onValueChange === undefined
      ? {}
      : {
          onChange: (next: DateValue | null) => {
            if (next) onValueChange(toNativeDate(next));
          },
        }),
  } as PointCalendarPrimitiveProps;
}

function CalendarRoot(props: CalendarMultipleProps | CalendarSingleProps) {
  const resolvedSize = useResolvedControlSize(props.size);
  const shared = useSharedCalendarProps(props);

  return (
    <CalendarPrimitive<CalendarDate, PointCalendarSelectionMode>
      {...passThroughProps(props)}
      {...shared.props}
      {...pointSelectionProps(props)}
      className={cn("siteplane-calendar", props.className)}
      data-foundation="calendar"
      data-size={resolvedSize}
      data-slot="calendar"
      selectionMode={props.selectionMode ?? "single"}
    >
      {({ isDisabled, state }) => (
        <CalendarContent
          focusedDateRef={shared.focusedDateRef}
          isDisabled={isDisabled}
          size={resolvedSize}
          state={state}
        />
      )}
    </CalendarPrimitive>
  );
}

function toRangeValue(
  range: DateRange | null | undefined,
): RangeValue<CalendarDate> | null {
  return range?.from && range.to
    ? { end: fromNativeDate(range.to), start: fromNativeDate(range.from) }
    : null;
}

function CalendarRangeRoot(props: CalendarRangeProps) {
  const { defaultValue, numberOfMonths, onValueChange, shortcuts, value } =
    props;
  const resolvedSize = useResolvedControlSize(props.size);
  const shared = useSharedCalendarProps(props);
  // `numberOfMonths={2}` shows consecutive months side by side in one range
  // calendar: one shared selection, one Previous and Next pair, and a heading
  // with its own month and year picker above each month.
  const visibleMonths = Math.max(1, Math.trunc(numberOfMonths ?? 1) || 1);

  return (
    <RangeCalendarPrimitive<CalendarDate>
      {...passThroughProps(props)}
      {...shared.props}
      {...(value === undefined ? {} : { value: toRangeValue(value) })}
      {...(defaultValue === undefined
        ? {}
        : { defaultValue: toRangeValue(defaultValue) })}
      {...(onValueChange === undefined
        ? {}
        : {
            onChange: (next: RangeValue<DateValue>) =>
              onValueChange({
                from: toNativeDate(next.start),
                to: toNativeDate(next.end),
              }),
          })}
      {...(visibleMonths > 1
        ? {
            pageBehavior: "single" as const,
            visibleDuration: { months: visibleMonths },
          }
        : {})}
      className={cn("siteplane-calendar", props.className)}
      data-foundation="calendar"
      data-selection-mode="range"
      data-size={resolvedSize}
      data-slot="calendar"
      data-visible-months={visibleMonths > 1 ? visibleMonths : undefined}
    >
      {({ isDisabled, state }) => (
        <CalendarContent
          focusedDateRef={shared.focusedDateRef}
          isDisabled={isDisabled}
          shortcuts={shortcuts}
          size={resolvedSize}
          state={state}
          visibleMonths={visibleMonths}
        />
      )}
    </RangeCalendarPrimitive>
  );
}

type PickerView = "month" | "year";
type CalendarNavigationDirection = "next" | "previous";
type CalendarNavigationMotion = {
  direction: CalendarNavigationDirection;
  key: number;
  previousStart: CalendarState<PointCalendarSelectionMode>["visibleRange"]["start"];
};
type CalendarPickerMotionDirection =
  CalendarNavigationDirection | "drill-in" | "drill-out";
type CalendarPickerItem = {
  date: CalendarState<PointCalendarSelectionMode>["focusedDate"];
  formatted: string;
  id: number;
  isSelected: boolean;
};
type CalendarPickerPage = {
  ariaLabel: string | undefined;
  heading: React.ReactNode;
  items: CalendarPickerItem[];
  view: PickerView;
};
type CalendarPickerPageMotion = {
  direction: CalendarPickerMotionDirection;
  previousPage: CalendarPickerPage;
};
type CalendarPickerHeadingMotion = {
  direction: CalendarNavigationDirection;
  previousHeading: React.ReactNode;
};

function isRangeCalendarState<M extends PointCalendarSelectionMode>(
  state: CalendarState<M> | RangeCalendarState,
): state is RangeCalendarState {
  return "setAnchorDate" in state;
}

function CalendarContent<M extends PointCalendarSelectionMode>({
  focusedDateRef,
  isDisabled,
  shortcuts,
  size,
  state,
  visibleMonths = 1,
}: {
  focusedDateRef: React.RefObject<CalendarDate | null>;
  isDisabled: boolean;
  shortcuts?: readonly CalendarRangeShortcut[] | undefined;
  size: SiteplaneControlSize;
  state: CalendarState<M> | RangeCalendarState;
  visibleMonths?: number;
}) {
  const { locale } = useLocale();

  // The Calendar tells a change of month by the day that had focus last.
  useLayoutEffect(() => {
    focusedDateRef.current = state.focusedDate;
  });

  const [navigationMotion, setNavigationMotion] =
    useCalendarNavigationMotion(state);
  const [pendingFocus, setPendingFocus] = useState<CalendarDate[]>([]);

  // Moving the visible range to a month that overlaps it takes two focus moves:
  // the first renders a realigned range, the second lands on the right month.
  useLayoutEffect(() => {
    const [next, ...rest] = pendingFocus;

    if (next === undefined) return;

    state.setFocusedDate(next);
    setPendingFocus(rest);
  }, [pendingFocus]);

  // Shows `month` at position `index` of the visible range, then focuses
  // `focus` when given.
  const showMonth = (
    index: number,
    month: CalendarDate,
    focus?: CalendarDate,
  ) => {
    const [first, ...rest] = planVisibleRangeShift(
      state.visibleRange,
      visibleMonths,
      month.subtract({ months: index }),
    );

    if (first === undefined) {
      if (focus) state.setFocusedDate(focus);

      return;
    }

    state.setFocusedDate(first);
    setPendingFocus(focus ? [...rest, focus] : rest);
  };

  // A shortcut selects its range and shows the month the range starts in, at
  // the first position, with the start date focused. It also ends a range the
  // user has begun, so the days no longer follow the pointer from its anchor.
  const selectShortcut = (range: CalendarRangeShortcut["value"]) => {
    if (!isRangeCalendarState(state)) return;

    const start = fromNativeDate(range.from);

    state.setAnchorDate(null);
    state.setValue({ end: fromNativeDate(range.to), start });
    showMonth(0, start, start);
  };

  const isDateAllowed = (date: CalendarDate) =>
    !state.isInvalid(date) && !state.isCellUnavailable(date);

  const shortcutRow = shortcuts?.length ? (
    <div aria-label="Shortcuts" data-slot="calendar-shortcuts" role="group">
      {shortcuts.map((shortcut) => (
        <Button
          disabled={
            isDisabled ||
            state.isReadOnly ||
            !isDateAllowed(fromNativeDate(shortcut.value.from)) ||
            !isDateAllowed(fromNativeDate(shortcut.value.to))
          }
          key={shortcut.label}
          onClick={() => selectShortcut(shortcut.value)}
          profile="inline"
          profileTone="accent"
          variant="link"
        >
          {shortcut.label}
        </Button>
      ))}
    </div>
  ) : null;

  const renderMonth = (index: number) => {
    // Each month of a multi-month calendar picks its own month and year. The
    // picker sees that month as its focused date, and what it selects moves the
    // visible range so that the month shows at this position.
    const pickerState =
      visibleMonths > 1
        ? {
            ...state,
            focusedDate: state.visibleRange.start.add({ months: index }),
            setFocusedDate: (date: CalendarDate) => showMonth(index, date),
          }
        : state;

    return (
      <>
        <div data-slot="calendar-header">
          {index === 0 ? (
            <Button
              data-slot="calendar-previous"
              render={<CalendarButtonPrimitive slot="previous" />}
              shape="square"
              variant="ghost"
            >
              <ChevronLeftIcon aria-hidden="true" />
            </Button>
          ) : null}
          <CalendarMonthHeading
            index={index}
            isDisabled={isDisabled}
            locale={locale}
            navigationMotion={navigationMotion}
            pickerState={pickerState}
            size={size}
            state={state}
          />
          {index === visibleMonths - 1 ? (
            <Button
              data-slot="calendar-next"
              render={<CalendarButtonPrimitive slot="next" />}
              shape="square"
              variant="ghost"
            >
              <ChevronRightIcon aria-hidden="true" />
            </Button>
          ) : null}
        </div>
        {visibleMonths < 2 ? shortcutRow : null}
        <div data-slot="calendar-grid-frame">
          {navigationMotion ? (
            <div
              aria-hidden="true"
              data-direction={navigationMotion.direction}
              data-motion-state="exit"
              data-slot="calendar-month-motion"
              inert
              key={`grid-exit-${navigationMotion.key}`}
              onAnimationEnd={(event) => {
                if (event.currentTarget !== event.target) {
                  return;
                }

                setNavigationMotion((current) =>
                  current?.key === navigationMotion.key ? null : current,
                );
              }}
            >
              <CalendarGrid
                offset={
                  index + (navigationMotion.direction === "next" ? -1 : 1)
                }
              />
            </div>
          ) : null}
          <div
            data-direction={navigationMotion?.direction}
            data-motion-state={navigationMotion ? "enter" : undefined}
            data-slot="calendar-month-motion"
            key={`grid-enter-${navigationMotion?.key ?? 0}`}
          >
            <CalendarGrid offset={index} />
          </div>
        </div>
      </>
    );
  };

  if (visibleMonths < 2) {
    return renderMonth(0);
  }

  // Consecutive months share one range selection and one Previous and Next
  // pair; each month has its own heading and month picker. The shortcuts have
  // no single heading to sit under, so they show once above the months.
  return (
    <>
      {shortcutRow}
      <div data-slot="calendar-months">
        {Array.from({ length: visibleMonths }, (_, index) => (
          <div data-slot="calendar-month" key={index}>
            {renderMonth(index)}
          </div>
        ))}
      </div>
    </>
  );
}

function useCalendarNavigationMotion<M extends PointCalendarSelectionMode>(
  state: CalendarState<M> | RangeCalendarState,
) {
  const [navigationMotion, setNavigationMotion] =
    useState<CalendarNavigationMotion | null>(null);
  const previousStartRef = useRef(state.visibleRange.start);
  const motionKeyRef = useRef(0);
  const currentStart = state.visibleRange.start;
  const currentMonthKey = `${currentStart.calendar.identifier}:${currentStart.era}:${currentStart.year}:${currentStart.month}`;

  useLayoutEffect(() => {
    const previousStart = previousStartRef.current;
    const isNext =
      currentStart.add({ months: -1 }).compare(previousStart) === 0;
    const isPrevious =
      currentStart.add({ months: 1 }).compare(previousStart) === 0;

    if (isNext || isPrevious) {
      motionKeyRef.current += 1;
      setNavigationMotion({
        direction: isNext ? "next" : "previous",
        key: motionKeyRef.current,
        previousStart,
      });
    } else {
      setNavigationMotion(null);
    }

    previousStartRef.current = currentStart;
  }, [currentMonthKey]);

  return [navigationMotion, setNavigationMotion] as const;
}

/**
 * The dates to focus, one after the other, so that `months` consecutive months
 * start at `target`. React Aria realigns the visible range only when the focused
 * date leaves it: a later date starts the new range, an earlier date ends it. A
 * target that overlaps the visible range needs a hop out of it first. No dates
 * mean the range already starts there.
 */
export function planVisibleRangeShift(
  visible: { end: CalendarDate; start: CalendarDate },
  months: number,
  target: CalendarDate,
): CalendarDate[] {
  const first = startOfMonth(target);

  if (first.compare(startOfMonth(visible.start)) === 0) return [];

  const last = first.add({ months: months - 1 });

  // Entirely after the visible range: its first day starts the new range.
  if (first.compare(visible.end) > 0) return [first];
  // Entirely before it: a day of its last month ends the new range.
  if (last.compare(visible.start) < 0) return [last];

  // Overlapping: hop beyond the new range, then back to its last month (a later
  // start) or to its first month (an earlier start).
  return first.compare(visible.start) > 0
    ? [first.add({ months }), last]
    : [first.subtract({ months: 1 }), first];
}

function CalendarMonthHeading<M extends PointCalendarSelectionMode>({
  index,
  isDisabled,
  locale,
  navigationMotion,
  pickerState,
  size,
  state,
}: {
  index: number;
  isDisabled: boolean;
  locale: string;
  navigationMotion: CalendarNavigationMotion | null;
  pickerState: CalendarState<M> | RangeCalendarState;
  size: SiteplaneControlSize;
  state: CalendarState<M> | RangeCalendarState;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerView, setPickerView] = useState<PickerView>("month");
  const pickerPortalContainerRef = useRef<HTMLElement | null>(null);
  const heading = formatHeading(
    state.visibleRange.start.add({ months: index }),
    state,
    locale,
  );

  return (
    <Popover
      onOpenChange={(open) => {
        setIsPickerOpen(open);
        if (open) setPickerView("month");
      }}
      open={isPickerOpen}
    >
      <h2 data-slot="calendar-heading">
        <PopoverTrigger
          data-slot="calendar-heading-trigger"
          ref={(trigger) => {
            pickerPortalContainerRef.current =
              trigger?.closest<HTMLElement>("[data-rac][data-trigger]") ?? null;
          }}
          render={
            <Button
              aria-label={`Choose month and year, ${heading}`}
              disabled={isDisabled}
              variant="ghost"
            />
          }
        >
          <span data-slot="calendar-heading-motion-frame">
            {navigationMotion ? (
              <span
                aria-hidden="true"
                data-direction={navigationMotion.direction}
                data-motion-state="exit"
                data-slot="calendar-heading-motion"
                key={`heading-exit-${navigationMotion.key}`}
              >
                {formatHeading(
                  navigationMotion.previousStart.add({ months: index }),
                  state,
                  locale,
                )}
              </span>
            ) : null}
            <span
              data-direction={navigationMotion?.direction}
              data-motion-state={navigationMotion ? "enter" : undefined}
              data-slot="calendar-heading-motion"
              key={`heading-enter-${navigationMotion?.key ?? 0}`}
            >
              {heading}
            </span>
          </span>
          <ChevronsUpDownIcon aria-hidden="true" />
        </PopoverTrigger>
      </h2>
      <PopoverPopup
        align="center"
        className="siteplane-calendar-picker-popup"
        data-calendar-size={size}
        portalProps={{ container: pickerPortalContainerRef }}
        viewportPadding="compact"
      >
        <CalendarPicker
          isDisabled={isDisabled}
          onClose={() => setIsPickerOpen(false)}
          onViewChange={setPickerView}
          state={pickerState}
          view={pickerView}
        />
      </PopoverPopup>
    </Popover>
  );
}

function CalendarGrid({ offset = 0 }: { offset?: number }) {
  return (
    <CalendarGridPrimitive
      data-slot="calendar-grid"
      {...(offset === 0 ? {} : { offset: { months: offset } })}
      weekdayStyle="short"
    >
      <CalendarGridHeaderPrimitive data-slot="calendar-grid-header">
        {(day) => (
          <CalendarHeaderCellPrimitive data-slot="calendar-header-cell">
            {day}
          </CalendarHeaderCellPrimitive>
        )}
      </CalendarGridHeaderPrimitive>
      <CalendarGridBodyPrimitive data-slot="calendar-grid-body">
        {(date) => (
          <CalendarCellPrimitive data-slot="calendar-cell" date={date} />
        )}
      </CalendarGridBodyPrimitive>
    </CalendarGridPrimitive>
  );
}

function CalendarPicker<M extends PointCalendarSelectionMode>({
  isDisabled,
  onClose,
  onViewChange,
  state,
  view,
}: {
  isDisabled: boolean;
  onClose: () => void;
  onViewChange: (view: PickerView) => void;
  state: CalendarState<M> | RangeCalendarState;
  view: Exclude<PickerView, null>;
}) {
  const [pageMotion, setPageMotion] = useState<CalendarPickerPageMotion | null>(
    null,
  );
  const [headingMotion, setHeadingMotion] =
    useState<CalendarPickerHeadingMotion | null>(null);
  const [pickerDate, setPickerDate] = useState(state.focusedDate);
  const currentPageRef = useRef<CalendarPickerPage | null>(null);
  const isMoving = pageMotion !== null || headingMotion !== null;
  const startPageMotion = (
    direction: CalendarPickerMotionDirection,
    action: () => void,
  ) => {
    if (isMoving || !currentPageRef.current) return;

    setPageMotion({ direction, previousPage: currentPageRef.current });
    action();
  };
  const changePage = (direction: -1 | 1) => {
    const motionDirection = direction === 1 ? "next" : "previous";

    if (view === "month") {
      if (isMoving || !currentPageRef.current) return;

      setHeadingMotion({
        direction: motionDirection,
        previousHeading: currentPageRef.current.heading,
      });
      setPickerDate((current) => current.add({ years: direction }));
      return;
    }

    startPageMotion(motionDirection, () => {
      setPickerDate((current) => current.add({ years: 12 * direction }));
    });
  };
  const changeView = (nextView: PickerView) =>
    startPageMotion(nextView === "year" ? "drill-in" : "drill-out", () => {
      onViewChange(nextView);
    });
  const renderCurrentPage = (
    page: CalendarPickerPage,
    onSelect: (item: CalendarPickerItem) => void,
  ) => {
    currentPageRef.current = page;

    return (
      <div
        data-direction={pageMotion?.direction}
        data-motion-state={pageMotion ? "enter" : undefined}
        data-slot="calendar-picker-page"
      >
        <CalendarPickerPageContent
          headingMotion={page.view === "month" ? headingMotion : null}
          isDisabled={isDisabled}
          onHeadingMotionEnd={() => setHeadingMotion(null)}
          onNext={() => changePage(1)}
          onPrevious={() => changePage(-1)}
          onSelect={onSelect}
          onToggle={() => changeView(page.view === "month" ? "year" : "month")}
          page={page}
        />
      </div>
    );
  };

  const picker = (
    <div
      aria-label="Choose month and year"
      data-motion-active={isMoving || undefined}
      data-slot="calendar-picker"
      data-view={view}
      role="group"
    >
      {pageMotion ? (
        <div
          aria-hidden="true"
          data-direction={pageMotion.direction}
          data-motion-state="exit"
          data-slot="calendar-picker-page"
          inert
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target) setPageMotion(null);
          }}
        >
          <CalendarPickerPageContent
            isDisabled={false}
            onHeadingMotionEnd={() => undefined}
            onNext={() => undefined}
            onPrevious={() => undefined}
            onSelect={() => undefined}
            onToggle={() => undefined}
            page={pageMotion.previousPage}
          />
        </div>
      ) : null}
      {view === "month" ? (
        <CalendarMonthPickerPrimitive format="short">
          {({ "aria-label": ariaLabel, items, onChange }) =>
            renderCurrentPage(
              {
                ariaLabel,
                heading: pickerDate.year,
                items: items.map((item) => ({
                  date: item.date,
                  formatted: item.formatted,
                  id: item.id,
                  isSelected: isSameMonth(item.date, state.focusedDate),
                })),
                view: "month",
              },
              (item) => {
                onChange(item.id);
                state.setFocusedDate(item.date);
                onClose();
              },
            )
          }
        </CalendarMonthPickerPrimitive>
      ) : (
        <CalendarYearPickerPrimitive visibleYears={12}>
          {({ "aria-label": ariaLabel, items, onChange }) =>
            renderCurrentPage(
              {
                ariaLabel,
                heading: `${items.at(0)?.formatted} – ${items.at(-1)?.formatted}`,
                items: items.map((item) => ({
                  date: item.date,
                  formatted: item.formatted,
                  id: item.id,
                  isSelected: isSameYear(item.date, state.focusedDate),
                })),
                view: "year",
              },
              (item) =>
                startPageMotion("drill-out", () => {
                  onChange(item.id);
                  state.setFocusedDate(item.date);
                  onViewChange("month");
                }),
            )
          }
        </CalendarYearPickerPrimitive>
      )}
    </div>
  );

  return "selectionMode" in state ? (
    <CalendarStateContext.Provider
      value={{
        ...state,
        focusedDate: pickerDate,
        setFocusedDate: setPickerDate,
      }}
    >
      {picker}
    </CalendarStateContext.Provider>
  ) : (
    <RangeCalendarStateContext.Provider
      value={{
        ...state,
        focusedDate: pickerDate,
        setFocusedDate: setPickerDate,
      }}
    >
      {picker}
    </RangeCalendarStateContext.Provider>
  );
}

function CalendarPickerPageContent({
  headingMotion,
  isDisabled,
  onHeadingMotionEnd,
  onNext,
  onPrevious,
  onSelect,
  onToggle,
  page,
}: {
  headingMotion?: CalendarPickerHeadingMotion | null;
  isDisabled: boolean;
  onHeadingMotionEnd: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (item: CalendarPickerItem) => void;
  onToggle: () => void;
  page: CalendarPickerPage;
}) {
  const heading = headingMotion ? (
    <span data-slot="calendar-picker-heading-motion-frame">
      <span
        aria-hidden="true"
        data-direction={headingMotion.direction}
        data-motion-state="exit"
        data-slot="calendar-picker-heading-motion"
        onAnimationEnd={(event) => {
          if (event.currentTarget === event.target) onHeadingMotionEnd();
        }}
      >
        {headingMotion.previousHeading}
      </span>
      <span
        data-direction={headingMotion.direction}
        data-motion-state="enter"
        data-slot="calendar-picker-heading-motion"
      >
        {page.heading}
      </span>
    </span>
  ) : (
    page.heading
  );

  return (
    <>
      <CalendarPickerHeader
        heading={heading}
        isDisabled={isDisabled}
        onNext={onNext}
        onPrevious={onPrevious}
        onToggle={onToggle}
        view={page.view}
      />
      <div
        aria-label={page.ariaLabel}
        data-slot="calendar-picker-grid"
        role="group"
      >
        {page.items.map((item) => (
          <Button
            aria-pressed={item.isSelected}
            data-selected={item.isSelected || undefined}
            data-slot="calendar-picker-option"
            disabled={isDisabled}
            key={item.id}
            onClick={() => onSelect(item)}
            variant={item.isSelected ? "inverse" : "ghost"}
          >
            {item.formatted}
          </Button>
        ))}
      </div>
    </>
  );
}

function CalendarPickerHeader({
  heading,
  isDisabled,
  onNext,
  onPrevious,
  onToggle,
  view,
}: {
  heading: React.ReactNode;
  isDisabled: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onToggle: () => void;
  view: Exclude<PickerView, null>;
}) {
  return (
    <div data-slot="calendar-picker-header">
      <Button
        aria-label={view === "month" ? "Previous year" : "Previous years"}
        data-slot="calendar-picker-previous"
        disabled={isDisabled}
        onClick={onPrevious}
        variant="ghost"
      >
        <ChevronLeftIcon aria-hidden="true" />
      </Button>
      <Button
        data-slot="calendar-picker-heading"
        disabled={isDisabled}
        onClick={onToggle}
        variant="ghost"
      >
        {heading}
        <ChevronsUpDownIcon aria-hidden="true" />
      </Button>
      <Button
        aria-label={view === "month" ? "Next year" : "Next years"}
        data-slot="calendar-picker-next"
        disabled={isDisabled}
        onClick={onNext}
        variant="ghost"
      >
        <ChevronRightIcon aria-hidden="true" />
      </Button>
    </div>
  );
}

function formatHeading<M extends PointCalendarSelectionMode>(
  date: CalendarState<M>["visibleRange"]["start"],
  state: CalendarState<M> | RangeCalendarState,
  locale: string,
) {
  const first = date.calendar.getFormattableMonth
    ? date.calendar.getFormattableMonth(date)
    : date;

  return new Intl.DateTimeFormat(locale, {
    calendar: first.calendar.identifier,
    month: "long",
    timeZone: state.timeZone,
    year: "numeric",
  }).format(first.toDate(state.timeZone));
}
