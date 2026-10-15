"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useRender } from "@base-ui/react/use-render";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button } from "../button";
import { KitButton } from "../button/button-internal";
import { useLeavingPane } from "../motion/motion-follow";
import { panelSwitchClassName } from "../motion/motion-presence";
import { useTabsOverflow } from "./tabs-overflow";

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
        // that could shrink collapsed for a moment (13 October 2026). The list
        // sits in its frame, which adds no box until its tabs overflow.
        className={cn(
          slotClass("tabs", props),
          "flex min-w-0 max-w-full flex-col gap-2 data-[orientation=vertical]:flex-row [&>.sp-tabs-list-frame]:shrink-0 [&>.sp-tabs-list-frame>.sp-tabs-list]:shrink-0 [&>.sp-tabs-rail]:shrink-0",
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
 * selected tab. It reads every box before it writes, so a placement forces one
 * layout. Returns whether the target has a size, as Base UI shows its own
 * indicator only then.
 */
function placeRailIndicator(
  rail: HTMLElement,
  indicator: HTMLElement,
  active?: HTMLElement | null,
): boolean {
  const target =
    active ??
    rail.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
  if (!target) return false;
  // Scrolled tabs must not paint their selection under the adjacent action.
  // The strip that shows the tabs is the list, or the scroll viewport of a
  // ScrollArea that holds the list inside this rail.
  const list = target.closest('[role="tablist"]');
  const viewport = list?.closest<HTMLElement>(
    '[data-slot="scroll-area-viewport"]',
  );
  const strip = viewport && rail.contains(viewport) ? viewport : list;
  const railBox = rail.getBoundingClientRect();
  const targetBox = target.getBoundingClientRect();
  const stripBox = strip?.getBoundingClientRect();

  indicator.style.setProperty(
    "--active-tab-left",
    `${targetBox.left - railBox.left}px`,
  );
  indicator.style.setProperty("--active-tab-width", `${targetBox.width}px`);
  indicator.style.setProperty("--active-tab-height", `${targetBox.height}px`);
  indicator.parentElement!.style.clipPath = stripBox
    ? `inset(0 ${Math.max(0, railBox.right - stripBox.right)}px 0 ${Math.max(0, stripBox.left - railBox.left)}px)`
    : "inset(0)";
  return targetBox.width > 0 && targetBox.height > 0;
}

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
  // As with Base UI's indicator in a list, the rail's indicator stays hidden
  // until it has a place, and the active tab paints the same selection until
  // then (design-rework.css, "pending"). The server HTML shows the selection
  // that way, with no inline script; the layout effect below hands it to the
  // indicator before the first paint after hydration, and the indicator
  // appears in place, without a transition.
  const [placed, setPlaced] = React.useState(false);
  React.useImperativeHandle(ref, () => railRef.current as HTMLDivElement);

  React.useLayoutEffect(() => {
    const rail = railRef.current;
    const indicator = indicatorRef.current;
    if (!rail || !indicator) return;

    function measure() {
      setPlaced(
        placeRailIndicator(rail!, indicator!, activeIndicatorRef?.current),
      );
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
      className={cn(
        slotClass("tabs-rail", props),
        "relative isolate flex min-w-0 items-center",
        className,
      )}
      data-indicator={placed ? undefined : "pending"}
      data-slot="tabs-rail"
      data-variant={variant}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          ref={indicatorRef}
          className="sp-tab-indicator absolute"
          data-slot="tab-indicator"
          data-variant={variant}
          hidden={!placed}
        />
      </div>
      {children}
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

/**
 * The button at one edge of a list whose tabs overflow, shown while more tabs
 * wait in its direction. It is a pointer control: keyboard users move through
 * the tabs with the arrow keys, which scroll the list, so the button stays out
 * of the tab order and of the accessibility tree, and a press keeps the focus
 * where it was. Its wrapper fades it in and out; the Button keeps its own
 * states (the muted inline action, rulebook T2). A touch screen hides it, as
 * the list scrolls by swiping there (design-rework.css).
 */
function TabsScrollButton({
  direction,
  onScroll,
  shown,
  size,
  visible,
}: {
  direction: "end" | "start";
  onScroll: (direction: "end" | "start") => void;
  /** The list overflows, so the button holds its place. */
  shown: boolean;
  size: SiteplaneControlSize;
  /** More tabs wait in its direction. */
  visible: boolean;
}): React.ReactElement {
  const Icon = direction === "start" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <span
      aria-hidden="true"
      className="sp-tabs-scroll-button"
      data-direction={direction}
      data-slot="tabs-scroll-button"
      data-visible={visible || undefined}
      hidden={!shown}
    >
      <Button
        onClick={() => onScroll(direction)}
        onMouseDown={(event) => event.preventDefault()}
        profile="inline"
        profileTone="muted"
        shape="square"
        size={`icon-${size}`}
        tabIndex={-1}
        type="button"
        variant="text"
      >
        <Icon aria-hidden="true" className="rtl:-scale-x-100" />
      </Button>
    </span>
  );
}

export function TabsList({
  divider = false,
  embedded = false,
  variant = "default",
  size,
  className,
  children,
  ref,
  ...props
}: TabsListProps): React.ReactElement {
  const groupSize = React.useContext(TabsSizeContext);
  const resolvedSize = useResolvedControlSize(size ?? groupSize);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const { overflow, scrollToward } = useTabsOverflow(listRef);
  const setListRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      listRef.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );
  return (
    <TabsSizeContext.Provider value={resolvedSize}>
      <TabsVariantContext.Provider value={variant}>
        {/* The frame adds no box while the tabs fit. When they overflow, it
            lays a scroll button on either side of the list, which shows while
            more tabs wait in its direction; a touch screen swipes the list
            instead and keeps no room for them (design-rework.css). */}
        <div
          className="sp-tabs-list-frame"
          data-overflow={overflow ? "" : undefined}
          data-slot="tabs-list-frame"
        >
          <TabsScrollButton
            direction="start"
            onScroll={scrollToward}
            shown={overflow !== null}
            size={resolvedSize}
            visible={overflow?.start ?? false}
          />
          <TabsPrimitive.List
            className={cn(
              slotClass("tabs-list", props),
              "scrollbar-none relative isolate flex w-fit max-w-full items-center overflow-x-auto overflow-y-hidden data-[orientation=vertical]:flex-col data-[orientation=vertical]:overflow-visible",
              className,
            )}
            data-size={resolvedSize}
            data-slot="tabs-list"
            data-divider={divider || undefined}
            data-embedded={embedded || undefined}
            data-variant={variant}
            ref={setListRef}
            {...props}
          >
            {/* Base UI keeps the indicator hidden until it has measured the
                active tab. Until then the active tab paints the same selection
                (design-rework.css), so the selection shows from the first paint
                without an inline script, and the indicator takes over in place
                once it shows. The indicator leads the list, so that rule reaches
                the tabs as its siblings. */}
            {!embedded && (
              <TabsPrimitive.Indicator
                className="sp-tab-indicator pointer-events-none absolute z-0"
                data-slot="tab-indicator"
                data-variant={variant}
              />
            )}
            {children}
          </TabsPrimitive.List>
          <TabsScrollButton
            direction="end"
            onScroll={scrollToward}
            shown={overflow !== null}
            size={resolvedSize}
            visible={overflow?.end ?? false}
          />
        </div>
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
        slotClass("tabs-tab", props, render),
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
      className={cn(
        slotClass("tabs-content", props),
        "flex-1",
        panelSwitchClassName,
        className,
      )}
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
