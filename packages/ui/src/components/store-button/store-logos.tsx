import type * as React from "react";

/*
 * The marks of Google Play, Galaxy Store and AppGallery, drawn for the kit in
 * a few simple shapes on a 24 x 24 grid. They are no store's official badge
 * artwork. The App Store's mark is SocialButton's Apple logo.
 */

/** The props of a store mark: an svg on a 24 x 24 grid. */
export type StoreLogoProps = React.SVGProps<SVGSVGElement> & {
  /** The store's own colours; without them the mark takes the text colour. */
  colorful?: boolean | undefined;
};

/*
 * Google Play: a play triangle cut into four pieces by two lines that meet
 * 56 % across it, in the four colours of Google's own logo. In colour the left
 * piece is the whole triangle and the other three lie on it, so no seam shows
 * between them; in one colour each piece is drawn 0.6 units in from the lines
 * it shares, so a gap of 1.2 units parts the pieces.
 */
const googlePlayTriangle = "M2 0.75L22 12L2 23.25Z";

const googlePlayPieces = [
  {
    color: "#4285F4",
    piece: "M2 0.75L13.2 12L2 23.25Z",
    inset: "M2 1.6L12.35 12L2 22.4Z",
  },
  {
    color: "#34A853",
    piece: "M2 0.75L16.8 9.07L13.2 12Z",
    inset: "M3.92 1.83L16.24 8.76L13.24 11.19Z",
  },
  {
    color: "#FBBC04",
    piece: "M16.8 9.07L22 12L16.8 14.93L13.2 12Z",
    inset: "M17.36 9.39L22 12L17.36 14.61L14.15 12Z",
  },
  {
    color: "#EA4335",
    piece: "M2 23.25L13.2 12L16.8 14.93Z",
    inset: "M3.92 22.17L13.24 12.81L16.24 15.24Z",
  },
] as const;

export function GooglePlayLogo({
  colorful = false,
  ...props
}: StoreLogoProps): React.ReactElement {
  return (
    <svg fill="none" height="24" viewBox="0 0 24 24" width="24" {...props}>
      {colorful ? (
        <>
          <path d={googlePlayTriangle} fill={googlePlayPieces[0].color} />
          {googlePlayPieces.slice(1).map(({ color, piece }) => (
            <path d={piece} fill={color} key={color} />
          ))}
        </>
      ) : (
        googlePlayPieces.map(({ color, inset }) => (
          <path d={inset} fill="currentColor" key={color} />
        ))
      )}
    </svg>
  );
}

/*
 * Galaxy Store: a white shopping bag, its body and the arc of its handle, on a
 * rounded tile in the average colour of the store's gradient. In one colour the
 * tile takes the text colour and the bag is cut out of it.
 */
const galaxyStoreTile =
  "M9 0h6a9 9 0 0 1 9 9v6a9 9 0 0 1-9 9H9a9 9 0 0 1-9-9V9a9 9 0 0 1 9-9Z";
const galaxyStoreBag =
  "M8.25 9a3.75 3.75 0 0 1 7.5 0h-1.5a2.25 2.25 0 0 0-4.5 0ZM7 9h10a1 1 0 0 1 1 1v5.5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V10a1 1 0 0 1 1-1Z";

export function GalaxyStoreLogo({
  colorful = false,
  ...props
}: StoreLogoProps): React.ReactElement {
  return (
    <svg fill="none" height="24" viewBox="0 0 24 24" width="24" {...props}>
      {colorful ? (
        <>
          <path d={galaxyStoreTile} fill="#F44C5F" />
          <path d={galaxyStoreBag} fill="#FFFFFF" />
        </>
      ) : (
        <path
          clipRule="evenodd"
          d={`${galaxyStoreTile}${galaxyStoreBag}`}
          fill="currentColor"
          fillRule="evenodd"
        />
      )}
    </svg>
  );
}

/*
 * AppGallery: the white smile of the store's bag on a red rounded tile. In one
 * colour the tile takes the text colour and the smile is cut out of it.
 */
const appGalleryTile =
  "M6 0h12a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6Z";
const appGallerySmile = "M7.75 9a4.25 4.25 0 0 0 8.5 0H15a3 3 0 0 1-6 0Z";

export function AppGalleryLogo({
  colorful = false,
  ...props
}: StoreLogoProps): React.ReactElement {
  return (
    <svg fill="none" height="24" viewBox="0 0 24 24" width="24" {...props}>
      {colorful ? (
        <>
          <path d={appGalleryTile} fill="#CA1E30" />
          <path d={appGallerySmile} fill="#FFFFFF" />
        </>
      ) : (
        <path
          clipRule="evenodd"
          d={`${appGalleryTile}${appGallerySmile}`}
          fill="currentColor"
          fillRule="evenodd"
        />
      )}
    </svg>
  );
}
