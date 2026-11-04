"use client";

import * as React from "react";

import { useFormReset } from "../../system/form/use-form-reset";
import { useTruncated } from "../../system/hooks/use-truncated";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import type { FormControlVariant } from "../../system/styles/surface";
import { Button } from "../button";
import {
  useFieldControlBridge,
  useFieldValueInput,
} from "../field/field-control-bridge";
import { ExternalInputOwner, Input, unnamedInputRender } from "../input/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../input-group/input-group";
import { Spinner } from "../spinner";
import {
  fileNames,
  opensFileDialog,
  selectedFiles,
} from "./file-input-selection";

import "./file-input.css";

export type FileInputProps = Omit<
  React.ComponentProps<"div">,
  | "aria-describedby"
  | "aria-invalid"
  | "aria-label"
  | "aria-labelledby"
  | "children"
  | "defaultValue"
  | "id"
  | "onChange"
  | "placeholder"
> & {
  /** The control size, as Input takes it; unset, the provider's. */
  size?: SiteplaneControlSize | undefined;
  /** The surface of the field, as Input's. */
  variant?: FormControlVariant | undefined;
  /** What the field shows while no file is chosen. */
  placeholder?: string | undefined;
  /** The label of the button that opens the file dialog. */
  buttonText?: string | undefined;
  /** The file types the dialog offers, as on a native file input. */
  accept?: string | undefined;
  /** Lets the user choose several files at once. */
  multiple?: boolean | undefined;
  /** The name of the files in the form data; a Field's name comes first. */
  name?: string | undefined;
  /** The id of the form that the files belong to. */
  form?: string | undefined;
  /** A form submits only with a file chosen. */
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  /**
   * Shows a spinner at the end of the field, such as while the chosen file
   * uploads. The field and its button stay usable.
   */
  loading?: boolean | undefined;
  /**
   * Called with the chosen files when the user picks files, and with null
   * when the field is emptied, as a reset of its form does.
   */
  onFilesChange?: ((files: FileList | null) => void) | undefined;
  /** The id of the field's text, which a label's `htmlFor` names. */
  id?: string | undefined;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
};

/**
 * A field for choosing files: a read-only text that shows the placeholder or
 * the names of the chosen files, and an Upload button as a segment at its
 * end. A click anywhere on the field, or Enter or Space on its text or its
 * button, opens the file dialog. A file input out of sight holds the chosen
 * files, so a form around the field sends them under its name.
 *
 * It is an InputGroup: the text is an InputGroupInput, which takes a Field's
 * label, description, error and state as an Input does, and the button, a
 * ghost Button, fills a bare addon after a divider. The file input's own constraints, such as
 * `required`, are the Field's validity.
 */
export function FileInput({
  accept,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  buttonText: buttonTextProp,
  disabled,
  form,
  id,
  loading = false,
  multiple,
  name,
  onClick,
  onFilesChange,
  placeholder: placeholderProp,
  required,
  size,
  variant,
  ...props
}: FileInputProps): React.ReactElement {
  const messages = useSiteplaneMessages("fileInput");
  const buttonText = buttonTextProp ?? messages.button;
  const placeholder = placeholderProp ?? messages.placeholder;
  const resolvedSize = useResolvedControlSize<SiteplaneControlSize>(size);
  // The name and the disabled state of a Field reach the file input and the
  // button; the text takes the Field's as any Input does.
  const field = useFieldControlBridge({ disabled, name });
  const textRef = React.useRef<HTMLInputElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const valueInput = useFieldValueInput(textRef);
  const registerValueInput = valueInput.ref;
  const [names, setNames] = React.useState("");
  const [truncatedRef, truncated] = useTruncated<HTMLInputElement>();
  // The files the input held when the dialog opened, and whether it is open.
  const keptFiles = React.useRef<File[]>([]);
  const dialogOpen = React.useRef(false);
  const resetRef = useFormReset<HTMLInputElement>(form, () => {
    // A reset of the form empties its file input.
    if (!names) return;
    setNames("");
    onFilesChange?.(null);
  });

  function openFileDialog() {
    const input = fileRef.current;
    if (!input || field.disabled) return;
    // Emptied, so a file that is picked again is reported again.
    keptFiles.current = Array.from(input.files ?? []);
    dialogOpen.current = true;
    input.value = "";
    input.click();
  }

  const setText = React.useCallback(
    (input: HTMLInputElement | null) => {
      textRef.current = input;
      const stop = truncatedRef(input);
      return () => {
        stop?.();
        textRef.current = null;
      };
    },
    [truncatedRef],
  );

  const setFileInput = React.useCallback(
    (input: HTMLInputElement | null) => {
      fileRef.current = input;
      resetRef.current = input;
      if (!input) return undefined;
      const unregister = registerValueInput(input);
      // A dialog that is cancelled leaves the files the input held.
      const restore = () => {
        dialogOpen.current = false;
        const kept = keptFiles.current;
        if (kept.length === 0 || (input.files?.length ?? 0) > 0) return;
        const transfer = new DataTransfer();
        for (const file of kept) transfer.items.add(file);
        input.files = transfer.files;
      };
      input.addEventListener("cancel", restore);
      return () => {
        input.removeEventListener("cancel", restore);
        unregister?.();
        fileRef.current = null;
        resetRef.current = null;
      };
    },
    [registerValueInput, resetRef],
  );

  return (
    <InputGroup
      data-slot="file-input"
      // The field of the size: its height, padding and text (the field scale).
      size={resolvedSize}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) openFileDialog();
      }}
      variant={variant}
    >
      {/* The file input holds the files for the form. It is out of sight
          but focusable, so a browser can point at it when a required file
          is missing, and it stands first, at the field's start, where a
          browser points at any input. Its own click, which opens the
          dialog, stays with it. */}
      <ExternalInputOwner>
        <Input
          accept={accept}
          aria-hidden="true"
          className="sr-only"
          disabled={field.disabled}
          form={form}
          multiple={multiple}
          name={field.name}
          nativeInput
          onChange={(event) => {
            dialogOpen.current = false;
            const files = selectedFiles(event.currentTarget.files);
            const next = fileNames(files);
            setNames(next);
            valueInput.change(next);
            onFilesChange?.(files);
          }}
          onClick={(event) => event.stopPropagation()}
          ref={setFileInput}
          required={required}
          size={resolvedSize}
          tabIndex={-1}
          type="file"
          unstyled
        />
      </ExternalInputOwner>
      <InputGroupInput
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-required={required || undefined}
        disabled={disabled}
        id={id}
        name={name}
        // While the dialog is open the file input is empty, so the Field
        // checks nothing then: not on the Enter that opens it, which also
        // stops the form's submit, and not when the page behind it blurs.
        onBlur={(event) => {
          if (dialogOpen.current) event.preventBaseUIHandler();
        }}
        onKeyDown={(event) => {
          if (event.repeat || !opensFileDialog(event.key)) return;
          event.preventDefault();
          event.preventBaseUIHandler();
          openFileDialog();
        }}
        placeholder={placeholder}
        readOnly
        ref={setText}
        // Base UI writes the Field's name on the input it renders. The names
        // shown are not the form value, the files are: the text renders
        // without a name, so a form sends only the file input.
        render={unnamedInputRender}
        title={truncated ? names : undefined}
        value={names}
      />
      {loading ? (
        <InputGroupAddon align="inline-end">
          <Spinner />
        </InputGroupAddon>
      ) : null}
      {/* The Upload segment is the flat segment of an Input Group, the
          ghost Button on the field after its divider, as the Copy segment
          (Lukas, 3 November 2026; rulebook S14, P3b). It was the raised
          default Button, the only segment with a fill of its own. */}
      <InputGroupAddon align="inline-end" divider padding="none">
        <Button
          data-slot="file-input-button"
          disabled={field.disabled}
          size={resolvedSize}
          type="button"
          variant="ghost"
        >
          {buttonText}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
