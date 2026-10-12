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

export function usePopoverFlipMotion(): RefCallback<HTMLDivElement> {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const previousRectRef = useRef<DOMRect | null>(null);
  const previousSideRef = useRef<PopoverSide | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cleanupTimeoutRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  const measurePositioner = useCallback((element: HTMLDivElement) => {
    if (isAnimatingRef.current) {
      return;
    }

    if (isPrePositioningPopoverPositioner(element)) {
      return;
    }

    const currentSide = readPopoverSide(element);
    const currentRect = element.getBoundingClientRect();
    const previousRect = previousRectRef.current;
    const previousSide = previousSideRef.current;

    if (
      !previousRect ||
      !isVerticalPopoverSideFlip(previousSide, currentSide) ||
      // The flip settles at once with reduced motion (M5): the system
      // setting, the document mode or the provider preset that the popover's
      // portal scope carries.
      readReducedMotion(element)
    ) {
      previousRectRef.current = currentRect;
      previousSideRef.current = currentSide;

      return;
    }

    const popup = element.querySelector<HTMLElement>(
      '[data-slot="popover-popup"]',
    );

    if (!popup) {
      previousRectRef.current = currentRect;
      previousSideRef.current = currentSide;

      return;
    }

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
        previousRectRef.current = element.getBoundingClientRect();
        previousSideRef.current = readPopoverSide(element);
        isAnimatingRef.current = false;
      }, getPopoverFlipCleanupDelay(element));
    });
  }, []);

  return useCallback(
    (element) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      elementRef.current = element;

      if (!element) {
        previousRectRef.current = null;
        previousSideRef.current = null;
        isAnimatingRef.current = false;
        cancelPendingPopoverFlipMotion(animationFrameRef, cleanupTimeoutRef);

        return;
      }

      previousRectRef.current = null;
      previousSideRef.current = null;

      if (typeof MutationObserver === "undefined") {
        return;
      }

      observerRef.current = new MutationObserver(() =>
        measurePositioner(element),
      );
      observerRef.current.observe(element, {
        attributeFilter: ["data-side", "style"],
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
  const side = element.getAttribute("data-side");

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
