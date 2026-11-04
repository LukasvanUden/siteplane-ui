"use client";

import * as React from "react";
// React Aria Components re-exports the provider of the react-aria version it
// pins, so the locale and the date and color components share one context.
import { I18nProvider, useLocale } from "react-aria-components";

import { mergeSiteplaneMessages, type SiteplaneMessages } from "./messages";
import {
  SiteplaneLocaleContext,
  SiteplaneMessagesContext,
} from "./messages-context";

export {
  englishMessages,
  type SiteplaneMessageCatalog,
  type SiteplaneMessages,
} from "./messages";

export type SiteplaneLocaleProviderProps = {
  children: React.ReactNode;
  /**
   * The locale of the components inside, such as `de-DE`: the language and
   * the format of their dates, times and numbers, and the direction of the
   * page.
   */
  locale: string;
  /**
   * The kit's own texts in the application's language, by component, such as
   * `{ datePicker: { cancel: "Abbrechen" } }`. Every text left out keeps the
   * one of an outer provider, or its English default. A component's own prop
   * still changes that one instance.
   */
  messages?: SiteplaneMessages | undefined;
};

/**
 * Sets the locale and the kit's texts for the components inside. It wraps
 * React Aria's I18nProvider, so the date and time components write their
 * dates in `locale` and React Aria's own texts in its language; the parts
 * that write numbers, such as the charts, Progress and Number Field, take
 * `locale` too, and every component of the kit reads `messages`. A provider
 * inside another keeps the outer provider's messages for the texts it leaves
 * out.
 */
export function SiteplaneLocaleProvider({
  children,
  locale,
  messages,
}: SiteplaneLocaleProviderProps): React.ReactElement {
  const outer = React.useContext(SiteplaneMessagesContext);
  const merged = React.useMemo(
    () => mergeSiteplaneMessages(outer, messages),
    [outer, messages],
  );
  return (
    <I18nProvider locale={locale}>
      <SiteplaneLocaleContext.Provider value={locale}>
        <SiteplaneMessagesContext.Provider value={merged}>
          {children}
        </SiteplaneMessagesContext.Provider>
      </SiteplaneLocaleContext.Provider>
    </I18nProvider>
  );
}

/**
 * The locale the kit writes dates in: the nearest provider's, or without one
 * the browser's language once the page has hydrated (React Aria's default),
 * as the kit's date and time components do.
 */
export function useSiteplaneLocale(): string {
  return useLocale().locale;
}
