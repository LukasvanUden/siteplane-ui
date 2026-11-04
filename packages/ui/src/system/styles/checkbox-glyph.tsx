import type { SiteplaneControlSize } from "../provider/siteplane-ui-provider";

// The check and the indeterminate dash of a checkbox, sized for the box of its
// control size: 12 px in the 16 px box at sm and 14 px in the 20 px box at md,
// then 2 px more with each 4 px of the box. The Checkbox and
// the selection box of a Table render this glyph, so every checkbox of the kit
// shares one geometry, one stroke and one size scale. The glyph is drawn as
// strokes in the 256-unit box of the kit's icon set, Phosphor, so that it can
// draw itself: the centre line of Phosphor's check, the geometry every check
// of the kit shares, with a stroke of 36 units, which is 14 % of the glyph and
// so 1.7 px at 12 px and 2 px at 14 px (the Regular weight of Phosphor, 16
// units, drew 0.75 px at 12 px, far too light for a mark on a filled box). The
// dash is Phosphor's minus a little shorter, so that its round caps keep the
// extent they have at the lighter stroke. Both paths carry the shared check
// motion (motion.css):
// the element that holds the state wraps the svg, and the paths draw in and
// out as it comes and goes. pathLength 24 makes each path as long as the dash
// of that motion.
/**
 * The stroke of every check the kit draws on a filled box, in the 256-unit
 * box: the Checkbox's check and dash, and the check of a selected Color
 * Swatch Picker swatch.
 */
export const checkGlyphStrokeWidth = 36;

const checkboxGlyphSizeClassName = {
  sm: "size-3",
  md: "size-3.5",
  lg: "size-4",
  xl: "size-4.5",
} as const satisfies Record<SiteplaneControlSize, string>;

export function CheckboxGlyph({ size }: { size: SiteplaneControlSize }) {
  return (
    <svg
      aria-hidden="true"
      className={checkboxGlyphSizeClassName[size]}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={checkGlyphStrokeWidth}
      viewBox="0 0 256 256"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="sp-check-path-motion"
        d="M40 144 96 200 224 72"
        pathLength={24}
      />
      <path
        className="sp-checkbox-indeterminate"
        d="M53 128h150"
        pathLength={24}
      />
    </svg>
  );
}
