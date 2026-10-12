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
};

/** SheetPopup with the kit's composition profile; the same component. */
export const KitSheetPopup = SheetPopup as (
  props: KitSheetPopupProps,
) => React.ReactElement;
