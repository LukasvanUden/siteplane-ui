"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { useSidebar } from "./sidebar";
import { SidebarSubTierContext, SidebarTierContext } from "./sidebar-tier";

import "./sidebar-secondary.css";

/** Whether children hold nothing to show. */
function isEmpty(children: React.ReactNode): boolean {
  return (
    children === undefined ||
    children === null ||
    children === false ||
    children === "" ||
    (Array.isArray(children) && children.every(isEmpty))
  );
}

/**
 * The second tier of a sidebar: a panel at the sidebar's inline end with the
 * pages of the current item, such as the overview and the reports of a
 * dashboard. It opens while the pointer is over the sidebar or the panel, or
 * while keyboard focus is in either, and lies over the content beside the
 * sidebar, so the layout does not move. Beside the collapsed icon rail it
 * makes a slim sidebar; beside the expanded sidebar a dual-tier one.
 *
 * Place it right after the Sidebar in the SidebarProvider, so the keyboard
 * reaches its links after the sidebar's, and fill it with the Sidebar's parts
 * (SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu,
 * SidebarFooter). Render it only for an item with pages: without children it
 * renders nothing. Below the mobile breakpoint the sidebar is a sheet: there
 * the pages stand under the current item, the row marked `active`, as its sub
 * rows, open, and that row folds them with its caret; the panel's group label,
 * header and footer stay out.
 */
export function SidebarSecondary({
  children,
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement | null {
  const { isMobile } = useSidebar();
  const tier = React.useContext(SidebarTierContext);
  const empty = isEmpty(children);
  const setPages = tier?.setPages;
  // Below the breakpoint the current item of the sheet keeps a list for the
  // pages while they exist.
  const onPhone = isMobile && !empty;
  React.useEffect(() => {
    if (!onPhone || !setPages) return;
    setPages(true);
    return () => setPages(false);
  }, [onPhone, setPages]);

  if (empty) return null;
  if (isMobile) {
    const list = tier?.list;
    return list
      ? createPortal(
          <SidebarSubTierContext.Provider value>
            {children}
          </SidebarSubTierContext.Provider>,
          list,
        )
      : null;
  }
  return (
    <div
      className={cn(slotClass("sidebar-secondary", props), className)}
      data-sidebar="secondary"
      data-slot="sidebar-secondary"
      {...props}
    >
      {/* The content keeps the panel's full width while the panel opens and
          closes around it, so its rows never reflow. */}
      <div
        className="sp-sidebar-secondary-content"
        data-slot="sidebar-secondary-content"
      >
        {children}
      </div>
    </div>
  );
}
