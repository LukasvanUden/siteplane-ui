"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import {
  siteplaneUIDefaults,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  choiceMenuItemClassName,
  choiceMenuItemSwitchGridClassName,
  choiceMenuItemSwitchLabelClassName,
  menuRowLabel,
} from "../../system/styles/choice-menu-item";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import type { KitSwitchProps } from "./switch-internal";

import "./switch.css";

export const switchVariants = cva(
  "siteplane-switch-motion inline-flex h-[calc(var(--thumb-size)+2px)] w-[calc(var(--thumb-size)*2-2px)] shrink-0 cursor-pointer items-center p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-checked:bg-primary data-unchecked:bg-input not-data-disabled:data-unchecked:hover:bg-input/80 not-data-disabled:data-unchecked:hover:shadow-sm/10 dark:not-data-disabled:data-unchecked:hover:bg-white/12",
  {
    defaultVariants: { size: siteplaneUIDefaults.controlSize },
    variants: {
      size: {
        md: "[--thumb-size:--spacing(5)] sm:[--thumb-size:--spacing(4)]",
        lg: "[--thumb-size:--spacing(6)] rounded-xl sm:[--thumb-size:--spacing(5)] sm:rounded-lg",
        sm: "[--thumb-size:--spacing(4)] sm:[--thumb-size:--spacing(3.5)]",
        xl: "[--thumb-size:--spacing(7)] sm:[--thumb-size:--spacing(6)]",
      },
    },
  },
);

export const switchThumbClassName =
  "pointer-events-none block aspect-square h-full origin-left rounded-[inherit] bg-background shadow-sm/5 will-change-transform in-[[data-foundation=switch]:active,[data-foundation=label]:active,[data-slot=field-label]:active]:not-data-disabled:scale-x-110 in-[[data-foundation=switch][data-checked]]:origin-[var(--thumb-size)_50%] in-[[data-foundation=switch][data-checked]]:translate-x-[calc(var(--thumb-size)-4px)]";

// The standalone control draws its track and thumb, their sizes and the
// thumb's travel from design-rework.css ([data-slot="switch"]); the utilities
// above style the menu tracks only. The thumb stretches from its leading edge
// while pressed.
const switchControlClassName =
  "siteplane-switch-motion inline-flex shrink-0 cursor-pointer items-center data-disabled:cursor-not-allowed";

const switchControlThumbClassName =
  "pointer-events-none block aspect-square origin-left will-change-transform in-[[data-foundation=switch]:active,[data-foundation=label]:active,[data-slot=field-label]:active]:not-data-disabled:scale-x-110 in-[[data-foundation=switch][data-checked]]:origin-right";

export const switchMenuTrackClassName =
  "col-start-2 in-[[data-foundation=switch][data-checked]]:bg-primary in-[[data-foundation=switch][data-unchecked]]:bg-input";

export interface SwitchProps
  extends
    Omit<WithStringClassName<SwitchPrimitive.Root.Props>, "size">,
    VariantProps<typeof switchVariants> {}

export function Switch(switchProps: SwitchProps): React.ReactElement {
  // Menu and drawer rows pass the internal menu-item profile through
  // KitSwitch (switch-internal.ts), the same function.
  const {
    children,
    className,
    profile = "control",
    size,
    ...props
  } = switchProps as KitSwitchProps;
  const resolvedSize = useResolvedControlSize(size);

  return (
    <SwitchPrimitive.Root
      className={cn(
        // A menu row shows the focus once, as a whole, like the check and
        // radio rows (T3); its track takes no ring of its own.
        profile === "menu-item"
          ? cn(choiceMenuItemClassName, choiceMenuItemSwitchGridClassName)
          : switchControlClassName,
        className,
      )}
      data-foundation="switch"
      data-profile={profile}
      data-size={resolvedSize}
      data-slot="switch"
      {...props}
    >
      {profile === "menu-item" ? (
        <>
          <span className={choiceMenuItemSwitchLabelClassName}>
            {menuRowLabel(children)}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              switchVariants({ size: resolvedSize }),
              switchMenuTrackClassName,
            )}
            data-slot="switch-track"
          >
            <SwitchPrimitive.Thumb
              className={switchThumbClassName}
              data-slot="switch-thumb"
            />
          </span>
        </>
      ) : (
        <SwitchPrimitive.Thumb
          className={switchControlThumbClassName}
          data-slot="switch-thumb"
        />
      )}
    </SwitchPrimitive.Root>
  );
}

export { SwitchPrimitive };
