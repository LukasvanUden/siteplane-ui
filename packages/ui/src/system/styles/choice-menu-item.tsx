import type { ReactNode } from "react";
import type React from "react";
import { cn } from "../utils/cn";
import { wrapTextRuns } from "../utils/text-runs";

// A menu row keeps one line. Its text sits in a label span that can shrink
// and ends in an ellipsis when the popup is narrower than the label.
export const menuRowLabelClassName = "min-w-0 truncate";

// Wraps each run of text children of a menu row in that label span. Icons,
// shortcuts and other elements stay direct children of the row, so the row
// recipe still lays them out.
export function menuRowLabel(children: ReactNode): ReactNode[] {
  return wrapTextRuns(children, (text, index) => (
    <span
      className={cn("sp-menu-row-label", menuRowLabelClassName)}
      data-slot="menu-row-label"
      key={`label-${index}`}
    >
      {text}
    </span>
  ));
}

// The rows keep one size at every control size, like the menu rows (S1): the
// shared menu-row recipe in design-rework.css sets their height, text and icon.
// The sp-choice-menu-item rule there gives a row the accent fill while
// it is hovered, focused or highlighted, where no menu-row state rule does.
export const choiceMenuItemClassName =
  "sp-choice-menu-item grid in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] w-full cursor-pointer items-center whitespace-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&_svg]:pointer-events-none [&_svg]:shrink-0";

// A check or radio indicator takes the leading icon slot of an action row
// (rulebook I8). Its column is as wide as the icon, which the shared menu-row
// slot in design-rework.css defines once, and the indicator carries no offset
// of its own, so every label in a menu starts at the same x.
export const choiceMenuItemCheckGridClassName =
  "grid-cols-[var(--sp-rw-menu-row-icon)_minmax(0,1fr)]";

// The label of a check or radio row: one line, ending in an ellipsis when the
// popup is narrower than the label.
export const choiceMenuItemLabelClassName = "col-start-2 min-w-0 truncate";

// A switch row keeps the leading slot of the other rows of its menu (rulebook
// I8): its label starts where the labels of icon, check and radio rows start,
// and an icon passed first takes the slot. A menu whose rows lead with no mark
// sets --sp-rw-menu-row-lead to 0 (design-rework.css), so its labels start at
// the row padding. The switch sits at the end.
export const choiceMenuItemSwitchGridClassName =
  "grid-cols-[minmax(0,1fr)_auto]";

export const choiceMenuItemSwitchLabelClassName =
  "col-start-1 flex min-w-0 items-center gap-(--sp-rw-menu-row-gap) ps-[calc(var(--sp-rw-menu-row-lead,1)*(var(--sp-rw-menu-row-icon)+var(--sp-rw-menu-row-gap)))] has-[>svg:first-child]:ps-0";

// A radio row with its indicator at the end (`indicatorPosition="end"`) is an
// identity row, such as a workspace in a switcher: it leads with its logo,
// avatar or icon like an action row, and its check ends the row. It takes the
// switch row's grid. A row that leads with an element puts it in the leading
// slot; a row of text alone keeps the slot empty, so its label starts where the
// other labels start (I8).
export const choiceMenuItemEndGridClassName = choiceMenuItemSwitchGridClassName;

export const choiceMenuItemEndLabelClassName =
  "col-start-1 flex min-w-0 items-center gap-(--sp-rw-menu-row-gap) ps-[calc(var(--sp-rw-menu-row-lead,1)*(var(--sp-rw-menu-row-icon)+var(--sp-rw-menu-row-gap)))] has-[>:not([data-slot=menu-row-label]):first-child]:ps-0";

// A Menu or ContextMenu switch keeps the size that fits the compact row at
// every control size; an explicit size still sets another one.
export const choiceMenuSwitchSize = "lg";

// The check of a choice row: the checkbox and radio items of Menu,
// ContextMenu and DrawerMenu and the items of Select and Combobox. It draws
// itself in and out like the check of the Checkbox: its path carries the
// Checkbox's `sp-check-path-motion`, and both read the state of the
// indicator around the glyph, so the rules live once in motion.css. The glyph
// adds the Checkbox indicator's pop. An indicator that holds this glyph stays
// mounted (`keepMounted`): Base UI unmounts one that runs no animation of its
// own, which would cut the leave short. The glyph keeps its size and its slot,
// so the motion changes no geometry.
export function ChoiceMenuItemCheck(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="sp-check-glyph-motion"
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="sp-check-path-motion"
        d="M5.252 12.7 10.2 18.63 18.748 5.37"
      />
    </svg>
  );
}
