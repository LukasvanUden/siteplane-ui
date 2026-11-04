"use client";

import * as React from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { AvatarLabelGroup } from "../avatar-label-group";
import { Button } from "../button";
import { Card } from "../card";
import { Menu, MenuPopup, MenuTrigger } from "../menu";
import { SidebarContext } from "../sidebar";
import {
  type AccountMenuAccount,
  AccountMenuAvatar,
  AccountMenuCaret,
  AccountMenuContent,
} from "./account-menu-content";

/**
 * An account the card shows and the menu lists: its `id`, its `name`, the
 * `email` under the name (in the card, or in the header of the menu that the
 * avatar opens), the avatar's `src` and `initials`, its `shape`, `square` for
 * a company or a workspace (rulebook B10), and the `status` dot at the corner
 * of the current account's avatar.
 */
export type AccountCardAccount = AccountMenuAccount;

/** An action row of the account menu: a link with `href`, an action without. */
export type AccountCardAction = {
  label: string;
  /** The leading icon, 16 px in the row's icon slot. Give it aria-hidden. */
  icon?: React.ReactNode;
  /** A keyboard shortcut shown at the end of the row; display only. */
  shortcut?: string | undefined;
  href?: string | undefined;
  onClick?: (() => void) | undefined;
};

export interface AccountCardProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /**
   * The accounts. The one whose `id` is `accountId` fills the card, and with
   * more than one the menu lists them all to switch between.
   */
  accounts: readonly AccountCardAccount[];
  /** The current account; the first of `accounts` when none matches. */
  accountId?: string | undefined;
  /** Called with the id of the account that is picked in the menu. */
  onAccountChange?: ((id: string) => void) | undefined;
  /** The action rows at the top of the menu, such as View profile. */
  items?: readonly AccountCardAction[] | undefined;
  /**
   * The label above the account list and the name of its group, "Switch
   * account" by default.
   */
  accountsLabel?: string | undefined;
  /** Shows the Add account row under the account list and is called by it. */
  onAddAccount?: (() => void) | undefined;
  /** The label of the add row, "Add account" by default. */
  addAccountLabel?: string | undefined;
  /** Shows the Sign out row at the end of the menu and is called by it. */
  onSignOut?: (() => void) | undefined;
  /** The label of the sign out row, "Sign out" by default. */
  signOutLabel?: string | undefined;
  /**
   * What the button that opens the menu does, "Account menu" by default. It
   * names the avatar button, and on the card it follows the account's name,
   * as in "Mara Ellis, Account menu". The menu takes its name from the button.
   */
  label?: string | undefined;
  /**
   * `card`, the default, shows the account's avatar, name and email in a card
   * that is one button: pressing anywhere on it opens the menu beside it.
   * `avatar` shows only the avatar, as a button that opens the menu, for the
   * collapsed icon rail of a slim sidebar; the menu then opens with a header
   * band of the account's avatar, name and email.
   */
  trigger?: "card" | "avatar" | undefined;
}

/**
 * The account of a sidebar: a card with the signed-in account's avatar, name
 * and email that is one button, which opens the account menu beside it. The
 * menu is the kit's Menu: the account's actions, such as View profile and
 * Account settings, a list of the accounts to switch to, Add account and,
 * under a separator, Sign out. With `trigger="avatar"` only the avatar shows,
 * as the button that opens the menu, for the collapsed rail of a slim sidebar;
 * that menu opens with the account's avatar, name and email.
 */
export function AccountCard({
  accountId,
  accounts,
  accountsLabel,
  addAccountLabel,
  className,
  items = [],
  label: labelProp,
  onAccountChange,
  onAddAccount,
  onSignOut,
  ref,
  signOutLabel,
  trigger = "card",
  ...props
}: AccountCardProps): React.ReactElement | null {
  // The texts of the menu's rows are the account menu's own (AccountMenuContent).
  const messages = useSiteplaneMessages("accountCard");
  const label = labelProp ?? messages.label;
  // In a Sidebar the menu follows its place: beside a docked sidebar, above
  // the card in a sheet. Outside one it opens beside the card.
  const sidebar = React.useContext(SidebarContext);
  const card = React.useRef<HTMLDivElement | null>(null);
  // The card's own ref anchors the menu; a ref the app passes reaches the
  // same element beside it rather than taking its place.
  const setCard = React.useCallback(
    (element: HTMLDivElement | null) => {
      card.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );
  const current =
    accounts.find((account) => account.id === accountId) ?? accounts[0];
  if (!current) return null;
  // Beside the sidebar the menu opens towards the content, its bottom on the
  // card's; in a sheet it opens above the card.
  const mobile = sidebar?.isMobile ?? false;
  const popup = (
    <MenuPopup
      align="end"
      anchor={trigger === "card" ? card : undefined}
      side={mobile ? "top" : "inline-end"}
      sideOffset={8}
    >
      {/* The kit's account menu, which HeaderAccountMenu shares: from the
          avatar, which shows no name, it opens with a header band of the
          account (Lukas, 3 November 2026, C8a); beside the card, which shows
          the account, it opens with its rows. */}
      <AccountMenuContent
        accountId={current.id}
        accounts={accounts}
        accountsLabel={accountsLabel}
        addAccountLabel={addAccountLabel}
        header={trigger === "avatar" ? current : undefined}
        items={items}
        onAccountChange={onAccountChange}
        onAddAccount={onAddAccount}
        onSignOut={onSignOut}
        signOutLabel={signOutLabel}
      />
    </MenuPopup>
  );

  if (trigger === "avatar") {
    return (
      <Menu>
        <MenuTrigger
          aria-label={label}
          className={className}
          render={<Button profile="avatar" variant="ghost" />}
        >
          {/* The rail's square, as its rows: a 32 px avatar in the 36 px
              circle of the avatar profile at the control size. The avatar
              names its size, so the profile keeps it, with a presence dot
              or without (button.css). */}
          <AccountMenuAvatar
            account={current}
            bordered
            size="sm"
            status={current.status}
          />
        </MenuTrigger>
        {popup}
      </Menu>
    );
  }

  return (
    // A Card with its 12 px inset around the avatar and the text, which end
    // 8 px before the chevron (Lukas, 3 November 2026, C8c: the whole card
    // opens the menu, the chevron centred).
    <Card
      className={cn(
        "sp-account-card flex-row items-center gap-3 p-3 pe-9",
        className,
      )}
      ref={setCard}
      {...props}
    >
      <AvatarLabelGroup size="md" subtitle={current.email} title={current.name}>
        <AccountMenuAvatar account={current} status={current.status} />
      </AvatarLabelGroup>
      <Menu>
        {/* The card is one button: a ghost Button laid over the whole card,
            as Attachment's trigger lies over its card, with the card's
            corners, so the Button's own hover, pressed and open fills and its
            focus ring cover the card, from the navigation treatment of the
            kit's ghost navigation triggers (rulebook T5). Its one glyph is
            the caret of every account trigger (AccountMenuCaret), 16 px,
            tertiary at rest and primary on hover, press and while the menu
            is open, as on HeaderAccountMenu's card trigger. The caret is
            centred on the card's height at the card's inset. The button is
            named by the account's name and what it does. */}
        <MenuTrigger
          aria-label={`${current.name}, ${label}`}
          data-slot="account-card-trigger"
          render={
            <Button
              className="absolute inset-0 size-full justify-end rounded-[inherit] pe-3"
              profile="navigation-link"
              size="xs"
              variant="ghost"
            />
          }
        >
          <AccountMenuCaret />
        </MenuTrigger>
        {popup}
      </Menu>
    </Card>
  );
}
