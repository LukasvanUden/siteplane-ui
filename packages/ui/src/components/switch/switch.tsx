"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import type * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  choiceMenuItemClassName,
  choiceMenuItemSwitchGridClassName,
  choiceMenuItemSwitchLabelClassName,
  menuRowLabel,
} from "../../system/styles/choice-menu-item";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";
import type { KitSwitchProps } from "./switch-internal";

import "./switch.css";

// The standalone control and the track of a menu row's switch draw their
// track and thumb, their sizes and the thumb's travel from the same rules in
// design-rework.css; the utilities here only lay the parts out. The track of a
// menu row is the chassis in its default variant at the step of the row's
// line, 36x20 beside the menu rows' 20 px line and 44x24 in a touch-size
// DrawerMenu (Lukas, 2 November 2026), and takes the standalone control's 3:1
// edge by its switch-track slot. The thumb starts
// at the track's inline start and travels toward its end when checked: in a
// right-to-left page it starts on the right and travels left, and it stretches
// from its leading edge there too, while the switch or its label is pressed.
const switchControlClassName =
  "sp-switch-motion inline-flex shrink-0 cursor-pointer items-center data-disabled:cursor-not-allowed";

export const switchThumbClassName =
  "pointer-events-none block aspect-square origin-left will-change-transform in-[[data-foundation=switch][data-checked]]:origin-right rtl:origin-right rtl:in-[[data-foundation=switch][data-checked]]:origin-left";

/** The track of a switch row in a menu; the row's checked state drives it. */
export const switchTrackClassName =
  "sp-switch-track sp-switch-motion col-start-2";

export interface SwitchProps extends Omit<
  WithStringClassName<SwitchPrimitive.Root.Props>,
  "size"
> {
  /** The control size, which the track and its label follow. */
  size?: SiteplaneControlSize | undefined;
  /**
   * `slim` draws the track without padding, as tall as the thumb, which
   * covers its edge. The thumb keeps its size and travel. A switch row of a
   * menu draws the default track.
   */
  variant?: "default" | "slim" | undefined;
}

export function Switch(switchProps: SwitchProps): React.ReactElement {
  // Menu and drawer rows pass the internal menu-item profile through
  // KitSwitch (switch-internal.ts), the same function.
  const {
    children,
    className,
    profile = "control",
    size,
    variant = "default",
    ...props
  } = switchProps as KitSwitchProps;
  const resolvedSize = useResolvedControlSize(size);

  return (
    <SwitchPrimitive.Root
      className={cn(
        // A menu row shows the focus once, as a whole, like the check and
        // radio rows (T3); its track takes no ring of its own.
        slotClass("switch", props),
        baseClass("switch", props),
        profile === "menu-item"
          ? cn(choiceMenuItemClassName, choiceMenuItemSwitchGridClassName)
          : switchControlClassName,
        className,
      )}
      data-foundation="switch"
      // A menu row ends with its switch, as a check row ends with its check
      // (I8).
      data-indicator-position={profile === "menu-item" ? "end" : undefined}
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="switch"
      data-variant={profile === "menu-item" ? undefined : variant}
      {...props}
    >
      {profile === "menu-item" ? (
        <>
          <span className={choiceMenuItemSwitchLabelClassName}>
            {menuRowLabel(children)}
          </span>
          <span
            aria-hidden="true"
            className={switchTrackClassName}
            data-slot="switch-track"
          >
            <SwitchPrimitive.Thumb
              className={cn("sp-switch-thumb", switchThumbClassName)}
              data-slot="switch-thumb"
            />
          </span>
        </>
      ) : (
        <SwitchPrimitive.Thumb
          className={cn("sp-switch-thumb", switchThumbClassName)}
          data-slot="switch-thumb"
        />
      )}
    </SwitchPrimitive.Root>
  );
}

export { SwitchPrimitive };
