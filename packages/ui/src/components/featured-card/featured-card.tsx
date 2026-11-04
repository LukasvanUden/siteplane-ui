"use client";

import * as React from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { moveFocusPast } from "../../system/utils/focus-target-after";
import { Button, CloseButton } from "../button";
import { Card, CardPanel } from "../card";
import { Progress, ProgressCircle, ProgressCircleValue } from "../progress";

import "./featured-card.css";

/**
 * How the card shows its progress: `bar`, a progress bar under the text, or
 * `circle`, a 64 px ring with the figure in it above the text.
 */
export type FeaturedCardIndicator = "bar" | "circle";

export interface FeaturedCardProps extends Omit<
  React.ComponentProps<"div">,
  "children" | "title"
> {
  /** The card's title, one short line such as "Used space". */
  title: React.ReactNode;
  /** The text under the title. */
  description?: React.ReactNode;
  /**
   * The completion between 0 and 100. The card shows it as a bar or a ring
   * (`indicator`); without it the card shows its text and actions only.
   */
  progress?: number | undefined;
  /** `bar`, the default, or `circle`. */
  indicator?: FeaturedCardIndicator | undefined;
  /**
   * The accessible name of the progress indicator. The title, when it is
   * plain text, by default.
   */
  progressLabel?: string | undefined;
  /** The label of the action that takes the offer, such as "Upgrade plan". */
  confirmLabel?: React.ReactNode;
  /** Called by the confirm action. */
  onConfirm?: (() => void) | undefined;
  /**
   * Called by the close button in the corner and by the dismiss action. The
   * card shows neither without it; removing the card is the application's.
   */
  onDismiss?: (() => void) | undefined;
  /** The label of the dismiss action: the `featuredCard.dismiss` message by default, "Dismiss" in English. */
  dismissLabel?: React.ReactNode;
  /** The accessible name of the close button: CloseButton's message by default, "Close" in English. */
  closeLabel?: string | undefined;
}

/**
 * A compact card that features one offer or status in a sidebar or a panel,
 * such as the storage a team has used: a title and a description, a progress
 * bar under them or a 64 px ring above them, a close button in the corner and
 * a pair of link actions, Dismiss and the offer's own. It is a Card with its
 * compact inset, so it takes the Card's surface and the Card's inset tokens.
 */
export function FeaturedCard({
  className,
  closeLabel,
  confirmLabel,
  description,
  dismissLabel: dismissLabelProp,
  indicator = "bar",
  onConfirm,
  onDismiss,
  progress,
  progressLabel,
  title,
  ...props
}: FeaturedCardProps): React.ReactElement {
  const messages = useSiteplaneMessages("featuredCard");
  const dismissLabel =
    dismissLabelProp === undefined ? messages.dismiss : dismissLabelProp;
  const hasProgress = typeof progress === "number" && Number.isFinite(progress);
  const value = hasProgress ? Math.min(100, Math.max(0, progress)) : null;
  const indicatorLabel =
    progressLabel ??
    (typeof title === "string" || typeof title === "number"
      ? String(title)
      : undefined);
  const hasConfirm =
    confirmLabel !== undefined && confirmLabel !== null && confirmLabel !== "";
  // A dismiss that holds the focus hands it to the next element after the
  // card before the card leaves, as the close of an Alert and of a
  // Notification does, so the focus never falls back to the page (B4).
  const dismiss = onDismiss
    ? (event: React.MouseEvent<HTMLElement>) => {
        moveFocusPast(
          event.currentTarget.closest<HTMLElement>(".sp-featured-card"),
        );
        onDismiss();
      }
    : undefined;
  // The close sits 4 px inside the top-end corner, over the card's inset; the
  // title keeps clear of it (featured-card.css). It is the card's last part
  // in the document, so the keyboard reaches it after the actions, as the
  // close of a Dialog, a Notification and an Alert (B16, 3 November 2026; it
  // followed the text, before the links).
  const close = dismiss ? (
    <CloseButton
      className="absolute end-1 top-1"
      label={closeLabel}
      onClick={dismiss}
    />
  ) : null;
  const text = (
    <div className="sp-featured-card-text" data-slot="featured-card-text">
      <p className="sp-featured-card-title" data-slot="featured-card-title">
        {title}
      </p>
      {description === undefined ||
      description === null ||
      description === "" ? null : (
        <div
          className="sp-featured-card-description"
          data-slot="featured-card-description"
        >
          {description}
        </div>
      )}
    </div>
  );
  return (
    <Card
      className={cn("sp-featured-card", className)}
      data-dismissible={onDismiss ? "" : undefined}
      data-indicator={value === null ? undefined : indicator}
      density="compact"
      {...props}
    >
      <CardPanel>
        {value !== null && indicator === "circle" ? (
          // The ring leads, 12 px above the text, with its figure inside.
          <div className="sp-featured-card-lead" data-slot="featured-card-lead">
            <ProgressCircle
              aria-label={indicatorLabel}
              display="xxs"
              value={value}
            >
              <ProgressCircleValue />
            </ProgressCircle>
            {text}
          </div>
        ) : (
          text
        )}
        {value !== null && indicator === "bar" ? (
          <Progress aria-label={indicatorLabel} value={value} />
        ) : null}
        {dismiss || hasConfirm ? (
          <div
            className="sp-featured-card-actions"
            data-slot="featured-card-actions"
          >
            {dismiss ? (
              <Button onClick={dismiss} variant="link">
                {dismissLabel}
              </Button>
            ) : null}
            {hasConfirm ? (
              <Button onClick={onConfirm} variant="link-accent">
                {confirmLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
        {close}
      </CardPanel>
    </Card>
  );
}
