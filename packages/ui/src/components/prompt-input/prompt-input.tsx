"use client";

import { ArrowUpIcon, PaperclipIcon, SquareIcon } from "lucide-react";
import * as React from "react";

import { useRelativeControlSize } from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button, type ButtonBaseProps, type ButtonProps } from "../button";
import { Form } from "../form";
import { Input } from "../input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "../input-group";
import { MotionSwap } from "../motion";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../tooltip";
import {
  sendDraft,
  submitOnEnterKey,
  submitState,
  type PromptInputStatus,
  type PromptInputSubmitOnEnter,
} from "./prompt-input-keys";

import "./prompt-input.css";

export type { PromptInputStatus, PromptInputSubmitOnEnter };

/** The words the Prompt Input speaks. Each can be replaced through `labels`. */
export type PromptInputLabels = {
  /** The name of the field for assistive technology. */
  textarea: string;
  /** The name of the button that sends the draft. */
  send: string;
  /** The name of the button that stops a reply that is running. */
  stop: string;
  /** The name and the tooltip of the button that picks files. */
  attach: string;
};

const defaultPromptInputLabels: PromptInputLabels = {
  attach: "Attach files",
  send: "Send message",
  stop: "Stop",
  textarea: "Message",
};

type PromptInputContextValue = {
  allowEmpty: boolean;
  disabled: boolean;
  labels: PromptInputLabels;
  onStop: (() => void) | undefined;
  setValue: (value: string) => void;
  status: PromptInputStatus;
  submitOnEnter: PromptInputSubmitOnEnter;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
};

const PromptInputContext = React.createContext<PromptInputContextValue | null>(
  null,
);

function usePromptInput(part: string): PromptInputContextValue {
  const context = React.useContext(PromptInputContext);
  if (!context) throw new Error(`${part} must be rendered inside PromptInput.`);
  return context;
}

export type PromptInputProps = Omit<
  React.ComponentProps<"form">,
  "defaultValue" | "onSubmit"
> & {
  /** The draft, for a controlled field. The app clears it when it sends. */
  value?: string | undefined;
  /** The draft of an uncontrolled field, which clears itself when it sends. */
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  /**
   * Called when the draft is sent, by Enter or by the button, with the draft
   * trimmed of the white space around it. Never called while a reply runs or
   * for a draft that has nothing in it, unless `allowEmpty` is set.
   */
  onSubmit: (message: { text: string }) => void;
  /** Where the chat is in a turn (the AI SDK's `status`). A running reply turns Send into Stop. */
  status?: PromptInputStatus | undefined;
  /** Called when Stop is pressed. */
  onStop?: (() => void) | undefined;
  /** Which Enter sends. Shift+Enter always adds a line. */
  submitOnEnter?: PromptInputSubmitOnEnter | undefined;
  /** Lets a draft with no text go, for a message that holds only attachments. */
  allowEmpty?: boolean | undefined;
  /** Disables the field, the attach button and Send. */
  disabled?: boolean | undefined;
  /** The surface of the field (the InputGroup's). */
  variant?: React.ComponentProps<typeof InputGroup>["variant"];
  labels?: Partial<PromptInputLabels> | undefined;
};

/**
 * The message field of a chat: a form around an InputGroup with a textarea
 * that grows with the draft, an attachments row above it and a toolbar below.
 * It sends on Enter, adds a line on Shift+Enter, never sends while an IME
 * composition is open, and shows Stop while a reply runs. The field stays
 * editable while a reply runs; only sending is held back. The app owns the
 * messages, the files and the transport: `onSubmit` hands over the text.
 */
export function PromptInput({
  allowEmpty = false,
  children,
  className,
  defaultValue = "",
  disabled = false,
  labels,
  onStop,
  onSubmit,
  onValueChange,
  status = "ready",
  submitOnEnter = "always",
  value,
  variant,
  ...props
}: PromptInputProps): React.ReactElement {
  const [uncontrolledDraft, setUncontrolledDraft] =
    React.useState(defaultValue);
  const controlled = value !== undefined;
  const draft = controlled ? value : uncontrolledDraft;
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const text = { ...defaultPromptInputLabels, ...labels };
  const state = submitState(status, draft, allowEmpty);

  const setValue = (next: string) => {
    if (!controlled) setUncontrolledDraft(next);
    onValueChange?.(next);
  };

  const context: PromptInputContextValue = {
    allowEmpty,
    disabled,
    labels: text,
    onStop,
    setValue,
    status,
    submitOnEnter,
    textareaRef,
    value: draft,
  };

  return (
    <PromptInputContext.Provider value={context}>
      <Form
        {...props}
        className={className}
        data-slot="prompt-input"
        onSubmit={(event) => {
          // Enter and the button both end here. The form never navigates.
          event.preventDefault();
          sendDraft({
            controlled,
            disabled,
            draft,
            // The field keeps focus, so the next message can be typed at once.
            focus: () => textareaRef.current?.focus({ preventScroll: true }),
            onSubmit,
            setValue,
            state,
          });
        }}
      >
        <InputGroup variant={variant}>{children}</InputGroup>
      </Form>
    </PromptInputContext.Provider>
  );
}

/** The row above the field that holds the attachments: an AttachmentGroup. Render it only while there are files. */
export function PromptInputAttachments({
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof InputGroupAddon>,
  "align"
>): React.ReactElement {
  return (
    <InputGroupAddon
      align="block-start"
      className={cn("sp-prompt-input-attachments", className)}
      {...props}
    />
  );
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as React.RefObject<T | null>).current = value;
}

export type PromptInputTextareaProps = Omit<
  React.ComponentProps<typeof InputGroupTextarea>,
  "defaultValue" | "value"
>;

/**
 * The field. It grows from one line to eight, then scrolls, and is named
 * "Message". Enter sends as `submitOnEnter` says, and the draft is the
 * PromptInput's, so the field takes no `value`.
 */
export function PromptInputTextarea({
  className,
  disabled,
  maxLines = 8,
  minLines = 1,
  onChange,
  onKeyDown,
  ref,
  ...props
}: PromptInputTextareaProps): React.ReactElement {
  const prompt = usePromptInput("PromptInputTextarea");
  const { textareaRef } = prompt;
  const mergedRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;
      assignRef(ref, node);
    },
    [ref, textareaRef],
  );

  return (
    <InputGroupTextarea
      aria-label={prompt.labels.textarea}
      {...props}
      className={cn("sp-prompt-input-textarea", className)}
      disabled={disabled ?? prompt.disabled}
      maxLines={maxLines}
      minLines={minLines}
      onChange={(event) => {
        onChange?.(event);
        prompt.setValue(event.target.value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        // The form decides whether this Enter sends, so a draft that cannot
        // be sent, or a reply that runs, adds no line either.
        submitOnEnterKey(
          event,
          prompt.submitOnEnter,
          () =>
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(pointer: fine)").matches,
        );
      }}
      ref={mergedRef}
      value={prompt.value}
    />
  );
}

/** The row below the field. Put two PromptInputToolbarGroups in it: the controls that start the row and the ones that end it. */
export function PromptInputToolbar({
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof InputGroupAddon>,
  "align"
>): React.ReactElement {
  return (
    <InputGroupAddon
      align="block-end"
      className={cn("sp-prompt-input-toolbar flex-wrap", className)}
      {...props}
    />
  );
}

export type PromptInputToolbarGroupProps = React.ComponentProps<"div"> & {
  /** `end` pushes the group to the end of the row. */
  align?: "start" | "end" | undefined;
};

export function PromptInputToolbarGroup({
  align = "start",
  className,
  ...props
}: PromptInputToolbarGroupProps): React.ReactElement {
  return (
    <div
      className={cn(slotClass("prompt-input-toolbar-group", props), className)}
      data-align={align}
      data-slot="prompt-input-toolbar-group"
      {...props}
    />
  );
}

export type PromptInputAttachButtonProps = Omit<
  ButtonBaseProps,
  "onChange" | "type"
> & {
  /** The file types the picker offers, as the `accept` of a file input. */
  accept?: string | undefined;
  /** Whether the picker takes several files. */
  multiple?: boolean | undefined;
  /** Called with the picked files. The app owns them from here. */
  onFilesSelected: (files: File[]) => void;
};

/**
 * The button that opens the file picker, with a Paperclip icon and a tooltip.
 * It is the field action of rulebook I4, the bare glyph in the 24 px target.
 * The picker is the kit Input of type file, hidden beside it.
 */
export function PromptInputAttachButton({
  accept,
  children,
  disabled,
  multiple = true,
  onClick,
  onFilesSelected,
  ...props
}: PromptInputAttachButtonProps): React.ReactElement {
  const prompt = usePromptInput("PromptInputAttachButton");
  const picker = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label={prompt.labels.attach}
              data-slot="prompt-input-attach-button"
              profile="field-action"
              shape="square"
              {...props}
              disabled={disabled ?? prompt.disabled}
              onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) picker.current?.click();
              }}
              type="button"
            />
          }
        >
          {children ?? <PaperclipIcon />}
        </TooltipTrigger>
        <TooltipPopup>{prompt.labels.attach}</TooltipPopup>
      </Tooltip>
      {/* The picker waits outside the layout; the button opens it. It stays
          enabled when the button is not, because a disabled input would dim
          the whole field. */}
      <div hidden>
        <Input
          accept={accept}
          aria-label={prompt.labels.attach}
          multiple={multiple}
          onChange={(event) => {
            const input = event.currentTarget;
            const files = Array.from(input.files ?? []);
            // Cleared, so the same file can be picked again.
            input.value = "";
            if (files.length > 0) onFilesSelected(files);
          }}
          ref={picker}
          tabIndex={-1}
          type="file"
        />
      </div>
    </>
  );
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type PromptInputSubmitProps = DistributiveOmit<
  ButtonProps,
  "children" | "type"
>;

/**
 * Send, or Stop while a reply runs. Send is the filled round button with the
 * ArrowUp icon and submits the form; it can be pressed once the draft has
 * something in it. Stop shows a Square, stays pressable and calls `onStop`.
 * The icons fade through each other (rulebook M8), and the button is never
 * the Button's `loading`, which would disable it. Any Button prop, such as
 * `variant`, `shape` or `size`, replaces the default look.
 */
export function PromptInputSubmit({
  className,
  disabled,
  onClick,
  ...props
}: PromptInputSubmitProps): React.ReactElement {
  const prompt = usePromptInput("PromptInputSubmit");
  const size = useRelativeControlSize("md");
  const state = submitState(prompt.status, prompt.value, prompt.allowEmpty);
  const stop = state.kind === "stop";

  return (
    <Button
      aria-label={stop ? prompt.labels.stop : prompt.labels.send}
      data-action={state.kind}
      data-slot="prompt-input-submit"
      shape="pill"
      size={`icon-${size}`}
      variant="accent"
      {...props}
      className={className}
      // A disabled composer turns off the field, the attach button and Send;
      // Stop stays pressable, so a reply that runs can always be stopped.
      disabled={
        Boolean(disabled) || (!stop && (prompt.disabled || state.disabled))
      }
      onClick={(event) => {
        onClick?.(event);
        if (!stop) return;
        // Stop never submits, also when the reply ends in this very click and
        // the button is Send again before the browser acts on it.
        event.preventDefault();
        prompt.onStop?.();
      }}
      type={stop ? "button" : "submit"}
    >
      <MotionSwap
        className="grid place-items-center"
        render={<span />}
        swapKey={state.kind}
      >
        {stop ? (
          <SquareIcon aria-hidden="true" fill="currentColor" />
        ) : (
          <ArrowUpIcon aria-hidden="true" />
        )}
      </MotionSwap>
    </Button>
  );
}
