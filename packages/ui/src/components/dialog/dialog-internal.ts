import type * as React from "react";

import { DialogPopup } from "./dialog";

/*
 * Kit-internal DialogPopup. Not public API: the dialog index does not export
 * this module, and its names and profiles may change in any release. Command
 * renders its dialog with the command profile, and TaskCalendar its day dialog
 * with the composite profile.
 */
export type DialogPopupProfile = "composite" | "default" | "command";

export type KitDialogPopupProps = React.ComponentProps<typeof DialogPopup> & {
  profile?: DialogPopupProfile;
};

/** DialogPopup with the kit's composition profiles; the same component. */
export const KitDialogPopup = DialogPopup as (
  props: KitDialogPopupProps,
) => React.ReactElement;
