"use client";

import { type CalendarDate, type DateValue } from "@internationalized/date";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";
import {
  Button as DateRangeButtonPrimitive,
  DateFieldContext,
  DateFieldStateContext,
  DateInput as DateRangeInputPrimitive,
  DateRangePicker as DateRangePickerPrimitive,
  type DateRangePickerState,
  DateSegment as DateRangeSegmentPrimitive,
  Dialog as DateRangeDialogPrimitive,
  Group as DateRangeGroupPrimitive,
  Popover as DateRangePopoverPrimitive,
  RangeCalendarContext,
  type RangeValue,
  useLocale,
  useSlottedContext,
} from "react-aria-components";

import { isInvalidAriaValue } from "../../system/form/aria-invalid";
import { useFormReset } from "../../system/form/use-form-reset";
import { normalizeFormattedText } from "../../system/locale/formatted-text";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { SiteplaneLocaleProvider } from "../../system/locale/siteplane-locale-provider";
import {
  type SiteplaneControlSize,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  surfaceClassNames,
  type FormControlTextSize,
  type FormControlVariant,
} from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { Button } from "../button";
import { Calendar } from "../calendar";
import {
  calendarMonthBounds,
  type CalendarOptions,
  type CalendarRangeShortcut,
  type DateRange,
  fromNativeDate,
  isCalendarDayDisabled,
  toNativeDate,
} from "../calendar/calendar";
import { DateInputGroup } from "../date-field/date-input-group";
import {
  DatePickerFooter,
  DatePickerPanel,
  DatePickerTrigger,
} from "../date-picker/date-picker-panel";
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
import { InputGroup, InputGroupAddon, InputGroupText } from "../input-group";

import "./date-range-picker.css";

// The range shape is the Calendar's, so a range moves between the picker and
// a range Calendar as it is.
export type { DateRange } from "../calendar/calendar";

export interface DateRangePickerProps {
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string;
  "aria-labelledby"?: string | undefined;
  calendarProps?: CalendarOptions;
  className?: string;
  defaultValue?: DateRange;
  disabled?: boolean;
  endLabel?: string;
  endName?: string;
  form?: string;
  /**
   * `action-end` ends the field with the button that opens the calendar;
   * `none` leaves the range to typing, as DateField's `iconMode="none"` does,
   * for a range beside a calendar of its own.
   */
  iconMode?: "action-end" | "none" | undefined;
  /**
   * The error a required picker shows while its range is incomplete, such as
   * after a segment is cleared. Default: "Enter a complete date range."
   */
  incompleteLabel?: string;
  locale?: string;
  onValueChange?: (value: DateRange | undefined) => void;
  openPickerLabel?: string;
  /**
   * The text of the button (`trigger="button"`) while no range is set.
   * Default: "Choose dates".
   */
  placeholder?: React.ReactNode;
  readOnly?: boolean;
  required?: boolean;
  /**
   * Quick choices such as "Last week", the Calendar's shortcuts: in the field's
   * calendar a row of links above the months, beside the months of the
   * button's panel a list (`trigger="button"`).
   */
  shortcuts?: readonly CalendarRangeShortcut[];
  /**
   * While the range is invalid, an alert icon stands at the end of the field,
   * before the calendar button, where the help icon of `tooltip` stands,
   * which gives way to it, as in an Input. It is decorative: the Field ties
   * the error message to the field. `false` turns it off. Default: `true`.
   */
  showInvalidIcon?: boolean;
  size?: SiteplaneControlSize;
  startLabel?: string;
  startName?: string;
  textSize?: FormControlTextSize;
  /**
   * Help text that a help icon at the end of the field shows in a tooltip,
   * as Input's `tooltip` does. With the calendar button the help icon sits
   * before it.
   */
  tooltip?: React.ReactNode;
  /**
   * `field` types the range into date segments, with a button at the end
   * that opens the calendar. `button` is a Button that shows the range and
   * opens a panel: the shortcuts as a list beside two months, the start and
   * end dates to type, and Cancel and Apply. The panel holds what is picked
   * until Apply sets it; Cancel, Escape and a press outside keep the range as
   * it was. Default: `field`.
   */
  trigger?: "button" | "field";
  value?: DateRange | null;
  variant?: FormControlVariant;
  /**
   * `fit` is as wide as the two dates and the calendar button, or the button
   * as wide as its text. `full` fills the container, like Input. Default:
   * `fit`.
   */
  width?: "fit" | "full";
}

function toCalendarDate(value: Date | null | undefined): CalendarDate | null {
  return value ? fromNativeDate(value) : null;
}

function toOptionalNativeDate(
  value: DateValue | null | undefined,
): Date | undefined {
  return value ? toNativeDate(value) : undefined;
}

function toInternalRange(
  value: DateRange | null | undefined,
): RangeValue<CalendarDate> | null {
  const start = toCalendarDate(value?.from);
  const end = toCalendarDate(value?.to);
  return start && end ? { end, start } : null;
}

function toNativeRange(
  value: RangeValue<DateValue | null> | null | undefined,
): DateRange | undefined {
  if (!value?.start && !value?.end) return undefined;
  return {
    from: toOptionalNativeDate(value.start),
    to: toOptionalNativeDate(value.end),
  };
}

function formatDate(value: DateValue | null | undefined): string {
  if (!value) return "";
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

function formatRange(value: RangeValue<DateValue | null> | null): string {
  return value?.start && value.end
    ? `${formatDate(value.start)}/${formatDate(value.end)}`
    : "";
}

type ClearedEndpoints = { end: boolean; start: boolean };

// The button shows no segments, so none of its dates is ever cleared.
const noClearedEndpoints: ClearedEndpoints = { end: false, start: false };

function DateRangeHiddenInputs({
  cleared,
  controlled,
  controlledInvalid,
  controlRef,
  defaultValue,
  endName,
  field,
  focusTarget,
  form,
  required,
  segmented,
  startName,
  state,
}: {
  cleared: ClearedEndpoints;
  controlled: boolean;
  controlledInvalid: boolean | undefined;
  controlRef: React.RefObject<HTMLDivElement | null>;
  defaultValue: DateRange | undefined;
  endName: string | undefined;
  field: FieldControlBridge;
  focusTarget: () => HTMLElement | null;
  form: string | undefined;
  required: boolean | undefined;
  segmented: SegmentedValue<RangeValue<DateValue>>;
  startName: string | undefined;
  state: DateRangePickerState;
}): React.ReactElement {
  const startInputRef = useFormReset<HTMLInputElement>(form, () => {
    if (!controlled) state.setValue(toInternalRange(defaultValue));
  });
  // A date with a cleared segment has no value, although React Aria still
  // holds the last complete one.
  const startValue = cleared.start ? null : state.value.start;
  const endValue = cleared.end ? null : state.value.end;
  const start = formatDate(startValue);
  const end = formatDate(endValue);
  React.useLayoutEffect(() => {
    const ownerValue =
      state.value.start && state.value.end
        ? { end: state.value.end, start: state.value.start }
        : null;
    segmented.sync({
      cleared: cleared.start || cleared.end,
      effective:
        startValue && endValue ? { end: endValue, start: startValue } : null,
      value: ownerValue,
    });
  });
  const proxyProps = useFieldControlProxy({
    controlled: controlledInvalid !== undefined,
    disabled: field.disabled,
    displayValidation: state.displayValidation,
    focusTarget,
    form,
    name: undefined,
    onRevalidate: state.commitValidation,
    realtimeValidation: state.realtimeValidation,
    required,
    value: start && end ? `${start}/${end}` : "",
  });
  useFieldErrorSegments(controlRef, {
    controlled: controlledInvalid !== undefined,
    ownerInvalid: state.isInvalid,
  });

  return (
    <>
      <Input
        disabled={field.disabled}
        form={form}
        name={startName}
        readOnly
        ref={startInputRef}
        required={required}
        type="hidden"
        value={start}
      />
      <Input
        disabled={field.disabled}
        form={form}
        name={endName}
        readOnly
        required={required}
        type="hidden"
        value={end}
      />
      {proxyProps ? (
        <ExternalInputOwner>
          <Input nativeInput unstyled {...proxyProps} />
        </ExternalInputOwner>
      ) : null}
    </>
  );
}

// React Aria names each date segment with its date field's name and the range
// label, such as "month, Start Date, Trip dates". A label replaces the
// localized Start Date or End Date field name.
function DateRangeEndpoint({
  label,
  onClearedChange,
  slot,
}: {
  label: string | undefined;
  onClearedChange: (slot: "end" | "start", cleared: boolean) => void;
  slot: "end" | "start";
}): React.ReactElement {
  const fieldProps = useSlottedContext(DateFieldContext, slot);

  return (
    <DateFieldContext.Provider
      value={
        label && fieldProps
          ? { ...fieldProps, "aria-label": label }
          : fieldProps
      }
    >
      <DateRangeInputPrimitive
        className={cn(
          "sp-base-date-field",
          `sp-date-range-picker-${slot}`,
          "contents",
        )}
        data-foundation="date-field"
        data-profile="input-group"
        data-slot={`date-range-picker-${slot}`}
        slot={slot}
      >
        {(segment) => (
          <DateRangeSegment
            onClearedChange={(cleared) => onClearedChange(slot, cleared)}
            segment={segment}
          />
        )}
      </DateRangeInputPrimitive>
    </DateFieldContext.Provider>
  );
}

// The start date, the dash and the end date read in the locale's direction,
// which React Aria's arrow keys follow, whatever the page's: an en-US range
// stays 01/01/2024 – 10/14/2026 in a right-to-left page. The dir attribute
// also isolates the row from the text around it; the rules of every date and
// time field (input-group.css) keep the field's insets on the field's sides.
function DateRangeSegments({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { direction } = useLocale();

  return (
    <div
      className="sp-date-range-picker-segments"
      data-slot="date-range-picker-segments"
      dir={direction}
    >
      {children}
    </div>
  );
}

// Each date of the range keeps its own field state inside its DateInput; the
// segments tell the picker whether that date shows a cleared segment.
function DateRangeSegment({
  onClearedChange,
  segment,
}: {
  onClearedChange: (cleared: boolean) => void;
  segment: React.ComponentProps<typeof DateRangeSegmentPrimitive>["segment"];
}): React.ReactElement {
  const cleared = hasClearedSegment(React.useContext(DateFieldStateContext));
  React.useLayoutEffect(() => onClearedChange(cleared));

  // The segment shows the text that the server's ICU and the browser's agree
  // on, as the Date Field's do (date-field.tsx), so the prerendered range
  // hydrates.
  return (
    <DateRangeSegmentPrimitive
      className="sp-date-field-segment sp-date-segment"
      data-literal-kind={
        segment.type === "literal" && /[./-]/.test(segment.text)
          ? "separator"
          : undefined
      }
      data-slot="date-field-segment"
      segment={segment}
    >
      {({ text }) => normalizeFormattedText(text)}
    </DateRangeSegmentPrimitive>
  );
}

/**
 * The button of `trigger="button"`: the range as the locale writes two dates,
 * "Oct 26, 2026 – Nov 2, 2026" in en-US, or the placeholder.
 */
function DateRangeButton({
  disabled,
  invalid,
  placeholder,
  size,
  state,
  textSize,
}: {
  disabled: boolean;
  invalid: boolean;
  placeholder: React.ReactNode;
  size: SiteplaneControlSize | undefined;
  state: DateRangePickerState;
  textSize: FormControlTextSize | undefined;
}): React.ReactElement {
  const { locale } = useLocale();
  const formatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );
  const { end, start } = state.value;
  const label =
    start && end
      ? normalizeFormattedText(
          `${formatter.format(toNativeDate(start))} – ${formatter.format(toNativeDate(end))}`,
        )
      : null;

  return (
    <DatePickerTrigger
      data-slot="date-range-picker-button"
      disabled={disabled}
      empty={label === null}
      invalid={invalid}
      size={size}
      textSize={textSize}
      valueSlot="date-range-picker-value"
    >
      {label ?? placeholder}
    </DatePickerTrigger>
  );
}

/**
 * The panel of `trigger="button"`: the
 * shortcuts in a list beside two months, and in the footer the start and the
 * end date to type, with Cancel and Apply. It holds the range picked or typed
 * apart from the picker's own until Apply sets it, so Cancel, or the panel
 * closed any other way, keeps the range as it was; it starts as the picker's
 * range each time the panel opens. Apply waits for a complete range whose
 * start does not follow its end.
 */
function DateRangePanel({
  calendarProps,
  endLabel,
  fieldAriaLabel,
  labelledBy,
  shortcuts,
  size,
  startLabel,
  state,
}: {
  calendarProps: CalendarOptions | undefined;
  endLabel: string | undefined;
  fieldAriaLabel: string | undefined;
  labelledBy: string | undefined;
  shortcuts: readonly CalendarRangeShortcut[] | undefined;
  size: SiteplaneControlSize;
  startLabel: string | undefined;
  state: DateRangePickerState;
}): React.ReactElement {
  const messages = useSiteplaneMessages("dateRangePicker");
  // The picker hands its calendar its range, its bounds and the focus on
  // open through React Aria's calendar context; the panel keeps all of it but
  // the range, which it holds itself until Apply.
  const pickerCalendar = useSlottedContext(RangeCalendarContext);
  const [start, setStart] = React.useState<DateValue | null>(state.value.start);
  const [end, setEnd] = React.useState<DateValue | null>(state.value.end);
  // The month a typed date shows; unset, the calendar shows the range's.
  const [month, setMonth] = React.useState<Date | undefined>(undefined);
  const range = start && end && start.compare(end) <= 0 ? { end, start } : null;
  const isDateUnavailable = (date: DateValue) =>
    isCalendarDayDisabled(toNativeDate(date), calendarProps?.disabled);
  const bounds = calendarMonthBounds(calendarProps ?? {});
  // A typed date the calendar allows joins the range and shows its month; one
  // it does not allow stays in its input, which shows it invalid.
  const typed = (date: DateValue | null, set: (date: DateValue) => void) => {
    if (
      !date ||
      isDateUnavailable(date) ||
      (bounds.minValue && date.compare(bounds.minValue) < 0) ||
      (bounds.maxValue && date.compare(bounds.maxValue) > 0)
    )
      return;
    set(date);
    setMonth(toNativeDate(date));
  };

  return (
    <DatePickerPanel
      aside={Boolean(shortcuts?.length)}
      footer={
        <DatePickerFooter
          applyDisabled={range === null}
          onApply={() => {
            if (!range) return;
            state.setValue(range);
            state.setOpen(false);
          }}
          onCancel={() => state.setOpen(false)}
        >
          <div
            className="sp-date-range-picker-inputs"
            data-slot="date-range-picker-inputs"
          >
            <DateInputGroup
              aria-label={startLabel ?? messages.start}
              isDateUnavailable={isDateUnavailable}
              {...bounds}
              onChange={(next) => typed(next, setStart)}
              size={size}
              value={start}
              width="fit"
            />
            <span
              aria-hidden="true"
              className="sp-date-range-picker-dash"
              data-slot="date-range-picker-dash"
            >
              –
            </span>
            <DateInputGroup
              aria-label={endLabel ?? messages.end}
              isDateUnavailable={isDateUnavailable}
              {...bounds}
              onChange={(next) => typed(next, setEnd)}
              size={size}
              value={end}
              width="fit"
            />
          </div>
        </DatePickerFooter>
      }
    >
      <RangeCalendarContext.Provider
        value={{
          ...pickerCalendar,
          onChange: (next: RangeValue<DateValue>) => {
            setStart(next.start);
            setEnd(next.end);
          },
          value: range,
        }}
      >
        <Calendar
          {...calendarProps}
          {...(fieldAriaLabel === undefined
            ? {}
            : { "aria-label": fieldAriaLabel })}
          {...(fieldAriaLabel || labelledBy === undefined
            ? {}
            : { "aria-labelledby": labelledBy })}
          className="sp-date-range-calendar"
          data-slot="date-range-picker-calendar"
          month={month}
          numberOfMonths={2}
          onMonthChange={setMonth}
          selectionMode="range"
          shortcuts={shortcuts}
          shortcutsLayout="list"
        />
      </RangeCalendarContext.Provider>
    </DatePickerPanel>
  );
}

export function DateRangePicker({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  calendarProps,
  className,
  defaultValue,
  disabled,
  endLabel,
  endName,
  form,
  iconMode = "action-end",
  incompleteLabel: incompleteLabelProp,
  locale,
  onValueChange,
  openPickerLabel: openPickerLabelProp,
  placeholder: placeholderProp,
  readOnly,
  required,
  shortcuts,
  showInvalidIcon = true,
  size,
  startLabel,
  startName,
  textSize,
  tooltip,
  trigger = "field",
  value,
  variant = "default",
  width = "fit",
}: DateRangePickerProps): React.ReactElement {
  const messages = useSiteplaneMessages("dateRangePicker");
  const incompleteLabel = incompleteLabelProp ?? messages.incomplete;
  const openPickerLabel = openPickerLabelProp ?? messages.openCalendar;
  const placeholder =
    placeholderProp === undefined ? messages.placeholder : placeholderProp;
  const controlled = value !== undefined;
  const resolvedSize = useResolvedControlSize(size);
  const controlRef = React.useRef<HTMLDivElement>(null);
  const field = useFieldControlBridge({
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    disabled,
  });
  const fieldAriaLabel = field.labelledBy ? undefined : ariaLabel;
  // React Aria validates typed dates unless the application controls the
  // invalid state through aria-invalid or an invalid Field.
  const controlledInvalid =
    ariaInvalid !== undefined
      ? isInvalidAriaValue(ariaInvalid)
      : field.invalid || undefined;
  // A cleared segment empties the range's value.
  const [cleared, setCleared] = React.useState<ClearedEndpoints>({
    end: false,
    start: false,
  });
  const onClearedChange = React.useCallback(
    (slot: "end" | "start", next: boolean) =>
      setCleared((current) =>
        current[slot] === next ? current : { ...current, [slot]: next },
      ),
    [],
  );
  const segmented = useSegmentedValue<RangeValue<DateValue>>({
    controlled,
    defaultValue: toInternalRange(defaultValue),
    incompleteMessage: incompleteLabel,
    onValueChange: (nextValue) =>
      onValueChange?.(
        nextValue?.start && nextValue.end
          ? toNativeRange(nextValue)
          : undefined,
      ),
    required,
    serialize: formatRange,
    value: toInternalRange(value),
  });
  // React Aria's optional props reject `undefined` under
  // exactOptionalPropertyTypes, so unset values are omitted.
  const picker = (
    <DateRangePickerPrimitive
      {...(field.describedBy === undefined
        ? {}
        : { "aria-describedby": field.describedBy })}
      {...(fieldAriaLabel === undefined
        ? {}
        : { "aria-label": fieldAriaLabel })}
      {...(field.labelledBy === undefined
        ? {}
        : { "aria-labelledby": field.labelledBy })}
      className="sp-date-range-picker sp-base-date-range-picker contents"
      data-foundation="date-range-picker"
      data-slot="date-range-picker"
      {...(controlled
        ? { value: segmented.ownerValue }
        : { defaultValue: toInternalRange(defaultValue) })}
      isDateUnavailable={(date) =>
        isCalendarDayDisabled(toNativeDate(date), calendarProps?.disabled)
      }
      isDisabled={field.disabled}
      {...(controlledInvalid === undefined
        ? {}
        : { isInvalid: controlledInvalid })}
      {...(readOnly === undefined ? {} : { isReadOnly: readOnly })}
      {...(required === undefined ? {} : { isRequired: required })}
      {...calendarMonthBounds(calendarProps ?? {})}
      // Typed segments start from the calendar's today, `todayDate` when set.
      {...(calendarProps?.todayDate === undefined
        ? {}
        : { placeholderValue: fromNativeDate(calendarProps.todayDate) })}
      onChange={segmented.onOwnerChange}
      // The button's panel stays open until Apply.
      shouldCloseOnSelect={trigger !== "button"}
      shouldForceLeadingZeros
      validate={segmented.validate}
    >
      {({ isInvalid, state }) =>
        trigger === "button" ? (
          <>
            <DateRangeGroupPrimitive
              // As wide as the range by default; width="full" fills the
              // container, like Input.
              className={cn(
                width === "full" ? "flex w-full" : "inline-flex",
                "max-w-full",
                className,
              )}
              ref={controlRef}
            >
              <DateRangeButton
                disabled={field.disabled}
                invalid={
                  (controlledInvalid ?? (isInvalid || field.valid === false)) ||
                  false
                }
                placeholder={placeholder}
                size={size}
                state={state}
                textSize={textSize}
              />
            </DateRangeGroupPrimitive>
            <DateRangePopoverPrimitive
              className={cn(
                "sp-date-range-picker-popover",
                surfaceClassNames.floatingOverlay,
                "sp-date-range-popover",
              )}
              data-panel
              data-slot="date-range-picker-popover"
              offset={4}
              placement="bottom end"
            >
              <SiteplaneUIPortalScope>
                <DateRangeDialogPrimitive
                  className="sp-date-range-picker-dialog outline-none"
                  data-slot="date-range-picker-dialog"
                >
                  <DateRangePanel
                    calendarProps={calendarProps}
                    endLabel={endLabel}
                    fieldAriaLabel={fieldAriaLabel}
                    labelledBy={field.labelledBy}
                    shortcuts={shortcuts}
                    size={resolvedSize}
                    startLabel={startLabel}
                    state={state}
                  />
                </DateRangeDialogPrimitive>
              </SiteplaneUIPortalScope>
            </DateRangePopoverPrimitive>
            <DateRangeHiddenInputs
              cleared={noClearedEndpoints}
              controlled={controlled}
              controlledInvalid={controlledInvalid}
              controlRef={controlRef}
              defaultValue={defaultValue}
              endName={endName}
              field={field}
              focusTarget={() =>
                controlRef.current?.querySelector<HTMLElement>(
                  ".sp-date-range-picker-button",
                ) ?? null
              }
              form={form}
              required={required}
              segmented={segmented}
              startName={startName}
              state={state}
            />
          </>
        ) : (
          <>
            <DateRangeGroupPrimitive
              // As wide as the two dates by default; width="full" fills the
              // container, like Input. The root takes className, as in the
              // other pickers; the field fills it.
              className={cn(
                width === "full" ? "flex w-full" : "inline-flex",
                "max-w-full",
                className,
              )}
            >
              <InputGroup
                aria-label={undefined}
                className="sp-date-range-control w-full"
                data-icon-mode={iconMode}
                data-invalid={
                  (controlledInvalid ?? (isInvalid || field.valid === false)) ||
                  undefined
                }
                data-readonly={(readOnly && !field.disabled) || undefined}
                data-slot="date-range-picker-control"
                ref={controlRef}
                // The group is the field of the size: its height, its padding,
                // its icons and its text, 14 px at sm and 16 px from md (the
                // field scale); textSize sets one text at every size. It shows
                // the help icon of `tooltip` and the alert icon of an invalid
                // range after the dates.
                showInvalidIcon={showInvalidIcon}
                size={resolvedSize}
                textSize={textSize}
                tooltip={tooltip}
                variant={variant}
              >
                <DateRangeSegments>
                  <DateRangeEndpoint
                    label={startLabel}
                    onClearedChange={onClearedChange}
                    slot="start"
                  />
                  <InputGroupText
                    aria-hidden="true"
                    className="mx-1 text-foreground"
                    data-slot="date-range-picker-separator"
                  >
                    –
                  </InputGroupText>
                  <DateRangeEndpoint
                    label={endLabel}
                    onClearedChange={onClearedChange}
                    slot="end"
                  />
                </DateRangeSegments>
                {iconMode === "action-end" ? (
                  <InputGroupAddon align="inline-end">
                    <Button
                      aria-label={openPickerLabel}
                      data-slot="date-range-picker-trigger"
                      disabled={field.disabled || readOnly}
                      render={<DateRangeButtonPrimitive />}
                      profile="field-action"
                      shape="square"
                    >
                      <CalendarBlankIcon aria-hidden="true" />
                    </Button>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
            </DateRangeGroupPrimitive>
            {/* Without its button the range opens no calendar: React Aria's
              picker works with its date fields alone. */}
            {iconMode === "action-end" ? (
              <DateRangePopoverPrimitive
                className={cn(
                  "sp-date-range-picker-popover",
                  surfaceClassNames.floatingOverlay,
                  "sp-date-range-popover",
                )}
                data-slot="date-range-picker-popover"
                offset={4}
                placement="bottom end"
              >
                <SiteplaneUIPortalScope>
                  <DateRangeDialogPrimitive
                    className="sp-date-range-picker-dialog outline-none"
                    data-slot="date-range-picker-dialog"
                  >
                    <Calendar
                      {...calendarProps}
                      {...(fieldAriaLabel === undefined
                        ? {}
                        : { "aria-label": fieldAriaLabel })}
                      {...(fieldAriaLabel || field.labelledBy === undefined
                        ? {}
                        : { "aria-labelledby": field.labelledBy })}
                      className="sp-date-range-calendar"
                      data-slot="date-range-picker-calendar"
                      selectionMode="range"
                      shortcuts={shortcuts}
                    />
                  </DateRangeDialogPrimitive>
                </SiteplaneUIPortalScope>
              </DateRangePopoverPrimitive>
            ) : null}
            <DateRangeHiddenInputs
              cleared={cleared}
              controlled={controlled}
              controlledInvalid={controlledInvalid}
              controlRef={controlRef}
              defaultValue={defaultValue}
              endName={endName}
              field={field}
              focusTarget={() =>
                controlRef.current?.querySelector<HTMLElement>(
                  '[role="spinbutton"], [role="textbox"]',
                ) ?? null
              }
              form={form}
              required={required}
              segmented={segmented}
              startName={startName}
              state={state}
            />
          </>
        )
      }
    </DateRangePickerPrimitive>
  );

  return locale ? (
    <SiteplaneLocaleProvider locale={locale}>{picker}</SiteplaneLocaleProvider>
  ) : (
    picker
  );
}
