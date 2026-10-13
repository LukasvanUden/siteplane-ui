"use client";

import {
  getLocalTimeZone,
  Time,
  today,
  toCalendarDateTime,
} from "@internationalized/date";
import { ClockIcon } from "lucide-react";
import { animate } from "motion/react";
import * as React from "react";
import {
  DateInput as DateInputPrimitive,
  DateSegment as DateSegmentPrimitive,
  TimeField as TimeFieldPrimitive,
  type TimeFieldState,
  useLocale,
} from "react-aria-components";

import { isInvalidAriaValue } from "../../system/form/aria-invalid";
import { useFormReset } from "../../system/form/use-form-reset";
import { getMotionTransitionFromCss } from "../../system/motion/css-transition";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  formControlTextClassNames,
  type FormControlTextSize,
  type FormControlVariant,
} from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { Button } from "../button";
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
import { ListBox, ListBoxItem } from "../list-box";
import { Popover, PopoverPopup, PopoverTrigger } from "../popover";
import { ScrollArea } from "../scroll-area";

import "./time-field.css";

export type TimeFieldValue = {
  hour: number;
  minute: number;
};

/** A 12-hour clock with AM and PM, or a 24-hour clock. */
export type TimeFieldHourCycle = 12 | 24;

export interface TimeFieldProps {
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string;
  "aria-labelledby"?: string | undefined;
  /** Where the segments sit in a field wider than they are. */
  align?: "start" | "center";
  className?: string;
  defaultValue?: TimeFieldValue;
  disabled?: boolean;
  form?: string;
  /**
   * The clock the segments and the selector show: `24` (00 to 23), or `12`
   * with the locale's AM and PM. The value stays in 24-hour time either way.
   */
  hourCycle?: TimeFieldHourCycle;
  hourLabel?: string;
  hoursLabel?: string;
  iconMode?: "action-end" | "decorative-start" | "none";
  minuteLabel?: string;
  minutesLabel?: string;
  minuteStep?: number;
  name?: string;
  /** Reports the time the user set, or `undefined` when the user cleared it. */
  onValueChange?: (value: TimeFieldValue | undefined) => void;
  openPickerLabel?: string;
  readOnly?: boolean;
  required?: boolean;
  size?: SiteplaneControlSize;
  textSize?: FormControlTextSize;
  value?: TimeFieldValue | null;
  variant?: FormControlVariant;
}

const timeFieldActionSizes = {
  md: "icon-xs",
  lg: "icon-xs",
  sm: "icon-2xs",
  xl: "icon-sm",
} as const satisfies Record<
  SiteplaneControlSize,
  "icon-2xs" | "icon-xs" | "icon-sm"
>;

const hourOptions = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);

/**
 * The names of the hour options on a 12-hour clock, such as "09 PM" for 21,
 * in the locale's day period and with the leading zero the segments show.
 * Unset on a 24-hour clock, whose options are the hours themselves. The Time
 * Field and the Date Time Picker selectors share it.
 */
export function useHourOptionLabels(
  hourCycle: TimeFieldHourCycle,
): Record<string, string> | undefined {
  const { locale } = useLocale();

  return React.useMemo(() => {
    if (hourCycle !== 12) return undefined;
    // The segments' own rule: React Aria turns a 12-hour cycle into hour12.
    const format = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      hour12: true,
    });

    return Object.fromEntries(
      hourOptions.map((option) => [
        option,
        format.format(new Date(2000, 0, 1, Number(option))),
      ]),
    );
  }, [hourCycle, locale]);
}

/**
 * A literal that separates two segments, the colon or the space before AM,
 * cancels their padding (time-field.css), so it sits as close to them as in
 * text.
 */
function isSeparatorLiteral(text: string): boolean {
  return text.includes(":") || /^\s+$/.test(text);
}

function normalizeTimeFieldValue(value: TimeFieldValue): TimeFieldValue {
  return {
    hour: Math.min(Math.max(Math.trunc(value.hour) || 0, 0), 23),
    minute: Math.min(Math.max(Math.trunc(value.minute) || 0, 0), 59),
  };
}

function toTime(value: TimeFieldValue | null | undefined): Time | null {
  if (!value) return null;
  const normalized = normalizeTimeFieldValue(value);
  return new Time(normalized.hour, normalized.minute);
}

function fromTime(value: Time): TimeFieldValue {
  return { hour: value.hour, minute: value.minute };
}

function formatTimeFieldValue(value: Time | null): string {
  if (!value) return "";
  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}

function setTimeFieldStateValue(
  state: TimeFieldState,
  value: Time | null,
): void {
  if (!value) {
    state.setValue(null);
    return;
  }

  const dateValue = state.value;
  state.setValue(
    dateValue
      ? dateValue.set({
          hour: value.hour,
          millisecond: value.millisecond,
          minute: value.minute,
          second: value.second,
        })
      : toCalendarDateTime(today(getLocalTimeZone()), value),
  );
}

export function TimeField(props: TimeFieldProps): React.ReactElement {
  return <TimeFieldRoot {...props} />;
}

function TimeFieldRoot({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  align = "start",
  className,
  defaultValue,
  disabled,
  form,
  hourCycle = 24,
  hourLabel,
  hoursLabel = "Hours",
  iconMode = "action-end",
  minuteLabel,
  minutesLabel = "Minutes",
  minuteStep = 5,
  name,
  onValueChange,
  openPickerLabel = "Open time selector",
  readOnly,
  required,
  size,
  textSize,
  value,
  variant = "default",
}: TimeFieldProps): React.ReactElement {
  const controlled = value !== undefined;
  const normalizedDefaultValue = defaultValue
    ? normalizeTimeFieldValue(defaultValue)
    : undefined;
  const resolvedSize = useResolvedControlSize(size);
  const resolvedTextSize =
    textSize ??
    (resolvedSize === "lg" || resolvedSize === "xl" ? "base" : undefined);
  const resolvedMinuteStep = Math.min(
    Math.max(Math.trunc(minuteStep) || 5, 1),
    60,
  );
  const minuteOptions = React.useMemo(
    () =>
      Array.from({ length: Math.ceil(60 / resolvedMinuteStep) }, (_, index) =>
        String(index * resolvedMinuteStep).padStart(2, "0"),
      ),
    [resolvedMinuteStep],
  );
  const field = useFieldControlBridge({
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    disabled,
    name,
  });
  // React Aria validates the time unless the application controls the invalid
  // state through aria-invalid or an invalid Field.
  const controlledInvalid =
    ariaInvalid !== undefined
      ? isInvalidAriaValue(ariaInvalid)
      : field.invalid || undefined;
  // Segment names built from aria-label; a FieldLabel or aria-labelledby
  // names the segments through React Aria instead.
  const namedByLabel = ariaLabel !== undefined && !field.labelledBy;
  // A cleared field, or a cleared segment, is reported as undefined, like
  // DateField.
  const segmented = useSegmentedValue<Time>({
    controlled,
    defaultValue: toTime(normalizedDefaultValue),
    incompleteMessage: "Enter a complete time.",
    onValueChange: (nextValue) =>
      onValueChange?.(nextValue ? fromTime(nextValue) : undefined),
    required,
    serialize: formatTimeFieldValue,
    value: toTime(value ?? null),
  });

  // React Aria's optional props reject `undefined` under
  // exactOptionalPropertyTypes, so unset values are omitted.
  return (
    <TimeFieldPrimitive<Time>
      {...(field.describedBy === undefined
        ? {}
        : { "aria-describedby": field.describedBy })}
      {...(field.labelledBy || ariaLabel === undefined
        ? {}
        : { "aria-label": ariaLabel })}
      {...(field.labelledBy === undefined
        ? {}
        : { "aria-labelledby": field.labelledBy })}
      className="contents"
      data-foundation="time-field"
      data-slot="time-field"
      {...(controlled
        ? { value: segmented.ownerValue }
        : { defaultValue: toTime(normalizedDefaultValue) })}
      granularity="minute"
      hourCycle={hourCycle}
      isDisabled={field.disabled}
      {...(controlledInvalid === undefined
        ? {}
        : { isInvalid: controlledInvalid })}
      {...(readOnly === undefined ? {} : { isReadOnly: readOnly })}
      {...(required === undefined ? {} : { isRequired: required })}
      onChange={segmented.onOwnerChange}
      shouldForceLeadingZeros
      validate={segmented.validate}
    >
      {({ state }) => (
        <TimeFieldContent
          align={align}
          className={className}
          controlled={controlled}
          controlledInvalid={controlledInvalid}
          dayPeriodLabel={namedByLabel ? `${ariaLabel}, AM/PM` : undefined}
          defaultValue={normalizedDefaultValue}
          field={field}
          form={form}
          hourCycle={hourCycle}
          hourLabel={
            hourLabel ?? (namedByLabel ? `${ariaLabel}, hour` : undefined)
          }
          hoursLabel={hoursLabel}
          iconMode={iconMode}
          minuteLabel={
            minuteLabel ?? (namedByLabel ? `${ariaLabel}, minute` : undefined)
          }
          minutesLabel={minutesLabel}
          minuteOptions={minuteOptions}
          openPickerLabel={openPickerLabel}
          readOnly={readOnly}
          required={required}
          resolvedSize={resolvedSize}
          resolvedTextSize={resolvedTextSize}
          segmented={segmented}
          stateValue={(state as TimeFieldState).timeValue as Time | null}
          textSize={textSize}
          timeFieldState={state as TimeFieldState}
          variant={variant}
        />
      )}
    </TimeFieldPrimitive>
  );
}

function TimeFieldContent({
  align,
  className,
  controlled,
  controlledInvalid,
  dayPeriodLabel,
  defaultValue,
  field,
  form,
  hourCycle,
  hourLabel,
  hoursLabel,
  iconMode,
  minuteLabel,
  minutesLabel,
  minuteOptions,
  openPickerLabel,
  readOnly,
  required,
  resolvedSize,
  resolvedTextSize,
  segmented,
  stateValue,
  textSize,
  timeFieldState,
  variant,
}: {
  align: "center" | "start";
  className: string | undefined;
  controlled: boolean;
  controlledInvalid: boolean | undefined;
  dayPeriodLabel: string | undefined;
  defaultValue: TimeFieldValue | undefined;
  field: FieldControlBridge;
  form: string | undefined;
  hourCycle: TimeFieldHourCycle;
  hourLabel: string | undefined;
  hoursLabel: string;
  iconMode: "action-end" | "decorative-start" | "none";
  minuteLabel: string | undefined;
  minutesLabel: string;
  minuteOptions: string[];
  openPickerLabel: string;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  resolvedSize: SiteplaneControlSize;
  resolvedTextSize: FormControlTextSize | undefined;
  segmented: SegmentedValue<Time>;
  stateValue: Time | null;
  textSize: FormControlTextSize | undefined;
  timeFieldState: TimeFieldState;
  variant: FormControlVariant;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const hourOptionLabels = useHourOptionLabels(hourCycle);
  const hoursListBoxRef = React.useRef<HTMLDivElement>(null);
  const segmentsRef = React.useRef<HTMLDivElement>(null);
  const hiddenInputRef = useFormReset<HTMLInputElement>(form, () => {
    if (!controlled)
      setTimeFieldStateValue(timeFieldState, toTime(defaultValue));
  });
  // A cleared segment leaves the field without a value, although React Aria
  // still holds the last complete time.
  const cleared = hasClearedSegment(timeFieldState);
  const fieldValue = cleared ? null : stateValue;
  const serializedValue = formatTimeFieldValue(fieldValue);
  React.useLayoutEffect(() => {
    segmented.sync({ cleared, effective: fieldValue, value: stateValue });
  });
  const invalid =
    controlledInvalid ??
    (timeFieldState.displayValidation.isInvalid || field.valid === false);
  const proxyProps = useFieldControlProxy({
    controlled: controlledInvalid !== undefined,
    disabled: field.disabled,
    displayValidation: timeFieldState.displayValidation,
    focusTarget: () =>
      segmentsRef.current?.querySelector<HTMLElement>(
        '[role="spinbutton"], [role="textbox"]',
      ) ?? null,
    form,
    name: field.name,
    onRevalidate: timeFieldState.commitValidation,
    realtimeValidation: timeFieldState.realtimeValidation,
    required,
    value: serializedValue,
  });
  useFieldErrorSegments(segmentsRef, {
    controlled: controlledInvalid !== undefined,
    ownerInvalid: timeFieldState.isInvalid,
  });
  const optionTextClassName = resolvedTextSize
    ? formControlTextClassNames[resolvedTextSize]
    : "text-base sm:text-sm";
  const control = (
    <InputGroup
      aria-label={undefined}
      // As wide as the segments by default, like the Date Time Picker; a width
      // utility in className, such as w-full, replaces it. The default width
      // never shrinks below the segments in a flex row (shrink-0 while w-max).
      className={cn(
        "siteplane-time-field-control w-max [&.w-max]:shrink-0",
        align === "center" && "siteplane-time-field-control-center",
        className,
      )}
      data-icon-mode={iconMode}
      data-invalid={invalid || undefined}
      data-readonly={(readOnly && !field.disabled) || undefined}
      data-size={resolvedSize}
      data-time-field-align={align}
      // The segments take the field text scale, as Input does: 14 px, or
      // 16 px at xl; textSize sets one size for every control size.
      textSize={textSize ?? (resolvedSize === "xl" ? "base" : undefined)}
      variant={variant}
    >
      {iconMode === "decorative-start" ? (
        <InputGroupAddon
          align="inline-start"
          aria-hidden="true"
          className="siteplane-time-field-decorative-icon pointer-events-none"
        >
          <ClockIcon data-slot="time-field-decorative-icon" />
        </InputGroupAddon>
      ) : null}
      <DateInputPrimitive
        className="siteplane-time-field-input"
        data-slot="time-field-input"
        ref={segmentsRef}
      >
        {(segment) => (
          <TimeFieldSegment
            label={
              segment.type === "hour"
                ? hourLabel
                : segment.type === "minute"
                  ? minuteLabel
                  : segment.type === "dayPeriod"
                    ? dayPeriodLabel
                    : undefined
            }
            segment={segment}
          />
        )}
      </DateInputPrimitive>
      {iconMode === "action-end" ? (
        <InputGroupAddon align="inline-end">
          <PopoverTrigger
            data-slot="time-field-trigger"
            render={
              <Button
                aria-label={openPickerLabel}
                disabled={field.disabled || readOnly}
                profile="field-action"
                size={timeFieldActionSizes[resolvedSize]}
              />
            }
          >
            <ClockIcon aria-hidden="true" />
          </PopoverTrigger>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );

  return (
    <>
      {iconMode === "action-end" ? (
        <Popover onOpenChange={setOpen} open={open}>
          {control}
          <PopoverPopup
            align="end"
            className={cn("siteplane-time-field-popover", optionTextClassName)}
            initialFocus={hoursListBoxRef}
            sideOffset={6}
            viewportPadding="compact"
          >
            <div
              className="siteplane-time-field-selector"
              data-slot="time-field-selector"
            >
              <TimeFieldOptionColumn
                label={hoursLabel}
                listBoxRef={hoursListBoxRef}
                onValueChange={(hour) => {
                  setTimeFieldStateValue(
                    timeFieldState,
                    new Time(Number(hour), stateValue?.minute ?? 0),
                  );
                }}
                open={open}
                optionLabels={hourOptionLabels}
                options={hourOptions}
                slot="time-field-hours"
                value={
                  stateValue
                    ? String(stateValue.hour).padStart(2, "0")
                    : undefined
                }
              />
              <TimeFieldOptionColumn
                label={minutesLabel}
                onValueChange={(minute) => {
                  setTimeFieldStateValue(
                    timeFieldState,
                    new Time(stateValue?.hour ?? 0, Number(minute)),
                  );
                  setOpen(false);
                }}
                open={open}
                options={minuteOptions}
                slot="time-field-minutes"
                value={
                  stateValue
                    ? String(stateValue.minute).padStart(2, "0")
                    : undefined
                }
              />
            </div>
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

function TimeFieldSegment({
  label,
  segment,
}: {
  label: string | undefined;
  segment: React.ComponentProps<typeof DateSegmentPrimitive>["segment"];
}): React.ReactElement {
  const ref = React.useRef<HTMLSpanElement>(null);

  // React Aria re-renders its own segment name, so the custom name is applied
  // after every render.
  React.useLayoutEffect(() => {
    if (label) ref.current?.setAttribute("aria-label", label);
  });

  return (
    <DateSegmentPrimitive
      className="siteplane-time-field-segment"
      data-literal-kind={
        segment.type === "literal" && isSeparatorLiteral(segment.text)
          ? "separator"
          : undefined
      }
      data-slot="time-field-segment"
      ref={ref}
      segment={segment}
    />
  );
}

export function TimeFieldOptionColumn({
  label,
  listBoxRef: providedListBoxRef,
  onValueChange,
  open,
  optionLabels,
  options,
  slot,
  value,
}: {
  label: string;
  listBoxRef?: React.RefObject<HTMLDivElement | null>;
  onValueChange: (value: string) => void;
  open: boolean;
  /** The names the options show, where they differ from their values. */
  optionLabels?: Record<string, string> | undefined;
  options: string[];
  slot: "time-field-hours" | "time-field-minutes";
  value: string | undefined;
}): React.ReactElement {
  const localListBoxRef = React.useRef<HTMLDivElement | null>(null);
  const listBoxRef = providedListBoxRef ?? localListBoxRef;
  const pendingScrollStartRef = React.useRef<number | null>(null);
  const previousValueRef = React.useRef(value);
  const scrollAnimationRef = React.useRef<ReturnType<typeof animate> | null>(
    null,
  );

  React.useLayoutEffect(() => {
    const valueChanged = previousValueRef.current !== value;
    previousValueRef.current = value;

    if (!open) {
      scrollAnimationRef.current?.stop();
      return;
    }

    let frame = 0;
    const listBox = listBoxRef.current;
    if (!listBox) return;

    const centerSelectedOption = () => {
      const selected = listBox.querySelector<HTMLElement>("[data-selected]");
      const viewport = selected?.closest<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      if (!selected || !viewport) {
        return false;
      }

      const selectedRect = selected.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      const targetScrollTop = Math.min(
        viewport.scrollHeight - viewport.clientHeight,
        Math.max(
          0,
          viewport.scrollTop +
            selectedRect.top -
            viewportRect.top -
            (viewport.clientHeight - selectedRect.height) / 2,
        ),
      );
      const shouldAnimate =
        valueChanged &&
        document.documentElement.dataset.motionReduce !== "true" &&
        !viewport.closest('[data-sp-motion="reduced"]') &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scrollStart = pendingScrollStartRef.current ?? viewport.scrollTop;
      pendingScrollStartRef.current = null;

      scrollAnimationRef.current?.stop();

      if (!shouldAnimate) {
        viewport.scrollTop = targetScrollTop;
        return true;
      }

      viewport.scrollTop = scrollStart;
      scrollAnimationRef.current = animate(scrollStart, targetScrollTop, {
        ...getMotionTransitionFromCss(
          viewport,
          "--motion-duration-moderate",
          "--motion-ease-standard",
        ),
        onUpdate: (scrollTop) => {
          viewport.scrollTop = scrollTop;
        },
      });
      return true;
    };

    const observer = new MutationObserver(() => {
      if (centerSelectedOption()) observer.disconnect();
    });
    observer.observe(listBox, {
      attributeFilter: ["data-selected"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    frame = window.requestAnimationFrame(() => {
      if (centerSelectedOption()) observer.disconnect();
    });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [open, value]);

  React.useEffect(() => () => scrollAnimationRef.current?.stop(), []);

  const captureScrollStart = () => {
    const viewport = listBoxRef.current?.closest<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    pendingScrollStartRef.current = viewport?.scrollTop ?? null;
  };

  return (
    <div className="siteplane-time-field-column" data-slot={slot}>
      <span className="siteplane-time-field-column-label">{label}</span>
      <ScrollArea
        className="siteplane-time-field-scroll-area"
        scrollFade
        scrollbar="hidden"
      >
        <ListBox
          aria-label={label}
          className="siteplane-time-field-listbox"
          onPointerDownCapture={captureScrollStart}
          onValueChange={onValueChange}
          ref={listBoxRef}
          selectionAppearance="row"
          size="md"
          value={value}
        >
          {options.map((option) => (
            <ListBoxItem
              className="siteplane-time-field-option justify-center font-normal"
              data-slot="time-field-option"
              key={option}
              multiline={false}
              value={option}
            >
              {optionLabels?.[option] ?? option}
            </ListBoxItem>
          ))}
        </ListBox>
      </ScrollArea>
    </div>
  );
}
