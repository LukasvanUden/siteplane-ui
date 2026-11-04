import { surfaceClassNames } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
// A shortcut (Lukas, 30 October 2026) is 12/18 text that
// ends 4 px before the row's padding.
const shortcutClassName =
  "ms-auto pe-1 font-(--sp-rw-font-weight-label) font-sans text-muted-foreground/72 text-xs leading-(--sp-rw-line-18)";

// cn() drops the default min-w-32 when a width mode or className sets a min width.
// The popup stacks its header band, its rows and its footer band in a column
// and stays within the room beside its anchor: the rows scroll between the
// bands, which keep their place.
const menuPopupLayoutClassName =
  "sp-menu-rows flex min-w-32 max-h-(--available-height) flex-col origin-(--transform-origin) outline-none before:rounded-[inherit] focus:outline-none";
export const menuPopupClassName = cn(
  surfaceClassNames.floatingOverlay,
  menuPopupLayoutClassName,
);
export type MenuPopupWidth =
  "auto" | "trigger" | "content" | "at-least-trigger";
// `glass` lays the shared glass surface over whatever sits behind the menu.
export type MenuPopupVariant = "default" | "glass";
// Glass keeps the popup's frame and layout and takes the glass surface in
// place of the opaque one, whose fill, edge and shadow the glass rule draws.
export const menuPopupVariantClassNames: Record<MenuPopupVariant, string> = {
  default: menuPopupClassName,
  glass: cn(
    surfaceClassNames.floatingOverlayFrame,
    surfaceClassNames.glass,
    menuPopupLayoutClassName,
  ),
};
// Every popup stays within the space beside its anchor and is at most 20rem
// wide, a step of the spacing scale like its minimum (min-w-32); a longer row
// label ends in an ellipsis instead (rulebook K5). A trigger-wide popup keeps
// its trigger's width, and one at least as wide as its trigger grows to it.
// ContextMenu repeats these classes for its trigger area: Tailwind reads
// class names only as written.
export const menuPopupWidthClassNames: Record<MenuPopupWidth, string> = {
  auto: "max-w-[min(--spacing(80),var(--available-width))]",
  content: "w-max max-w-[min(--spacing(80),var(--available-width))]",
  trigger: "min-w-0 w-(--anchor-width) max-w-(--available-width)",
  "at-least-trigger":
    "min-w-(--anchor-width) w-max max-w-[min(max(--spacing(80),var(--anchor-width)),var(--available-width))]",
};
// Menus stay compact at every control size: rows, group labels and separators
// keep the default look, and the shared menu-row recipe in design-rework.css
// sets their height, text and icon: a 36 px row with 14/20 text
// and a 16 px icon.
export const menuItemClassName =
  "flex cursor-pointer select-none items-center whitespace-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&>svg]:pointer-events-none [&>svg]:shrink-0";
// A group label is the popup-furniture rule of design-rework.css, which every
// popup list shares: its text, its weight, and the wrapping of a long unbroken
// value, such as an email address, within the popup's width (rulebook K5);
// only rows stay on one line.
export const menuGroupLabelClassName = "";
export const menuSeparatorClassName = "";
export const menuShortcutClassName = shortcutClassName;
export const menuSubTriggerClassName =
  "flex cursor-pointer items-center whitespace-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&_svg]:pointer-events-none";

/** The text in the search field of a menu, and whether the menu is open. */
export type MenuSearchText = { open: boolean; query: string };

/**
 * The text of a menu's search as the menu opens and closes: it belongs to one
 * opening. It stays while the menu closes, whatever closes it, an outside
 * press, Escape, a chosen row or the focus moving out, so the rows do not
 * change as the popup leaves; the next opening starts with an empty field and
 * every row. It follows the open state alone, so no way of closing needs a
 * step of its own. Unchanged, it returns the same object.
 */
export function menuSearchText(
  text: MenuSearchText,
  open: boolean,
): MenuSearchText {
  if (text.open === open) return text;
  return { open, query: open ? "" : text.query };
}

/**
 * The rows of a menu's popup that show, in their order: the elements with a
 * menu item role. A row that the search takes out is not rendered, and the
 * picture of a row that leaves closes in an inert holder (PopupListMotion),
 * so neither counts.
 */
export function menuSearchRows(popup: ParentNode): HTMLElement[] {
  return Array.from(
    popup.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  ).filter((row) => row.closest('[inert], [aria-hidden="true"]') === null);
}

/**
 * The row that an arrow key in the search field goes to: ArrowDown the first
 * row that shows and ArrowUp the last, as the field stands before the rows.
 * The field moves the focus there itself, so the row that Base UI still holds
 * as highlighted from before the field had the focus never decides the step,
 * and no row is skipped.
 */
export function menuSearchArrowRow(
  popup: ParentNode,
  key: string,
): HTMLElement | undefined {
  if (key !== "ArrowDown" && key !== "ArrowUp") return undefined;
  const rows = menuSearchRows(popup);
  return key === "ArrowDown" ? rows[0] : rows.at(-1);
}

/**
 * The props that leave Base UI's highlight off a row while the search field
 * holds the focus. Base UI keeps the row it last highlighted when the focus
 * moves to the field, which is no row of its list, so a row would stay marked
 * while typing goes into the field; it shows its mark again once a row has
 * the focus.
 */
export function menuRowHighlight(fieldFocused: boolean): {
  "data-highlighted"?: undefined;
} {
  return fieldFocused ? { "data-highlighted": undefined } : {};
}

/** What ends the opening of a menu with a search: a key or the pointer in it. */
const menuSearchSettleEvents = ["keydown", "pointerdown", "pointermove"];

/**
 * Keeps the focus in the search field through an opening of its menu: until
 * the first key or pointer in the popup, a focus that moves anywhere else in
 * it comes back to the field, as when a key opens the menu and Base UI focuses
 * the first row. Returns the function that stops it, which the menu calls as
 * it closes.
 */
export function holdMenuSearchFocus(
  popup: EventTarget,
  field: EventTarget & { focus: (options?: FocusOptions) => void },
): () => void {
  // The options object, which every EventTarget reads in both calls.
  const capture = { capture: true };
  const back = (event: Event) => {
    if (event.target !== field) field.focus({ preventScroll: true });
  };
  const stop = () => {
    popup.removeEventListener("focusin", back, capture);
    for (const type of menuSearchSettleEvents)
      popup.removeEventListener(type, stop, capture);
  };
  popup.addEventListener("focusin", back, capture);
  for (const type of menuSearchSettleEvents)
    popup.addEventListener(type, stop, capture);
  return stop;
}
