"use client";

import * as React from "react";

import { type ScrollMotion, scrollInlineTo } from "../motion/motion-scroll";

/** Where a list that overflows has more tabs: before the visible ones, after them, or both. */
export type TabsOverflow = { end: boolean; start: boolean };

/**
 * The horizontal overflow of a tab list (S-13), measured whenever the list, a
 * tab or the scroll position changes, and the scrolling that reveals tabs: the
 * selected tab when the list starts to overflow and whenever the selection
 * changes, and a page of tabs for each scroll button. A vertical list never
 * overflows here. Keyboard focus scrolls its tab into view itself, as the
 * browser does for any element that takes focus.
 */
export function useTabsOverflow(
  listRef: React.RefObject<HTMLDivElement | null>,
): {
  overflow: TabsOverflow | null;
  scrollToward: (direction: "end" | "start") => void;
} {
  const [overflow, setOverflow] = React.useState<TabsOverflow | null>(null);
  const animationRef = React.useRef<ScrollMotion | null>(null);

  // The list scrolls through the motion component, over the tokens of a list
  // that scrolls to a target, and at once under reduced motion.
  const scrollTo = React.useCallback(
    (left: number, smooth: boolean) => {
      const list = listRef.current;
      if (!list) return;
      animationRef.current?.stop();
      // scrollLeft runs from 0 toward the end in LTR and from 0 toward
      // negative values in RTL; the target stays within that range.
      const extent = list.scrollWidth - list.clientWidth;
      const rtl = getComputedStyle(list).direction === "rtl";
      const target = rtl
        ? Math.min(0, Math.max(-extent, left))
        : Math.max(0, Math.min(extent, left));
      animationRef.current = scrollInlineTo(list, target, smooth);
    },
    [listRef],
  );

  /** Scrolls the list just far enough to show a tab whole, clear of the list's inset. */
  const reveal = React.useCallback(
    (tab: HTMLElement, smooth: boolean) => {
      const list = listRef.current;
      if (!list) return;
      const box = list.getBoundingClientRect();
      const tabBox = tab.getBoundingClientRect();
      const style = getComputedStyle(list);
      const left = box.left + list.clientLeft;
      const before =
        tabBox.left - (left + (Number.parseFloat(style.paddingLeft) || 0));
      const after =
        tabBox.right -
        (left +
          list.clientWidth -
          (Number.parseFloat(style.paddingRight) || 0));
      if (before < 0) scrollTo(list.scrollLeft + before, smooth);
      else if (after > 0) scrollTo(list.scrollLeft + after, smooth);
    },
    [listRef, scrollTo],
  );

  const scrollToward = React.useCallback(
    (direction: "end" | "start") => {
      const list = listRef.current;
      if (!list) return;
      // A page is as many whole tabs as fit in the visible width, and the
      // visible width when a single tab is wider.
      let page = 0;
      for (const tab of list.querySelectorAll<HTMLElement>('[role="tab"]')) {
        const width = tab.getBoundingClientRect().width;
        if (page + width > list.clientWidth) {
          if (page === 0) page = list.clientWidth;
          break;
        }
        page += width;
      }
      const rtl = getComputedStyle(list).direction === "rtl";
      const sign = (direction === "end" ? 1 : -1) * (rtl ? -1 : 1);
      scrollTo(list.scrollLeft + sign * page, true);
    },
    [listRef, scrollTo],
  );

  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const extent = list.scrollWidth - list.clientWidth;
      const next =
        list.getAttribute("aria-orientation") === "vertical" || extent <= 1
          ? null
          : {
              end: Math.abs(list.scrollLeft) < extent - 1,
              start: Math.abs(list.scrollLeft) > 1,
            };
      setOverflow((current) =>
        current?.start === next?.start && current?.end === next?.end
          ? current
          : next,
      );
    };

    measure();
    const resize = new ResizeObserver(measure);
    const observeTabs = () => {
      resize.observe(list);
      for (const tab of list.querySelectorAll<HTMLElement>('[role="tab"]'))
        resize.observe(tab);
    };
    observeTabs();
    // A selection made outside the list, or a click on a tab at its edge,
    // brings the selected tab into view; tabs that join are measured too.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList") observeTabs();
        const tab = record.target;
        if (
          record.type === "attributes" &&
          tab instanceof HTMLElement &&
          tab.getAttribute("aria-selected") === "true"
        )
          reveal(tab, true);
      }
      measure();
    });
    mutations.observe(list, {
      attributeFilter: ["aria-selected"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    // A scroll by hand stops a scroll the kit runs.
    const stop = () => animationRef.current?.stop();
    list.addEventListener("scroll", measure, { passive: true });
    list.addEventListener("wheel", stop, { passive: true });
    list.addEventListener("pointerdown", stop, { passive: true });
    return () => {
      resize.disconnect();
      mutations.disconnect();
      list.removeEventListener("scroll", measure);
      list.removeEventListener("wheel", stop);
      list.removeEventListener("pointerdown", stop);
      animationRef.current?.stop();
    };
  }, [listRef, reveal]);

  // When the list starts to overflow, such as after its first layout, it
  // shows the selected tab at once.
  const overflowing = overflow !== null;
  React.useLayoutEffect(() => {
    if (!overflowing) return;
    const selected = listRef.current?.querySelector<HTMLElement>(
      '[role="tab"][aria-selected="true"]',
    );
    if (selected) reveal(selected, false);
  }, [listRef, overflowing, reveal]);

  return { overflow, scrollToward };
}
