"use client";

import { type CalendarDate, type DateValue } from "@internationalized/date";
import { CalendarDaysIcon } from "lucide-react";
import * as React from "react";
import {
  DateField as DateFieldPrimitive,
  type DateFieldState,
  DateInput as DateInputPrimitive,
  DateSegment as DateSegmentPrimitive,
  useLocale,
} from "react-aria-components";

import { isInvalidAriaValue } from "../../system/form/aria-invalid";
import { useFormReset } from "../../system/form/use-form-reset";
import { normalizeFormattedText } from "../../system/locale/formatted-text";
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
  iconMode?: "action-end" | "decorative-start" | "none";
  /**
   * The error a required field shows while its date is incomplete, such as
   * after a segment is cleared. Default: "Enter a complete date."
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
  size?: SiteplaneControlSize;
  textSize?: FormControlTextSize;
  value?: Date | null;
  variant?: FormControlVariant;
}

const dateFieldActionSizes = {
  md: "icon-xs",
  lg: "icon-xs",
  sm: "icon-2xs",
  xl: "icon-sm",
} as const satisfies Record<
  SiteplaneControlSize,
  "icon-2xs" | "icon-xs" | "icon-sm"
>;

function toCalendarDate(value: Date | null | undefined): CalendarDate | null {
  return value ? fromNativeDate(value) : null;
}

function toOptionalNativeDate(
  value: DateValue | null | undefined,
): Date | undefined {
  return value ? toNativeDate(value) : undefined;
}

function formatDateFieldValue(value: DateValue | null): string {
  if (!value) return "";
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
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
  iconMode = "action-end",
  incompleteLabel = "Enter a complete date.",
  insetStart = false,
  name,
  onValueChange,
  openPickerLabel = "Open date calendar",
  profile = "default",
  readOnly,
  required,
  size,
  textSize,
  value,
  variant = "default",
}: DateFieldProps): React.ReactElement {
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
  const segmented = useSegmentedValue<CalendarDate>({
    controlled,
    defaultValue: toCalendarDate(defaultValue),
    incompleteMessage: incompleteLabel,
    onValueChange: (nextValue) =>
      onValueChange?.(toOptionalNativeDate(nextValue)),
    required,
    serialize: formatDateFieldValue,
    value: toCalendarDate(value),
  });

  // React Aria's optional props reject `undefined` under
  // exactOptionalPropertyTypes, so unset values are omitted.
  return (
    <DateFieldPrimitive<CalendarDate>
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
        : { defaultValue: toCalendarDate(defaultValue) })}
      granularity="day"
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
          iconMode={iconMode}
          insetStart={insetStart}
          openPickerLabel={openPickerLabel}
          profile={profile}
          readOnly={readOnly}
          required={required}
          resolvedSize={resolvedSize}
          segmented={segmented}
          textSize={textSize}
          variant={variant}
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
  iconMode,
  insetStart,
  openPickerLabel,
  profile,
  readOnly,
  required,
  resolvedSize,
  segmented,
  textSize,
  variant,
}: {
  calendarProps: CalendarOptions | undefined;
  className: string | undefined;
  controlled: boolean;
  controlledInvalid: boolean | undefined;
  dateFieldState: DateFieldState;
  defaultValue: Date | undefined;
  field: FieldControlBridge;
  form: string | undefined;
  iconMode: "action-end" | "decorative-start" | "none";
  insetStart: boolean;
  openPickerLabel: string;
  profile: "default" | "input-group";
  readOnly: boolean | undefined;
  required: boolean | undefined;
  resolvedSize: SiteplaneControlSize;
  segmented: SegmentedValue<CalendarDate>;
  textSize: FormControlTextSize | undefined;
  variant: FormControlVariant;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const segmentsRef = React.useRef<HTMLDivElement>(null);
  const hiddenInputRef = useFormReset<HTMLInputElement>(form, () => {
    if (!controlled) dateFieldState.setValue(toCalendarDate(defaultValue));
  });
  // A cleared segment leaves the field without a value, although React Aria
  // still holds the last complete date.
  const cleared = hasClearedSegment(dateFieldState);
  const ownerValue = dateFieldState.value as CalendarDate | null;
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
        <DateSegmentPrimitive
          className="sp-date-field-segment sp-date-segment"
          data-literal-kind={
            segment.type === "literal" && /[./-]/.test(segment.text)
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
      )}
    </DateInputPrimitive>
  );
  const control = (
    <InputGroup
      aria-label={undefined}
      // As wide as the segments by default, like the Date Time Picker; a width
      // utility in className, such as w-full, replaces it. The default width
      // never shrinks below the segments in a flex row (shrink-0 while w-max).
      className={cn(
        "sp-date-field-control w-max [&.w-max]:shrink-0",
        className,
      )}
      data-icon-mode={iconMode}
      data-invalid={invalid || undefined}
      data-readonly={(readOnly && !field.disabled) || undefined}
      data-size={resolvedSize}
      data-slot="date-field-control"
      // The segments take the field text scale, as Input does: 14 px, or
      // 16 px at xl; textSize sets one size for every control size.
      textSize={textSize ?? (resolvedSize === "xl" ? "base" : undefined)}
      variant={variant}
    >
      {iconMode === "decorative-start" ? (
        <InputGroupAddon
          align="inline-start"
          aria-hidden="true"
          className="sp-date-field-icon-addon pointer-events-none"
        >
          <CalendarDaysIcon
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
                size={dateFieldActionSizes[resolvedSize]}
              />
            }
          >
            <CalendarDaysIcon aria-hidden="true" />
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
            sideOffset={6}
            viewportPadding="compact"
          >
            <Calendar
              {...calendarProps}
              aria-label="Choose date"
              data-slot="date-field-calendar"
              onValueChange={(nextValue) => {
                dateFieldState.setValue(fromNativeDate(nextValue));
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
