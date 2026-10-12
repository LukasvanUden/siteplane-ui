import type * as React from "react";

import { Toggle } from "./toggle";

/*
 * Kit-internal Toggle. Not public API: the toggle index does not export this
 * module, and its names and profiles may change in any release. ToggleGroup
 * renders its toggles with the group profile, and the theme toggles with the
 * theme profile.
 */
export type ToggleProfile = "default" | "group" | "theme";

export type KitToggleProps = React.ComponentProps<typeof Toggle> & {
  profile?: ToggleProfile;
};

/** Toggle with the kit's composition profiles; the same component. */
export const KitToggle = Toggle as (
  props: KitToggleProps,
) => React.ReactElement;
