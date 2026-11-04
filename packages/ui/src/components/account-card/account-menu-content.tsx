"use client";

import {
  MoonIcon,
  PlusIcon,
  SignOutIcon,
} from "@phosphor-icons/react/dist/ssr";
import type * as React from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarShape,
  type AvatarStatus,
} from "../avatar";
import { AvatarLabelGroup } from "../avatar-label-group";
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuHeader,
  MenuItem,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTriggerIcon,
} from "../menu";

/*
 * The account menu of the kit, one owner for every account menu: Account
 * Card's and Header Navigation's HeaderAccountMenu compose it inside their
 * MenuPopup, so their rows, avatars, checks and texts are one (Lukas, 3
 * November 2026). Internal: the index of Account Card does not export it.
 */

/** An account of the account menu. */
export type AccountMenuAccount = {
  id: string;
  /** The account holder's name. */
  name: string;
  /** The line under the name, such as the email address. */
  email?: string | undefined;
  /** The avatar image. */
  src?: string | undefined;
  /** The initials the avatar shows while it has no image. */
  initials?: string | undefined;
  /**
   * The avatar's shape: `square` for a company or a workspace, such as an
   * organisation's account; a person keeps the circle (rulebook B10). Every
   * avatar of the account takes it: its row, the header band and a trigger.
   */
  shape?: AvatarShape | undefined;
  /** The presence dot at the corner of the account's avatar. */
  status?: AvatarStatus | undefined;
};

/**
 * A row of the account menu: a link with `href`, an action without, and a
 * submenu of its `children`.
 */
export type AccountMenuAction = {
  label: string;
  /** The leading icon, 16 px in the row's icon slot. Give it aria-hidden. */
  icon?: React.ReactNode;
  /** A keyboard shortcut shown at the end of the row; display only. */
  shortcut?: string | undefined;
  href?: string | undefined;
  onClick?: (() => void) | undefined;
  /** The rows of a submenu, which this row opens. */
  children?: readonly AccountMenuAction[] | undefined;
};

export type AccountMenuContentProps = {
  /**
   * The account whose avatar, name and email head the menu in a header band:
   * for a trigger that shows no name, such as an avatar (Lukas, 3 November
   * 2026, C8a). A trigger that shows the account passes none.
   */
  header?: AccountMenuAccount | undefined;
  /** The action rows at the top of the menu, such as View profile. */
  items?: readonly AccountMenuAction[] | undefined;
  /** Shows a dark mode switch row after the action rows and is called by it. */
  onDarkModeChange?: ((dark: boolean) => void) | undefined;
  darkMode?: boolean | undefined;
  darkModeLabel?: string | undefined;
  /** A second group of action rows, after a separator. */
  secondaryItems?: readonly AccountMenuAction[] | undefined;
  /** The accounts; with more than one, the menu lists them to switch between. */
  accounts?: readonly AccountMenuAccount[] | undefined;
  /** The account whose row is checked. */
  accountId?: string | undefined;
  onAccountChange?: ((id: string) => void) | undefined;
  accountsLabel?: string | undefined;
  /** Shows the Add account row under the account list and is called by it. */
  onAddAccount?: (() => void) | undefined;
  addAccountLabel?: string | undefined;
  /** Shows the Sign out row at the end of the menu and is called by it. */
  onSignOut?: (() => void) | undefined;
  signOutLabel?: string | undefined;
};

/**
 * An account's avatar in the account's shape; it names no size, so its scope
 * or row sizes it.
 */
export function AccountMenuAvatar({
  account,
  ...props
}: {
  account: AccountMenuAccount;
} & Omit<React.ComponentProps<typeof Avatar>, "children">): React.ReactElement {
  return (
    <Avatar shape={account.shape} {...props}>
      <AvatarImage alt="" src={account.src} />
      <AvatarFallback>
        {account.initials ?? account.name.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * The caret of a trigger that opens the account menu: Account Card's card and
 * HeaderAccountMenu's card trigger. It is the switcher caret of every
 * switcher, `MenuTriggerIcon variant="switcher"`: the still up-down caret,
 * 16 px, tertiary at rest and primary on hover, press and while its menu is
 * open (rulebook M9; Lukas, 3 November 2026, C8c, and 4 November 2026: the
 * account caret was a glyph and a rule of its own).
 */
export function AccountMenuCaret(): React.ReactElement {
  return <MenuTriggerIcon variant="switcher" />;
}

/**
 * An action row: its icon, its label and its shortcut at the end, as a link
 * row with `href`, as an action row without, and as a submenu trigger with
 * `children`. The row's own children are written in place, so the menu row
 * lays out the icon and the shortcut.
 */
function ActionRow({ action }: { action: AccountMenuAction }) {
  if (action.children)
    return (
      <MenuSub>
        <MenuSubTrigger>
          {action.icon}
          {action.label}
        </MenuSubTrigger>
        <MenuSubPopup>
          {action.children.map((child) => (
            <ActionRow action={child} key={child.label} />
          ))}
        </MenuSubPopup>
      </MenuSub>
    );
  const shortcut = action.shortcut ? (
    <MenuShortcut>{action.shortcut}</MenuShortcut>
  ) : null;
  if (action.href)
    return (
      <MenuLinkItem href={action.href} onClick={action.onClick}>
        {action.icon}
        {action.label}
        {shortcut}
      </MenuLinkItem>
    );
  return (
    <MenuItem onClick={action.onClick}>
      {action.icon}
      {action.label}
      {shortcut}
    </MenuItem>
  );
}

/**
 * The rows of the account menu, in this order, each part only with something
 * to show and divided from the part before it by a separator: the header band
 * (`header`), the action rows with the dark mode switch, the second group of
 * rows, the accounts to switch between with Add account, and Sign out. Put it
 * in a MenuPopup.
 */
export function AccountMenuContent({
  accountId,
  accounts = [],
  accountsLabel: accountsLabelProp,
  addAccountLabel: addAccountLabelProp,
  darkMode,
  darkModeLabel: darkModeLabelProp,
  header,
  items = [],
  onAccountChange,
  onAddAccount,
  onDarkModeChange,
  onSignOut,
  secondaryItems = [],
  signOutLabel: signOutLabelProp,
}: AccountMenuContentProps): React.ReactElement {
  const messages = useSiteplaneMessages("accountCard");
  const accountsLabel = accountsLabelProp ?? messages.accounts;
  const addAccountLabel = addAccountLabelProp ?? messages.addAccount;
  const darkModeLabel = darkModeLabelProp ?? messages.darkMode;
  const signOutLabel = signOutLabelProp ?? messages.signOut;
  const actions = items.length > 0 || onDarkModeChange !== undefined;
  const secondary = secondaryItems.length > 0;
  const switching = accounts.length > 1;
  const accountRows = switching || onAddAccount !== undefined;
  return (
    <>
      {header ? (
        // The trigger shows no name, so the menu opens with a header band of
        // the account's avatar, name and email (Lukas, 3 November 2026, C8a).
        <MenuHeader>
          <AvatarLabelGroup
            size="md"
            subtitle={header.email}
            title={header.name}
          >
            <AccountMenuAvatar account={header} aria-hidden="true" />
          </AvatarLabelGroup>
        </MenuHeader>
      ) : null}
      {items.map((action) => (
        <ActionRow action={action} key={action.label} />
      ))}
      {onDarkModeChange ? (
        // A switch row keeps its menu open on its own, and its icon comes
        // first, so the label starts at the other rows' x (I8).
        <MenuCheckboxItem
          checked={darkMode}
          onCheckedChange={onDarkModeChange}
          variant="switch"
        >
          <MoonIcon aria-hidden="true" />
          {darkModeLabel}
        </MenuCheckboxItem>
      ) : null}
      {secondary ? (
        <>
          {actions ? <MenuSeparator /> : null}
          {secondaryItems.map((action) => (
            <ActionRow action={action} key={action.label} />
          ))}
        </>
      ) : null}
      {accountRows && (actions || secondary) ? <MenuSeparator /> : null}
      {switching ? (
        <MenuGroup>
          <MenuGroupLabel>{accountsLabel}</MenuGroupLabel>
          <MenuRadioGroup
            onValueChange={(value) => onAccountChange?.(String(value))}
            value={accountId}
          >
            {/* Identity rows: the avatar leads in the slot of the row's icon,
                20 px as it names no size, and the check ends the current
                account's row (rulebook I8). The name names the row, so the
                avatar and its initials stay out of its accessible name. A
                picked row closes the menu, as every radio row does (B9). */}
            {accounts.map((account) => (
              <MenuRadioItem key={account.id} value={account.id}>
                <AccountMenuAvatar account={account} aria-hidden="true" />
                {account.name}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      ) : null}
      {onAddAccount ? (
        <MenuItem onClick={onAddAccount}>
          <PlusIcon aria-hidden="true" />
          {addAccountLabel}
        </MenuItem>
      ) : null}
      {onSignOut ? (
        <>
          {/* Sign out is a plain row under a separator, with its icon and
              without a shortcut (Lukas, 3 November 2026). */}
          {actions || secondary || accountRows ? <MenuSeparator /> : null}
          <MenuItem onClick={onSignOut}>
            <SignOutIcon aria-hidden="true" />
            {signOutLabel}
          </MenuItem>
        </>
      ) : null}
    </>
  );
}
