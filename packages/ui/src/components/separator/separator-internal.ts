import type { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import type * as React from "react";

import type { WithStringClassName } from "../../system/utils/cn";
import { Separator } from "./separator";

/*
 * Kit-internal Separator. Not public API: the separator index does not export
 * this module, and its names and profiles may change in any release. Group and
 * ToggleGroup render their dividers with these composition profiles.
 */
export type SeparatorProfile = "default" | "group" | "toggle-group";

export type KitSeparatorProps =
  WithStringClassName<SeparatorPrimitive.Props> & {
    profile?: SeparatorProfile;
  };

/** Separator with the kit's composition profiles; the same component. */
export const KitSeparator = Separator as (
  props: KitSeparatorProps,
) => React.ReactElement;
