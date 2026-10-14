"use client";

import * as React from "react";

import { cn } from "../../system/utils/cn";
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarContext,
  SidebarTrigger,
} from "../sidebar";

export type DashboardShellLayout = "inset" | "push";

type DashboardShellContextValue = {
  layout: DashboardShellLayout;
};

const DashboardShellContext = React.createContext<DashboardShellContextValue>({
  layout: "push",
});

export interface DashboardShellProps extends React.ComponentProps<
  typeof SidebarProvider
> {
  layout?: DashboardShellLayout;
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

export function DashboardShell({
  children,
  className,
  layout = "push",
  ...props
}: DashboardShellProps): React.ReactElement {
  return (
    <DashboardShellContext.Provider value={{ layout }}>
      <SidebarProvider
        className={cn("min-h-svh", className)}
        // The bar height and the sidebar width are the stylesheet's
        // (design-rework.css, "Dashboard Shell"); an app's style overrides
        // them.
        data-dashboard-shell="root"
        layout={layout}
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
  return (
    <SidebarInset
      className={className}
      data-dashboard-shell="inset"
      {...props}
    />
  );
}

// The desktop insets start where the desktop sidebar does, at the provider's
// mobile breakpoint. In the push layout SidebarInset moves the header clear of
// the expanded sidebar with the rest of the content.
const dashboardShellHeaderClassNames = {
  lg: {
    inset: "ps-4 lg:ps-4",
    push: "lg:pe-5",
  },
  md: {
    inset: "ps-4 md:ps-4",
    push: "md:pe-5",
  },
} as const;

export function DashboardShellHeader({
  className,
  divider = true,
  ...props
}: DashboardShellHeaderProps): React.ReactElement {
  const { layout } = React.useContext(DashboardShellContext);
  const insets =
    dashboardShellHeaderClassNames[
      React.useContext(SidebarContext)?.mobileBreakpoint ?? "md"
    ];

  // The header sits on the main surface (B1), never on the page canvas: it has
  // no fill of its own, so the sidebar and the content never share one grey.
  return (
    <header
      className={cn(
        "flex min-h-(--dashboard-shell-header-height) shrink-0 items-center gap-2 px-2",
        insets.push,
        layout === "inset" && insets.inset,
        className,
      )}
      data-dashboard-shell="header"
      data-divider={divider ? "true" : "false"}
      {...props}
    />
  );
}

export function DashboardShellMain({
  className,
  flush = false,
  ...props
}: DashboardShellMainProps): React.ReactElement {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-auto", !flush && "p-4", className)}
      data-dashboard-shell="main"
      data-flush={flush || undefined}
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
