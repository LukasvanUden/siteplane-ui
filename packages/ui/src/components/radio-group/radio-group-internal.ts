import type * as React from "react";

import {
  Radio,
  RadioGroup,
  type RadioGroupProps,
  type RadioProps,
} from "./radio-group";

/*
 * Kit-internal RadioGroup and Radio. Not public API: the radio-group index
 * does not export this module, and its names and profiles may change in any
 * release. Menu and Drawer radio rows render them with the menu-item profile.
 */
export type RadioProfile = "control" | "menu-item";

export type KitRadioGroupProps = RadioGroupProps & { profile?: RadioProfile };

export type KitRadioProps = RadioProps & { profile?: RadioProfile };

/** RadioGroup with the kit's composition profile; the same component. */
export const KitRadioGroup = RadioGroup as (
  props: KitRadioGroupProps,
) => React.ReactElement;

/** Radio with the kit's composition profile; the same component. */
export const KitRadio = Radio as (props: KitRadioProps) => React.ReactElement;
