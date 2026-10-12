"use client";

// React Aria Components re-exports the provider of the react-aria version it
// pins, so the locale and the date and color components share one context.
import { I18nProvider } from "react-aria-components";

export type SiteplaneLocaleProviderProps = {
  children: React.ReactNode;
  locale: string;
};

export function SiteplaneLocaleProvider({
  children,
  locale,
}: SiteplaneLocaleProviderProps) {
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
