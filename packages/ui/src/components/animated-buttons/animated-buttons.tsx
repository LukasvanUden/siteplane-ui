"use client";

import { ChevronLeft, ChevronRight, LogOutIcon } from "lucide-react";
import {
  type CSSProperties,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";

import type { ButtonBaseProps } from "../button";
import { KitButton } from "../button/button-internal";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";

import "./animated-buttons.css";

type AnimatedButtonVariant = Extract<
  NonNullable<ButtonBaseProps["variant"]>,
  "default" | "destructive" | "inverse" | "outline"
>;

export type FillSweepButtonProps = Omit<ButtonBaseProps, "variant"> & {
  /** `accent` darkens the accent surface on hover instead of sweeping. */
  variant?: AnimatedButtonVariant | "accent";
  /**
   * `reverse` widens an inverse fill from the start edge and takes it back
   * the way it came. `through` passes a fill of the label colour through the
   * Button: up from the bottom edge while the label shrinks slightly, or
   * across from the start edge on a Button with an arrow. It leaves through
   * the far edge.
   */
  sweep?: "reverse" | "through";
  /**
   * A chevron after the label that runs through on hover; `tile` sets it on
   * a tile of the label colour. Without children the chevron is the
   * Button's only content, so give it an `aria-label`.
   */
  arrow?: "bare" | "tile";
  /** The way the chevron points and runs. */
  arrowDirection?: "next" | "previous";
  /**
   * Plays once when the Button mounts: `grow` from the start edge, `widen`
   * from a ring into the accent fill, or `fade`.
   */
  entrance?: "grow" | "widen" | "fade";
};

interface SweepState {
  hovered: boolean;
  /** The fill is on its way out through the far edge. */
  leaving: boolean;
  /** The fill returns to its start edge without a transition. */
  resetting: boolean;
}

type SweepEvent = "enter" | "leave" | "settle" | "rested";

const restingSweep: SweepState = {
  hovered: false,
  leaving: false,
  resetting: false,
};

// Entering while a fill still leaves puts it back at its start edge first, so
// every hover runs it in from the same edge.
function sweepReducer(state: SweepState, event: SweepEvent): SweepState {
  switch (event) {
    case "enter":
      return { hovered: true, leaving: false, resetting: state.leaving };
    case "leave":
      if (!state.hovered) return state;
      return state.resetting
        ? { ...state, hovered: false }
        : { hovered: false, leaving: true, resetting: false };
    case "settle":
      return state.leaving
        ? { ...state, leaving: false, resetting: true }
        : state;
    case "rested":
      return state.resetting ? { ...state, resetting: false } : state;
  }
}

function durationMs(element: Element, token: `--motion-${string}`): number {
  const value = getComputedStyle(element).getPropertyValue(token).trim();
  return (Number.parseFloat(value) || 0) * (value.endsWith("ms") ? 1 : 1000);
}

/**
 * The pointer state of a fill that passes through, and of a running arrow.
 * After the pointer leaves, the fill leaves through the far edge, and
 * --motion-duration-sweep-reset later it returns to its start for two frames
 * without a transition.
 */
function useSweepPointer(active: boolean) {
  const [state, dispatch] = useReducer(sweepReducer, restingSweep);
  const timer = useRef<number | null>(null);
  const clearTimer = useCallback(() => {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);
  useEffect(() => {
    if (!state.resetting) return;
    let second: number | undefined;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => dispatch("rested"));
    });
    return () => {
      cancelAnimationFrame(first);
      if (second !== undefined) cancelAnimationFrame(second);
    };
  }, [state.resetting]);

  const onPointerEnter = useCallback(() => {
    if (!active) return;
    clearTimer();
    dispatch("enter");
  }, [active, clearTimer]);
  const onPointerLeave = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      dispatch("leave");
      if (!state.hovered || state.resetting) return;
      clearTimer();
      timer.current = window.setTimeout(
        () => {
          timer.current = null;
          dispatch("settle");
        },
        durationMs(event.currentTarget, "--motion-duration-sweep-reset"),
      );
    },
    [clearTimer, state.hovered, state.resetting],
  );

  const phase = state.resetting
    ? "reset"
    : state.hovered
      ? "in"
      : state.leaving
        ? "out"
        : "rest";
  return {
    hovered: state.hovered,
    onPointerEnter,
    onPointerLeave,
    phase,
  };
}

function SweepArrow({
  direction,
  standalone,
}: {
  direction: "next" | "previous";
  standalone: boolean;
}): ReactElement {
  const Glyph = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <span
      aria-hidden="true"
      className="sp-fill-sweep-arrow"
      data-direction={direction}
      data-standalone={standalone ? "" : undefined}
    >
      <span className="sp-fill-sweep-arrow-track">
        <span>
          <Glyph aria-hidden="true" focusable="false" />
        </span>
        <span>
          <Glyph aria-hidden="true" focusable="false" />
        </span>
      </span>
    </span>
  );
}

export function FillSweepButton({
  arrow,
  arrowDirection = "next",
  children,
  className,
  entrance,
  onPointerEnter,
  onPointerLeave,
  sweep = "reverse",
  variant = "default",
  ...props
}: FillSweepButtonProps): ReactElement {
  const darkens = variant === "accent";
  const passes = sweep === "through" && !darkens;
  const arrowOnly =
    arrow !== undefined && (children == null || children === false);
  const inactive = Boolean(
    props.disabled ||
    props.loading ||
    props["aria-disabled"] === true ||
    props["aria-disabled"] === "true",
  );
  const pointer = useSweepPointer((passes || arrow !== undefined) && !inactive);
  const arrowMark = arrow ? (
    <SweepArrow direction={arrowDirection} standalone={arrowOnly} />
  ) : null;

  return (
    <span
      className="sp-fill-sweep-button-root"
      data-slot="fill-sweep-button-root"
    >
      <KitButton
        {...props}
        className={cn("sp-fill-sweep-button", className)}
        data-arrow={arrow}
        data-arrow-only={arrowOnly ? "" : undefined}
        data-entrance={entrance}
        data-hovered={pointer.hovered ? "" : undefined}
        data-sweep={passes ? (arrow ? "across" : "up") : undefined}
        data-sweep-phase={passes ? pointer.phase : undefined}
        onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
          onPointerEnter?.(event);
          pointer.onPointerEnter();
        }}
        onPointerLeave={(event: PointerEvent<HTMLButtonElement>) => {
          onPointerLeave?.(event);
          pointer.onPointerLeave(event);
        }}
        profile="animated-fill"
        variant={variant === "destructive" ? "outline-destructive" : variant}
      >
        <span aria-hidden="true" className="sp-fill-sweep-fill" />
        <span className="sp-fill-sweep-label">
          {arrow || entrance ? (
            arrowOnly ? null : (
              <span className="sp-fill-sweep-text">{children}</span>
            )
          ) : (
            children
          )}
          {arrow === "tile" ? (
            <span aria-hidden="true" className="sp-fill-sweep-arrow-tile">
              {arrowMark}
            </span>
          ) : (
            arrowMark
          )}
        </span>
      </KitButton>
    </span>
  );
}

export type ExpandingArrowButtonProps = Omit<
  ButtonBaseProps,
  "children" | "size" | "variant"
> & {
  label?: ReactNode;
  size?: SiteplaneControlSize;
  /**
   * `text` is the bare arrow and label. `default` sets them on the default
   * Button's surface, with its fill, hairline rim, depth and states.
   */
  variant?: "text" | "default";
};

// `type` stays in `props`: Button sets type="button" only when it renders a
// native button, so a `render` link does not receive it.
export function ExpandingArrowButton({
  className,
  label = "Learn more",
  size,
  variant = "text",
  ...props
}: ExpandingArrowButtonProps): ReactElement {
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span
      data-size={resolvedSize}
      className="sp-expanding-arrow-button-root"
      data-slot="expanding-arrow-button-root"
    >
      <KitButton
        {...props}
        className={cn("sp-expanding-arrow-button", className)}
        profile="animated-arrow"
        size={resolvedSize}
        variant={variant}
      >
        <span aria-hidden="true" className="sp-expanding-arrow-circle">
          <span className="sp-expanding-arrow-icon" />
        </span>
        <span className="sp-expanding-arrow-label">{label}</span>
      </KitButton>
    </span>
  );
}

export type ExpandingLogoutButtonProps = Omit<
  ButtonBaseProps,
  "children" | "size" | "variant"
> & {
  label?: string;
  size?: SiteplaneControlSize;
  variant?: AnimatedButtonVariant;
};

export function ExpandingLogoutButton({
  "aria-label": ariaLabel,
  className,
  label = "Log out",
  size,
  style,
  variant = "destructive",
  ...props
}: ExpandingLogoutButtonProps): ReactElement {
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span
      data-size={resolvedSize}
      className="sp-expanding-logout-button-root"
      data-slot="expanding-logout-button-root"
    >
      {/* The open width fits the label; animated-buttons.css turns its length
          into the width. */}
      <span
        className="sp-expanding-logout-slot"
        style={
          {
            "--sp-expanding-logout-label-length": label.length,
          } as CSSProperties
        }
      >
        <KitButton
          {...props}
          aria-label={ariaLabel ?? label}
          className={cn("sp-expanding-logout-button", className)}
          data-variant={
            variant === "destructive" ? "outline-destructive" : variant
          }
          profile="animated-expand"
          size={resolvedSize}
          style={style}
          variant={variant === "destructive" ? "outline-destructive" : variant}
        >
          <span aria-hidden="true" className="sp-expanding-logout-sign">
            <LogOutIcon aria-hidden="true" focusable="false" />
          </span>
          <span className="sp-expanding-logout-label">{label}</span>
        </KitButton>
      </span>
    </span>
  );
}
