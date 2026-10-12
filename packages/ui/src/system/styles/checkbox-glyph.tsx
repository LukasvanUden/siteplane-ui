import type { SiteplaneControlSize } from "../provider/siteplane-ui-provider";

// The check and the indeterminate dash of a checkbox, sized for the box of its
// control size. The Checkbox and the selection box of a Table render this
// glyph, so every checkbox of the kit shares one geometry, one stroke and one
// size scale. Both paths carry the shared check motion (motion.css): the
// element that holds the state wraps the svg, and the paths draw in and out as
// it comes and goes. Each path is about 24 units long, the length of the dash.
const checkboxGlyphSizeClassName = {
  sm: "size-3 sm:size-2.5",
  md: "size-3.5 sm:size-3",
  lg: "size-4 sm:size-3.5",
  xl: "size-4.5 sm:size-4",
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
      strokeWidth="3"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="siteplane-check-path-motion"
        d="M5.252 12.7 10.2 18.63 18.748 5.37"
      />
      <path className="siteplane-checkbox-indeterminate" d="M5.252 12h13.496" />
    </svg>
  );
}
