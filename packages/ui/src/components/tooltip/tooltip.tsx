"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export const TooltipCreateHandle: typeof TooltipPrimitive.createHandle =
  TooltipPrimitive.createHandle;

export function TooltipProvider({
  // The first tooltip opens after the pointer rests 300 ms on its trigger
  // (Lukas, 4 November 2026; it was 700 ms), and a neighbour opens at once
  // within 550 ms of the last one closing.
  delay = 300,
  timeout = 550,
  ...props
}: TooltipPrimitive.Provider.Props): React.ReactElement {
  return (
    <TooltipPrimitive.Provider delay={delay} timeout={timeout} {...props} />
  );
}

/*
 * A tooltip that describes its trigger (`describeTrigger`, Lukas, 4 November
 * 2026). By default a tooltip is a visual label: its popup has no role and
 * links to nothing, and its trigger names itself, so a screen reader does not
 * hear the name of an icon button twice. A tooltip that adds what its trigger
 * does not say, such as a title with a sentence, opts in: the popup takes
 * `role="tooltip"` and an id, and the trigger that opened it names that id in
 * `aria-describedby` while it is open. `"always"` keeps that link while the
 * popup is closed as well, for a text that must also be read on a touch
 * screen, where no tooltip opens: the popup stays in the page, hidden while
 * it is closed, and every trigger of the tooltip names it (Lukas, 4 November
 * 2026; FieldHelp linked its text by hand with a hidden copy in its button).
 * The Tooltip hands the id to its popup and its triggers; a trigger outside
 * it, which a handle connects (TooltipCreateHandle), finds the id through the
 * handle.
 */
type TooltipDescription = {
  /** The triggers name the popup also while it is closed (`"always"`). */
  always: boolean;
  /** The popup's id, which the triggers name in `aria-describedby`. */
  id: string;
};

const TooltipDescriptionContext =
  React.createContext<TooltipDescription | null>(null);

const handleDescriptions = new WeakMap<object, TooltipDescription>();
const handleListeners = new WeakMap<object, Set<() => void>>();

function setHandleDescription(
  handle: object,
  description: TooltipDescription | null,
): void {
  if (description === null) handleDescriptions.delete(handle);
  else handleDescriptions.set(handle, description);
  handleListeners.get(handle)?.forEach((listener) => listener());
}

/** How the tooltip of a handle describes its triggers. */
function useHandleDescription(
  handle: object | undefined,
): TooltipDescription | null {
  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (handle === undefined) return () => undefined;
      const listeners = handleListeners.get(handle) ?? new Set<() => void>();
      handleListeners.set(handle, listeners);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    [handle],
  );
  return React.useSyncExternalStore(
    subscribe,
    () =>
      handle === undefined ? null : (handleDescriptions.get(handle) ?? null),
    () => null,
  );
}

export type TooltipProps<Payload = unknown> =
  TooltipPrimitive.Root.Props<Payload> & {
    /**
     * The tooltip describes its trigger: the popup takes `role="tooltip"`,
     * and the trigger that opened it names the popup in `aria-describedby`
     * while it is open, after the ids it names itself, so a screen reader
     * reads the tooltip's text after the trigger's name. For a tooltip that
     * adds what the trigger does not say, such as a title with a sentence.
     * `"always"` keeps that link while the popup is closed too, for a text
     * that must also be read on a touch screen, where no tooltip opens: the
     * popup stays in the page, hidden while it is closed, and every trigger
     * of the tooltip names it, so give it one trigger, or triggers that share
     * its text. A tooltip that repeats the trigger's name, the label of an
     * icon button, leaves it off: the trigger names itself with `aria-label`,
     * and the name would be read twice. Default: `false`.
     */
    describeTrigger?: boolean | "always" | undefined;
  };

/** The root of a tooltip: Base UI's Tooltip root, which renders no element. */
export function Tooltip<Payload = unknown>({
  describeTrigger = false,
  ...props
}: TooltipProps<Payload>): React.ReactElement {
  const id = React.useId();
  const description = React.useMemo<TooltipDescription | null>(
    () =>
      describeTrigger === false
        ? null
        : { always: describeTrigger === "always", id },
    [describeTrigger, id],
  );
  const { handle } = props;
  React.useLayoutEffect(() => {
    if (handle === undefined) return undefined;
    setHandleDescription(handle, description);
    return () => setHandleDescription(handle, null);
  }, [description, handle]);
  return (
    <TooltipDescriptionContext.Provider value={description}>
      <TooltipPrimitive.Root {...props} />
    </TooltipDescriptionContext.Provider>
  );
}

/** How far the arrow reaches out of the popup: --sp-rw-space-1, in px. */
const TOOLTIP_ARROW_DEPTH = 4;

/*
 * The arrow continues the popup's edge around itself (Lukas, 2 November 2026:
 * the hairline stopped where the arrow began). The popup draws its edge as two
 * rings of the kit's hairline outside its box, the inner one in the popup's
 * fill (Dark lays a light rim over it) and the outer one the contour. The
 * glyph draws the same two rings along the arrow's slanted sides, each from
 * where it leaves the popup's ring of the same kind, so every ring is painted
 * once and runs on unbroken; the fill on top covers the popup's rings under
 * the arrow. It is drawn pointing down from the popup's edge, at the top of
 * its 8 by 4 box, and the stylesheet sizes the rings and turns it to its side
 * (design-rework.css, "An arrow points").
 */
function TooltipArrowGlyph(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="sp-tooltip-arrow-glyph"
      focusable="false"
      viewBox="0 0 8 4"
    >
      <path className="sp-tooltip-arrow-contour" d="M0 0L4 4L8 0" />
      <path className="sp-tooltip-arrow-ring" d="M0 0L4 4L8 0" />
      <path className="sp-tooltip-arrow-rim" d="M0 0L4 4L8 0" />
      <path className="sp-tooltip-arrow-fill" d="M0 0L4 4L8 0Z" />
    </svg>
  );
}

type TooltipTriggerRender = TooltipPrimitive.Trigger.Props["render"];
type TooltipTriggerRenderFunction = Extract<
  NonNullable<TooltipTriggerRender>,
  (...args: never[]) => unknown
>;
type TooltipTriggerRenderProps = Parameters<TooltipTriggerRenderFunction>[0];

/** Ids for `aria-describedby`, each once, in order. */
function joinIds(...ids: Array<string | undefined>): string | undefined {
  const unique = [
    ...new Set(ids.flatMap((value) => value?.split(/\s+/) ?? [])),
  ].filter(Boolean);
  return unique.length > 0 ? unique.join(" ") : undefined;
}

/** The element of a described trigger, `render` or a button, as Base UI renders it. */
function TooltipTriggerElement({
  props,
  render,
}: {
  props: TooltipTriggerRenderProps;
  render: React.ReactElement | undefined;
}): React.ReactElement {
  return useRender({
    defaultTagName: "button",
    props: props as Record<string, unknown>,
    render,
  });
}

/**
 * The render of a trigger whose tooltip describes it: while this trigger has
 * the tooltip open, or open and closed with `"always"`, it names the popup in
 * `aria-describedby`, after the ids the trigger and its element name. It
 * renders in the same tree open and closed, so the element keeps its node and
 * its focus.
 */
function describedRender(
  render: TooltipTriggerRender,
  { always, id }: TooltipDescription,
): TooltipTriggerRenderFunction {
  return (triggerProps, state) => {
    const element = React.isValidElement<{ "aria-describedby"?: string }>(
      render,
    )
      ? render
      : undefined;
    const describedBy =
      always || state.open
        ? joinIds(
            triggerProps["aria-describedby"],
            element?.props["aria-describedby"],
            id,
          )
        : undefined;
    const props =
      describedBy === undefined
        ? triggerProps
        : { ...triggerProps, "aria-describedby": describedBy };
    if (typeof render === "function") return render(props, state);
    return (
      <TooltipTriggerElement
        props={props}
        render={
          // The element's own ids would replace the ones it is given.
          element && describedBy !== undefined
            ? React.cloneElement(element, { "aria-describedby": describedBy })
            : element
        }
      />
    );
  };
}

export function TooltipTrigger(
  props: WithStringClassName<TooltipPrimitive.Trigger.Props>,
): React.ReactElement {
  const inTooltip = React.useContext(TooltipDescriptionContext);
  const throughHandle = useHandleDescription(props.handle);
  // A trigger with a handle belongs to the handle's tooltip, as in Base UI.
  const description = props.handle === undefined ? inTooltip : throughHandle;
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      {...props}
      className={cn(slotClass("tooltip-trigger", props), props.className)}
      {...(description === null
        ? {}
        : { render: describedRender(props.render, description) })}
    />
  );
}

export type TooltipTone = "neutral" | "error";

export function TooltipPopup({
  className,
  align = "center",
  // 6 px between a tooltip and what it describes.
  sideOffset = 6,
  side = "top",
  anchor,
  disableAnchorTracking,
  arrow = false,
  children,
  interactive = true,
  portalProps,
  tone = "neutral",
  variant = "default",
  ...props
}: WithStringClassName<TooltipPrimitive.Popup.Props> & {
  align?: TooltipPrimitive.Positioner.Props["align"];
  side?: TooltipPrimitive.Positioner.Props["side"];
  sideOffset?: TooltipPrimitive.Positioner.Props["sideOffset"];
  anchor?: TooltipPrimitive.Positioner.Props["anchor"];
  /**
   * Stops the popup from watching its anchor and itself for changes of size
   * and place. For an anchor that its owner moves and hands over again at
   * every frame, such as the card of a chart that trails its item, which
   * would otherwise set the watching up anew at every frame.
   */
  disableAnchorTracking?: TooltipPrimitive.Positioner.Props["disableAnchorTracking"];
  /**
   * Points an arrow at the anchor. The arrow reaches into the side offset,
   * so the gap between the arrow's tip and the anchor stays `sideOffset`.
   */
  arrow?: boolean;
  /**
   * `false` lets the pointer pass through the popup, for a bubble that only
   * reports, such as a field's error.
   */
  interactive?: boolean;
  portalProps?: WithStringClassName<TooltipPrimitive.Portal.Props>;
  /**
   * `error` fills the popup with the solid destructive colour of the Badge's
   * destructive variant, for an error; `neutral`, the default, keeps the
   * secondary surface.
   */
  tone?: TooltipTone;
  /**
   * `glass` lays the shared glass surface over whatever sits behind the
   * tooltip. `tone` applies to the default surface only.
   */
  variant?: "default" | "glass";
}): React.ReactElement {
  // The popup of a tooltip that describes its trigger (`describeTrigger`)
  // carries the id the trigger names. With `"always"` it stays in the page,
  // hidden while it is closed, so the trigger names it at all times.
  const description = React.useContext(TooltipDescriptionContext);
  return (
    <TooltipPrimitive.Portal
      {...portalProps}
      {...(description?.always ? { keepMounted: true } : {})}
    >
      <SiteplaneUIPortalScope>
        <TooltipPrimitive.Positioner
          align={align}
          anchor={anchor}
          disableAnchorTracking={disableAnchorTracking}
          className={cn(
            "sp-tooltip-positioner",
            "z-50 max-w-(--available-width)",
            // The positioner is as large as the popup was when it opened: Base
            // UI measures it then and sets `--positioner-width` and
            // `--positioner-height`, which fix its size, and it glides when its
            // place changes. A popup with an anchor of its own is placed by
            // whoever supplies it: the anchor moves frame by frame and the
            // content may change in place (the card of a chart that trails its
            // item, with rows and rolling digits). So its positioner neither
            // transitions nor holds a measured size, which the content would
            // outgrow and lose its padding to: it is as large as its content.
            anchor === undefined
              ? "h-(--positioner-height) w-(--positioner-width) transition-[top,left,right,bottom,transform] duration-(--motion-duration-fast) ease-(--motion-ease-state) data-instant:transition-none"
              : "h-max w-max",
            !interactive && "pointer-events-none",
          )}
          data-slot="tooltip-positioner"
          side={side}
          sideOffset={
            arrow && typeof sideOffset === "number"
              ? sideOffset + TOOLTIP_ARROW_DEPTH
              : sideOffset
          }
        >
          <TooltipPrimitive.Popup
            className={cn(
              slotClass("tooltip-popup", props),
              "sp-floating-panel relative flex h-(--popup-height,auto) w-(--popup-width,auto) origin-(--transform-origin) text-balance before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] data-instant:duration-0",
              // Glass takes the glass surface in place of the opaque one, whose
              // fill, text colour and shadow the glass rule draws.
              variant === "glass" && surfaceClassNames.glass,
              !interactive && "pointer-events-none",
              className,
            )}
            data-slot="tooltip-popup"
            // Only the error tone paints; glass keeps its own surface.
            data-tone={
              tone === "error" && variant !== "glass" ? "error" : undefined
            }
            data-variant={variant === "glass" ? variant : undefined}
            {...props}
            {...(description === null
              ? {}
              : { id: description.id, role: "tooltip" })}
          >
            {arrow && (
              <TooltipPrimitive.Arrow
                className="sp-tooltip-arrow"
                data-slot="tooltip-arrow"
              >
                <TooltipArrowGlyph />
              </TooltipPrimitive.Arrow>
            )}
            {/* When the popup moves to another trigger, its content switches
                at once: the kit's one switch rule hides the previous content
                (motion.css, rulebook M8), and the viewport rule it shares with
                Popover in design-rework.css gives the content its width. */}
            <TooltipPrimitive.Viewport
              className="sp-tooltip-viewport relative size-full overflow-clip data-instant:transition-none"
              data-slot="tooltip-viewport"
            >
              {children}
            </TooltipPrimitive.Viewport>
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </TooltipPrimitive.Portal>
  );
}

/**
 * The title of a tooltip that also has a description: the label weight,
 * with the description 4 px under it (design-rework.css).
 */
export function TooltipTitle({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("tooltip-title", props), className)}
      data-slot="tooltip-title"
      {...props}
    />
  );
}

/**
 * The supporting text under a TooltipTitle, in the tertiary text colour of the
 * tooltip.
 */
export function TooltipDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(slotClass("tooltip-description", props), className)}
      data-slot="tooltip-description"
      {...props}
    />
  );
}

// TooltipContent is an alias of TooltipPopup.
export { TooltipPrimitive, TooltipPopup as TooltipContent };
