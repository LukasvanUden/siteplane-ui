"use client";

import * as React from "react";

import { englishMessages, type SiteplaneMessageCatalog } from "./messages";

/**
 * The kit's texts that the components read: the English defaults, or those of
 * the nearest SiteplaneLocaleProvider merged over them.
 */
export const SiteplaneMessagesContext =
  React.createContext<SiteplaneMessageCatalog>(englishMessages);

/**
 * The texts of one component, such as `useSiteplaneMessages("datePicker")`:
 * the provider's messages over the English defaults. A prop of the component
 * still wins for its own instance.
 */
export function useSiteplaneMessages<
  Group extends keyof SiteplaneMessageCatalog,
>(group: Group): SiteplaneMessageCatalog[Group] {
  return React.useContext(SiteplaneMessagesContext)[group];
}

/** The keys of a group whose message is plain text, not a function. */
type TextKey<Group extends keyof SiteplaneMessageCatalog> = {
  [
    Key in keyof SiteplaneMessageCatalog[Group]
  ]: SiteplaneMessageCatalog[Group][Key] extends string ? Key : never;
}[keyof SiteplaneMessageCatalog[Group]];

/**
 * One text of the kit for a Server Component: the small client leaf that
 * reads the provider's messages, so the component around it stays
 * server-rendered (Spinner, Stepper and Timeline). Server rendering reads the
 * provider too when the application renders it above, as in the root layout,
 * so the server and the browser write the same text. `before` and `after`
 * frame a text that is not empty, such as the parentheses of a status.
 */
export function KitText<Group extends keyof SiteplaneMessageCatalog>({
  after = "",
  before = "",
  group,
  name,
}: {
  after?: string | undefined;
  before?: string | undefined;
  group: Group;
  name: TextKey<Group>;
}): string {
  const text = useSiteplaneMessages(group)[name] as string;
  return text ? `${before}${text}${after}` : "";
}

/**
 * The locale of the nearest SiteplaneLocaleProvider, and undefined outside
 * one. The parts that write numbers take it when they have no `locale` of
 * their own, and otherwise their fixed default, en-US.
 */
export const SiteplaneLocaleContext = React.createContext<string | undefined>(
  undefined,
);

/**
 * The locale a part writes its numbers in: its own `locale`, else the nearest
 * provider's, else `fallback`. Each is a fixed value, never the browser's
 * language, so the server and the browser write the same text.
 */
export function useFormatLocale<Locale>(
  own: Locale | undefined,
  fallback: Locale,
): Locale | string {
  const provided = React.useContext(SiteplaneLocaleContext);
  return own ?? provided ?? fallback;
}
