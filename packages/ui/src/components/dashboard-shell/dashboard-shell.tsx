"use client";

import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../sidebar";

export type DashboardShellLayout = "inset" | "push";

export interface DashboardShellProps extends React.ComponentProps<
  typeof SidebarProvider
> {
  layout?: DashboardShellLayout;
  /**
   * Keeps DashboardShellHeader in view while the content scrolls. Default
   * true. From the Sidebar's mobile breakpoint up, the shell is the
   * viewport's height and only DashboardShellMain scrolls. Below it the page
   * scrolls and the header sticks to the top of the viewport. Set false for a
   * page that scrolls as a whole: the shell is then at least the viewport's
   * height, and the header scrolls away with the page.
   */
  stickyHeader?: boolean;
}

export interface DashboardShellHeaderProps extends React.ComponentProps<"header"> {
  divider?: boolean;
}

export interface DashboardShellMainProps extends React.ComponentProps<"div"> {
  /**
   * Runs the content to the edges of the main area, without its padding, for
   * a view that lays out its own panes, such as a list beside a detail pane.
   */
  flush?: boolean;
}

// The parts that follow the shell's settings read them here. Outside a
// DashboardShell no sticky rule applies, so a part there keeps the Sidebar's
// own behaviour.
const DashboardShellContext: React.Context<{ stickyHeader: boolean }> =
  React.createContext<{ stickyHeader: boolean }>({ stickyHeader: false });

export function DashboardShell({
  children,
  className,
  layout = "push",
  mobileBreakpoint = "md",
  stickyHeader = true,
  ...props
}: DashboardShellProps): React.ReactElement {
  const context = React.useMemo(() => ({ stickyHeader }), [stickyHeader]);
  return (
    <DashboardShellContext.Provider value={context}>
      <SidebarProvider
        className={cn("min-h-svh", className)}
        // The bar height and the sidebar width are the stylesheet's
        // (design-rework.css, "Dashboard Shell"); an app's style overrides
        // them. So are the sticky header's rules, which switch at the
        // Sidebar's mobile breakpoint.
        data-dashboard-shell="root"
        data-mobile-breakpoint={stickyHeader ? mobileBreakpoint : undefined}
        data-sticky-header={stickyHeader || undefined}
        layout={layout}
        mobileBreakpoint={mobileBreakpoint}
        {...props}
      >
        {children}
      </SidebarProvider>
    </DashboardShellContext.Provider>
  );
}

export function DashboardShellSidebar({
  className,
  collapsible = "icon",
  ...props
}: React.ComponentProps<typeof Sidebar>): React.ReactElement {
  return (
    <Sidebar
      className={className}
      collapsible={collapsible}
      data-dashboard-shell="sidebar"
      {...props}
    />
  );
}

export function DashboardShellSidebarHeader({
  className,
  ...props
}: React.ComponentProps<typeof SidebarHeader>): React.ReactElement {
  return (
    <SidebarHeader
      // Content shorter than the band centres in it, level with the top bar
      // beside it (rulebook S2).
      className={cn(
        "min-h-(--dashboard-shell-header-height) shrink-0 justify-center",
        className,
      )}
      data-dashboard-shell="sidebar-header"
      data-slot="sidebar-header"
      {...props}
    />
  );
}

export function DashboardShellInset({
  className,
  ...props
}: React.ComponentProps<typeof SidebarInset>): React.ReactElement {
  const { stickyHeader } = React.useContext(DashboardShellContext);
  return (
    <SidebarInset
      // A sticky header sticks to its nearest scroll container. The inset
      // clips its content without becoming one (overflow: clip, where it is
      // otherwise hidden), so below the breakpoint, where the page scrolls,
      // the header sticks to the viewport.
      className={cn(stickyHeader && "overflow-clip", className)}
      data-dashboard-shell="inset"
      {...props}
    />
  );
}

export function DashboardShellHeader({
  className,
  divider = true,
  ...props
}: DashboardShellHeaderProps): React.ReactElement {
  // The header sits on the main surface (B1), never on the page canvas: it has
  // no fill of its own, so the sidebar and the content never share one grey.
  // Its inline inset is the main area's 16 px in both layouts and at every
  // width, so a title in it starts on the content's line; a leading sidebar
  // trigger puts its glyph on that line (design-rework.css, "Dashboard Shell
  // header"). In the push layout SidebarInset moves the header clear of the
  // expanded sidebar with the rest of the content. With the shell's
  // stickyHeader, the default, it sticks to the top below the breakpoint,
  // filled with the surface it sits on there, so the content scrolls under it
  // unseen.
  return (
    <header
      className={cn(
        slotClass("dashboard-shell-header", props),
        "flex min-h-(--dashboard-shell-header-height) shrink-0 items-center gap-2 px-4",
        className,
      )}
      data-dashboard-shell="header"
      data-divider={divider ? "true" : "false"}
      data-slot="dashboard-shell-header"
      {...props}
    />
  );
}

export function DashboardShellMain({
  className,
  flush = false,
  ...props
}: DashboardShellMainProps): React.ReactElement {
  // It scrolls on its own only where the shell is the viewport's height
  // (design-rework.css, "Dashboard Shell sticky header"). Elsewhere the page
  // scrolls, and a scroll container here would hold every sticky bar or table
  // header inside it to a box that never scrolls.
  return (
    <div
      className={cn(
        slotClass("dashboard-shell-main", props),
        "min-h-0 flex-1",
        !flush && "p-4",
        className,
      )}
      data-dashboard-shell="main"
      data-flush={flush || undefined}
      data-slot="dashboard-shell-main"
      {...props}
    />
  );
}

export function DashboardShellPrimary({
  className,
  ...props
}: React.ComponentProps<"section">): React.ReactElement {
  return (
    <section
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        className,
      )}
      data-dashboard-shell="primary"
      {...props}
    />
  );
}

export { SidebarTrigger as DashboardShellSidebarTrigger };
