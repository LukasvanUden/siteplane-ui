"use client";

import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button, type ButtonBaseProps, type ButtonProps } from "../button";
import { KitButton } from "../button/button-internal";
import { MotionItem, MotionList, MotionShimmer } from "../motion";
import { ScrollArea } from "../scroll-area";

import "./attachment.css";

/**
 * Where an attachment is in its life: `idle` was picked and waits, `uploading`
 * and `processing` are under way (the name shimmers), `error` failed and
 * `done` is there. The AI SDK's file parts carry no state, so the app maps
 * its upload's own state to one of these words.
 */
export type AttachmentState =
  "idle" | "uploading" | "processing" | "error" | "done";

export type AttachmentSize = "sm" | "md";

export type AttachmentOrientation = "horizontal" | "vertical";

type AttachmentContextValue = {
  orientation: AttachmentOrientation;
  state: AttachmentState;
};

// The parts read the state and the orientation of their card. Outside a card
// they show as a finished, horizontal one.
const AttachmentContext = React.createContext<AttachmentContextValue>({
  orientation: "horizontal",
  state: "done",
});

export type AttachmentProps = React.ComponentProps<"div"> & {
  /** The upload state. It styles the card and shimmers the name while the file is on its way. */
  state?: AttachmentState | undefined;
  size?: AttachmentSize | undefined;
  /** `horizontal` puts the media beside the text; `vertical` stacks it above, for image cards. */
  orientation?: AttachmentOrientation | undefined;
};

/**
 * A file or an image attached to a draft or a message: media, a name with its
 * details, actions and, over the whole card, an optional trigger. The app owns
 * the files and their upload; the card shows the state it is given.
 */
export function Attachment({
  className,
  orientation = "horizontal",
  size = "md",
  state = "done",
  ...props
}: AttachmentProps): React.ReactElement {
  const context = React.useMemo(
    () => ({ orientation, state }),
    [orientation, state],
  );
  const busy = state === "uploading" || state === "processing";

  return (
    <AttachmentContext.Provider value={context}>
      <div
        aria-busy={busy || undefined}
        className={cn(slotClass("attachment", props), className)}
        data-orientation={orientation}
        data-size={size}
        data-slot="attachment"
        data-state={state}
        {...props}
      />
    </AttachmentContext.Provider>
  );
}

export type AttachmentMediaProps = React.ComponentProps<"div"> & {
  /** `icon` is a tile for an icon or a file type icon; `image` holds an `img` that fills it. */
  variant?: "icon" | "image" | undefined;
};

export function AttachmentMedia({
  className,
  variant = "icon",
  ...props
}: AttachmentMediaProps): React.ReactElement {
  return (
    <div
      className={cn(slotClass("attachment-media", props), className)}
      data-slot="attachment-media"
      data-variant={variant}
      {...props}
    />
  );
}

/** The column of the name and its details. It may shrink below its text (rulebook K5). */
export function AttachmentContent({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("attachment-content", props), className)}
      data-slot="attachment-content"
      {...props}
    />
  );
}

/**
 * The name of the file. It ends in an ellipsis where it meets the edge of the
 * card and carries its full text as its title; while the file uploads or is
 * processed, the shimmer runs over it.
 */
export function AttachmentTitle({
  children,
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  const { state } = React.useContext(AttachmentContext);

  return (
    <span
      className={cn(slotClass("attachment-title", props), className)}
      data-slot="attachment-title"
      title={typeof children === "string" ? children : undefined}
      {...props}
    >
      <MotionShimmer active={state === "uploading" || state === "processing"}>
        {children}
      </MotionShimmer>
    </span>
  );
}

/** The details of the file: its type and size, the upload progress or why it failed, in words. */
export function AttachmentDescription({
  children,
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      className={cn(slotClass("attachment-description", props), className)}
      data-slot="attachment-description"
      title={typeof children === "string" ? children : undefined}
      {...props}
    >
      {children}
    </span>
  );
}

export function AttachmentActions({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("attachment-actions", props), className)}
      data-slot="attachment-actions"
      {...props}
    />
  );
}

export type AttachmentActionProps = Omit<ButtonBaseProps, "aria-label"> & {
  /** Names the action and its file, such as "Remove brief.pdf". The icon alone says nothing. */
  "aria-label": string;
};

/**
 * An icon action of the card, such as remove, retry or download: a Button.
 * Beside the text it is the muted bare action of rulebook T2 in the 24 px
 * square target; over the image of a vertical card it is the opaque default
 * Button, which reads on any picture. Any Button prop replaces these.
 */
export function AttachmentAction({
  className,
  ...props
}: AttachmentActionProps): React.ReactElement {
  const { orientation } = React.useContext(AttachmentContext);
  const look: ButtonProps =
    orientation === "vertical"
      ? { variant: "default" }
      : { profile: "inline", profileTone: "muted", variant: "text" };

  return (
    <Button
      className={className}
      data-slot="attachment-action"
      shape="square"
      size="icon-xs"
      {...look}
      {...props}
    />
  );
}

export type AttachmentTriggerProps = Omit<ButtonBaseProps, "aria-label"> & {
  /** Says what activating the card does, such as "Open brief.pdf". The trigger has no text of its own. */
  "aria-label": string;
};

/**
 * A button laid over the whole card, behind the actions, that opens the file
 * or a preview of it. It is the full-cell Button profile; pass `render` for a
 * link, or put it in a DialogTrigger's `render`. Its hover tint and keyboard
 * ring are the Button's own.
 */
export function AttachmentTrigger({
  className,
  ...props
}: AttachmentTriggerProps): React.ReactElement {
  return (
    <KitButton
      className={cn("absolute inset-0 z-10 size-full", className)}
      data-slot="attachment-trigger"
      profile="full-cell-action"
      variant="ghost"
      {...props}
    />
  );
}

export type AttachmentGroupProps = React.ComponentProps<"div"> & {
  /**
   * Names the row of files for assistive technology, such as "Attachments".
   * The name goes to the row's scroll viewport, a labelled region, because
   * that is what joins the tab order once the row scrolls; a row that can
   * scroll should have one.
   */
  label?: string | undefined;
};

/**
 * A row of attachments that scrolls sideways, snaps card by card and fades the
 * edge that has more to show. Its cards are a list, and one that joins or
 * leaves fades in or out while the others glide (rulebook M6). Give each
 * Attachment a stable `key`.
 */
export function AttachmentGroup({
  children,
  className,
  label,
  ...props
}: AttachmentGroupProps): React.ReactElement {
  const attachments = React.Children.toArray(children).filter(
    React.isValidElement,
  );

  return (
    <div
      className={cn(slotClass("attachment-group", props), className)}
      data-slot="attachment-group"
      {...props}
    >
      <ScrollArea aria-label={label} scrollFade scrollbar="hidden">
        <MotionList className="sp-attachment-group-row" layout="flow">
          {attachments.map((attachment) => (
            <MotionItem
              className="sp-attachment-group-item"
              key={attachment.key}
            >
              {attachment}
            </MotionItem>
          ))}
        </MotionList>
      </ScrollArea>
    </div>
  );
}
