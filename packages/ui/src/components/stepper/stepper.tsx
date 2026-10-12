import { cva, type VariantProps } from "class-variance-authority";
import { Check, Lock } from "lucide-react";
import * as React from "react";

import { cn } from "../../system/utils/cn";
import { KitButton } from "../button/button-internal";
import { MotionReveal, MotionSwap } from "../motion";

export function Stepper({
  className,
  ...props
}: React.ComponentProps<"ol">): React.ReactElement {
  return (
    <ol
      className={cn("flex flex-col", className)}
      data-slot="stepper"
      {...props}
    />
  );
}

// A step that changes status eases its colours instead of switching them. The
// marker's edge, ring and transitions are design-rework.css's, so the reduced
// motion modes switch them off.
const stepIndicatorVariants = cva(
  "relative z-10 flex shrink-0 items-center justify-center rounded-full font-semibold after:pointer-events-none after:absolute after:-inset-1 after:origin-center after:scale-75 after:rounded-full after:opacity-0 after:content-['']",
  {
    defaultVariants: { status: "open" },
    variants: {
      status: {
        blocked: "border-dashed",
        current: "",
        done: "",
        open: "",
      },
    },
  },
);

type StepperItemStatus = VariantProps<typeof stepIndicatorVariants>["status"];

// Done and blocked markers are icons only, so the title carries their status
// as visually hidden text.
const defaultStatusLabels: Partial<
  Record<NonNullable<StepperItemStatus>, string>
> = {
  blocked: "blocked",
  done: "completed",
};

// A step is the marker and its text, then the body, with the connector to the
// next step running down its left edge. The body opens and closes inside the
// step, so a step keeps its marker, title and connector when its content changes.
const stepItemClassName =
  "relative pb-5 last:pb-0 before:absolute before:top-7 before:bottom-0 before:left-3 before:-translate-x-1/2 last:before:hidden";

export interface StepperItemProps
  extends
    Omit<React.ComponentProps<"li">, "title">,
    VariantProps<typeof stepIndicatorVariants> {
  title: React.ReactNode;
  /**
   * Supporting text under the title. Text that changes cross-fades; give a
   * description element a `key` to cross-fade between elements, or keep the
   * same `key` to update it in place.
   */
  description?: React.ReactNode;
  index?: number;
  statusLabel?: string;
  /**
   * The content of the step, shown under its text. It expands when children
   * appear and collapses when they go away, so keep the step mounted between
   * renders and pass children only while the step shows its content.
   */
  children?: React.ReactNode;
}

export function StepperItem({
  className,
  status = "open",
  title,
  description,
  index,
  statusLabel,
  children,
  ...props
}: StepperItemProps): React.ReactElement {
  return (
    <li
      aria-current={status === "current" ? "step" : undefined}
      className={cn(stepItemClassName, className)}
      data-slot="stepper-item"
      data-status={status}
      {...props}
    >
      <div className="flex gap-3">
        <StepperIndicator index={index} status={status} />
        <StepperContent
          description={description}
          status={status}
          statusLabel={statusLabel}
          title={title}
        />
      </div>
      <StepperBody>{children}</StepperBody>
    </li>
  );
}

export interface StepperButtonItemProps
  extends
    Omit<React.ComponentProps<"button">, "title">,
    VariantProps<typeof stepIndicatorVariants> {
  title: React.ReactNode;
  /** See `StepperItem`: text that changes cross-fades. */
  description?: React.ReactNode;
  index?: number;
  /**
   * Marks the step that is open (`aria-current="step"`), independent of its
   * `status`.
   */
  active?: boolean;
  /** @deprecated Use `active`. */
  current?: boolean;
  statusLabel?: string;
  /**
   * The content of the step, shown under its text and outside the button, so
   * it can hold fields and links. It expands when children appear and
   * collapses when they go away: one item can be the clickable header of a
   * step and open as the current step, without being replaced.
   */
  children?: React.ReactNode;
}

export function StepperButtonItem({
  className,
  status = "open",
  title,
  description,
  index,
  active: activeProp,
  current,
  statusLabel,
  children,
  ...props
}: StepperButtonItemProps): React.ReactElement {
  const active = activeProp ?? current ?? false;
  // The title and its status name the button; the marker number and the
  // description would otherwise run into one long name.
  const titleId = React.useId();
  const descriptionId = React.useId();
  return (
    <li
      className={stepItemClassName}
      data-slot="stepper-item"
      data-status={status}
    >
      <KitButton
        aria-current={active ? "step" : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        className={cn(
          "[&:not(:disabled):not([aria-current=step]):hover_[data-slot=stepper-indicator]]:after:scale-100 [&:not(:disabled):not([aria-current=step]):hover_[data-slot=stepper-indicator]]:after:opacity-100",
          "[&[aria-current=step]_[data-slot=stepper-indicator]]:after:scale-100 [&[aria-current=step]_[data-slot=stepper-indicator]]:after:opacity-100",
          className,
        )}
        data-slot="stepper-button-item"
        profile="step-trigger"
        variant="text"
        {...props}
      >
        <StepperIndicator index={index} status={status} />
        <StepperContent
          description={description}
          descriptionId={descriptionId}
          status={status}
          statusLabel={statusLabel}
          title={title}
          titleId={titleId}
        />
      </KitButton>
      <StepperBody>{children}</StepperBody>
    </li>
  );
}

/**
 * The marker's content: a number, or a check or lock for a done or blocked
 * step. A new content cross-fades in the same place.
 */
function StepperIndicator({
  index,
  status,
}: {
  index?: number | undefined;
  status: StepperItemStatus;
}) {
  const content =
    status === "done" ? (
      <Check />
    ) : status === "blocked" ? (
      <Lock />
    ) : index != null ? (
      index
    ) : null;
  const contentKey =
    status === "done" || status === "blocked" ? status : `number:${index}`;

  return (
    <span
      className={cn(stepIndicatorVariants({ status }))}
      data-slot="stepper-indicator"
    >
      <MotionSwap
        className="grid size-full place-items-center"
        swapKey={contentKey}
      >
        {content}
      </MotionSwap>
    </span>
  );
}

/**
 * What identifies a description for the swap: text by its value, an element by
 * its `key` or else its type.
 */
function descriptionKey(description: React.ReactNode): React.Key {
  if (typeof description === "string" || typeof description === "number")
    return `text:${description}`;
  if (React.isValidElement(description))
    return (
      description.key ??
      `type:${typeof description.type === "string" ? description.type : "component"}`
    );
  return "none";
}

function StepperContent({
  description,
  descriptionId,
  status,
  statusLabel,
  title,
  titleId,
}: {
  description?: React.ReactNode;
  descriptionId?: string | undefined;
  status: StepperItemStatus;
  statusLabel?: string | undefined;
  title: React.ReactNode;
  titleId?: string | undefined;
}) {
  const hiddenStatus =
    statusLabel ?? (status ? defaultStatusLabels[status] : undefined);

  return (
    <div className="min-w-0 flex-1 pt-0.5">
      <div className="wrap-anywhere" data-slot="stepper-title" id={titleId}>
        {title}
        {hiddenStatus ? (
          <span className="sr-only" data-slot="stepper-status">
            {` (${hiddenStatus})`}
          </span>
        ) : null}
      </div>
      <MotionReveal open={Boolean(description)}>
        <div
          className="mt-0.5 wrap-anywhere"
          data-slot="stepper-description"
          id={descriptionId}
        >
          <MotionSwap swapKey={descriptionKey(description)}>
            {description}
          </MotionSwap>
        </div>
      </MotionReveal>
    </div>
  );
}

/**
 * The step's content under its text, in line with the title. The 12 px above
 * it are part of the body, so they open and close with it.
 */
function StepperBody({ children }: { children?: React.ReactNode }) {
  return (
    <MotionReveal open={React.Children.toArray(children).length > 0}>
      <div className="ps-9 pt-3" data-slot="stepper-body">
        {children}
      </div>
    </MotionReveal>
  );
}
