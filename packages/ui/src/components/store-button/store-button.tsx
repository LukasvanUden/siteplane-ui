"use client";

import type * as React from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { useResolvedControlSize } from "../../system/provider/siteplane-ui-provider";
import { Button } from "../button";
import { AppleLogo } from "../social-button/social-logos";
import { AppGalleryLogo, GalaxyStoreLogo, GooglePlayLogo } from "./store-logos";

import "./store-button.css";

/** The mobile app stores a StoreButton links to. */
export type StoreButtonStore =
  "app-store" | "app-gallery" | "galaxy-store" | "google-play";

/**
 * The sizes of the Button that a StoreButton is: md is 40 px high with a
 * 24 px mark, lg 44 px with everything 10 % larger and xl 48 px with
 * everything 20 % larger. There is no sm: 40 px is the smallest App Store
 * badge Apple allows on screen.
 */
export type StoreButtonSize = "md" | "lg" | "xl";

/**
 * `solid` is the black badge, black in light and dark themes, with the store's
 * mark in its colours. `outline` is the badge without its fill: text, mark and
 * ring in the text colour.
 */
export type StoreButtonAppearance = "outline" | "solid";

// The store's name, and the message of the store's own wording, the caption
// over the name. Together they are the link's name.
const stores = {
  "app-gallery": { caption: "appGallery", name: "AppGallery" },
  "app-store": { caption: "appStore", name: "App Store" },
  "galaxy-store": { caption: "galaxyStore", name: "Galaxy Store" },
  "google-play": { caption: "googlePlay", name: "Google Play" },
} as const satisfies Record<
  StoreButtonStore,
  {
    caption: "appGallery" | "appStore" | "galaxyStore" | "googlePlay";
    name: string;
  }
>;

export type StoreButtonProps = Omit<React.ComponentProps<"a">, "children"> & {
  /** The store, which picks the mark, the caption and the store's name. */
  store: StoreButtonStore;
  /**
   * md (40 px), lg (44 px) or xl (48 px). The control size of the
   * SiteplaneUIProvider by default, and md where that is sm.
   */
  size?: StoreButtonSize | undefined;
  /** `solid` (the default) or `outline`. */
  appearance?: StoreButtonAppearance | undefined;
};

// The mark of a store. It is decoration: the link's name says the store.
function logoFor(
  store: StoreButtonStore,
  colorful: boolean,
): React.ReactElement {
  const logo = {
    "aria-hidden": true,
    className: "sp-store-button-logo",
    "data-slot": "store-button-logo",
  } as const;
  switch (store) {
    case "app-gallery":
      return <AppGalleryLogo {...logo} colorful={colorful} />;
    case "app-store":
      return <AppleLogo {...logo} />;
    case "galaxy-store":
      return <GalaxyStoreLogo {...logo} colorful={colorful} />;
    case "google-play":
      return <GooglePlayLogo {...logo} colorful={colorful} />;
  }
}

/**
 * A link to an app in a mobile app store: the kit Button rendered as an
 * anchor, with the store's mark before two lines of text, the store's caption
 * over its name. The solid badge is the inverse Button held black in both
 * themes; the outline badge is the outline Button with its ring in the text
 * colour (store-button.css). Size, radius, focus, hover, press and cursor are
 * the Button's: it takes the provider's control size, as every Button does,
 * but never goes below md, 40 px, the smallest App Store badge Apple allows on
 * screen (Lukas, 4 November 2026; it was fixed at md). The link is named with
 * the store's wording, such as "Get it on Google Play", unless `aria-label`
 * names it. Anchor props pass through, such as `href`, `target`, `rel` and
 * `onClick`.
 */
export function StoreButton({
  "aria-label": ariaLabel,
  appearance = "solid",
  className,
  size: sizeProp,
  store,
  ...props
}: StoreButtonProps): React.ReactElement {
  const messages = useSiteplaneMessages("storeButton");
  const resolved = useResolvedControlSize(sizeProp);
  const size = resolved === "sm" ? "md" : resolved;
  const caption = messages[stores[store].caption];
  const { name } = stores[store];
  return (
    <Button
      className={className}
      data-appearance={appearance}
      data-slot="store-button"
      data-store={store}
      render={<a aria-label={ariaLabel ?? `${caption} ${name}`} {...props} />}
      size={size}
      variant={appearance === "solid" ? "inverse" : "outline"}
    >
      {logoFor(store, appearance === "solid")}
      <span className="sp-store-button-text" data-slot="store-button-text">
        <span
          className="sp-store-button-caption"
          data-slot="store-button-caption"
        >
          {caption}
        </span>
        {/* The store's name stays as it is in a translated page. */}
        <span
          className="sp-store-button-name"
          data-slot="store-button-name"
          translate="no"
        >
          {name}
        </span>
      </span>
    </Button>
  );
}
