"use client";

import * as React from "react";
import { useFormReset } from "../../system/form/use-form-reset";
import {
  Button as ColorButtonPrimitive,
  ColorArea as ColorAreaPrimitive,
  ColorField as ColorFieldPrimitive,
  ColorPicker as ColorPickerPrimitive,
  ColorSlider as ColorSliderPrimitive,
  ColorSwatch as ColorSwatchPrimitive,
  ColorThumb as ColorThumbPrimitive,
  Dialog as ColorDialogPrimitive,
  DialogTrigger as ColorDialogTriggerPrimitive,
  Input as ColorInputPrimitive,
  Popover as ColorPopoverPrimitive,
  SliderTrack as ColorSliderTrackPrimitive,
  parseColor,
} from "react-aria-components";

import {
  type SiteplaneControlSize,
  type SiteplaneRadius,
  SiteplaneUIPortalScope,
  useResolvedControlSize,
  useResolvedRadius,
} from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { CopyRedrawIcon, useCopyIconPhase } from "../action-icons/action-icons";
import { Button, type ButtonProps } from "../button/button";
import {
  noOwnerValidation,
  useFieldControlBridge,
  useFieldControlProxy,
} from "../field/field-control-bridge";
import {
  ColorSwatchFace,
  type ColorSwatchIndicator,
} from "../color-swatch-picker/color-swatch-face";
import { ExternalInputOwner, Input } from "../input/input";

import "./color-picker.css";

/** The accessible names of the controls in the picker's popover. */
export type ColorPickerLabels = {
  /** The popover's dialog. */
  controls: string;
  /** The saturation and brightness area. */
  saturation: string;
  /** The hue slider. */
  hue: string;
  /** The hex value field. */
  hex: string;
  /** The copy button. */
  copy: string;
  /** The copy button while its check confirms a copy. */
  copied: string;
  /** The red, green and blue channel fields. */
  red: string;
  green: string;
  blue: string;
};

const defaultColorPickerLabels: ColorPickerLabels = {
  controls: "Color controls",
  saturation: "Color saturation and brightness",
  hue: "Color hue",
  hex: "Hex color value",
  copy: "Copy hex value",
  copied: "Copied hex value",
  red: "R color channel",
  green: "G color channel",
  blue: "B color channel",
};

/**
 * The props the picker supports. The form value is a hidden input the picker
 * owns, so it takes no other input props.
 */
export interface ColorPickerProps {
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
  /** The id of the form the color belongs to. */
  form?: string | undefined;
  /** The trigger's id. */
  id?: string | undefined;
  /** Replaces the English names of the controls in the popover. */
  labels?: Partial<ColorPickerLabels> | undefined;
  /** Submits the hex value under this name; a Field name takes precedence. */
  name?: string | undefined;
  /**
   * Shows and submits the color; the controls open for reading and copying,
   * but the color does not change, as in ColorSwatchPicker.
   */
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  /** The trigger's style. */
  style?: React.CSSProperties | undefined;
  /** -1 takes the trigger out of the tab order. */
  tabIndex?: number | undefined;
  /** Controlled hex value. Omit for uncontrolled usage. */
  value?: string;
  /** Uncontrolled initial hex value. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Controlled open state of the popover. Omit for uncontrolled usage. */
  open?: boolean;
  /** Uncontrolled initial open state of the popover. */
  defaultOpen?: boolean;
  /** Called when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
  showValue?: boolean;
  size?: SiteplaneControlSize;
  /**
   * `swatch` shows the trigger as a bare swatch of the current color, drawn
   * like a ColorSwatchPicker swatch, for a color row that ends in a custom
   * color. The default is an outlined button with the color and its hex value.
   */
  variant?: "default" | "swatch";
  /** `swatch` only: the swatch is the chosen color of its row. */
  selected?: boolean;
  /** `swatch` only: how a selected swatch shows it, as ColorSwatchPicker. */
  indicator?: ColorSwatchIndicator;
}

export function ColorPicker({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  defaultOpen,
  defaultValue = "#000000",
  disabled: disabledProp,
  form,
  id,
  indicator = "check",
  labels,
  name: nameProp,
  onOpenChange,
  onValueChange,
  open,
  readOnly = false,
  required,
  selected,
  showValue = true,
  size,
  style,
  tabIndex,
  value,
  variant = "default",
}: ColorPickerProps): React.ReactElement {
  // Inside a Field, FieldLabel names the trigger, FieldDescription and
  // FieldError describe it, and the Field supplies name and disabled state.
  const field = useFieldControlBridge({
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    disabled: disabledProp,
    name: nameProp,
  });
  const disabled = field.disabled;
  const name = field.name;
  const text = { ...defaultColorPickerLabels, ...labels };
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const resolvedSize = useResolvedControlSize(size);
  const radius = useResolvedRadius<SiteplaneRadius>(undefined);
  const swatch = variant === "swatch";
  const controlled = value !== undefined;
  const [resetKey, setResetKey] = React.useState(0);
  const formMarkerRef = useFormReset<HTMLInputElement>(form, () => {
    if (!controlled) setResetKey((current) => current + 1);
  });
  const normalizedDefault = normalizeHexColor(defaultValue);
  // A read-only picker keeps its color: the value it shows is pinned.
  const normalizedValue =
    controlled || readOnly
      ? normalizeHexColor(value, normalizedDefault)
      : undefined;

  return (
    <ColorPickerPrimitive
      key={resetKey}
      {...(normalizedValue === undefined
        ? { defaultValue: normalizedDefault }
        : { value: normalizedValue })}
      onChange={(color) => {
        if (!readOnly) onValueChange?.(color.toString("hex").toLowerCase());
      }}
    >
      {({ color }) => {
        const current = color.toString("hex").toLowerCase();
        const triggerAriaLabel = field.labelledBy
          ? undefined
          : (ariaLabel ?? `Choose color ${current.toUpperCase()}`);

        return (
          <span
            className={cn(
              "sp-base-color-picker",
              "contents",
              swatch && "sp-color-swatch-scope",
            )}
            data-foundation="color-picker"
            data-indicator={swatch ? indicator : undefined}
            data-radius={swatch ? radius : undefined}
            data-size={resolvedSize}
            ref={rootRef}
          >
            <ColorDialogTriggerPrimitive
              {...present({ defaultOpen, isOpen: open, onOpenChange })}
            >
              {swatch ? (
                <ColorButtonPrimitive
                  {...present({
                    "aria-current": selected ? ("true" as const) : undefined,
                    "aria-describedby": field.describedBy,
                    "aria-label": triggerAriaLabel,
                    "aria-labelledby": field.labelledBy,
                    id,
                    style,
                  })}
                  className={cn(
                    "sp-color-picker",
                    "sp-color-swatch-item",
                    className,
                  )}
                  data-selected={selected || undefined}
                  data-slot="color-picker"
                  data-variant="swatch"
                  isDisabled={disabled}
                  type="button"
                  {...(tabIndex === -1 ? { excludeFromTabOrder: true } : {})}
                >
                  <ColorSwatchFace
                    color={current}
                    indicator={indicator}
                    selected={selected}
                  />
                </ColorButtonPrimitive>
              ) : (
                <Button
                  aria-describedby={field.describedBy}
                  aria-invalid={
                    ariaInvalid ?? (field.valid === false || undefined)
                  }
                  aria-label={triggerAriaLabel}
                  aria-labelledby={field.labelledBy}
                  className={cn(
                    "sp-color-picker-trigger",
                    showValue && "sp-color-picker-trigger-with-value",
                    className,
                  )}
                  data-show-value={showValue || undefined}
                  data-slot="color-picker"
                  disabled={disabled}
                  id={id}
                  render={<ColorButtonPrimitive isDisabled={disabled} />}
                  size={getTriggerSize(resolvedSize, showValue)}
                  style={style}
                  tabIndex={tabIndex}
                  type="button"
                  variant="outline"
                >
                  <ColorSwatchPrimitive
                    aria-hidden="true"
                    className="sp-color-picker-trigger-swatch"
                    data-slot="color-picker-trigger-swatch"
                  />
                  {showValue ? (
                    <span
                      className="sp-color-picker-value"
                      data-slot="color-picker-value"
                    >
                      {current}
                    </span>
                  ) : null}
                </Button>
              )}
              <ColorPopoverPrimitive
                className={cn(
                  surfaceClassNames.floatingOverlay,
                  "sp-color-picker-popover",
                )}
                data-size={resolvedSize}
                data-slot="color-picker-popover"
                offset={6}
                placement="bottom start"
              >
                <SiteplaneUIPortalScope>
                  <ColorDialogPrimitive
                    aria-label={text.controls}
                    className="sp-color-picker-panel sp-color-picker-dialog"
                    data-slot="color-picker-panel"
                  >
                    <div
                      className="sp-color-picker-saturation-field sp-color-picker-area-frame"
                      data-slot="color-picker-saturation-field"
                    >
                      <ColorAreaPrimitive
                        aria-label={text.saturation}
                        className="sp-color-picker-saturation sp-color-picker-area"
                        colorSpace="hsb"
                        data-slot="color-picker-saturation"
                        isDisabled={disabled || readOnly}
                        xChannel="saturation"
                        yChannel="brightness"
                      >
                        <ColorThumbPrimitive
                          className="sp-color-picker-saturation-thumb sp-color-picker-area-thumb"
                          data-slot="color-picker-saturation-thumb"
                        />
                      </ColorAreaPrimitive>
                    </div>

                    <div className="sp-color-picker-hue-row">
                      <ColorSwatchPrimitive
                        aria-hidden="true"
                        className="sp-color-picker-current-swatch"
                        data-slot="color-picker-current-swatch"
                      />
                      <ColorSliderPrimitive
                        aria-label={text.hue}
                        channel="hue"
                        className="sp-color-picker-hue"
                        colorSpace="hsb"
                        data-slot="color-picker-hue"
                        isDisabled={disabled || readOnly}
                      >
                        <ColorSliderTrackPrimitive
                          className="sp-color-picker-hue-track"
                          data-slot="color-picker-hue-track"
                        >
                          <ColorThumbPrimitive
                            className="sp-color-picker-hue-thumb"
                            data-slot="color-picker-hue-thumb"
                          />
                        </ColorSliderTrackPrimitive>
                      </ColorSliderPrimitive>
                    </div>

                    <div className="sp-color-picker-hex-row">
                      <ColorFieldPrimitive
                        aria-label={text.hex}
                        className="contents"
                        isDisabled={disabled}
                        isReadOnly={readOnly}
                      >
                        <ColorTextInput
                          className="sp-color-picker-hex-input"
                          size={resolvedSize}
                          spellCheck={false}
                        />
                      </ColorFieldPrimitive>
                      <ColorCopyButton
                        copiedLabel={text.copied}
                        copyLabel={text.copy}
                        disabled={disabled}
                        size={resolvedSize}
                        value={current}
                      />
                    </div>

                    <div className="sp-color-picker-channels">
                      <ColorChannelField
                        channel="red"
                        disabled={disabled}
                        label="R"
                        name={text.red}
                        readOnly={readOnly}
                        size={resolvedSize}
                      />
                      <ColorChannelField
                        channel="green"
                        disabled={disabled}
                        label="G"
                        name={text.green}
                        readOnly={readOnly}
                        size={resolvedSize}
                      />
                      <ColorChannelField
                        channel="blue"
                        disabled={disabled}
                        label="B"
                        name={text.blue}
                        readOnly={readOnly}
                        size={resolvedSize}
                      />
                    </div>
                  </ColorDialogPrimitive>
                </SiteplaneUIPortalScope>
              </ColorPopoverPrimitive>
            </ColorDialogTriggerPrimitive>
            <Input
              disabled={disabled}
              form={form}
              name={name}
              readOnly
              required={required}
              type="hidden"
              value={current}
            />
            <Input
              aria-hidden="true"
              disabled
              form={form}
              ref={formMarkerRef}
              type="hidden"
            />
            {field.inField ? (
              <ColorPickerFieldProxy
                disabled={disabled}
                focusTarget={() =>
                  rootRef.current?.querySelector<HTMLElement>(
                    '[data-slot="color-picker"]',
                  ) ?? null
                }
                form={form}
                name={name}
                readOnly={readOnly}
                required={required}
                value={current}
              />
            ) : null}
          </span>
        );
      }}
    </ColorPickerPrimitive>
  );
}

// Inside a Field, a visually hidden proxy registers the picker with Field and
// Form like the date fields: FieldLabel focuses the trigger, and Form values
// include the color.
function ColorPickerFieldProxy({
  disabled,
  focusTarget,
  form,
  name,
  readOnly,
  required,
  value,
}: {
  disabled: boolean;
  focusTarget: () => HTMLElement | null;
  form: string | undefined;
  name: string | undefined;
  readOnly: boolean;
  required: boolean | undefined;
  value: string;
}): React.ReactElement | null {
  const proxyProps = useFieldControlProxy({
    controlled: false,
    disabled,
    displayValidation: noOwnerValidation,
    focusTarget,
    form,
    name,
    onRevalidate: () => {},
    realtimeValidation: noOwnerValidation,
    required,
    value,
  });

  return proxyProps ? (
    <ExternalInputOwner>
      <Input nativeInput readOnly={readOnly} unstyled {...proxyProps} />
    </ExternalInputOwner>
  ) : null;
}

function ColorChannelField({
  channel,
  disabled,
  label,
  name,
  readOnly,
  size,
}: {
  channel: "blue" | "green" | "red";
  disabled: boolean;
  /** The letter beside the field, hidden from assistive technology. */
  label: "B" | "G" | "R";
  /** The field's accessible name. */
  name: string;
  readOnly: boolean;
  size: SiteplaneControlSize;
}): React.ReactElement {
  return (
    <ColorFieldPrimitive
      aria-label={name}
      channel={channel}
      className="sp-color-picker-channel"
      colorSpace="rgb"
      isDisabled={disabled}
      isReadOnly={readOnly}
    >
      <ColorTextInput
        className="sp-color-picker-channel-input"
        inputMode="numeric"
        size={size}
      />
      <span aria-hidden="true">{label}</span>
    </ColorFieldPrimitive>
  );
}

function ColorTextInput({
  className,
  inputMode,
  size,
  spellCheck,
}: {
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  size: SiteplaneControlSize;
  spellCheck?: boolean;
}): React.ReactElement {
  // The React Aria color field labels this input; an enclosing Field belongs
  // to the picker trigger.
  return (
    <ExternalInputOwner>
      <Input
        className={className}
        inputMode={inputMode}
        renderInput={<ColorInputPrimitive />}
        size={size}
        spellCheck={spellCheck}
      />
    </ExternalInputOwner>
  );
}

function ColorCopyButton({
  copiedLabel,
  copyLabel,
  disabled,
  size,
  value,
}: {
  copiedLabel: string;
  copyLabel: string;
  disabled?: boolean;
  size: SiteplaneControlSize;
  value: string;
}): React.ReactElement {
  const { copyPhase, isShowingCheck, playCopyFeedback } = useCopyIconPhase();

  async function copy() {
    if (await copyTextToClipboard(value)) playCopyFeedback();
  }

  return (
    <Button
      aria-label={isShowingCheck ? copiedLabel : copyLabel}
      disabled={disabled}
      onClick={copy}
      size={getCopyButtonSize(size)}
      type="button"
      variant="outline"
    >
      <CopyRedrawIcon phase={copyPhase} />
    </Button>
  );
}

// Props that are set, for components that do not accept an explicit undefined.
function present<T extends Record<string, unknown>>(
  props: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

function getTriggerSize(
  size: SiteplaneControlSize,
  showValue: boolean,
): ButtonProps["size"] {
  if (!showValue) {
    if (size === "sm") return "icon-sm";
    if (size === "lg") return "icon-lg";
    if (size === "xl") return "icon-xl";
    return "icon-md";
  }

  return size;
}

function getCopyButtonSize(
  size: SiteplaneControlSize,
): "icon-lg" | "icon-md" | "icon-sm" | "icon-xl" {
  if (size === "sm") return "icon-sm";
  if (size === "lg") return "icon-lg";
  if (size === "xl") return "icon-xl";
  return "icon-md";
}

function normalizeHexColor(
  value: string | undefined,
  fallback = "#000000",
): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;

  const withHash = candidate.startsWith("#") ? candidate : `#${candidate}`;

  try {
    return parseColor(withHash).toString("hex").toLowerCase();
  } catch {
    return fallback;
  }
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall back to selection-based copy below.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.readOnly = true;
  textArea.style.left = "-9999px";
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus({ preventScroll: true });
  textArea.select();
  textArea.setSelectionRange(0, value.length);

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}
