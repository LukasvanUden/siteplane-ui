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
// Every popup stays within the space beside its anchor; a longer row label
// ends in an ellipsis instead.
export const menuPopupWidthClassNames: Record<MenuPopupWidth, string> = {
  auto: "max-w-(--available-width)",
  content: "w-max max-w-(--available-width)",
  trigger: "min-w-0 w-(--anchor-width) max-w-(--available-width)",
  "at-least-trigger": "min-w-(--anchor-width) w-max max-w-(--available-width)",
};
// Menus stay compact at every control size: rows, group labels and separators
// keep the default look, and the shared menu-row recipe in design-rework.css
// sets their height, text and icon.
export const menuItemClassName =
  "flex cursor-pointer select-none items-center whitespace-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&>svg]:pointer-events-none [&>svg]:shrink-0";
export const menuGroupLabelClassName = "font-medium";
export const menuSeparatorClassName = "";
export const menuShortcutClassName = shortcutClassName;
export const menuSubTriggerClassName =
  "flex cursor-pointer items-center whitespace-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&_svg]:pointer-events-none";
