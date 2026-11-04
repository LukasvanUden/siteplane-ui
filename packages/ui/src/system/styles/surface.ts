// A floating overlay is a frame and a surface. The frame (the floating-panel
// motion, the positioning context and the ::before layer) is shared by every
// variant. The opaque surface (fill, edge, shadow, text colour and the ::before
// highlight) belongs to the default variant only: on glass the shared glass
// rule draws them, and no utility may set them as well (rulebook P6). The
// surface is the sp-floating-surface rule in design-rework.css, at zero
// specificity, so the surface rule of a popup and a consumer's utility both
// win over it.
const floatingOverlayFrame =
  "sp-floating-panel relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]";
const floatingOverlaySurface = "sp-floating-surface";

export const surfaceClassNames = {
  iconWell: "sp-icon-well",
  // A framed surface, such as the Task Calendar's: its border is the one
  // surface edge, the sp-contained-surface rule in design-rework.css (B7).
  contained: "sp-contained-surface rounded-lg bg-background",
  edgeOverlay: `relative ${floatingOverlaySurface} before:pointer-events-none before:absolute before:inset-0`,
  // The popup of Dialog and AlertDialog. Its motion (sp-dialog-motion),
  // its scale and its slide on small screens (sp-dialog-mobile-stick)
  // are design-rework.css rules, with the reduced-motion rules beside them (M5).
  // Behind a nested dialog it stays visible and steps back: 10% less opacity
  // per nested dialog here, and 10% smaller there on a wide screen.
  dialogOverlayPopup:
    "relative row-start-2 min-h-0 min-w-0 origin-center flex-col opacity-[calc(1-0.1*var(--nested-dialogs))] sp-dialog-motion will-change-transform before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:shadow-[0_1px_--theme(--color-black/4%)] data-ending-style:opacity-0 data-starting-style:opacity-0 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
  dialogOverlayCompositePopup:
    "relative row-start-2 flex max-h-full min-h-0 w-full min-w-0 origin-center flex-col opacity-[calc(1-0.1*var(--nested-dialogs))] sp-dialog-motion will-change-transform data-ending-style:opacity-0 data-starting-style:opacity-0",
  dialogOverlayPopupMobileStick:
    "sp-dialog-mobile-stick max-sm:origin-bottom max-sm:before:rounded-none",
  dialogOverlayViewport: "fixed inset-0 z-50 justify-items-center",
  // The disabled state of a field is the shared field rule in
  // design-rework.css.
  formControl:
    "relative inline-flex w-full ring-ring/24 has-focus-visible:has-aria-invalid:ring-destructive/16 dark:has-aria-invalid:ring-destructive/24",
  formControlSoft:
    "relative inline-flex w-full ring-ring/24 focus-within:has-aria-invalid:ring-destructive/16 dark:has-aria-invalid:ring-destructive/24",
  // An OTP slot. Its text is the slot rule of its size in design-rework.css.
  formControlCell:
    "relative min-w-0 text-center ring-ring/24 focus-visible:z-10 focus-visible:ring-ring/24 disabled:cursor-not-allowed aria-invalid:focus-visible:ring-destructive/16 dark:aria-invalid:focus-visible:ring-destructive/24",
  // The InputGroup's focus and invalid rings are the shared field rules'
  // box-shadows in design-rework.css, so it sets no ring colour.
  formControlComposite: "relative inline-flex w-full min-w-0 items-center",
  formControlCompositeSoft:
    "relative inline-flex w-full min-w-0 items-center ring-ring/24 focus-within:has-[input[aria-invalid],textarea[aria-invalid]]:ring-destructive/16 dark:has-[input[aria-invalid],textarea[aria-invalid]]:ring-destructive/24",
  glass: "sp-glass-surface",
  floatingOverlay: `${floatingOverlayFrame} ${floatingOverlaySurface}`,
  floatingOverlayFrame,
  floatingOverlaySurface,
  overlay: `relative ${floatingOverlaySurface} before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]`,
  // The command dialog's popup. Its fill is the command profile's rule
  // (design-rework.css), which publishes the surface colour, so a glass or
  // theme override reaches it (rulebook P6).
  overlayBorderless:
    "relative border-0 text-[var(--sp-rw-fg-primary)] shadow-[var(--sp-rw-floating-lg-shadow)]",
  // The backdrop of Dialog and AlertDialog. Its fade is the
  // sp-overlay-backdrop-motion rule in design-rework.css, so reduced
  // motion can make it instant (M5).
  overlayBackdrop: "sp-overlay-backdrop-motion fixed inset-0 z-50",
  raised:
    "relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
} as const;

const linearIndicatorFill = "";

export const linearIndicatorClassNames = {
  // The shared fill shape. Each owner adds its own value transition: Progress
  // defines linear interpolation in progress.css, Meter keeps `indicator`,
  // whose transition is the meter rule's in design-rework.css.
  fill: linearIndicatorFill,
  indicator: linearIndicatorFill,
  label: "",
  root: "flex w-full flex-col",
  track: "block w-full overflow-hidden",
  value: "",
} as const;

// The sizes of Progress and Meter. The default sm keeps what lg had before the
// control ladder moved to 4 px steps (Lukas, 30 October 2026): an 8 px track
// 8 px under 14 px text. md takes the xl look, a 10 px track and 16 px text
// below 640 px, and lg and xl go on in steps of 2 px; the text stays at 16 px.
export const linearIndicatorSizeClassNames = {
  label: {
    md: "text-base sm:text-sm",
    lg: "text-base sm:text-sm",
    sm: "text-sm",
    xl: "text-base sm:text-sm",
  },
  root: {
    md: "gap-2.5",
    lg: "gap-3",
    sm: "gap-2",
    xl: "gap-3.5",
  },
  track: {
    md: "h-2.5",
    lg: "h-3",
    sm: "h-2",
    xl: "h-3.5",
  },
  value: {
    md: "text-base sm:text-sm",
    lg: "text-base sm:text-sm",
    sm: "text-sm",
    xl: "text-base sm:text-sm",
  },
} as const;

export type SurfaceClassName = keyof typeof surfaceClassNames;

// The surfaces of a field (Lukas, 4 November 2026: "nur Standard und soft").
// `default` rests inset, on the field's depth and its 2 % shade (rulebook
// B11), and `soft`, on the members that offer it, takes a subtle fill in place
// of the edge. The elevated and inset surfaces are gone: inset drew the
// default, and elevated only added the elevated Card's contour.
export type FormControlSurface = "default";
export type FormControlVariant = FormControlSurface | "soft";

// The text of a field at every size: `sm` 14 px on a 20 px line, `base` 16 px
// on 24. A field names it in data-text-size, which sets the text of its field
// scale (design-rework.css); without it the text follows the field's size.
export type FormControlTextSize = "sm" | "base";
