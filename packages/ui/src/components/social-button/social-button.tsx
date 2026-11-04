"use client";

import * as React from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { Button, type ButtonDefaultProfileProps } from "../button";
import {
  AppleLogo,
  DribbbleLogo,
  FacebookLogo,
  FigmaLogo,
  FigmaOutlinedLogo,
  GoogleLogo,
  XLogo,
} from "./social-logos";

import "./social-button.css";

/** The account providers a SocialButton signs in with. */
export type SocialButtonProvider =
  "apple" | "dribbble" | "facebook" | "figma" | "google" | "x";

/**
 * How the provider shows. `brand` fills the button with the provider's colour
 * and a white logo: blue for Facebook, pink for Dribbble and black for Apple,
 * X and Figma, whose logo keeps its own colours. Google stays the neutral
 * button with its colour logo. `color` is the neutral button with the
 * full-colour logo, Apple and X in the text colour. `gray` is the neutral
 * button with the logo in the quaternary text colour.
 */
export type SocialButtonTheme = "brand" | "color" | "gray";

/**
 * The sizes of the Button that a SocialButton is, the control sizes: sm is
 * 36 px and md 40 px with a 16 px logo, lg 44 px and xl 48 px with a 20 px
 * logo.
 */
export type SocialButtonSize = "sm" | "md" | "lg" | "xl";

const providerNames = {
  apple: "Apple",
  dribbble: "Dribbble",
  facebook: "Facebook",
  figma: "Figma",
  google: "Google",
  x: "X",
} as const satisfies Record<SocialButtonProvider, string>;

export type SocialButtonProps = Omit<
  ButtonDefaultProfileProps,
  | "children"
  | "loading"
  | "multiline"
  | "profile"
  | "profileTone"
  | "shape"
  | "size"
  | "variant"
> & {
  /** The provider, which picks the logo and the brand colour. */
  social: SocialButtonProvider;
  /** How the provider shows; `brand` by default. */
  theme?: SocialButtonTheme | undefined;
  /**
   * sm (36 px), md (40 px), lg (44 px) or xl (48 px). The control size of the
   * SiteplaneUIProvider by default, sm unless it sets another, as every
   * Button's.
   */
  size?: SocialButtonSize | undefined;
  /**
   * The label after the logo, such as "Sign in with Google". Without one the
   * button is the square of its size with the logo alone, named "Sign in with"
   * and the provider unless `aria-label` names it.
   */
  children?: React.ReactNode;
};

// The logo of a provider in a theme. It is decoration: the label or the
// button's name says the provider.
function logoFor(
  social: SocialButtonProvider,
  theme: SocialButtonTheme,
): React.ReactElement {
  const logo = {
    "aria-hidden": true,
    className: "sp-social-button-logo",
    "data-slot": "social-button-logo",
  } as const;
  switch (social) {
    case "apple":
      return <AppleLogo {...logo} />;
    case "dribbble":
      return <DribbbleLogo {...logo} colorful={theme === "color"} />;
    case "facebook":
      return <FacebookLogo {...logo} colorful={theme === "color"} />;
    case "figma":
      return theme === "gray" ? (
        <FigmaOutlinedLogo {...logo} />
      ) : (
        <FigmaLogo {...logo} />
      );
    case "google":
      return <GoogleLogo {...logo} colorful={theme !== "gray"} />;
    case "x":
      return <XLogo {...logo} />;
  }
}

/**
 * A button that signs in with an account provider: the kit Button with the
 * provider's logo before its label. The neutral look is the default Button,
 * opaque with the control's rim and shadow, so it reads on the kit's grey page
 * where an outline Button would show the page through; the brand fill is the solid accent Button in the provider's colour
 * (social-button.css). Size, focus, hover, press, disabled and cursor are the
 * Button's: it takes the provider's control size, as high as a Button beside
 * it (Lukas, 4 November 2026; it was fixed at lg, 44 px). Without children it
 * is the square of its size with the logo alone. Button props pass through,
 * such as `disabled`, `width`, `onClick` and `render` for a link to the
 * application's sign-in route.
 */
export function SocialButton({
  "aria-label": ariaLabel,
  children,
  size,
  social,
  theme = "brand",
  ...props
}: SocialButtonProps): React.ReactElement {
  const messages = useSiteplaneMessages("socialButton");
  const iconOnly = React.Children.toArray(children).length === 0;
  const filled = theme === "brand" && social !== "google";
  return (
    <Button
      data-slot="social-button"
      {...props}
      aria-label={
        iconOnly
          ? (ariaLabel ?? messages.signIn(providerNames[social]))
          : ariaLabel
      }
      data-social={social}
      data-social-theme={theme}
      shape={iconOnly ? "square" : "default"}
      size={size}
      variant={filled ? "accent" : "default"}
    >
      {logoFor(social, theme)}
      {iconOnly ? null : children}
    </Button>
  );
}
