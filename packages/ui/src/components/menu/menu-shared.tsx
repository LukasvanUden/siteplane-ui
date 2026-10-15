import { surfaceClassNames } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
const shortcutClassName =
  "ms-auto font-medium font-sans text-muted-foreground/72 text-xs";

// cn() drops the default min-w-32 when a width mode or className sets a min width.
const menuPopupLayoutClassName =
  "flex min-w-32 origin-(--transform-origin) outline-none before:rounded-[inherit] focus:outline-none";
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
// sets their height, text and icon.
export const menuItemClassName =
  "flex cursor-pointer select-none items-center whitespace-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&>svg]:pointer-events-none [&>svg]:shrink-0";
// A group label wraps a long unbroken value, such as an email address, within
// the popup's width (rulebook K5); only rows stay on one line.
export const menuGroupLabelClassName =
  "font-(--sp-rw-font-weight-label) wrap-anywhere";
export const menuSeparatorClassName = "";
export const menuShortcutClassName = shortcutClassName;
export const menuSubTriggerClassName =
  "flex cursor-pointer items-center whitespace-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&_svg]:pointer-events-none";
