"use client";

import {
  QuestionIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import * as React from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { Button } from "../button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../tooltip";

/*
 * Kit-internal: the status at the end of a field. Not public API: the
 * input-group index does not export this module, and its names may change in
 * any release. InputGroup renders it for every field built on it (Input with
 * `tooltip`, Date Field, Time Field, Date Range Picker, Date Time Picker, File
 * Input, Prompt Input), and a plain Input renders its alert icon with it;
 * input-group.css lays it out and shows it.
 */

/**
 * The alert icon of an invalid field: the "!" in a circle that FieldError
 * shows beside its message, a trailing icon of 16 px (rulebook I3) in the
 * error foreground. It is decorative: the Field ties the error message to the
 * control.
 */
export function InputInvalidIcon(): React.ReactElement {
  return (
    <WarningCircleIcon
      aria-hidden="true"
      className="sp-input-invalid-icon"
      data-slot="input-invalid-icon"
    />
  );
}

/**
 * The help of a field: a help icon, the field action that shows its children
 * in a Tooltip above it on hover and keyboard focus, named by `aria-label`.
 * Screen readers hear the help text as its description at all times, also on
 * a touch screen, where no tooltip opens: the Tooltip's
 * `describeTrigger="always"` keeps the popup in the page and names it from the
 * button (Lukas, 4 November 2026; the button carried a hidden copy of the text
 * that it named itself). A click keeps the tooltip open, as a click on a help
 * icon asks for the help. Assistive technology reads the text through that
 * link, so the popup is hidden from it and the text is not read twice. It
 * stands at the end of a field (`input-group-tooltip`) or after the text of
 * its label (`field-label-help`, FieldLabel and SelectLabel `tooltip`).
 */
export function FieldHelp({
  "aria-label": ariaLabelProp,
  children,
  slot = "input-group-tooltip",
}: {
  "aria-label"?: string | undefined;
  children: React.ReactNode;
  slot?: "input-group-tooltip" | "field-label-help" | undefined;
}): React.ReactElement {
  const messages = useSiteplaneMessages("inputGroup");
  const ariaLabel = ariaLabelProp ?? messages.help;
  return (
    <Tooltip describeTrigger="always">
      <TooltipTrigger
        closeOnClick={false}
        render={
          <Button
            aria-label={ariaLabel}
            data-slot={slot}
            profile="field-action"
            shape="square"
            type="button"
          >
            <QuestionIcon aria-hidden="true" />
          </Button>
        }
      />
      <TooltipPopup aria-hidden>{children}</TooltipPopup>
    </Tooltip>
  );
}

/** Whether a help text was given: not unset, false or empty. */
export function hasFieldHelp(tooltip: React.ReactNode): boolean {
  return (
    tooltip !== undefined &&
    tooltip !== null &&
    tooltip !== false &&
    tooltip !== ""
  );
}

/**
 * The status at the end of a field, right after its text: the help icon of
 * `tooltip`, and the alert icon of an invalid field (`alert`), which takes the
 * help icon's place while the field is invalid, so the help text is passed in
 * every state. Both stand in the 24 px box of a field action, so the 16 px
 * glyph ends at the field's inline padding and the text ends 8 px before it
 * (rulebook I3, I4). It shows nothing while the field is valid and has no
 * help (input-group.css).
 */
export function FieldStatus({
  alert,
  tooltip,
}: {
  alert: boolean;
  tooltip?: React.ReactNode;
}): React.ReactElement | null {
  const help = hasFieldHelp(tooltip);
  if (!alert && !help) return null;
  return (
    <span
      className="sp-field-status"
      data-alert={alert ? "" : undefined}
      data-help={help ? "" : undefined}
      data-slot="field-status"
    >
      {help ? <FieldHelp>{tooltip}</FieldHelp> : null}
      {alert ? <InputInvalidIcon /> : null}
    </span>
  );
}
