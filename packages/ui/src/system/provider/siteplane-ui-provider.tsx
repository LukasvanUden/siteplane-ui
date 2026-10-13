"use client";

import { CSPProvider } from "@base-ui/react/csp-provider";
import * as React from "react";
import { useSiteplaneMotionPreset } from "../motion/siteplane-motion-provider";

export type SiteplaneControlSize = "sm" | "md" | "lg" | "xl";
export type SiteplaneDensity = "compact" | "default";
export type SiteplaneRadius = "none" | "sm" | "md" | "lg" | "xl";

export interface SiteplaneUIConfig {
  controlSize: SiteplaneControlSize;
  density: SiteplaneDensity;
  radius: SiteplaneRadius;
}

export interface SiteplaneUIProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  controlSize?: SiteplaneControlSize;
  "data-theme"?: "dark" | "light";
  density?: SiteplaneDensity;
  /**
   * The nonce of a Content Security Policy that allows inline scripts and
   * styles only with a nonce. The kit puts it on its inline `<script>` and
   * `<style>` elements, such as the script that shows the Tabs selection before
   * the page hydrates, and passes it to Base UI's `CSPProvider`. An inner
   * provider without one keeps the outer provider's.
   */
  nonce?: string | undefined;
  /**
   * The corner radius of every kit component inside: the base `--radius` and
   * the role radii derived from it (design-rework.css). `md` is the kit's
   * default, also without a provider.
   */
  radius?: SiteplaneRadius;
}

export const siteplaneUIDefaults = {
  controlSize: "lg",
  density: "default",
  radius: "md",
} as const satisfies SiteplaneUIConfig;

/** The base `--radius` of each provider radius, as the kit's stylesheet sets it. */
export const siteplaneRadiusValues = {
  none: "0rem",
  sm: "0.5rem",
  md: "0.625rem",
  lg: "0.875rem",
  xl: "1.25rem",
} as const satisfies Record<SiteplaneRadius, string>;

const SiteplaneUIContext = React.createContext<SiteplaneUIConfig | null>(null);
const SiteplaneNonceContext = React.createContext<string | undefined>(
  undefined,
);
const SiteplaneUIThemeContext = React.createContext<
  "dark" | "light" | undefined
>(undefined);

// A provider and its portal scopes add no box of their own. Their radius
// reaches the kit through data-radius: the stylesheet sets the base for it and
// derives every corner again on the scope, so a portal follows its provider.
const scopeStyle: React.CSSProperties = { display: "contents" };

export function resolveControlSize<T extends string>(
  size: T | null | undefined,
  contextSize: SiteplaneControlSize,
): T | SiteplaneControlSize {
  return size ?? contextSize;
}

export function resolveDensity<T extends string>(
  density: T | null | undefined,
  contextDensity: SiteplaneDensity,
): T | SiteplaneDensity {
  return density ?? contextDensity;
}

export function resolveRadius<T extends string>(
  radius: T | null | undefined,
  contextRadius: SiteplaneRadius,
): T | SiteplaneRadius {
  return radius ?? contextRadius;
}

export function useSiteplaneUI(): SiteplaneUIConfig {
  return React.useContext(SiteplaneUIContext) ?? siteplaneUIDefaults;
}

export function useResolvedControlSize<T extends string>(
  size: T | null | undefined,
): T | SiteplaneControlSize {
  const context = useSiteplaneUI();
  return resolveControlSize(size, context.controlSize);
}

/** The control sizes from the smallest; only a part that is xs at lg uses xs. */
const controlSizeSteps = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * The size of a part designed for the default lg, at another control size: it
 * keeps its steps from lg within the scale. A code field one step above lg is
 * md at sm and xl at lg; presets two steps below are sm up to lg and md at xl
 * (Lukas, 13 October 2026). Patterns size their parts this way, so they keep
 * their proportions at every control size and look as designed at lg.
 */
export function resolveRelativeControlSize(
  sizeAtLg: SiteplaneControlSize,
  controlSize: SiteplaneControlSize,
): SiteplaneControlSize;
export function resolveRelativeControlSize(
  sizeAtLg: "xs" | SiteplaneControlSize,
  controlSize: SiteplaneControlSize,
): "xs" | SiteplaneControlSize;
export function resolveRelativeControlSize(
  sizeAtLg: "xs" | SiteplaneControlSize,
  controlSize: SiteplaneControlSize,
): "xs" | SiteplaneControlSize {
  const step =
    controlSizeSteps.indexOf(controlSize) +
    controlSizeSteps.indexOf(sizeAtLg) -
    controlSizeSteps.indexOf("lg");
  const lowest = sizeAtLg === "xs" ? 0 : 1;
  return controlSizeSteps[
    Math.min(controlSizeSteps.length - 1, Math.max(lowest, step))
  ]!;
}

/** `resolveRelativeControlSize` at the provider's control size. */
export function useRelativeControlSize(
  sizeAtLg: SiteplaneControlSize,
): SiteplaneControlSize;
export function useRelativeControlSize(
  sizeAtLg: "xs" | SiteplaneControlSize,
): "xs" | SiteplaneControlSize;
export function useRelativeControlSize(
  sizeAtLg: "xs" | SiteplaneControlSize,
): "xs" | SiteplaneControlSize {
  return resolveRelativeControlSize(sizeAtLg, useSiteplaneUI().controlSize);
}

/** The provider's CSP nonce, for a kit part that renders inline script or style. */
export function useSiteplaneNonce(): string | undefined {
  return React.useContext(SiteplaneNonceContext);
}

export function useResolvedDensity<T extends string>(
  density: T | null | undefined,
): T | SiteplaneDensity {
  const context = useSiteplaneUI();
  return resolveDensity(density, context.density);
}

export function useResolvedRadius<T extends string>(
  radius: T | null | undefined,
): T | SiteplaneRadius {
  const context = useSiteplaneUI();
  return resolveRadius(radius, context.radius);
}

export function SiteplaneUIPortalScope({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const value = useSiteplaneUI();
  const theme = React.useContext(SiteplaneUIThemeContext);
  const motionPreset = useSiteplaneMotionPreset();

  return (
    <div
      data-control-size={value.controlSize}
      data-density={value.density}
      data-radius={value.radius}
      data-slot="siteplane-ui-portal-scope"
      data-sp-motion={motionPreset}
      data-theme={theme}
      style={scopeStyle}
    >
      {children}
    </div>
  );
}

export function SiteplaneUIProvider({
  children,
  controlSize,
  density,
  nonce,
  radius,
  style,
  "data-theme": theme,
  ...props
}: SiteplaneUIProviderProps): React.ReactElement {
  const parent = useSiteplaneUI();
  const parentNonce = React.useContext(SiteplaneNonceContext);
  const parentTheme = React.useContext(SiteplaneUIThemeContext);
  const resolvedTheme =
    theme === "dark" || theme === "light" ? theme : parentTheme;
  const value = React.useMemo<SiteplaneUIConfig>(
    () => ({
      controlSize: controlSize ?? parent.controlSize,
      density: density ?? parent.density,
      radius: radius ?? parent.radius,
    }),
    [
      controlSize,
      density,
      radius,
      parent.controlSize,
      parent.density,
      parent.radius,
    ],
  );
  const providerStyle: React.CSSProperties = { ...scopeStyle, ...style };

  return (
    <SiteplaneUIContext.Provider value={value}>
      <SiteplaneUIThemeContext.Provider value={resolvedTheme}>
        <SiteplaneNonceContext.Provider value={nonce ?? parentNonce}>
          <div
            {...props}
            data-control-size={value.controlSize}
            data-density={value.density}
            data-radius={value.radius}
            data-slot="siteplane-ui-provider"
            data-theme={theme}
            style={providerStyle}
          >
            {/* Base UI's inline scripts and styles, such as the Tabs indicator's
                script before hydration, take the nonce from its own provider. */}
            {nonce ? (
              <CSPProvider nonce={nonce}>{children}</CSPProvider>
            ) : (
              children
            )}
          </div>
        </SiteplaneNonceContext.Provider>
      </SiteplaneUIThemeContext.Provider>
    </SiteplaneUIContext.Provider>
  );
}
