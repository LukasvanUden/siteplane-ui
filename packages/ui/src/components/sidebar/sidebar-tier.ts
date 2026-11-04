"use client";

import * as React from "react";

/*
 * Kit-internal. Not public API: the sidebar index does not export this module,
 * and its names may change in any release.
 *
 * The second tier on a phone. Below the mobile breakpoint the Sidebar is a
 * sheet and SidebarSecondary has no panel of its own: its pages stand in the
 * sheet under the current item, the row its SidebarMenuButton marks `active`,
 * as the sub rows of that item, which fold with the item's caret (Lukas,
 * 3 November 2026).
 */
export type SidebarTier = {
  /** A SidebarSecondary with pages is mounted below the breakpoint. */
  pages: boolean;
  setPages: (pages: boolean) => void;
  /** The list under the current item that the pages render into. */
  list: HTMLElement | null;
  setList: (list: HTMLElement | null) => void;
};

export const SidebarTierContext: React.Context<SidebarTier | null> =
  React.createContext<SidebarTier | null>(null);

/**
 * The pages of SidebarSecondary in the sheet: there its parts render as the
 * sub rows of the current item.
 */
export const SidebarSubTierContext: React.Context<boolean> =
  React.createContext(false);
