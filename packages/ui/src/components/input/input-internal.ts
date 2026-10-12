import type * as React from "react";

import { Input, type InputProps } from "./input";

/*
 * Kit-internal Input. Not public API: the input index does not export this
 * module, and its names and profiles may change in any release. Command,
 * Combobox, Autocomplete, InputGroup and Sidebar render their input with these
 * composition profiles.
 */
export type InputProfile =
  "command" | "combobox" | "default" | "input-group" | "sidebar";
export type InputProfileMode = "default" | "embedded";

export type KitInputProps = InputProps & {
  profile?: InputProfile;
  profileMode?: InputProfileMode;
};

/** Input with the kit's composition profiles; the same component. */
export const KitInput = Input as (props: KitInputProps) => React.ReactElement;
