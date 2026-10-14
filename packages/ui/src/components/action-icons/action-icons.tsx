"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "../../system/utils/cn";

import "./action-icons.css";

export type CopyIconPhase = "idle" | "check" | "check-out" | "redraw";

/** How long the check stays on the icon before it fades, in milliseconds. */
const copyCheckHold = 2000;

/** What a screen reader hears when a copy succeeds. */
const copyAnnouncement = "Copied";

/**
 * A motion token in milliseconds, read where the kit's tokens are set, so the
 * phases below keep in step with the copy feedback in motion.css. The value
 * the kit ships stands in where there is no document.
 */
function motionTokenMs(name: `--motion-${string}`, fallback: number): number {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function")
    return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return value.endsWith("ms") ? parsed : parsed * 1000;
}

let copyStatus: HTMLElement | null = null;

/**
 * The polite live region that announces a copy (rulebook T7). A copy button
 * keeps its place and its focus, and not every screen reader reads a new name
 * on the focused element, so the confirmation is said here, once for the
 * page. It sits on the body, which a modal dialog leaves readable: Base UI
 * keeps aria-live regions out of what it hides.
 */
function copyStatusRegion(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (copyStatus?.isConnected) return copyStatus;
  const region = document.createElement("div");
  region.setAttribute("aria-atomic", "true");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("role", "status");
  region.setAttribute("data-slot", "copy-status");
  region.className = "sp-copy-status sr-only";
  document.body.append(region);
  copyStatus = region;
  return region;
}

export type CopyIconPhaseOptions = {
  /**
   * Whether a copy is announced in the shared "Copied" live region. Turn it
   * off where the caller says it itself, such as a visible label that changes
   * in a live region of its own, so a copy is announced once.
   */
  announce?: boolean;
};

export function useCopyIconPhase({
  announce = true,
}: CopyIconPhaseOptions = {}) {
  const [copyPhase, setCopyPhase] = useState<CopyIconPhase>("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    // The region exists before the first copy, so that copy is announced.
    if (announce) copyStatusRegion();
    return () => {
      for (const timer of timersRef.current) clearTimeout(timer);
    };
  }, [announce]);
  function playCopyFeedback() {
    for (const timer of timersRef.current) clearTimeout(timer);
    setCopyPhase("check");
    // The check stays for two seconds, long enough to read a "copied" label
    // beside it; then it fades and, a micro beat later, the copy icon draws
    // itself again: the first stroke, then the second from 80% of the first.
    const checkOut = motionTokenMs("--motion-duration-fast", 150);
    const beat = motionTokenMs("--motion-duration-micro", 100);
    const draw = motionTokenMs("--motion-duration-slow", 320);
    const redraw = copyCheckHold + checkOut + beat;
    // The region is emptied first, so a second copy is announced again, and
    // says "Copied" for as long as the check shows.
    const region = announce ? copyStatusRegion() : null;
    if (region) region.textContent = "";
    timersRef.current = [
      setTimeout(() => {
        if (region) region.textContent = copyAnnouncement;
      }, beat),
      setTimeout(() => setCopyPhase("check-out"), copyCheckHold),
      setTimeout(() => {
        if (region?.textContent === copyAnnouncement) region.textContent = "";
      }, copyCheckHold),
      setTimeout(() => setCopyPhase("redraw"), redraw),
      setTimeout(() => setCopyPhase("idle"), redraw + draw * 1.8),
    ];
  }
  return {
    copyPhase,
    isShowingCheck: copyPhase === "check" || copyPhase === "check-out",
    playCopyFeedback,
  };
}

export function CopyRedrawIcon({
  className,
  phase,
}: {
  className?: string;
  phase: CopyIconPhase;
}) {
  return (
    <span
      className={cn("sp-copy relative inline-flex size-4", className)}
      data-phase={phase}
    >
      <svg
        aria-hidden="true"
        className="sp-copy-check absolute inset-0 mx-0 size-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M20 6 9 17l-5-5" pathLength={1} />
      </svg>
      <svg
        aria-hidden="true"
        className="sp-copy-draw absolute inset-0 mx-0 size-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
          data-draw="1"
          pathLength={1}
        />
        <rect
          data-draw="2"
          height="14"
          pathLength={1}
          rx="2"
          ry="2"
          width="14"
          x="8"
          y="8"
        />
      </svg>
    </span>
  );
}

/**
 * Passive selection mark. The element around it owns the state: it carries
 * `data-selected` while the row is selected, and the shared check motion in
 * motion.css draws the check in and pops the glyph (rulebook M1). The icon
 * stays mounted so the check can draw back out.
 */
export function SelectionCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("sp-check-glyph-motion mx-0 size-4 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {/* pathLength 24 is the dash length of the shared draw-in. */}
      <path
        className="sp-check-path-motion"
        d="M20 6 9 17l-5-5"
        pathLength={24}
      />
    </svg>
  );
}

export function RevealIcon({
  className,
  revealed,
}: {
  className?: string;
  revealed: boolean;
}) {
  return revealed ? (
    <EyeOffIcon className={cn("sp-icon-pop size-4", className)} />
  ) : (
    <EyeIcon className={cn("sp-icon-pop size-4", className)} />
  );
}
