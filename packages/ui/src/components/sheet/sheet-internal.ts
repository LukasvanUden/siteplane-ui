import type * as React from "react";

import { SheetPopup } from "./sheet";

/*
 * Kit-internal SheetPopup. Not public API: the sheet index does not export
 * this module, and its names and profiles may change in any release. Sidebar
 * renders its mobile sheet with the sidebar profile.
 */
export type SheetPopupProfile = "default" | "sidebar";

export type KitSheetPopupProps = React.ComponentProps<typeof SheetPopup> & {
  profile?: SheetPopupProfile;
  /**
   * Starts the sheet, its viewport and its backdrop `--sheet-offset-top` below
   * the top of the viewport, which the portal sets, and clips the sheet's
   * entrance there, so a bar above it stays in view and in reach.
   */
  belowOffset?: boolean | undefined;
};

/** SheetPopup with the kit's composition profile; the same component. */
export const KitSheetPopup = SheetPopup as (
  props: KitSheetPopupProps,
) => React.ReactElement;
