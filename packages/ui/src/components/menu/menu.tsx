"use client";

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type { IconProps as PhosphorIconProps } from "@phosphor-icons/react";
import {
  CaretDownIcon,
  CaretRightIcon,
  CaretUpDownIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr";
import * as React from "react";
import { createPortal } from "react-dom";

import { useReducedMotionPreference } from "../../system/motion/use-reduced-motion-preference";
import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import {
  type ChoiceIndicatorPosition,
  ChoiceMenuItemContent,
  choiceIndicatorPosition,
  choiceMenuItemClassName,
  choiceMenuItemGridClassNames,
  choiceMenuItemRadioCloseProps,
  choiceMenuItemSwitchCloseProps,
  choiceMenuItemSwitchGridClassName,
  choiceMenuItemSwitchLabelClassName,
  menuRowLabel,
} from "../../system/styles/choice-menu-item";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../input-group";
import { PopupListMotion } from "../motion/motion-follow";
import {
  holdMenuSearchFocus,
  menuGroupLabelClassName,
  menuItemClassName,
  menuPopupVariantClassNames,
  menuPopupWidthClassNames,
  menuRowHighlight,
  menuSearchArrowRow,
  menuSearchRows,
  menuSearchText,
  menuSeparatorClassName,
  menuShortcutClassName,
  menuSubTriggerClassName,
  type MenuPopupVariant,
  type MenuPopupWidth,
  type MenuSearchText,
} from "./menu-shared";
import { switchThumbClassName, switchTrackClassName } from "../switch/switch";

export const MenuCreateHandle: typeof MenuPrimitive.createHandle =
  MenuPrimitive.createHandle;
export const Menu: typeof MenuPrimitive.Root = MenuPrimitive.Root;
// Base UI's own Portal type, with className narrowed to a string.
export const MenuPortal: React.ForwardRefExoticComponent<
  WithStringClassName<Omit<MenuPrimitive.Portal.Props, "ref">> &
    React.RefAttributes<HTMLDivElement>
> = MenuPrimitive.Portal;

export function MenuTrigger({
  className,
  children,
  ...props
}: WithStringClassName<MenuPrimitive.Trigger.Props>) {
  return (
    <MenuPrimitive.Trigger
      className={cn(slotClass("menu-trigger", props), className)}
      data-slot="menu-trigger"
      {...props}
    >
      {children}
    </MenuPrimitive.Trigger>
  );
}

/** The caret of a menu trigger: the down caret that turns, or a switcher's. */
export type MenuTriggerIconVariant = "default" | "switcher";

/**
 * The caret of a menu trigger: write it last in the trigger, after the
 * label. It is hidden from assistive technology and 16 px at every size, as
 * the caret of a Select. The default is the kit's down caret, which turns half
 * a turn while the menu is open and back when it closes, with every trigger
 * chevron of the kit (design-rework.css, "Trigger chevrons").
 * `variant="switcher"` is the still up-down caret of a trigger that switches
 * between accounts, workspaces or plans: it does not turn, rests in the
 * tertiary text colour and takes the primary on hover, press and while its
 * menu is open (rulebook M9; Lukas, 4 November 2026). It is the one caret of
 * every switcher: a Sidebar's switcher row ends with SidebarMenuChevron
 * `variant="switcher"`, which draws it, and so do the account triggers.
 */
export function MenuTriggerIcon({
  className,
  variant = "default",
  ...props
}: Omit<PhosphorIconProps, "weight"> & {
  /**
   * `default`, the down caret that turns while the menu is open; or
   * `switcher`, the still up-down caret of a switcher.
   */
  variant?: MenuTriggerIconVariant | undefined;
}): React.ReactElement {
  const Icon = variant === "switcher" ? CaretUpDownIcon : CaretDownIcon;
  return (
    <Icon
      aria-hidden="true"
      data-slot="menu-trigger-icon"
      data-variant={variant === "switcher" ? "switcher" : undefined}
      {...props}
      className={cn(slotClass("menu-trigger-icon", props), className)}
    />
  );
}

/**
 * What a menu with a search field shares between its parts: the text in the
 * field, the test that a row's text passes, the field itself (a row hands the
 * typing back to it), whether the search leaves no row at all, whether the
 * field holds the focus and whether the menu is open.
 */
type MenuSearchValue = {
  /** Whether the search finds no row: the text is set and no row has it. */
  empty: boolean;
  /** Whether the field holds the focus, so no row shows Base UI's highlight. */
  fieldFocused: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  matches: (text: string) => boolean;
  /** The menu's open state, which the text and the field's focus follow. */
  open: boolean;
  query: string;
  setFieldFocused: (focused: boolean) => void;
  setQuery: (query: string) => void;
};

const MenuSearchContext = React.createContext<MenuSearchValue | null>(null);

/** The text of what a row holds, as it is written: strings and numbers, through elements. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (React.isValidElement<{ children?: React.ReactNode }>(node))
    return textOf(node.props.children);
  return "";
}

/**
 * Whether a row stays while the search is set: its `label`, or the text it
 * holds, has the text of the field in it, ignoring case and accents. Every
 * row asks, so rows in components of the application are found too.
 */
function useMenuRowVisible(
  label: string | null | undefined,
  children: React.ReactNode,
): boolean {
  const search = React.useContext(MenuSearchContext);
  return !search || search.matches(label ?? textOf(children));
}

/**
 * The props of a row while the search field holds the focus: Base UI's
 * highlight stays off, as the field and not a row has the focus
 * (menuRowHighlight). Every kind of row spreads them after its own props.
 */
function useMenuRowHighlight(): ReturnType<typeof menuRowHighlight> {
  return menuRowHighlight(
    React.useContext(MenuSearchContext)?.fieldFocused ?? false,
  );
}

/**
 * Whether a row among these children has the text of the search, for a group
 * that hides itself when it holds no such row and for the empty state of the
 * search. The rows are the Menu's own, found through the elements written in
 * place (groups and parts of the Menu); a component of the application that
 * holds rows and takes no children counts as a match, so a guess never hides
 * a group or shows the empty state wrongly. The rows of a submenu belong to
 * their own popup.
 */
function anyRowMatches(
  node: React.ReactNode,
  matches: (text: string) => boolean,
): boolean {
  return React.Children.toArray(node).some((child) => {
    if (
      !React.isValidElement<{
        children?: React.ReactNode;
        label?: string | null;
      }>(child)
    )
      return false;
    if (menuRows.has(child.type))
      return matches(child.props.label ?? textOf(child.props.children));
    if (menuLeaves.has(child.type) || child.type === MenuSubPopup) return false;
    if (child.props.children !== undefined)
      return anyRowMatches(child.props.children, matches);
    return typeof child.type !== "string";
  });
}

/**
 * The search of a menu for one opening. MenuPopup puts it around its
 * positioner, which hands it the menu's open state, so the text in the field is
 * the text of this opening (menuSearchText): it stays while the menu closes,
 * whatever closes it, and the next opening starts with an empty field and every
 * row, before anything of it renders. The rows ask it whether they stay.
 */
function MenuSearchScope({
  children,
  inputRef,
  open,
  rows,
}: {
  children: React.ReactNode;
  inputRef: React.RefObject<HTMLInputElement | null>;
  open: boolean;
  /** The rows of the popup, for the empty state of the search. */
  rows: React.ReactNode;
}) {
  const [stored, setStored] = React.useState<MenuSearchText>({
    open,
    query: "",
  });
  const current = menuSearchText(stored, open);
  if (current !== stored) setStored(current);
  const query = current.query;
  const setQuery = React.useCallback(
    (next: string) => setStored((text) => ({ ...text, query: next })),
    [],
  );
  const [fieldFocused, setFieldFocused] = React.useState(false);
  const { contains } = AutocompletePrimitive.useFilter({ sensitivity: "base" });
  const text = query.trim();
  const matches = React.useCallback(
    (row: string) => text === "" || contains(row, text),
    [contains, text],
  );
  const search = React.useMemo<MenuSearchValue>(
    () => ({
      empty: text !== "" && !anyRowMatches(rows, matches),
      fieldFocused,
      inputRef,
      matches,
      open: current.open,
      query,
      setFieldFocused,
      setQuery,
    }),
    [
      current.open,
      fieldFocused,
      inputRef,
      matches,
      query,
      rows,
      setQuery,
      text,
    ],
  );
  return (
    <MenuSearchContext.Provider value={search}>
      {children}
    </MenuSearchContext.Provider>
  );
}

/** The motion of the rows of a menu as its search changes them (rulebook M7). */
function MenuSearchMotion({
  list,
  reduced,
}: {
  list: React.RefObject<HTMLDivElement | null>;
  reduced: boolean;
}) {
  const query = React.useContext(MenuSearchContext)?.query ?? "";
  return (
    <PopupListMotion
      change={[query]}
      reduced={reduced}
      scrollArea={() => list.current}
    />
  );
}

/**
 * The two places of a popup that its bands stand in, above and below the
 * rows, and the part that tells the popup it has a search field. MenuHeader
 * and MenuFooter put themselves in them wherever they are written, so a band
 * that an application wraps in a component of its own still stands in its
 * place and the rows scroll between the two.
 */
type MenuBandsValue = {
  footer: HTMLElement | null;
  header: HTMLElement | null;
  registerSearch: () => () => void;
};

const MenuBandsContext = React.createContext<MenuBandsValue | null>(null);

export function MenuPopup({
  children,
  className,
  onKeyDownCapture,
  sideOffset = 4,
  align = "center",
  alignOffset,
  side = "bottom",
  anchor,
  portalProps,
  width = "auto",
  variant = "default",
  ...props
}: WithStringClassName<MenuPrimitive.Popup.Props> & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"];
  side?: MenuPrimitive.Positioner.Props["side"];
  anchor?: MenuPrimitive.Positioner.Props["anchor"];
  portalProps?: WithStringClassName<MenuPrimitive.Portal.Props>;
  width?: MenuPopupWidth;
  variant?: MenuPopupVariant;
}) {
  // The places of the bands, and whether a search field has put itself in the
  // header: a menu with one filters its rows by what is typed in it.
  const [headerSlot, setHeaderSlot] = React.useState<HTMLDivElement | null>(
    null,
  );
  const [footerSlot, setFooterSlot] = React.useState<HTMLDivElement | null>(
    null,
  );
  const [searchers, setSearchers] = React.useState(0);
  const searches = searchers > 0;
  const registerSearch = React.useCallback(() => {
    setSearchers((count) => count + 1);
    return () => setSearchers((count) => count - 1);
  }, []);
  const bands = React.useMemo<MenuBandsValue>(
    () => ({ footer: footerSlot, header: headerSlot, registerSearch }),
    [footerSlot, headerSlot, registerSearch],
  );
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();
  return (
    <MenuPortal {...portalProps}>
      <SiteplaneUIPortalScope>
        <MenuPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          className="sp-menu-positioner z-50"
          data-slot="menu-positioner"
          // The text of the search belongs to one opening of the menu: the
          // positioner hands the menu's open state to the part that holds it,
          // whatever opens or closes the menu.
          render={(positionerProps, { open }) => (
            <MenuSearchScope inputRef={inputRef} open={open} rows={children}>
              <div {...positionerProps} />
            </MenuSearchScope>
          )}
          side={side}
          sideOffset={sideOffset}
        >
          <MenuPrimitive.Popup
            className={cn(
              slotClass("menu-popup", props),
              menuPopupVariantClassNames[variant],
              menuPopupWidthClassNames[width],
              className,
            )}
            data-slot="menu-popup"
            data-variant={variant === "glass" ? variant : undefined}
            onKeyDownCapture={(event) => {
              onKeyDownCapture?.(event);
              const input = inputRef.current;
              if (!searches || !input || event.defaultPrevented) return;
              if (event.target === input) return;
              const key = event.key;
              // Typing while a row has the focus goes on in the field: the
              // character that this key makes is typed where the focus is
              // after the handler, and a space stays the row's own.
              if (
                key.length === 1 &&
                key !== " " &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey
              ) {
                input.focus();
                event.stopPropagation();
              } else if (
                key === "ArrowUp" &&
                event.target === menuSearchRows(event.currentTarget)[0]
              ) {
                // From the first row that shows back up to the field.
                event.preventDefault();
                event.stopPropagation();
                input.focus();
              }
            }}
            {...props}
          >
            <MenuBandsContext.Provider value={bands}>
              <div
                className="sp-menu-header-slot shrink-0"
                data-slot="menu-header-slot"
                ref={setHeaderSlot}
              />
              {/* The menu (Lukas, 30 October 2026): the rows sit 6
                  px inside the popup and the list 4 px from its top and
                  bottom (the menu list rule of design-rework.css). A grid of
                  one column stacks them, so the 1 px above and below each
                  row adds up between two rows. */}
              <div
                className="sp-menu-list grid max-h-(--available-height) w-full grid-cols-1 overflow-y-auto"
                data-popup-list={searches ? "" : undefined}
                ref={list}
              >
                {children}
              </div>
              <div
                className="sp-menu-footer-slot shrink-0"
                data-slot="menu-footer-slot"
                ref={setFooterSlot}
              />
              {/* The rows that the search takes out fade and close where they
                  were, the rows below glide and the popup follows its height
                  (rulebook M7), as in every list of a popup that filters. */}
              {searches ? (
                <MenuSearchMotion list={list} reduced={reduced} />
              ) : null}
            </MenuBandsContext.Provider>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </MenuPortal>
  );
}

export function MenuGroup(
  props: WithStringClassName<MenuPrimitive.Group.Props>,
) {
  const search = React.useContext(MenuSearchContext);
  // While the search is set, a group with no row that has the text is gone,
  // with its label.
  if (
    search &&
    search.query.trim() !== "" &&
    !anyRowMatches(props.children, search.matches)
  )
    return null;
  return (
    <MenuPrimitive.Group
      data-slot="menu-group"
      {...props}
      className={cn(slotClass("menu-group", props), props.className)}
    />
  );
}
export function MenuItem({
  className,
  children,
  inset,
  variant = "default",
  ...props
}: WithStringClassName<MenuPrimitive.Item.Props> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  const highlight = useMenuRowHighlight();
  if (!useMenuRowVisible(props.label, children)) return null;
  return (
    <MenuPrimitive.Item
      className={cn(
        slotClass("menu-item", props),
        menuItemClassName,
        className,
      )}
      data-inset={inset || undefined}
      data-slot="menu-item"
      data-variant={variant}
      {...props}
      {...highlight}
    >
      {menuRowLabel(children)}
    </MenuPrimitive.Item>
  );
}
export function MenuLinkItem({
  className,
  children,
  inset,
  variant = "default",
  closeOnClick = true,
  ...props
}: WithStringClassName<MenuPrimitive.LinkItem.Props> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  const highlight = useMenuRowHighlight();
  if (!useMenuRowVisible(props.label, children)) return null;
  return (
    <MenuPrimitive.LinkItem
      className={cn(
        slotClass("menu-link-item", props),
        menuItemClassName,
        className,
      )}
      closeOnClick={closeOnClick}
      data-inset={inset || undefined}
      data-slot="menu-link-item"
      data-variant={variant}
      {...props}
      {...highlight}
    >
      {menuRowLabel(children)}
    </MenuPrimitive.LinkItem>
  );
}
export function MenuCheckboxItem({
  className,
  children,
  checked,
  variant = "default",
  ...props
}: WithStringClassName<MenuPrimitive.CheckboxItem.Props> & {
  /**
   * How the row shows that it is on: `default`, the check that ends the row;
   * `switch`, the Switch that ends it; or `checkbox`, the Checkbox's box
   * that leads it, for a list that people pick several rows from, as in a
   * menu with a search field. A switch row keeps the menu open when it is
   * pressed, whatever `closeOnClick` says.
   */
  variant?: "default" | "switch" | "checkbox";
}) {
  // The check ends the row, as the switch does, and the Checkbox's box leads
  // it (I8).
  const position = choiceIndicatorPosition(
    undefined,
    variant === "checkbox" ? "checkbox" : "check",
  );
  const highlight = useMenuRowHighlight();
  if (!useMenuRowVisible(props.label, children)) return null;
  return (
    <MenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        slotClass("menu-checkbox-item", props),
        choiceMenuItemClassName,
        variant === "switch"
          ? choiceMenuItemSwitchGridClassName
          : choiceMenuItemGridClassNames[position],
        className,
      )}
      data-indicator-position={position}
      data-slot="menu-checkbox-item"
      data-variant={variant}
      {...props}
      {...highlight}
      {...choiceMenuItemSwitchCloseProps(variant)}
    >
      {variant === "switch" ? (
        <>
          <span className={choiceMenuItemSwitchLabelClassName}>
            {menuRowLabel(children)}
          </span>
          <MenuPrimitive.CheckboxItemIndicator
            className={cn("sp-base-switch", switchTrackClassName)}
            data-foundation="switch"
            data-slot="switch-track"
            keepMounted
          >
            <span
              className={cn("sp-switch-thumb", switchThumbClassName)}
              data-slot="switch-thumb"
            />
          </MenuPrimitive.CheckboxItemIndicator>
        </>
      ) : (
        <ChoiceMenuItemContent
          box={variant === "checkbox" ? "sm" : undefined}
          indicator={MenuPrimitive.CheckboxItemIndicator}
          indicatorClassName={
            variant === "checkbox"
              ? "sp-menu-item-checkbox inline-flex shrink-0 items-center justify-center"
              : undefined
          }
          indicatorSlot={
            variant === "checkbox" ? "menu-item-checkbox" : undefined
          }
          position={position}
        >
          {children}
        </ChoiceMenuItemContent>
      )}
    </MenuPrimitive.CheckboxItem>
  );
}
export function MenuRadioGroup(
  props: WithStringClassName<MenuPrimitive.RadioGroup.Props>,
) {
  const search = React.useContext(MenuSearchContext);
  if (
    search &&
    search.query.trim() !== "" &&
    !anyRowMatches(props.children, search.matches)
  )
    return null;
  return (
    <MenuPrimitive.RadioGroup
      data-slot="menu-radio-group"
      {...props}
      className={cn(slotClass("menu-radio-group", props), props.className)}
    />
  );
}
export function MenuRadioItem({
  className,
  children,
  closeOnClick,
  indicatorPosition,
  ...props
}: WithStringClassName<MenuPrimitive.RadioItem.Props> & {
  /**
   * Whether picking the row closes the menu. It does by default, as a single
   * choice does in a Select; `false` keeps the menu open.
   */
  closeOnClick?: boolean | undefined;
  /**
   * Where the row shows its check: at the end of the row, the default of
   * every list of the kit, while a logo, an avatar or an icon passed first
   * takes the leading slot; or in the leading slot (`start`).
   */
  indicatorPosition?: ChoiceIndicatorPosition | undefined;
}) {
  const position = choiceIndicatorPosition(indicatorPosition);
  const highlight = useMenuRowHighlight();
  if (!useMenuRowVisible(props.label, children)) return null;
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        slotClass("menu-radio-item", props),
        choiceMenuItemClassName,
        choiceMenuItemGridClassNames[position],
        className,
      )}
      data-indicator-position={position}
      data-slot="menu-radio-item"
      {...props}
      {...highlight}
      {...choiceMenuItemRadioCloseProps(closeOnClick)}
    >
      <ChoiceMenuItemContent
        indicator={MenuPrimitive.RadioItemIndicator}
        position={position}
      >
        {children}
      </ChoiceMenuItemContent>
    </MenuPrimitive.RadioItem>
  );
}
export function MenuGroupLabel({
  className,
  inset,
  ...props
}: WithStringClassName<MenuPrimitive.GroupLabel.Props> & { inset?: boolean }) {
  return (
    <MenuPrimitive.GroupLabel
      className={cn(
        slotClass("menu-label", props),
        menuGroupLabelClassName,
        className,
      )}
      data-inset={inset || undefined}
      data-slot="menu-label"
      {...props}
    />
  );
}
export function MenuSeparator({
  className,
  ...props
}: WithStringClassName<MenuPrimitive.Separator.Props>) {
  // The dividers between groups mean nothing among the rows that a search
  // has left.
  if (React.useContext(MenuSearchContext)?.query.trim()) return null;
  return (
    <MenuPrimitive.Separator
      className={cn(
        slotClass("menu-separator", props),
        menuSeparatorClassName,
        className,
      )}
      data-slot="menu-separator"
      {...props}
    />
  );
}
/**
 * The supporting text of a row, such as an email beside a name: the regular
 * weight in the tertiary colour after the label, which then takes the title
 * weight, as the description of a Select option does (design-rework.css). A
 * direct child of the row, after its text.
 */
export function MenuItemDescription({
  className,
  stacked,
  ...props
}: React.ComponentProps<"span"> & {
  /**
   * Puts the description under the name instead of after it, in one column
   * beside the row's avatar or icon, as an account list shows a name over its
   * email. The row's name and description stay on one line each.
   */
  stacked?: boolean | undefined;
}) {
  return (
    <span
      className={cn(
        slotClass("menu-item-description", props),
        "min-w-0 truncate",
        className,
      )}
      data-layout={stacked ? "stacked" : undefined}
      data-slot="menu-item-description"
      {...props}
    />
  );
}
export function MenuShortcut({
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        slotClass("menu-shortcut", props),
        menuShortcutClassName,
        className,
      )}
      data-slot="menu-shortcut"
      {...props}
    />
  );
}
export function MenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="menu-sub" {...props} />;
}
export function MenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: WithStringClassName<MenuPrimitive.SubmenuTrigger.Props> & {
  inset?: boolean;
}) {
  const highlight = useMenuRowHighlight();
  if (!useMenuRowVisible(props.label, children)) return null;
  return (
    <MenuPrimitive.SubmenuTrigger
      className={cn(
        slotClass("menu-sub-trigger", props),
        menuSubTriggerClassName,
        className,
      )}
      data-inset={inset || undefined}
      data-slot="menu-sub-trigger"
      {...props}
      {...highlight}
    >
      {menuRowLabel(children)}
      <CaretRightIcon aria-hidden="true" />
    </MenuPrimitive.SubmenuTrigger>
  );
}
export function MenuSubPopup({
  className,
  sideOffset = 0,
  alignOffset,
  align = "start",
  ...props
}: WithStringClassName<MenuPrimitive.Popup.Props> & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"];
  width?: MenuPopupWidth;
  variant?: MenuPopupVariant;
}) {
  const defaultAlignOffset = align !== "center" ? -5 : undefined;
  return (
    <MenuPopup
      align={align}
      alignOffset={alignOffset ?? defaultAlignOffset}
      className={className}
      data-slot="menu-sub-content"
      side="inline-end"
      sideOffset={sideOffset}
      {...props}
    />
  );
}

/**
 * The band above the rows of a popup: a 12 px band under a hairline, which
 * holds a search field (MenuSearch) or the identity of the account the menu
 * belongs to, such as an AvatarLabelGroup or a MenuHeaderTitle with its
 * MenuHeaderDescription. It is a direct child of MenuPopup, and the rows
 * scroll beneath it. It is the popup band of design-rework.css, which the
 * Combobox's header and the Command palette's search row share.
 */
export function MenuHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const bands = React.useContext(MenuBandsContext);
  const band = (
    <div
      className={cn(slotClass("menu-header", props), className)}
      data-slot="menu-header"
      {...props}
    />
  );
  // In its place above the rows; outside a popup it stands where it is written.
  if (!bands) return band;
  return bands.header ? createPortal(band, bands.header) : null;
}

/** The first line of a MenuHeader: who or what the menu is for, in the label role. */
export function MenuHeaderTitle({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(slotClass("menu-header-title", props), className)}
      data-slot="menu-header-title"
      {...props}
    />
  );
}

/** The line under a MenuHeaderTitle: what else there is to know, in the tertiary text colour. */
export function MenuHeaderDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(slotClass("menu-header-description", props), className)}
      data-slot="menu-header-description"
      {...props}
    />
  );
}

/**
 * The band under the rows of a popup: a 12 px band over a hairline, which holds
 * an action, such as a full-width Button (`width="full"`, xs), or a line of
 * text at its two ends, such as a copyright and a version. A direct child of
 * MenuPopup; the rows scroll above it.
 */
export function MenuFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const bands = React.useContext(MenuBandsContext);
  const band = (
    <div
      className={cn(slotClass("menu-footer", props), className)}
      data-slot="menu-footer"
      {...props}
    />
  );
  // In its place under the rows; outside a popup it stands where it is written.
  if (!bands) return band;
  return bands.footer ? createPortal(band, bands.footer) : null;
}

/**
 * A search field in the header band that filters the rows of the menu as it is
 * typed in: a row stays while its
 * `label` (or the text it holds) has what is typed in it, ignoring case and
 * accents; the groups and separators that no row is left in go with them, and
 * the rows move as one stack (rulebook M7). The field has the focus at every
 * opening, by a key as by a pointer, and no row shows a highlight while it
 * holds it. ArrowDown goes to the first row that shows and ArrowUp to the
 * last, and ArrowUp from the first row comes back; typing while a row has the
 * focus goes on in the field; Escape clears the field before it closes the
 * menu. A direct child of MenuPopup. The
 * text belongs to one opening of the menu: it stays while the menu closes,
 * whatever closes it, and the next opening starts with an empty field and
 * every row.
 */
export function MenuSearch({
  "aria-label": ariaLabelProp,
  className,
  placeholder: placeholderProp,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  "aria-label"?: string | undefined;
  placeholder?: string | undefined;
}) {
  const messages = useSiteplaneMessages("menu");
  const ariaLabel = ariaLabelProp ?? messages.searchLabel;
  const placeholder = placeholderProp ?? messages.searchPlaceholder;
  const search = React.useContext(MenuSearchContext);
  const bands = React.useContext(MenuBandsContext);
  // The popup knows it has a search field, so its rows move as one stack.
  const registerSearch = bands?.registerSearch;
  React.useLayoutEffect(() => registerSearch?.(), [registerSearch]);
  // The field has the focus at every opening, by a pointer or a key, also in a
  // popup kept mounted: it follows the open state that the text follows
  // (menuSearchText), from the moment the band is in its place. Through the
  // opening, a focus that Base UI moves to a row, as a key that opens the menu
  // does, comes back to the field (holdMenuSearchFocus).
  const open = search?.open ?? false;
  const header = bands?.header ?? null;
  const inputRef = search?.inputRef;
  React.useLayoutEffect(() => {
    const input = inputRef?.current;
    if (!open || !header || !input) return undefined;
    input.focus({ preventScroll: true });
    const popup = input.closest('[role="menu"]');
    return popup ? holdMenuSearchFocus(popup, input) : undefined;
  }, [header, inputRef, open]);
  return (
    <MenuHeader className={className} data-search="" {...props}>
      <InputGroup size="md">
        <InputGroupAddon>
          <MagnifyingGlassIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={ariaLabel}
          autoComplete="off"
          onBlur={() => search?.setFieldFocused(false)}
          onChange={(event) => search?.setQuery(event.target.value)}
          onFocus={() => search?.setFieldFocused(true)}
          onKeyDown={(event) => {
            const key = event.key;
            // ArrowDown goes to the first row that shows and ArrowUp to the
            // last: the field moves the focus itself (menuSearchArrowRow), so
            // the row Base UI held before the field had the focus never
            // decides the step. Tab leaves the menu.
            if (key === "ArrowDown" || key === "ArrowUp") {
              const popup = event.currentTarget.closest('[role="menu"]');
              const row = popup ? menuSearchArrowRow(popup, key) : undefined;
              event.preventDefault();
              event.stopPropagation();
              row?.focus();
              return;
            }
            if (key === "Tab") return;
            if (key === "Escape") {
              // The first Escape clears the field; the next closes the menu.
              if (search && search.query !== "") {
                event.preventDefault();
                event.stopPropagation();
                search.setQuery("");
              }
              return;
            }
            // Every other key is the field's: the menu's typeahead, Home and
            // End and the rest never see it.
            event.stopPropagation();
          }}
          placeholder={placeholder}
          ref={search?.inputRef}
          spellCheck={false}
          type="text"
          value={search?.query ?? ""}
        />
      </InputGroup>
    </MenuHeader>
  );
}

/**
 * What the search says when no row has what was typed: in the rows' place, as
 * a status for assistive technology too. Put it among the rows; it shows only
 * while the search finds none.
 */
export function MenuEmpty({
  className,
  ...props
}: React.ComponentProps<"div">) {
  if (!React.useContext(MenuSearchContext)?.empty) return null;
  return (
    <div
      className={cn(slotClass("menu-empty", props), className)}
      data-slot="menu-empty"
      role="status"
      {...props}
    />
  );
}

/** The rows of a Menu, which a search keeps or takes out. */
const menuRows = new Set<unknown>([
  MenuItem,
  MenuLinkItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuSubTrigger,
]);

/** The parts that are no row and hold none: the leaves of a menu. */
const menuLeaves = new Set<unknown>([
  MenuSeparator,
  MenuGroupLabel,
  MenuShortcut,
  MenuItemDescription,
  MenuHeader,
  MenuHeaderTitle,
  MenuHeaderDescription,
  MenuFooter,
  MenuSearch,
  MenuEmpty,
]);

// The DropdownMenu names are aliases of the Menu parts. Most only swap the
// prefix; DropdownMenuContent is MenuPopup, DropdownMenuLabel is
// MenuGroupLabel and DropdownMenuSubContent is MenuSubPopup.
export {
  MenuPrimitive,
  MenuCreateHandle as DropdownMenuCreateHandle,
  Menu as DropdownMenu,
  MenuPortal as DropdownMenuPortal,
  MenuTrigger as DropdownMenuTrigger,
  MenuTriggerIcon as DropdownMenuTriggerIcon,
  MenuPopup as DropdownMenuContent,
  MenuGroup as DropdownMenuGroup,
  MenuItem as DropdownMenuItem,
  MenuItemDescription as DropdownMenuItemDescription,
  MenuHeader as DropdownMenuHeader,
  MenuHeaderDescription as DropdownMenuHeaderDescription,
  MenuHeaderTitle as DropdownMenuHeaderTitle,
  MenuFooter as DropdownMenuFooter,
  MenuSearch as DropdownMenuSearch,
  MenuEmpty as DropdownMenuEmpty,
  MenuCheckboxItem as DropdownMenuCheckboxItem,
  MenuRadioGroup as DropdownMenuRadioGroup,
  MenuRadioItem as DropdownMenuRadioItem,
  MenuGroupLabel as DropdownMenuLabel,
  MenuSeparator as DropdownMenuSeparator,
  MenuShortcut as DropdownMenuShortcut,
  MenuSub as DropdownMenuSub,
  MenuSubTrigger as DropdownMenuSubTrigger,
  MenuSubPopup as DropdownMenuSubContent,
};
