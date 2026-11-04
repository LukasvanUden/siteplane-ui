"use client";

import {
  type CalendarDate,
  type DateValue,
  Time,
  toCalendarDateTime,
} from "@internationalized/date";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";
import {
  DateField as DateFieldPrimitive,
  type DateFieldState,
  DateInput as DateInputPrimitive,
  useLocale,
} from "react-aria-components";

import { isInvalidAriaValue } from "../../system/form/aria-invalid";
import { useFormReset } from "../../system/form/use-form-reset";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { SiteplaneLocaleProvider } from "../../system/locale/siteplane-locale-provider";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  type FormControlTextSize,
  type FormControlVariant,
} from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { Button } from "../button";
import { Calendar } from "../calendar";
import {
  calendarMonthBounds,
  type CalendarOptions,
  fromNativeDate,
  isCalendarDayDisabled,
  toNativeDate,
} from "../calendar/calendar";
import {
  type FieldControlBridge,
  hasClearedSegment,
  type SegmentedValue,
  useFieldControlBridge,
  useFieldControlProxy,
  useFieldErrorSegments,
  useSegmentedValue,
} from "../field/field-control-bridge";
import { Input } from "../input";
import { ExternalInputOwner } from "../input/input";
import { InputGroup, InputGroupAddon } from "../input-group";
import { Popover, PopoverPopup, PopoverTrigger } from "../popover";
import { timeSegmentPart } from "../time-field/time-field";
import { DateFieldSegment } from "./date-input-group";

import "./date-field.css";

export interface DateFieldProps {
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string;
  "aria-labelledby"?: string | undefined;
  calendarProps?: CalendarOptions;
  className?: string;
  defaultValue?: Date;
  disabled?: boolean;
  form?: string;
  /**
   * `minute` adds hour and minute segments after the date, in the locale's
   * hour cycle, and the value keeps its time. Default: `day`.
   */
  granularity?: "day" | "minute";
  iconMode?: "action-end" | "decorative-start" | "none";
  /**
   * The error a required field shows while its value is incomplete, such as
   * after a segment is cleared. Default: "Enter a complete date.", or "Enter a
   * complete date and time." with `granularity="minute"`.
   */
  incompleteLabel?: string;
  insetStart?: boolean;
  locale?: string;
  name?: string;
  onValueChange?: (value: Date | undefined) => void;
  openPickerLabel?: string;
  /**
   * `input-group` renders only the date segments, without surface, calendar
   * button or popover, for use inside your own InputGroup.
   */
  profile?: "default" | "input-group";
  readOnly?: boolean;
  required?: boolean;
  /**
   * While the field is invalid, an alert icon stands at the end of the field,
   * before the calendar button, where the help icon of `tooltip` stands,
   * which gives way to it, as in an Input (the InputGroup's status). It is
   * decorative: the Field ties the error message to the field. `false` turns
   * it off. Default: `true`.
   */
  showInvalidIcon?: boolean;
  size?: SiteplaneControlSize;
  textSize?: FormControlTextSize;
  /**
   * Help text that a help icon at the end of the field shows in a tooltip,
   * as Input's `tooltip` does. With the calendar button the help icon sits
   * before it.
   */
  tooltip?: React.ReactNode;
  value?: Date | null;
  variant?: FormControlVariant;
  /**
   * `full` fills the container, like Input. `fit` is as wide as the segments
   * and the calendar button. Default: `full`.
   */
  width?: "fit" | "full";
}

type DateFieldGranularity = NonNullable<DateFieldProps["granularity"]>;

/** A day as a value of the field: the day, or its midnight with a time. */
function atGranularity(
  day: CalendarDate,
  granularity: DateFieldGranularity,
): DateValue {
  return granularity === "minute" ? toCalendarDateTime(day) : day;
}

/** The field's value of a native date: its day, and its time with a time. */
function toFieldValue(
  value: Date | null | undefined,
  granularity: DateFieldGranularity,
): DateValue | null {
  if (!value) return null;
  const day = fromNativeDate(value);
  return granularity === "minute"
    ? toCalendarDateTime(day, new Time(value.getHours(), value.getMinutes()))
    : day;
}

function toOptionalNativeDate(
  value: DateValue | null | undefined,
): Date | undefined {
  if (!value) return undefined;
  const date = toNativeDate(value);
  if ("hour" in value) date.setHours(value.hour, value.minute);
  return date;
}

function padded(value: number, digits = 2): string {
  return String(value).padStart(digits, "0");
}

/** The form value: `YYYY-MM-DD`, and `YYYY-MM-DDTHH:mm` with a time. */
function formatDateFieldValue(value: DateValue | null): string {
  if (!value) return "";
  const day = `${padded(value.year, 4)}-${padded(value.month)}-${padded(value.day)}`;
  return "hour" in value
    ? `${day}T${padded(value.hour)}:${padded(value.minute)}`
    : day;
}

/**
 * The Calendar's month bounds as bounds of the field. With a time they run
 * from the start of the first allowed day to 23:59 on the last, so a time on
 * the last day stays in range.
 */
function fieldBounds(
  calendarProps: CalendarOptions | undefined,
  granularity: DateFieldGranularity,
): { maxValue?: DateValue; minValue?: DateValue } {
  const { maxValue, minValue } = calendarMonthBounds(calendarProps ?? {});
  return {
    ...(maxValue === undefined
      ? {}
      : {
          maxValue:
            granularity === "minute"
              ? toCalendarDateTime(maxValue, new Time(23, 59))
              : maxValue,
        }),
    ...(minValue === undefined
      ? {}
      : { minValue: atGranularity(minValue, granularity) }),
  };
}

/**
 * The time the segments show, the placeholder's midnight where they show
 * none. React Aria formats the segments from `dateValue` in UTC, so its UTC
 * fields are the time on screen.
 */
function shownTime(state: DateFieldState): Time {
  return new Time(
    state.dateValue.getUTCHours(),
    state.dateValue.getUTCMinutes(),
  );
}

export function DateField(props: DateFieldProps): React.ReactElement {
  const { locale } = props;
  const field = <DateFieldRoot {...props} />;

  return locale ? (
    <SiteplaneLocaleProvider locale={locale}>{field}</SiteplaneLocaleProvider>
  ) : (
    field
  );
}

function DateFieldRoot({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  calendarProps,
  className,
  defaultValue,
  disabled,
  form,
  granularity = "day",
  iconMode = "action-end",
  incompleteLabel: incompleteLabelProp,
  insetStart = false,
  name,
  onValueChange,
  openPickerLabel: openPickerLabelProp,
  profile = "default",
  readOnly,
  required,
  showInvalidIcon = true,
  size,
  textSize,
  tooltip,
  value,
  variant = "default",
  width = "full",
}: DateFieldProps): React.ReactElement {
  const messages = useSiteplaneMessages("dateField");
  const incompleteLabel =
    incompleteLabelProp ??
    (granularity === "minute"
      ? messages.incompleteDateTime
      : messages.incompleteDate);
  const openPickerLabel = openPickerLabelProp ?? messages.openCalendar;
  const controlled = value !== undefined;
  const resolvedSize = useResolvedControlSize(size);
  const field = useFieldControlBridge({
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    disabled,
    name,
  });
  // React Aria validates typed dates unless the application controls the
  // invalid state through aria-invalid or an invalid Field.
  const controlledInvalid =
    ariaInvalid !== undefined
      ? isInvalidAriaValue(ariaInvalid)
      : field.invalid || undefined;
  // A cleared segment empties the field's value.
  const segmented = useSegmentedValue<DateValue>({
    controlled,
    defaultValue: toFieldValue(defaultValue, granularity),
    incompleteMessage: incompleteLabel,
    onValueChange: (nextValue) =>
      onValueChange?.(toOptionalNativeDate(nextValue)),
    required,
    serialize: formatDateFieldValue,
    value: toFieldValue(value, granularity),
  });

  // React Aria's optional props reject `undefined` under
  // exactOptionalPropertyTypes, so unset values are omitted.
  return (
    <DateFieldPrimitive<DateValue>
      {...(field.describedBy === undefined
        ? {}
        : { "aria-describedby": field.describedBy })}
      {...(field.labelledBy || ariaLabel === undefined
        ? {}
        : { "aria-label": ariaLabel })}
      {...(field.labelledBy === undefined
        ? {}
        : { "aria-labelledby": field.labelledBy })}
      className="sp-date-field sp-base-date-field contents"
      data-foundation="date-field"
      data-inset-start={insetStart || undefined}
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="date-field"
      {...(controlled
        ? { value: segmented.ownerValue }
        : { defaultValue: toFieldValue(defaultValue, granularity) })}
      // The locale's hour cycle, with its day period where it uses one.
      granularity={granularity}
      isDateUnavailable={(date) =>
        isCalendarDayDisabled(toNativeDate(date), calendarProps?.disabled)
      }
      isDisabled={field.disabled}
      {...(controlledInvalid === undefined
        ? {}
        : { isInvalid: controlledInvalid })}
      {...(readOnly === undefined ? {} : { isReadOnly: readOnly })}
      {...(required === undefined ? {} : { isRequired: required })}
      {...fieldBounds(calendarProps, granularity)}
      // Typed segments start from the calendar's today, `todayDate` when set,
      // at midnight with a time.
      {...(calendarProps?.todayDate === undefined
        ? {}
        : {
            placeholderValue: atGranularity(
              fromNativeDate(calendarProps.todayDate),
              granularity,
            ),
          })}
      onChange={segmented.onOwnerChange}
      shouldForceLeadingZeros
      validate={segmented.validate}
    >
      {({ state }) => (
        <DateFieldContent
          calendarProps={calendarProps}
          className={className}
          controlled={controlled}
          controlledInvalid={controlledInvalid}
          dateFieldState={state as DateFieldState}
          defaultValue={defaultValue}
          field={field}
          form={form}
          granularity={granularity}
          iconMode={iconMode}
          insetStart={insetStart}
          openPickerLabel={openPickerLabel}
          profile={profile}
          readOnly={readOnly}
          required={required}
          resolvedSize={resolvedSize}
          segmented={segmented}
          showInvalidIcon={showInvalidIcon}
          textSize={textSize}
          tooltip={tooltip}
          variant={variant}
          width={width}
        />
      )}
    </DateFieldPrimitive>
  );
}

function DateFieldContent({
  calendarProps,
  className,
  controlled,
  controlledInvalid,
  dateFieldState,
  defaultValue,
  field,
  form,
  granularity,
  iconMode,
  insetStart,
  openPickerLabel,
  profile,
  readOnly,
  required,
  resolvedSize,
  segmented,
  showInvalidIcon,
  textSize,
  tooltip,
  variant,
  width,
}: {
  calendarProps: CalendarOptions | undefined;
  className: string | undefined;
  controlled: boolean;
  controlledInvalid: boolean | undefined;
  dateFieldState: DateFieldState;
  defaultValue: Date | undefined;
  field: FieldControlBridge;
  form: string | undefined;
  granularity: DateFieldGranularity;
  iconMode: "action-end" | "decorative-start" | "none";
  insetStart: boolean;
  openPickerLabel: string;
  profile: "default" | "input-group";
  readOnly: boolean | undefined;
  required: boolean | undefined;
  resolvedSize: SiteplaneControlSize;
  segmented: SegmentedValue<DateValue>;
  showInvalidIcon: boolean;
  textSize: FormControlTextSize | undefined;
  tooltip: React.ReactNode;
  variant: FormControlVariant;
  width: "fit" | "full";
}): React.ReactElement {
  const messages = useSiteplaneMessages("dateField");
  const [open, setOpen] = React.useState(false);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const segmentsRef = React.useRef<HTMLDivElement>(null);
  const hiddenInputRef = useFormReset<HTMLInputElement>(form, () => {
    if (!controlled)
      dateFieldState.setValue(toFieldValue(defaultValue, granularity));
  });
  // A cleared segment leaves the field without a value, although React Aria
  // still holds the last complete date.
  const cleared = hasClearedSegment(dateFieldState);
  const ownerValue = dateFieldState.value;
  const fieldValue = cleared ? null : ownerValue;
  const serializedValue = formatDateFieldValue(fieldValue);
  React.useLayoutEffect(() => {
    segmented.sync({ cleared, effective: fieldValue, value: ownerValue });
  });
  const invalid =
    controlledInvalid ??
    (dateFieldState.displayValidation.isInvalid || field.valid === false);
  const proxyProps = useFieldControlProxy({
    controlled: controlledInvalid !== undefined,
    disabled: field.disabled,
    displayValidation: dateFieldState.displayValidation,
    focusTarget: () => getFirstSegment(segmentsRef.current),
    form,
    name: field.name,
    onRevalidate: dateFieldState.commitValidation,
    realtimeValidation: dateFieldState.realtimeValidation,
    required,
    value: serializedValue,
  });
  useFieldErrorSegments(segmentsRef, {
    controlled: controlledInvalid !== undefined,
    ownerInvalid: dateFieldState.isInvalid,
  });
  // The segments read in the locale's direction, which React Aria's arrow
  // keys follow, whatever the page's: an en-US date stays 10/14/2026 in a
  // right-to-left page. The dir attribute also isolates the row from the
  // text around it.
  const { direction } = useLocale();
  const input = (
    <DateInputPrimitive
      className="sp-date-field-input"
      data-inset-start={insetStart || undefined}
      data-slot="date-field-input"
      dir={direction}
      ref={segmentsRef}
    >
      {(segment) => (
        // The hour, the minute, the day period and the literals before them,
        // the comma after the date included, are the Time Field's segments
        // (time-field.tsx).
        <DateFieldSegment
          segment={segment}
          timePart={
            granularity === "minute"
              ? timeSegmentPart(segment, dateFieldState.segments)
              : undefined
          }
        />
      )}
    </DateInputPrimitive>
  );
  const control = (
    <InputGroup
      aria-label={undefined}
      // The field fills its container, like Input. width="fit" makes it as
      // wide as the segments, like the Date Time Picker, and never narrower
      // than them in a flex row. A width utility in className replaces either.
      className={cn(
        "sp-date-field-control",
        width === "fit" && "w-max shrink-0",
        className,
      )}
      data-icon-mode={iconMode}
      data-invalid={invalid || undefined}
      data-readonly={(readOnly && !field.disabled) || undefined}
      data-slot="date-field-control"
      // The group is the field of the size: its height, its padding, its
      // icons and its text, 14 px at sm and 16 px from md (the field scale);
      // textSize sets one text at every size. It shows the help icon of
      // `tooltip` and the alert icon of an invalid field after the segments.
      showInvalidIcon={showInvalidIcon}
      size={resolvedSize}
      textSize={textSize}
      tooltip={tooltip}
      variant={variant}
    >
      {iconMode === "decorative-start" ? (
        <InputGroupAddon
          align="inline-start"
          aria-hidden="true"
          className="sp-date-field-icon-addon pointer-events-none"
        >
          {/* The calendar of every date field and picker trigger, one
              glyph for the date (A9, 3 November 2026). */}
          <CalendarBlankIcon
            aria-hidden="true"
            className="sp-date-field-decorative-icon"
            data-slot="date-field-decorative-icon"
          />
        </InputGroupAddon>
      ) : null}
      {input}
      {iconMode === "action-end" ? (
        <InputGroupAddon align="inline-end">
          <PopoverTrigger
            data-slot="date-field-trigger"
            render={
              <Button
                aria-label={openPickerLabel}
                disabled={field.disabled || readOnly}
                profile="field-action"
                shape="square"
              />
            }
          >
            <CalendarBlankIcon aria-hidden="true" />
          </PopoverTrigger>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );

  return (
    <>
      {profile === "input-group" ? (
        input
      ) : iconMode === "action-end" ? (
        <Popover onOpenChange={setOpen} open={open}>
          {control}
          <PopoverPopup
            align="end"
            className="sp-date-field-popover"
            data-slot="date-field-popover"
            // The calendar opens with the focus on its day, the selected one
            // or today, as the calendar of every date picker does, so the
            // arrow keys move through the days at once (A5, 3 November 2026;
            // it opened on its Previous month button). Without a day Base UI
            // keeps its own first focus.
            initialFocus={() =>
              popupRef.current?.querySelector<HTMLElement>(
                '[role="grid"] [tabindex="0"]',
              ) ?? true
            }
            ref={popupRef}
            sideOffset={6}
            viewportPadding="compact"
          >
            <Calendar
              {...calendarProps}
              aria-label={messages.calendar}
              data-slot="date-field-calendar"
              onValueChange={(nextValue) => {
                const day = fromNativeDate(nextValue);
                // With a time the picked day keeps the time the segments
                // show, or midnight while they show none.
                dateFieldState.setValue(
                  granularity === "minute"
                    ? toCalendarDateTime(day, shownTime(dateFieldState))
                    : day,
                );
                setOpen(false);
              }}
              value={toOptionalNativeDate(dateFieldState.value) ?? null}
            />
          </PopoverPopup>
        </Popover>
      ) : (
        control
      )}
      <Input
        disabled={field.disabled}
        form={form}
        name={field.name}
        readOnly
        ref={hiddenInputRef}
        required={required}
        type="hidden"
        value={serializedValue}
      />
      {proxyProps ? (
        <ExternalInputOwner>
          <Input nativeInput unstyled {...proxyProps} />
        </ExternalInputOwner>
      ) : null}
    </>
  );
}

function getFirstSegment(container: HTMLElement | null): HTMLElement | null {
  return (
    container?.querySelector<HTMLElement>(
      '[role="spinbutton"], [role="textbox"]',
    ) ?? null
  );
}
