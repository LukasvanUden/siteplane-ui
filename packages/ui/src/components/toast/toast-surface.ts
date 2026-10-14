// The chrome that Toast and the static Notification share. Kit internals,
// imported by file path; neither is part of the public Toast API.

/**
 * The toast surface: the kit's floating surface, radius and fill. The static
 * Notification renders the same chrome, so a preview and the toast it previews
 * cannot drift apart. The `sp-toast-surface` rule in design-rework.css
 * draws the borderless floating surface of Popover and Dialog: one edge from
 * the floating shadow, no border (rulebook B7). The fill is the surface colour
 * that toast.css publishes and mixes in black per stack position; outside a
 * toast there is no stack position and the fill is the plain surface colour.
 * The radius is the control radius token, not `rounded-lg`: a toast portals out
 * of the provider while the preview sits inside it, and the provider rescales
 * `--radius`, which would make the two differ.
 */
export const toastSurfaceClassName =
  "sp-toast-surface sp-toast-replay-motion relative rounded-(--sp-rw-radius-control) bg-[color-mix(in_srgb,var(--sp-rw-surface-color),var(--color-black)_calc(1%*max(0,var(--toast-index,0))))] dark:bg-[color-mix(in_srgb,var(--sp-rw-surface-color),var(--color-black)_calc(6%*max(0,var(--toast-index,0))))]";

/**
 * Where the dismiss control sits on that surface: 8 px inside the top-end
 * corner, as the close of every overlay (rulebook B5). Button's
 * overlay-dismiss profile owns its 24 px box, its 16 px glyph, its colour and
 * its hover; the surface owns only the corner. Text beside it ends 8 px before
 * it, 40 px from the edge (`pe-10`).
 */
export const toastDismissClassName = "absolute end-2 top-2 z-10";
