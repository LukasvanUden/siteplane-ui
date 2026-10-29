/*
 * The rules of the Prompt Input that need no DOM: which Enter sends, and what
 * the submit button is for. Kept apart from the component so they are checked
 * without a browser; the component calls them from its handlers.
 */

/**
 * Where the chat is in a turn, in the words of the AI SDK's chat `status`:
 * `ready` waits for a message, `submitted` has sent one and waits for the
 * reply to start, `streaming` receives it and `error` failed, back to a
 * field that sends again.
 */
export type PromptInputStatus = "ready" | "submitted" | "streaming" | "error";

/**
 * Which Enter sends: `always`, `desktop` only with a fine pointer (a mouse or
 * a trackpad, so a phone's Enter adds a line), `never` (Enter adds a line).
 */
export type PromptInputSubmitOnEnter = "always" | "desktop" | "never";

/** What the Prompt Input reads of a key press. */
export type PromptInputEnterEvent = {
  /** True while an IME composition is open (a browser sets it on the keydown). */
  isComposing: boolean;
  key: string;
  /** Safari reports the key that ends an IME composition as 229, with isComposing already false. */
  keyCode: number;
  shiftKey: boolean;
};

/**
 * Whether this key press sends the message. Shift+Enter adds a line. Nothing
 * is sent while an IME composition is open, because that Enter confirms a
 * candidate: `isComposing`, or keyCode 229 for the Enter that ends it in
 * Safari. `pointerFine` is whether the primary pointer is a mouse or a
 * trackpad; only `desktop` reads it.
 */
export function shouldSubmitOnEnter(
  event: PromptInputEnterEvent,
  mode: PromptInputSubmitOnEnter,
  pointerFine: boolean,
): boolean {
  if (event.key !== "Enter" || event.shiftKey) return false;
  if (event.isComposing || event.keyCode === 229) return false;
  if (mode === "never") return false;
  return mode === "always" || pointerFine;
}

/** What the submit button does now, and whether it can be pressed. */
export type PromptInputSubmitState = {
  disabled: boolean;
  kind: "send" | "stop";
};

/**
 * Send, or Stop while a reply is on its way (`submitted` or `streaming`). Stop
 * can always be pressed. Send needs a draft with something in it, white space
 * not counting, unless `allowEmpty` lets a draft that holds only attachments
 * go. After an `error` the field sends again.
 */
export function submitState(
  status: PromptInputStatus,
  draft: string,
  allowEmpty: boolean,
): PromptInputSubmitState {
  if (status === "submitted" || status === "streaming")
    return { disabled: false, kind: "stop" };
  return { disabled: !allowEmpty && draft.trim() === "", kind: "send" };
}

/**
 * The key event the Prompt Input reads, as a React keyboard event on the
 * textarea has it: the composition flags live on the native event.
 */
export type PromptInputKeyDownEvent = {
  currentTarget: { form: { requestSubmit(): void } | null };
  defaultPrevented: boolean;
  key: string;
  nativeEvent: { isComposing: boolean; keyCode: number };
  preventDefault(): void;
  shiftKey: boolean;
};

/**
 * What the textarea does on a key press. An Enter that sends is cancelled, so
 * it adds no line, and the form is asked to submit; the form decides whether
 * the draft can go. A key that something else already handled is left alone.
 * `pointerFine` is read only when the mode asks for it. Returns whether the
 * key was taken.
 */
export function submitOnEnterKey(
  event: PromptInputKeyDownEvent,
  mode: PromptInputSubmitOnEnter,
  pointerFine: () => boolean,
): boolean {
  if (event.defaultPrevented) return false;
  if (
    !shouldSubmitOnEnter(
      {
        isComposing: event.nativeEvent.isComposing,
        key: event.key,
        keyCode: event.nativeEvent.keyCode,
        shiftKey: event.shiftKey,
      },
      mode,
      mode === "desktop" && pointerFine(),
    )
  )
    return false;
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
  return true;
}

/** What the form needs to send the draft. */
export type SendDraftOptions = {
  /** A controlled draft is the app's to clear. */
  controlled: boolean;
  disabled: boolean;
  draft: string;
  /** Puts focus back in the field. */
  focus: () => void;
  onSubmit: (message: { text: string }) => void;
  setValue: (value: string) => void;
  state: PromptInputSubmitState;
};

/**
 * Sends the draft when it can go: not while the field is disabled, not while a
 * reply runs and not for a draft that has nothing in it (unless `allowEmpty`
 * made the state enabled). The text goes out without the white space around
 * it, an uncontrolled field clears itself, and focus stays in the field.
 * Returns whether it sent.
 */
export function sendDraft(options: SendDraftOptions): boolean {
  const { controlled, disabled, draft, focus, onSubmit, setValue, state } =
    options;
  if (disabled || state.kind === "stop" || state.disabled) return false;
  onSubmit({ text: draft.trim() });
  if (!controlled) setValue("");
  focus();
  return true;
}
