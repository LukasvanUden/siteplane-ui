"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";
import {
  ButtonContext,
  Button as PickerButtonPrimitive,
  useSlottedContext,
} from "react-aria-components";

import { type SiteplaneControlSize } from "../../system/provider/siteplane-ui-provider";
import {
  type FormControlTextSize,
  type FormControlTriggerVariant,
} from "../../system/styles/surface";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button } from "../button";

import "./date-picker.css";

/*
 * Kit-internal parts of the date pickers that open from a Button, not public
 * API: the date-picker index does not export this module, and its names may
 * change in any release. The Date Picker, and the Date Range Picker and the
 * Date Time Picker with `trigger="button"`, share them, so the three read and
 * confirm alike.
 */

/**
 * The Button that shows a picker's value and opens its popover. It reads as a
 * field that opens a picker: the raised default Button of the field's size on
 * the Select trigger's surface (Lukas, 4 November 2026: a trigger rests
 * raised, a field you type into inset), its text the field text of that size
 * at the body weight, the field's leading icon, a calendar, at the field's
 * inline padding and 8 px before the value (design-rework.css), and the
 * placeholder colour while there is no value. With `variant="outline"` it is
 * the outline Button instead, transparent in the outline rim, as the Select
 * trigger's outline mode is, for a filter bar or a toolbar; its field states
 * stay the same (design-rework.css). The React Aria picker
 * around it opens the popover and names it "Calendar" and the picker's label;
 * the value it shows ends that name, so assistive technology reads the date
 * the Button shows.
 */
export function DatePickerTrigger({
  children,
  "data-slot": dataSlot,
  disabled,
  empty,
  invalid,
  size,
  textSize,
  valueSlot,
  variant = "default",
}: {
  children: React.ReactNode;
  "data-slot": string;
  disabled: boolean;
  /** The picker holds no value, so the trigger shows its placeholder. */
  empty: boolean;
  invalid: boolean;
  size: SiteplaneControlSize | undefined;
  textSize: FormControlTextSize | undefined;
  /** The slot of the text that shows the value. */
  valueSlot: string;
  /** The trigger's surface: the raised default Button, or the outline one. */
  variant?: FormControlTriggerVariant | undefined;
}): React.ReactElement {
  const valueId = React.useId();
  const pickerLabelledBy =
    useSlottedContext(ButtonContext)?.["aria-labelledby"];

  return (
    <Button
      aria-labelledby={
        pickerLabelledBy ? `${pickerLabelledBy} ${valueId}` : undefined
      }
      // The trigger names its size on the field scale (date-picker.css), so
      // its text and a Field's hint follow it.
      className="sp-picker-trigger sp-field-scale w-full justify-start"
      // A picker trigger reads as a field, which flashes no border when a
      // press ends (Button's flashesBorder).
      data-flash={false}
      data-invalid={invalid || undefined}
      data-slot={dataSlot}
      data-text-size={textSize}
      disabled={disabled}
      render={<PickerButtonPrimitive />}
      size={size}
      variant={variant}
    >
      <CalendarBlankIcon aria-hidden="true" />
      <span
        className={cn(
          slotClass(valueSlot),
          // A trigger narrower than its value, such as one a flex row lets
          // shrink, ends the value with an ellipsis inside the Button, as a
          // Select trigger does (rulebook K5); the whole value stays the
          // Button's name.
          "truncate",
          empty && "text-muted-foreground",
        )}
        data-slot={valueSlot}
        id={valueId}
      >
        {children}
      </span>
    </Button>
  );
}

/**
 * The panel of a picker that confirms its value: a body, and the footer under
 * it. Beside a calendar's list of shortcuts (`aside`) the calendar fills the
 * body and the footer stands under the months, so the list runs down the
 * panel's whole height.
 */
export function DatePickerPanel({
  aside = false,
  children,
  footer,
}: {
  aside?: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className="sp-date-picker-panel"
      data-aside={aside || undefined}
      data-slot="date-picker-panel"
    >
      <div
        className="sp-date-picker-panel-body"
        data-slot="date-picker-panel-body"
      >
        {children}
      </div>
      {footer}
    </div>
  );
}

/**
 * The footer of a picker's panel: what the picker shows at its start, such as
 * typed dates, and Cancel and Apply at its end. `fill` lets Cancel and Apply
 * share the footer in two equal halves, never narrower than their words.
 */
export function DatePickerFooter({
  actionLayout,
  applyDisabled = false,
  children,
  onApply,
  onCancel,
}: {
  actionLayout?: "fill" | undefined;
  applyDisabled?: boolean;
  children?: React.ReactNode;
  onApply: () => void;
  onCancel: () => void;
}): React.ReactElement {
  const messages = useSiteplaneMessages("datePicker");
  return (
    <div className="sp-date-picker-footer" data-slot="date-picker-footer">
      {children ? (
        <div
          className="sp-date-picker-footer-start"
          data-slot="date-picker-footer-start"
        >
          {children}
        </div>
      ) : null}
      <div
        className="sp-date-picker-actions"
        data-action-layout={actionLayout}
        data-slot="date-picker-actions"
      >
        <Button data-slot="date-picker-cancel" onClick={onCancel}>
          {messages.cancel}
        </Button>
        <Button
          data-slot="date-picker-apply"
          disabled={applyDisabled}
          onClick={onApply}
          variant="accent"
        >
          {messages.apply}
        </Button>
      </div>
    </div>
  );
}
