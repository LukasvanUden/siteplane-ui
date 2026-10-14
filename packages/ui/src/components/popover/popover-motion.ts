"use client";

import {
  useCallback,
  useRef,
  type MutableRefObject,
  type RefCallback,
} from "react";

import { readReducedMotion } from "../../system/motion/use-reduced-motion-preference";

type PopoverSide = "top" | "right" | "bottom" | "left";

const flipMotionCleanupBuffer = 40;
const popoverFlipSettleTransition =
  "transform var(--motion-duration-moderate) var(--motion-ease-standard)";

export function isVerticalPopoverSideFlip(
  previousSide: string | null,
  currentSide: string | null,
): boolean {
  return (
    (previousSide === "bottom" && currentSide === "top") ||
    (previousSide === "top" && currentSide === "bottom")
  );
}

/**
 * Base UI hides a positioner with an inline `opacity: 0` until it has a
 * position; a batch that starts from that style places the popover for the
 * first time, which is no flip.
 */
const unplacedStyle = /(?:^|;)\s*opacity:\s*0\s*(?:;|$)/;

/**
 * Where the positioner sat before a batch of attribute writes: the batch's
 * first `style` record holds the style it had, which is restored for one
 * measurement. Without a style record nothing moved.
 */
function rectBeforeWrites(
  element: HTMLElement,
  moved: MutationRecord | undefined,
  current: DOMRect,
): DOMRect {
  if (!moved) return current;
  const style = element.getAttribute("style");
  setStyleAttribute(element, moved.oldValue);
  const rect = element.getBoundingClientRect();
  setStyleAttribute(element, style);
  return rect;
}

function setStyleAttribute(element: HTMLElement, value: string | null) {
  if (value === null) element.removeAttribute("style");
  else element.setAttribute("style", value);
}

export function usePopoverFlipMotion(): RefCallback<HTMLDivElement> {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cleanupTimeoutRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  // Floating UI writes the positioner's style on every position update while
  // the popover is open (scroll, resize). Those writes are left alone: the
  // positioner is measured only in the batch that flips its side, and the
  // place it had comes from the style the batch replaced (RW-11).
  const measurePositioner = useCallback(
    (element: HTMLDivElement, records: readonly MutationRecord[]) => {
      if (isAnimatingRef.current) {
        return;
      }

      const sideChange = records.find(
        (record) => record.attributeName === "data-side",
      );

      if (!sideChange) {
        return;
      }

      const previousSide = toPopoverSide(sideChange.oldValue);
      const currentSide = readPopoverSide(element);
      const moved = records.find((record) => record.attributeName === "style");

      if (
        !isVerticalPopoverSideFlip(previousSide, currentSide) ||
        // The flip settles at once with reduced motion (M5): the system
        // setting, the document mode or the provider preset that the
        // popover's portal scope carries.
        readReducedMotion(element) ||
        unplacedStyle.test(moved?.oldValue ?? "") ||
        isPrePositioningPopoverPositioner(element)
      ) {
        return;
      }

      const popup = element.querySelector<HTMLElement>(
        '[data-slot="popover-popup"]',
      );

      if (!popup) {
        return;
      }

      const currentRect = element.getBoundingClientRect();
      const previousRect = rectBeforeWrites(element, moved, currentRect);

      cancelPendingPopoverFlipMotion(animationFrameRef, cleanupTimeoutRef);
      isAnimatingRef.current = true;

      const previousInlineTransition = popup.style.transition;
      const previousInlineTransform = popup.style.transform;
      const offset = getPopoverFlipOffset(
        previousRect,
        currentRect,
        popup,
        currentSide,
      );

      popup.style.transition = "none";
      popup.style.transform = `translate3d(0, ${offset}px, 0) scale(var(--motion-overlay-scale))`;
      popup.getBoundingClientRect();

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        popup.style.transition = popoverFlipSettleTransition;
        popup.style.transform = previousInlineTransform;

        cleanupTimeoutRef.current = window.setTimeout(() => {
          cleanupTimeoutRef.current = null;

          if (elementRef.current !== element || !element.contains(popup)) {
            isAnimatingRef.current = false;

            return;
          }

          popup.style.transition = previousInlineTransition;
          popup.style.transform = previousInlineTransform;
          isAnimatingRef.current = false;
        }, getPopoverFlipCleanupDelay(element));
      });
    },
    [],
  );

  return useCallback(
    (element) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      elementRef.current = element;

      if (!element) {
        isAnimatingRef.current = false;
        cancelPendingPopoverFlipMotion(animationFrameRef, cleanupTimeoutRef);

        return;
      }

      if (typeof MutationObserver === "undefined") {
        return;
      }

      observerRef.current = new MutationObserver((records) =>
        measurePositioner(element, records),
      );
      observerRef.current.observe(element, {
        attributeFilter: ["data-side", "style"],
        attributeOldValue: true,
        attributes: true,
      });
    },
    [measurePositioner],
  );
}

function isPrePositioningPopoverPositioner(element: HTMLElement): boolean {
  return (
    element.style.opacity === "0" || getComputedStyle(element).opacity === "0"
  );
}

function readPopoverSide(element: HTMLElement): PopoverSide | null {
  return toPopoverSide(element.getAttribute("data-side"));
}

function toPopoverSide(side: string | null): PopoverSide | null {
  if (
    side === "top" ||
    side === "right" ||
    side === "bottom" ||
    side === "left"
  ) {
    return side;
  }

  return null;
}

function getPopoverFlipCleanupDelay(element: HTMLElement): number {
  const duration = getCssDurationMs(element, "--motion-duration-moderate");

  return duration + flipMotionCleanupBuffer;
}

function getPopoverFlipOffset(
  previousRect: DOMRect,
  currentRect: DOMRect,
  element: HTMLElement,
  currentSide: PopoverSide | null,
): number {
  const offset = previousRect.top - currentRect.top;

  if (Math.abs(offset) > 0.5) {
    return offset;
  }

  return getPopoverFlipSettleOffset(element, currentSide);
}

function getPopoverFlipSettleOffset(
  element: HTMLElement,
  currentSide: PopoverSide | null,
): number {
  const distance = getCssDistancePx(element, "--motion-overlay-y");

  return currentSide === "top" ? distance : distance * -1;
}

function getCssDurationMs(element: HTMLElement, propertyName: string): number {
  const value = getComputedStyle(element).getPropertyValue(propertyName).trim();

  if (value.endsWith("ms")) {
    return Number.parseFloat(value);
  }

  if (value.endsWith("s")) {
    return Number.parseFloat(value) * 1000;
  }

  return 0;
}

function getCssDistancePx(element: HTMLElement, propertyName: string): number {
  const value = getComputedStyle(element).getPropertyValue(propertyName).trim();

  if (value.endsWith("px")) {
    return Number.parseFloat(value);
  }

  return 0;
}

function cancelPendingPopoverFlipMotion(
  animationFrameRef: MutableRefObject<number | null>,
  cleanupTimeoutRef: MutableRefObject<number | null>,
) {
  if (typeof window === "undefined") {
    return;
  }

  if (animationFrameRef.current !== null) {
    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }

  if (cleanupTimeoutRef.current !== null) {
    window.clearTimeout(cleanupTimeoutRef.current);
    cleanupTimeoutRef.current = null;
  }
}
