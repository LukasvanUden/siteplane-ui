import type * as React from "react";

import { Checkbox, type CheckboxProps } from "./checkbox";

/*
 * Kit-internal Checkbox. Not public API: the checkbox index does not export
 * this module, and its names and profiles may change in any release. Menu and
 * Drawer checkbox rows render a Checkbox with the menu-item profile.
 */
export type CheckboxProfile = "control" | "menu-item";

export type KitCheckboxProps = CheckboxProps & { profile?: CheckboxProfile };

/** Checkbox with the kit's composition profile; the same component. */
export const KitCheckbox = Checkbox as (
  props: KitCheckboxProps,
) => React.ReactElement;
