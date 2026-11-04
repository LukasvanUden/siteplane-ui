import type * as React from "react";

import { Sidebar, SidebarProvider } from "./sidebar";

/*
 * Kit-internal SidebarProvider and Sidebar. Not public API: the sidebar index
 * does not export this module, and its names may change in any release.
 * Header Navigation renders its menu as the mobile Sidebar whenever the header
 * itself is narrow, whatever the width of the viewport, and its fullscreen menu
 * opens under its bar.
 */
export type KitSidebarProviderProps = React.ComponentProps<
  typeof SidebarProvider
> & {
  /** Renders the Sidebar as its mobile sheet at every viewport width. */
  forceMobile?: boolean | undefined;
};

/** SidebarProvider with the kit's mobile override; the same component. */
export const KitSidebarProvider = SidebarProvider as (
  props: KitSidebarProviderProps,
) => React.ReactElement;

/**
 * A bar that stays in view above the mobile sheet, as a header's bar stays
 * above its fullscreen menu: the sheet starts at the bar's bottom edge, the
 * button in the bar is the sheet's own trigger and the close as well, and the
 * page beside the sheet keeps its scroll position.
 */
export type SidebarMobileBar = {
  /** The button in the bar that opens and closes the sheet. */
  trigger: React.ReactElement;
  /** Where the sheet starts, from the top of the viewport: the bar's bottom. */
  offset: string;
};

export type KitSidebarProps = React.ComponentProps<typeof Sidebar> & {
  /** Opens the mobile sheet under a bar that stays in view. */
  mobileBar?: SidebarMobileBar | undefined;
};

/** Sidebar with the kit's bar option for its mobile sheet; the same component. */
export const KitSidebar = Sidebar as (
  props: KitSidebarProps,
) => React.ReactElement;
