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
   * height, and the header scrolls away with the page. A `contained` shell is
   * the height of its container instead, at every width, and only
   * DashboardShellMain scrolls.
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
type DashboardShellSettings = {
  inShell: boolean;
  mobileBreakpoint: "lg" | "md" | undefined;
  stickyHeader: boolean;
};

const DashboardShellContext: React.Context<DashboardShellSettings> =
  React.createContext<DashboardShellSettings>({
    inShell: false,
    mobileBreakpoint: undefined,
    stickyHeader: false,
  });

export function DashboardShell({
  children,
  className,
  contained = false,
  layout = "push",
  mobileBreakpoint = "md",
  stickyHeader = true,
  ...props
}: DashboardShellProps): React.ReactElement {
  const context = React.useMemo(
    () => ({ inShell: true, mobileBreakpoint, stickyHeader }),
    [mobileBreakpoint, stickyHeader],
  );
  return (
    <DashboardShellContext.Provider value={context}>
      <SidebarProvider
        className={cn(!contained && "min-h-svh", className)}
        contained={contained}
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
  const { inShell } = React.useContext(DashboardShellContext);
  return (
    <SidebarInset
      // Sticky content sticks to its nearest scroll container. In a shell the
      // inset clips its content without becoming one (overflow: clip, where
      // the Sidebar's inset is hidden), so where the page scrolls, below the
      // breakpoint and with stickyHeader={false} at every width, the header
      // and a sticky bar of the app's own in the content stick to the
      // viewport. A Table's sticky heading row sticks to the table's own
      // scrolling container.
      className={cn(inShell && "overflow-clip", className)}
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
  // unseen. Below the breakpoint it is the phone bar that holds the menu
  // button, 56 px tall like Header Navigation's (B15): it names the breakpoint
  // in data-menu-bar, and the stylesheet switches its height there.
  const { inShell, mobileBreakpoint } = React.useContext(DashboardShellContext);
  return (
    <header
      className={cn(
        slotClass("dashboard-shell-header", props),
        "flex min-h-(--dashboard-shell-header-height) shrink-0 items-center gap-2 px-4",
        className,
      )}
      data-dashboard-shell="header"
      data-divider={divider ? "true" : "false"}
      data-menu-bar={inShell ? mobileBreakpoint : undefined}
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
  // scrolls, and a scroll container here would hold every sticky bar inside
  // it to a box that never scrolls.
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
  // It clips its content without becoming a scroll container (overflow:
  // clip, as the inset does), so a sticky bar of the app's own in the content
  // sticks to the part that scrolls: the page below the breakpoint, and
  // DashboardShellMain from it up. With overflow hidden it was a scroll
  // container that never scrolls, and nothing in it stuck.
  // It names its slot as the header and the main area do.
  return (
    <section
      className={cn(
        slotClass("dashboard-shell-primary", props),
        "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-clip",
        className,
      )}
      data-dashboard-shell="primary"
      data-slot="dashboard-shell-primary"
      {...props}
    />
  );
}

export { SidebarTrigger as DashboardShellSidebarTrigger };
