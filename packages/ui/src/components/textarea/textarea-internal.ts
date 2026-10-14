import type * as React from "react";

import { Textarea, type TextareaProps } from "./textarea";

/*
 * Kit-internal Textarea. Not public API: the textarea index does not export
 * this module, and its names and profiles may change in any release.
 * InputGroupTextarea renders its textarea with the input-group profile.
 */
export type TextareaProfile = "default" | "input-group";

export type KitTextareaProps = TextareaProps & {
  profile?: TextareaProfile;
  /**
   * In the input-group profile: the group keeps the end of the textarea clear
   * for an action over its corner (InputGroup `insetEnd`).
   */
  insetEnd?: boolean | undefined;
};

/** Textarea with the kit's composition profile; the same component. */
export const KitTextarea = Textarea as (
  props: KitTextareaProps,
) => React.ReactElement;
