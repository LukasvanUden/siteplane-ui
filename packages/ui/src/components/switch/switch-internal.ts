import type * as React from "react";

import { Switch, type SwitchProps } from "./switch";

/*
 * Kit-internal Switch. Not public API: the switch index does not export this
 * module, and its names and profiles may change in any release. Menu and
 * Drawer switch rows render a Switch with the menu-item profile.
 */
export type SwitchProfile = "control" | "menu-item";

export type KitSwitchProps = SwitchProps & { profile?: SwitchProfile };

/** Switch with the kit's composition profile; the same component. */
export const KitSwitch = Switch as (
  props: KitSwitchProps,
) => React.ReactElement;
