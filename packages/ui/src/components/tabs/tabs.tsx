"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
  useSiteplaneNonce,
} from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { KitButton } from "../button/button-internal";
import { useLeavingPane } from "../motion/motion-follow";
import { panelSwitchClassName } from "../motion/motion-presence";

export type TabsVariant = "default" | "pill" | "underline";
const TabsSizeContext = React.createContext<SiteplaneControlSize | null>(null);
const TabsVariantContext = React.createContext<TabsVariant>("default");

export interface TabsProps extends Omit<
  WithStringClassName<TabsPrimitive.Root.Props>,
  "size"
> {
  size?: SiteplaneControlSize;
}
export function Tabs({
  className,
  size,
  ...props
}: TabsProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  return (
    <TabsSizeContext.Provider value={resolvedSize}>
      <TabsPrimitive.Root
        // The list or rail never shrinks: when the panels sit in the root, it
        // follows a taller panel's height from below the content, and a list
        // that could shrink collapsed for a moment (13 October 2026).
        className={cn(
          "flex min-w-0 max-w-full flex-col gap-2 data-[orientation=vertical]:flex-row [&>[data-slot=tabs-list]]:shrink-0 [&>[data-slot=tabs-rail]]:shrink-0",
          className,
        )}
        data-size={resolvedSize}
        data-slot="tabs"
        {...props}
      />
    </TabsSizeContext.Provider>
  );
}

/**
 * Places a rail's selection on its active tab: the target given, or the
 * selected tab. Self-contained, because the server HTML also runs it as an
 * inline script, before the page hydrates.
 */
function placeRailIndicator(rail: HTMLElement, active?: HTMLElement | null) {
  const indicator = rail.querySelector<HTMLElement>(
    ':scope > div > [data-slot="tab-indicator"]',
  );
  const target =
    active ??
    rail.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
  if (!indicator || !target) return;
  const railBox = rail.getBoundingClientRect();
  const targetBox = target.getBoundingClientRect();
  indicator.style.setProperty(
    "--active-tab-left",
    `${targetBox.left - railBox.left}px`,
  );
  indicator.style.setProperty("--active-tab-width", `${targetBox.width}px`);
  indicator.style.setProperty("--active-tab-height", `${targetBox.height}px`);
  // Scrolled tabs must not paint their selection under the adjacent action.
  // The strip that shows the tabs is the list, or the scroll viewport of a
  // ScrollArea that holds the list inside this rail.
  const list = target.closest('[role="tablist"]');
  const viewport = list?.closest<HTMLElement>(
    '[data-slot="scroll-area-viewport"]',
  );
  const strip = viewport && rail.contains(viewport) ? viewport : list;
  const stripBox = strip?.getBoundingClientRect();
  indicator.parentElement!.style.clipPath = stripBox
    ? `inset(0 ${Math.max(0, railBox.right - stripBox.right)}px 0 ${Math.max(0, stripBox.left - railBox.left)}px)`
    : "inset(0)";
}

// The script ends the rail, so the tabs it measures are parsed before it runs.
const railIndicatorScript = `(${placeRailIndicator.toString()})(document.currentScript.parentElement)`;

const subscribeToNothing = () => () => {};

/** Shared rail and selection indicator for tabs composed with an adjacent action. */
export function TabsRail({
  className,
  children,
  activeIndicatorRef,
  ref,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  activeIndicatorRef?: React.RefObject<HTMLElement | null> | undefined;
  variant?: "default" | "pill" | undefined;
}): React.ReactElement {
  const railRef = React.useRef<HTMLDivElement>(null);
  const indicatorRef = React.useRef<HTMLDivElement>(null);
  // A Content Security Policy with nonces lets the script run only with the
  // provider's nonce.
  const nonce = useSiteplaneNonce();
  React.useImperativeHandle(ref, () => railRef.current as HTMLDivElement);
  // The server HTML and the hydration pass carry the script; once the page
  // has hydrated, the layout effect below places the selection.
  const hydrated = React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  React.useLayoutEffect(() => {
    const rail = railRef.current;
    const indicator = indicatorRef.current;
    if (!rail || !indicator) return;

    function measure() {
      placeRailIndicator(rail!, activeIndicatorRef?.current);
    }

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(rail);
    for (const element of rail.querySelectorAll<HTMLElement>(
      '[role="tab"], button',
    )) {
      resize.observe(element);
    }
    const selection = new MutationObserver(measure);
    selection.observe(rail, {
      attributes: true,
      attributeFilter: ["aria-selected"],
      subtree: true,
    });
    rail.addEventListener("scroll", measure, true);
    return () => {
      resize.disconnect();
      selection.disconnect();
      rail.removeEventListener("scroll", measure, true);
    };
  }, [activeIndicatorRef]);

  return (
    <div
      ref={railRef}
      className={cn("relative isolate flex min-w-0 items-center", className)}
      data-slot="tabs-rail"
      data-variant={variant}
      {...props}
    >
      {/* The script styles both before hydration, so their server HTML differs
          from the first client render. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        suppressHydrationWarning
      >
        <div
          ref={indicatorRef}
          className="absolute"
          data-slot="tab-indicator"
          data-variant={variant}
          suppressHydrationWarning
        />
      </div>
      {children}
      {hydrated ? null : (
        <script
          dangerouslySetInnerHTML={{ __html: railIndicatorScript }}
          nonce={nonce}
          suppressHydrationWarning
        />
      )}
    </div>
  );
}

export interface TabsListProps extends Omit<
  WithStringClassName<TabsPrimitive.List.Props>,
  "size"
> {
  variant?: TabsVariant;
  embedded?: boolean;
  /**
   * Underline variant: a hairline under all tabs, along their side when
   * vertical, that the active underline sits on. It spans the list, so a list
   * widened with a class such as `w-full` carries it further; the tabs stay at
   * the start.
   */
  divider?: boolean;
  size?: SiteplaneControlSize;
}
export function TabsList({
  divider = false,
  embedded = false,
  variant = "default",
  size,
  className,
  children,
  ...props
}: TabsListProps): React.ReactElement {
  const groupSize = React.useContext(TabsSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  return (
    <TabsSizeContext.Provider value={resolvedSize}>
      <TabsVariantContext.Provider value={variant}>
        <TabsPrimitive.List
          className={cn(
            "scrollbar-none relative isolate flex w-fit max-w-full items-center overflow-x-auto overflow-y-hidden data-[orientation=vertical]:flex-col data-[orientation=vertical]:overflow-visible",
            className,
          )}
          data-size={resolvedSize}
          data-slot="tabs-list"
          data-divider={divider || undefined}
          data-embedded={embedded || undefined}
          data-variant={variant}
          {...props}
        >
          {children}
          {/* Base UI's inline script places the selection in the server
              HTML, so it shows before the page hydrates (13 October 2026). */}
          {!embedded && (
            <TabsPrimitive.Indicator
              className="pointer-events-none absolute z-0"
              data-slot="tab-indicator"
              data-variant={variant}
              renderBeforeHydration
            />
          )}
        </TabsPrimitive.List>
      </TabsVariantContext.Provider>
    </TabsSizeContext.Provider>
  );
}

export interface TabsTabProps extends Omit<
  WithStringClassName<TabsPrimitive.Tab.Props>,
  "size"
> {
  size?: SiteplaneControlSize;
}
export function TabsTab({
  className,
  size,
  render,
  ...props
}: TabsTabProps): React.ReactElement {
  const groupSize = React.useContext(TabsSizeContext);
  const variant = React.useContext(TabsVariantContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative z-10 shrink-0 whitespace-nowrap data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-profile="tabs-tab"
      data-profile-mode={variant}
      data-size={resolvedSize}
      data-slot="tabs-tab"
      render={
        render ?? (
          <KitButton
            profile="tabs-tab"
            profileMode={variant}
            size={resolvedSize}
            variant="text"
          />
        )
      }
      {...props}
    />
  );
}

/** The panel that takes over: the one that is shown and not on its way out. */
const enteringPanel = (container: HTMLElement) =>
  container.querySelector(
    ':scope > [data-slot="tabs-content"]:not([data-ending-style]):not([hidden])',
  );

/**
 * Switching tabs shows the new panel at once (rulebook M8): the panel that
 * leaves is hidden the moment the new one shows, and the indicator and the
 * height of the panels' container carry the motion. No moment shows two panels
 * or none. Nothing to set up; a panel with `keepMounted` keeps its state, which
 * a `MotionSwap` would remount, so Base UI keeps mounting the panels and the
 * motion component pins the one that leaves while the container follows.
 */
export function TabsPanel({
  className,
  render,
  ...props
}: WithStringClassName<TabsPrimitive.Panel.Props>): React.ReactElement {
  return (
    <TabsPrimitive.Panel
      // Base UI makes the shown panel a tab stop; its keyboard focus takes the
      // kit focus outline (design-rework.css).
      className={cn("flex-1", panelSwitchClassName, className)}
      data-slot="tabs-content"
      render={(panelProps, state) => (
        <TabsPanelSwap panelProps={panelProps} render={render} state={state} />
      )}
      {...props}
    />
  );
}

function TabsPanelSwap({
  panelProps,
  render,
  state,
}: {
  panelProps: React.ComponentPropsWithRef<"div">;
  render: TabsPrimitive.Panel.Props["render"];
  state: TabsPrimitive.Panel.State;
}): React.ReactElement {
  const ref = React.useRef<HTMLDivElement>(null);
  // Base UI keeps the panel mounted while it leaves, `ending` until its fade
  // has run, and unmounts or hides it after.
  const leaving = state.transitionStatus === "ending";
  const style = useLeavingPane(ref, {
    enter: enteringPanel,
    leaving,
    open: !state.hidden && !leaving,
  });

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(panelProps, { style }),
    ref,
    render: render as useRender.ComponentProps<"div">["render"],
    state: { ...state },
  });
}

export { TabsPrimitive, TabsTab as TabsTrigger, TabsPanel as TabsContent };
