"use client";

import { XIcon } from "lucide-react";
import * as React from "react";

import {
  announceCopyStatus,
  CopyRedrawIcon,
  type CopyIconPhase,
  useCopyIconPhase,
} from "../action-icons";
import { Button, type ButtonProfile, type ButtonProps } from "../button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../tooltip";

/** The words a CopyButton shows and speaks. */
export type CopyButtonLabels = {
  /** The name and the tooltip of a button that shows the icon alone. */
  copy: string;
  /**
   * The name, the tooltip and the announcement while the check confirms a
   * copy; a button with text shows it in place of its label.
   */
  copied: string;
  /**
   * The same for a copy that failed: the clipboard is missing or refuses, or
   * the value could not be read.
   */
  copyFailed: string;
};

const defaultCopyButtonLabels: CopyButtonLabels = {
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Copy unavailable",
};

/**
 * The text to copy, or a function that returns it, also one that loads it
 * first, such as a token requested when the button is pressed.
 */
export type CopyValue = string | (() => string | Promise<string>);

// How long a failed copy shows, in milliseconds: a little longer than the
// check of a copy that worked (rulebook T7).
const copyFailureHold = 2400;

/**
 * Copies `text` through a selection and the copy command, for a page without
 * the Clipboard API, such as one served over plain http. The text is selected
 * in a node of its own, so focus stays where it is. Inside a modal dialog the
 * node joins the dialog, since the page behind it may be inert.
 */
function copyThroughSelection(text: string): boolean {
  if (typeof document === "undefined") return false;
  const selection = document.getSelection();
  if (!selection || typeof document.execCommand !== "function") return false;
  const ranges = Array.from({ length: selection.rangeCount }, (_, index) =>
    selection.getRangeAt(index),
  );
  const node = document.createElement("span");
  node.textContent = text;
  node.style.position = "fixed";
  node.style.top = "0";
  node.style.left = "0";
  node.style.clipPath = "inset(50%)";
  node.style.whiteSpace = "pre";
  node.style.userSelect = "text";
  const host =
    document.activeElement?.closest(
      "dialog, [role='dialog'], [role='alertdialog']",
    ) ?? document.body;
  host.append(node);
  try {
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    selection.removeAllRanges();
    for (const range of ranges) selection.addRange(range);
    node.remove();
  }
}

function writeText(text: string): Promise<void> {
  const clipboard =
    typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (clipboard?.writeText) return clipboard.writeText(text);
  return copyThroughSelection(text)
    ? Promise.resolve()
    : Promise.reject(new Error("The clipboard is unavailable."));
}

/**
 * Puts a value on the clipboard. It resolves with the text it copied, or
 * rejects when the clipboard is missing or refuses, or the value throws or
 * rejects. The write starts in the caller's event, so call it from a click: a
 * browser lets a page write to the clipboard only then. A value that is still
 * loading goes in as a promised ClipboardItem, the clipboard's way to write
 * data that is still on its way, so Safari keeps the click's permission while
 * the text arrives.
 */
export function copyToClipboard(value: CopyValue): Promise<string> {
  let result: string | Promise<string>;
  try {
    result = typeof value === "function" ? value() : value;
  } catch (error) {
    return Promise.reject(error);
  }
  if (typeof result === "string") {
    const text = result;
    return writeText(text).then(() => text);
  }
  const pending = Promise.resolve(result);
  const clipboard =
    typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (clipboard?.write && typeof ClipboardItem === "function") {
    // The value's own error reaches the caller, not the browser's.
    let valueError: unknown;
    const blob = pending.then(
      (text) => new Blob([text], { type: "text/plain" }),
      (error: unknown) => {
        valueError = error;
        throw error;
      },
    );
    let item: ClipboardItem | undefined;
    try {
      item = new ClipboardItem({ "text/plain": blob });
    } catch {
      // A browser that takes no promise in a ClipboardItem writes the text
      // once it has arrived, below.
    }
    if (item)
      return clipboard.write([item]).then(
        () => pending,
        (error: unknown) => Promise.reject(valueError ?? error),
      );
  }
  return pending.then((text) => writeText(text).then(() => text));
}

export type UseCopyToClipboardOptions = {
  /**
   * Whether a copy and a failure are said in the kit's shared live region.
   * Turn it off where the caller says them itself, such as in a status line
   * of its own, so a copy is announced once.
   */
  announce?: boolean | undefined;
  /** The words of the announcements, `copied` and `copyFailed`. */
  labels?: Partial<Pick<CopyButtonLabels, "copied" | "copyFailed">> | undefined;
  /** Called with the text once it is on the clipboard. */
  onCopy?: ((value: string) => void) | undefined;
  /**
   * Called with the error when the clipboard is missing or refuses, or the
   * value throws or rejects.
   */
  onCopyError?: ((error: unknown) => void) | undefined;
};

export type CopyToClipboardState = {
  /** Copies a value; resolves `true` once it is on the clipboard. */
  copy: (value: CopyValue) => Promise<boolean>;
  /** True while the check confirms a copy, for two seconds. */
  copied: boolean;
  /** True for a moment after a copy failed. */
  failed: boolean;
  /** The phase that `CopyRedrawIcon` draws. */
  phase: CopyIconPhase;
};

/**
 * The copy of CopyButton for a control that is not a CopyButton, such as a
 * menu item: it writes the value, times the check of the copy icon and says
 * the outcome in the shared live region. Call `copy` from the click.
 */
export function useCopyToClipboard({
  announce = true,
  labels,
  onCopy,
  onCopyError,
}: UseCopyToClipboardOptions = {}): CopyToClipboardState {
  const copiedLabel = labels?.copied ?? defaultCopyButtonLabels.copied;
  const failedLabel = labels?.copyFailed ?? defaultCopyButtonLabels.copyFailed;
  const { copyPhase, isShowingCheck, playCopyFeedback } = useCopyIconPhase({
    announce,
    announcement: copiedLabel,
  });
  // A count, so a failure after a failure shows for its full time again.
  const [failures, setFailures] = React.useState(0);
  React.useEffect(() => {
    if (failures === 0) return;
    const timer = setTimeout(() => setFailures(0), copyFailureHold);
    return () => clearTimeout(timer);
  }, [failures]);
  const stopFailureAnnouncement = React.useRef<(() => void) | undefined>(
    undefined,
  );
  React.useEffect(() => () => stopFailureAnnouncement.current?.(), []);

  async function copy(value: CopyValue): Promise<boolean> {
    let text: string;
    try {
      text = await copyToClipboard(value);
    } catch (error) {
      setFailures((count) => count + 1);
      if (announce) {
        stopFailureAnnouncement.current?.();
        stopFailureAnnouncement.current = announceCopyStatus(
          failedLabel,
          copyFailureHold,
        );
      }
      onCopyError?.(error);
      return false;
    }
    setFailures(0);
    playCopyFeedback();
    onCopy?.(text);
    return true;
  }

  return {
    copy,
    copied: isShowingCheck && failures === 0,
    failed: failures > 0,
    phase: copyPhase,
  };
}

/** The props of the TooltipPopup of a CopyButton that shows the icon alone. */
export type CopyButtonTooltipProps = Omit<
  React.ComponentProps<typeof TooltipPopup>,
  "children"
>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type CopyButtonProps = DistributiveOmit<
  ButtonProps,
  "children" | "onCopy" | "value"
> & {
  /** The text to copy, or a function that returns it, also asynchronously. */
  value: CopyValue;
  /**
   * A label after the icon, such as "Copy link", which makes a text button.
   * Without one the button shows the icon alone, named by `labels.copy` or
   * `aria-label`, with a tooltip.
   */
  children?: React.ReactNode;
  /** Replaces the English words of the button. */
  labels?: Partial<CopyButtonLabels> | undefined;
  /** Called with the text once it is on the clipboard. */
  onCopy?: ((value: string) => void) | undefined;
  /**
   * Called with the error when the clipboard is missing or refuses, or
   * `value` throws or rejects.
   */
  onCopyError?: ((error: unknown) => void) | undefined;
  /**
   * The tooltip of a button that shows the icon alone, which says "Copy" and
   * then "Copied". `false` turns it off; an object passes props to
   * TooltipPopup, such as `side`.
   */
  tooltip?: boolean | CopyButtonTooltipProps | undefined;
};

/**
 * A button that copies a value to the clipboard: the kit Button with the copy
 * icon that turns into a check after a copy. By default it shows the icon
 * alone as the muted inline action (rulebook T2),
 * with a tooltip that says "Copy" and then "Copied"; with children it is a
 * text button whose label says "Copied" while the check shows. The shared
 * live region says every copy, and a copy that fails names the failure, with
 * a cross on a button that shows the icon alone. Button props pass through,
 * such as `variant`, `size` and `profile`; `profile="field-action"` places it
 * inside a field.
 */
export function CopyButton({
  "aria-label": ariaLabel,
  children,
  labels,
  onClick,
  onCopy,
  onCopyError,
  profile,
  profileTone,
  shape,
  size,
  tooltip = true,
  value,
  variant,
  ...props
}: CopyButtonProps): React.ReactElement {
  const text = { ...defaultCopyButtonLabels, ...labels };
  const { copy, copied, failed, phase } = useCopyToClipboard({
    labels: text,
    onCopy,
    onCopyError,
  });
  const iconOnly = React.Children.toArray(children).length === 0;
  // Without a profile or a variant it is the muted inline action (T2); a
  // variant alone, such as outline, is that variant's Button.
  const inline =
    profile === "inline" || (profile === undefined && variant === undefined);
  const look: ButtonProps = inline
    ? {
        profile: "inline",
        profileTone: profileTone ?? "muted",
        variant: variant ?? "text",
      }
    : {
        ...(profile
          ? { profile: profile as Exclude<ButtonProfile, "inline"> }
          : {}),
        variant,
      };
  const name = failed
    ? text.copyFailed
    : copied
      ? text.copied
      : (ariaLabel ?? text.copy);
  const button = (
    <Button
      data-slot="copy-button"
      {...props}
      {...look}
      {...(shape ? { shape } : iconOnly ? { shape: "square" as const } : {})}
      // The bare glyph keeps the 24 px target of the field action.
      {...(size != null
        ? { size }
        : iconOnly && inline
          ? { size: "icon-xs" as const }
          : {})}
      aria-label={iconOnly ? name : ariaLabel}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) void copy(value);
      }}
    >
      {failed && iconOnly ? (
        <XIcon aria-hidden="true" className="sp-copy-fail sp-icon-pop size-4" />
      ) : (
        <CopyRedrawIcon phase={phase} />
      )}
      {iconOnly
        ? null
        : failed
          ? text.copyFailed
          : copied
            ? text.copied
            : children}
    </Button>
  );
  if (!iconOnly || tooltip === false) return button;

  // The tooltip stays open on a click, so it can say "Copied". Its text is the
  // trigger's payload, so the popup measures itself again when the text
  // changes. It repeats the button's name, which assistive technology hears
  // from the button, so it is hidden from it.
  return (
    <Tooltip>
      <TooltipTrigger
        closeOnClick={false}
        payload={name}
        render={button as React.ReactElement<Record<string, unknown>>}
      />
      <TooltipPopup aria-hidden {...(tooltip === true ? {} : tooltip)}>
        {name}
      </TooltipPopup>
    </Tooltip>
  );
}
