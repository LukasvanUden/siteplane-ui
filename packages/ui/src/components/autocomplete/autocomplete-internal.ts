import type * as React from "react";

import { AutocompleteInput, AutocompleteItem } from "./autocomplete";

/*
 * Kit-internal Autocomplete parts. Not public API: the autocomplete index does
 * not export this module, and its names and profiles may change in any
 * release. Command renders its search input and items with the command
 * profile.
 */
export type KitAutocompleteInputProps = React.ComponentProps<
  typeof AutocompleteInput
> & { profile?: "combobox" | "command" };

export type KitAutocompleteItemProps = React.ComponentProps<
  typeof AutocompleteItem
> & { profile?: "default" | "command" };

/** AutocompleteInput with the kit's composition profiles; the same component. */
export const KitAutocompleteInput = AutocompleteInput as (
  props: KitAutocompleteInputProps,
) => React.ReactElement;

/** AutocompleteItem with the kit's composition profile; the same component. */
export const KitAutocompleteItem = AutocompleteItem as (
  props: KitAutocompleteItemProps,
) => React.ReactElement;
