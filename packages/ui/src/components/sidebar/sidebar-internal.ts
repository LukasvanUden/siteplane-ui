import type * as React from "react";

import { SidebarProvider } from "./sidebar";

/*
 * Kit-internal SidebarProvider. Not public API: the sidebar index does not
 * export this module, and its names may change in any release. Header
 * Navigation renders its menu as the mobile Sidebar whenever the header itself
 * is narrow, whatever the width of the viewport.
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
