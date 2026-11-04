import { Children, isValidElement, type ReactNode } from "react";
import type React from "react";
import type { SiteplaneControlSize } from "../provider/siteplane-ui-provider";
import { cn } from "../utils/cn";
import { wrapTextRuns } from "../utils/text-runs";
import { CheckboxGlyph } from "./checkbox-glyph";

// A menu row keeps one line. Its text sits in a label span that can shrink
// and ends in an ellipsis when the popup is narrower than the label.
export const menuRowLabelClassName = "min-w-0 truncate";

// Where a description that asks to be stacked stands among a row's parts,
// after the label it goes under; -1 without one.
function stackedDescriptionIndex(parts: readonly ReactNode[]): number {
  return parts.findIndex(
    (part, index) =>
      index > 0 &&
      isValidElement<{ stacked?: unknown }>(part) &&
      part.props.stacked === true,
  );
}

// Wraps each run of text children of a menu row in that label span. Icons,
// shortcuts and other elements stay direct children of the row, so the row
// recipe still lays them out. A description that asks to be stacked (a
// `stacked` prop, as MenuItemDescription and DrawerMenuItemDescription have)
// joins the label before it in one column, the name over its description as
// in an account list; the avatar or icon before them stays beside the column.
export function menuRowLabel(children: ReactNode): ReactNode[] {
  const parts = wrapTextRuns(children, (text, index) => (
    <span
      className={cn("sp-menu-row-label", menuRowLabelClassName)}
      data-slot="menu-row-label"
      key={`label-${index}`}
    >
      {text}
    </span>
  ));
  const stacked = stackedDescriptionIndex(parts);
  if (stacked < 1) return parts;
  return [
    ...parts.slice(0, stacked - 1),
    <span
      className="sp-menu-item-stack"
      data-slot="menu-item-stack"
      key="stack"
    >
      {parts[stacked - 1]}
      {parts[stacked]}
    </span>,
    ...parts.slice(stacked + 1),
  ];
}

// A row that keeps its own text layout, such as a DrawerMenu row, whose text
// wraps, stacks a description by the same rule: with a description that asks
// to be stacked, its label and that description form menuRowLabel's column,
// one line each; without one, its children stay as they are.
export function menuRowStack(children: ReactNode): ReactNode {
  return stackedDescriptionIndex(Children.toArray(children)) > 0
    ? menuRowLabel(children)
    : children;
}

/** Where a row of a list shows that it is chosen. */
export type ChoiceIndicatorPosition = "start" | "end";

/** The mark of a chosen row: the check, the Checkbox's box, or none. */
export type ChoiceIndicatorMark = "check" | "checkbox" | "none";

/**
 * The one default of every list of the kit (rulebook I8, Lukas, 31 October
 * 2026): the check of a chosen row ends the row, in the check and radio rows
 * of Menu, ContextMenu and DrawerMenu, the options of Select and Combobox and
 * the rows of ListBox, so every label starts at one x. The Checkbox's box of a
 * multiple Select or a Combobox with checkbox rows is a control, not a mark,
 * and leads its row. A part that offers
 * `indicatorPosition` passes it here, so `start` stays an opt-in and no part
 * keeps a default of its own.
 */
export function choiceIndicatorPosition(
  position: ChoiceIndicatorPosition | undefined,
  mark: ChoiceIndicatorMark = "check",
): ChoiceIndicatorPosition {
  return position ?? (mark === "checkbox" ? "start" : "end");
}

// The rows keep one size at every control size, like the menu rows (S1): the
// shared menu-row recipe in design-rework.css sets their height, text and icon.
// The sp-choice-menu-item rule there gives a row the accent fill while
// it is hovered, focused or highlighted, where no menu-row state rule does.
export const choiceMenuItemClassName =
  "sp-choice-menu-item grid in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] w-full cursor-pointer items-center whitespace-nowrap outline-none data-disabled:cursor-not-allowed data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&_svg]:pointer-events-none [&_svg]:shrink-0";

// A row whose check, radio check or switch ends it: the label, then the
// indicator. The label keeps the leading slot of the other rows of its menu
// (rulebook I8): it starts where the labels of icon rows start, and an icon,
// avatar or logo passed first takes the slot. A menu whose rows lead with no
// mark sets --sp-rw-menu-row-lead to 0 (design-rework.css), so its labels
// start at the row padding. Check, radio and switch rows share this label.
export const choiceMenuItemEndGridClassName = "grid-cols-[minmax(0,1fr)_auto]";

export const choiceMenuItemEndLabelClassName =
  "col-start-1 flex min-w-0 items-center gap-(--sp-rw-menu-row-gap) ps-[calc(var(--sp-rw-menu-row-lead,1)*(var(--sp-rw-menu-row-icon)+var(--sp-rw-menu-row-gap)))] has-[>:not([data-slot=menu-row-label],[data-slot=menu-item-stack]):first-child]:ps-0";

export const choiceMenuItemSwitchGridClassName = choiceMenuItemEndGridClassName;

export const choiceMenuItemSwitchLabelClassName =
  choiceMenuItemEndLabelClassName;

/**
 * The props that keep a menu open while one of its switch rows is pressed: a
 * switch shows its change in place, and more settings can follow. A switch row
 * of Menu, DropdownMenu or ContextMenu never closes its menu, whatever
 * `closeOnClick` says (Lukas, 2 November 2026); the part spreads these after
 * its own props.
 * Check rows keep Base UI's default, which leaves the menu open as well.
 */
export function choiceMenuItemSwitchCloseProps(variant: string | undefined): {
  closeOnClick?: false;
} {
  return variant === "switch" ? { closeOnClick: false } : {};
}

/**
 * Whether picking a radio row closes its menu: it does by default, as a
 * Select closes after its one choice and as a single choice closes a menu
 * (Lukas, 3 November 2026). The one default of the radio
 * rows of Menu, DropdownMenu, ContextMenu and DrawerMenu, which pass a
 * caller's `closeOnClick` here; `false` keeps the menu open. Check rows stay
 * open, since more choices can follow, and switch rows never close
 * (choiceMenuItemSwitchCloseProps).
 */
export function choiceMenuItemRadioCloseProps(
  closeOnClick: boolean | undefined,
): { closeOnClick: boolean } {
  return { closeOnClick: closeOnClick ?? true };
}

// A row with its check at the start, the opt-in `indicatorPosition="start"`,
// or with the Checkbox's box that leads it (`variant="checkbox"`): the check
// or the box takes the leading icon slot, a column as wide as the icon of the
// other rows, which the shared menu-row slot in design-rework.css defines
// once, and the row's gap follows it. The check carries no offset of its own,
// so every label in a menu starts at the same x; the label is one line that
// ends in an ellipsis.
export const choiceMenuItemStartGridClassName =
  "grid-cols-[var(--sp-rw-menu-row-icon)_minmax(0,1fr)]";

// The label column of such a row lays out what it holds as the label of a row
// whose check ends it: an avatar, an icon or a status dot after the box keeps
// the row's gap to the name, as it keeps it after the slot of an icon row, so
// box, mark and name stand 8 px apart (Lukas, 2 November 2026). Text runs take
// the label span that ends in an ellipsis.
export const choiceMenuItemStartLabelClassName =
  "col-start-2 flex min-w-0 items-center gap-(--sp-rw-menu-row-gap)";

/** The columns of a check or radio row of a menu, by its position. */
export const choiceMenuItemGridClassNames: Record<
  ChoiceIndicatorPosition,
  string
> = {
  end: choiceMenuItemEndGridClassName,
  start: choiceMenuItemStartGridClassName,
};

// The check of a choice row: the checkbox and radio items of Menu,
// ContextMenu and DrawerMenu, the items of Select and Combobox and the rows of
// ListBox. It draws itself in and out like the check of the Checkbox: its path
// carries the Checkbox's `sp-check-path-motion`, and both read the state of the
// indicator around the glyph, so the rules live once in motion.css. The glyph
// adds the Checkbox indicator's pop. An indicator that holds this glyph stays
// mounted (`keepMounted`): Base UI unmounts one that runs no animation of its
// own, which would cut the leave short. The glyph keeps its size and its slot,
// so the motion changes no geometry; a part that sizes it apart from its row
// passes the size in `className`. It is the Checkbox's check: the centre line
// of Phosphor's check with the Regular 16-unit stroke in the 256-unit box, as
// long as the dash of the motion (pathLength 24).
export function ChoiceMenuItemCheck({
  className,
  ...props
}: Omit<React.ComponentProps<"svg">, "children">): React.ReactElement {
  return (
    <svg
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="16"
      viewBox="0 0 256 256"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      aria-hidden="true"
      className={cn("sp-check-glyph-motion", className)}
    >
      <path
        className="sp-check-path-motion"
        d="M40 144 96 200 224 72"
        pathLength={24}
      />
    </svg>
  );
}

/** The indicator part of a check or radio row, which Base UI shows. */
type ChoiceMenuItemIndicator = React.ComponentType<{
  children?: ReactNode;
  className?: string;
  keepMounted?: boolean;
}>;

/**
 * The label and the check of a check or radio row of Menu, ContextMenu and
 * DrawerMenu, in the order of the row's position: the one layout of these
 * rows (rulebook I8). The part passes its own indicator, which reads the row's
 * checked state; this places it, holds the shared check in it and keeps it
 * mounted. With the check at the end the label keeps the menu's leading slot;
 * with the check at the start the check takes it.
 */
export function ChoiceMenuItemContent({
  box,
  children,
  indicator: Indicator,
  indicatorClassName,
  indicatorSlot,
  position,
}: {
  /**
   * The Checkbox's box of this size in place of the check: the indicator is
   * the box itself, which shows on every row and fills on a chosen one, as the
   * box of a multiple Select's option does.
   */
  box?: "sm" | "md" | undefined;
  children?: ReactNode;
  indicator: ChoiceMenuItemIndicator;
  /** The part's own class on its indicator, before its column. */
  indicatorClassName?: string | undefined;
  /** The part's own slot on its indicator. */
  indicatorSlot?: string | undefined;
  position: ChoiceIndicatorPosition;
}): React.ReactElement {
  const end = position === "end";
  const check = (
    <Indicator
      className={cn(indicatorClassName, end ? "col-start-2" : "col-start-1")}
      data-size={box}
      data-slot={indicatorSlot}
      keepMounted
    >
      {box ? <CheckboxGlyph size={box} /> : <ChoiceMenuItemCheck />}
    </Indicator>
  );
  return end ? (
    <>
      <span className={choiceMenuItemEndLabelClassName}>
        {menuRowLabel(children)}
      </span>
      {check}
    </>
  ) : (
    <>
      {check}
      <span className={choiceMenuItemStartLabelClassName}>
        {menuRowLabel(children)}
      </span>
    </>
  );
}

// The box of the Checkbox that leads an option of a multiple Select or a
// Combobox with checkbox rows takes a size from its field: the
// sm box beside an sm or md field and the md box beside a larger one. The
// Checkbox rules size the box and CheckboxGlyph its check (design-rework.css).
export function choiceMenuItemBoxSize(
  fieldSize: SiteplaneControlSize,
): "sm" | "md" {
  return fieldSize === "sm" || fieldSize === "md" ? "sm" : "md";
}
