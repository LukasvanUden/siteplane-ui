"use client";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";

import "./action-icons.css";

export type CopyIconPhase = "idle" | "check" | "check-out" | "redraw";

/** How long the check stays on the icon before it fades, in milliseconds. */
const copyCheckHold = 2000;

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

/**
 * Says `text` in the shared copy live region and takes it back after `hold`
 * milliseconds, unless something else was said since. The region is emptied
 * first and takes the text a micro beat later, so the same words are
 * announced again. Returns a function that stops what is still to come.
 */
export function announceCopyStatus(text: string, hold: number): () => void {
  const region = copyStatusRegion();
  if (!region) return () => {};
  region.textContent = "";
  const timers = [
    setTimeout(
      () => {
        region.textContent = text;
      },
      motionTokenMs("--motion-duration-micro", 100),
    ),
    setTimeout(() => {
      if (region.textContent === text) region.textContent = "";
    }, hold),
  ];
  return () => {
    for (const timer of timers) clearTimeout(timer);
  };
}

export type CopyIconPhaseOptions = {
  /**
   * Whether a copy is announced in the shared live region. Turn it off where
   * the caller says it itself, such as a status line of its own, so a copy is
   * announced once.
   */
  announce?: boolean;
  /**
   * What the shared region says after a copy: CopyButton's `copied` message
   * by default, "Copied" in English.
   */
  announcement?: string | undefined;
};

export function useCopyIconPhase({
  announce = true,
  announcement: announcementProp,
}: CopyIconPhaseOptions = {}) {
  const messages = useSiteplaneMessages("copyButton");
  const announcement = announcementProp ?? messages.copied;
  const [copyPhase, setCopyPhase] = useState<CopyIconPhase>("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stopAnnouncementRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    // The region exists before the first copy, so that copy is announced.
    if (announce) copyStatusRegion();
    return () => {
      for (const timer of timersRef.current) clearTimeout(timer);
      stopAnnouncementRef.current?.();
    };
  }, [announce]);
  function playCopyFeedback() {
    for (const timer of timersRef.current) clearTimeout(timer);
    stopAnnouncementRef.current?.();
    setCopyPhase("check");
    // The check stays for two seconds, long enough to read a "copied" label
    // beside it; then it fades and, a micro beat later, the copy icon draws
    // itself again: the first stroke, then the second from 80% of the first.
    const checkOut = motionTokenMs("--motion-duration-fast", 150);
    const beat = motionTokenMs("--motion-duration-micro", 100);
    const draw = motionTokenMs("--motion-duration-slow", 320);
    const redraw = copyCheckHold + checkOut + beat;
    // The region says the copy for as long as the check shows.
    stopAnnouncementRef.current = announce
      ? announceCopyStatus(announcement, copyCheckHold)
      : undefined;
    timersRef.current = [
      setTimeout(() => setCopyPhase("check-out"), copyCheckHold),
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

/**
 * The copy icon that turns into a check and draws itself again. Both glyphs
 * are the kit's icon set, Phosphor in the Regular weight, drawn as the centre
 * lines of Phosphor's copy and check with their 16-unit stroke in the 256-unit
 * box, so that they can draw themselves. The check runs from the tip of its
 * long arm to the tip of its short arm, because its draw-in dashes it from the
 * end (action-icons.css) and the short arm comes first. In a Button it is the
 * glyph of the Button's size, as every glyph is, and 16 px elsewhere
 * (action-icons.css).
 */
export function CopyRedrawIcon({
  className,
  phase,
}: {
  className?: string;
  phase: CopyIconPhase;
}) {
  return (
    <span
      className={cn("sp-copy relative inline-flex", className)}
      data-phase={phase}
    >
      <svg
        aria-hidden="true"
        className="sp-copy-check absolute inset-0 mx-0 size-full"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
        viewBox="0 0 256 256"
      >
        <path d="M224 72 96 200 40 144" pathLength={1} />
      </svg>
      <svg
        aria-hidden="true"
        className="sp-copy-draw absolute inset-0 mx-0 size-full"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
        viewBox="0 0 256 256"
      >
        <path d="M88 80V40h128v128h-40" data-draw="1" pathLength={1} />
        <rect
          data-draw="2"
          height="128"
          pathLength={1}
          width="128"
          x="40"
          y="88"
        />
      </svg>
    </span>
  );
}

/**
 * Passive selection mark. The element around it owns the state: it carries
 * `data-selected` while the row is selected, and the shared check motion in
 * motion.css draws the check in and pops the glyph (rulebook M1). The icon
 * stays mounted so the check can draw back out. It is the kit's check, the
 * centre line of Phosphor's check with the Regular 16-unit stroke.
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
      strokeWidth="16"
      viewBox="0 0 256 256"
    >
      {/* pathLength 24 is the dash length of the shared draw-in. */}
      <path
        className="sp-check-path-motion"
        d="M40 144 96 200 224 72"
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
    <EyeSlashIcon
      aria-hidden="true"
      className={cn("sp-icon-pop size-4", className)}
    />
  ) : (
    <EyeIcon
      aria-hidden="true"
      className={cn("sp-icon-pop size-4", className)}
    />
  );
}
