"use client";

import { type ReactElement, useState } from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import type { ButtonBaseProps } from "../button";
import { KitButton } from "../button/button-internal";

export type MenuIconMorphProps = Omit<
  ButtonBaseProps,
  "aria-expanded" | "children" | "size" | "variant"
> & {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  size?: SiteplaneControlSize;
};

export function MenuIconMorph({
  "aria-label": ariaLabel,
  className,
  defaultOpen = false,
  disabled,
  onClick,
  onOpenChange,
  open,
  size,
  type = "button",
  ...props
}: MenuIconMorphProps): ReactElement {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const currentOpen = isControlled ? open : internalOpen;
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span data-size={resolvedSize} data-slot="menu-icon-morph-root">
      <style>{menuIconMorphStyles}</style>
      <KitButton
        {...props}
        aria-expanded={currentOpen}
        aria-label={
          ariaLabel ??
          (currentOpen ? "Close navigation menu" : "Open navigation menu")
        }
        className={cn("siteplane-menu-icon-morph", className)}
        data-state={currentOpen ? "open" : "closed"}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented || disabled) {
            return;
          }

          const nextOpen = !currentOpen;

          if (!isControlled) {
            setInternalOpen(nextOpen);
          }

          onOpenChange?.(nextOpen);
        }}
        profile="morph-trigger"
        size={`icon-${resolvedSize}`}
        type={type}
        variant="text"
      >
        <span aria-hidden="true" className="siteplane-menu-icon-bars">
          <span className="siteplane-menu-icon-bar siteplane-menu-icon-bar-one" />
          <span className="siteplane-menu-icon-bar siteplane-menu-icon-bar-two" />
          <span className="siteplane-menu-icon-bar siteplane-menu-icon-bar-three" />
        </span>
      </KitButton>
    </span>
  );
}

const menuIconMorphStyles = `
  @layer siteplane {
    [data-slot="menu-icon-morph-root"] {
      display: inline-flex;
    }

    /* The bars sit two thirds of the way from their earlier 2 to 2.75 px toward
     * the 4/3 px stroke lucide draws at the Button's 16 px icon size, which is
     * about 1.56 to 1.81 px. Browsers snap each bar to whole device pixels, so
     * those fractions drew the middle bar thicker than the outer ones. The bars
     * therefore use the nearest half pixels, 1.5 px up to default and 2 px for
     * lg and xl; with the half-pixel gaps, every bar and every step between
     * bars is a whole device pixel on 2x screens, and all three bars draw
     * equally thick. The open state moves the outer bars by gap plus bar
     * height, so they still cross on the middle bar. */
    [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bars {
      --siteplane-menu-icon-gap: 0.28125rem;
      --siteplane-menu-icon-bar-height: 0.09375rem;
      --siteplane-menu-icon-width: 1.40625rem;
      --siteplane-menu-icon-pos-y-bar-one: 0;
      --siteplane-menu-icon-pos-y-bar-three: 0;
      --siteplane-menu-icon-scale-bar: 1;
      --siteplane-menu-icon-rotate-bar-one: 0deg;
      --siteplane-menu-icon-rotate-bar-three: 0deg;
    }

    [data-slot="menu-icon-morph-root"][data-size="sm"] .siteplane-menu-icon-bars {
      --siteplane-menu-icon-gap: 0.25rem;
      --siteplane-menu-icon-bar-height: 0.09375rem;
      --siteplane-menu-icon-width: 1.25rem;
    }

    [data-slot="menu-icon-morph-root"][data-size="md"] .siteplane-menu-icon-bars {
      --siteplane-menu-icon-gap: 0.28125rem;
      --siteplane-menu-icon-bar-height: 0.09375rem;
      --siteplane-menu-icon-width: 1.40625rem;
    }

    [data-slot="menu-icon-morph-root"][data-size="lg"] .siteplane-menu-icon-bars {
      --siteplane-menu-icon-gap: 0.3125rem;
      --siteplane-menu-icon-bar-height: 0.125rem;
      --siteplane-menu-icon-width: 1.5625rem;
    }

    [data-slot="menu-icon-morph-root"][data-size="xl"] .siteplane-menu-icon-bars {
      --siteplane-menu-icon-gap: 0.34375rem;
      --siteplane-menu-icon-bar-height: 0.125rem;
      --siteplane-menu-icon-width: 1.71875rem;
    }

    @media (min-width: 640px) {
      [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bars {
        --siteplane-menu-icon-gap: 0.25rem;
        --siteplane-menu-icon-bar-height: 0.09375rem;
        --siteplane-menu-icon-width: 1.25rem;
      }

      [data-slot="menu-icon-morph-root"][data-size="sm"] .siteplane-menu-icon-bars {
        --siteplane-menu-icon-gap: 0.21875rem;
        --siteplane-menu-icon-bar-height: 0.09375rem;
        --siteplane-menu-icon-width: 1.125rem;
      }

      [data-slot="menu-icon-morph-root"][data-size="md"] .siteplane-menu-icon-bars {
        --siteplane-menu-icon-gap: 0.25rem;
        --siteplane-menu-icon-bar-height: 0.09375rem;
        --siteplane-menu-icon-width: 1.25rem;
      }

      [data-slot="menu-icon-morph-root"][data-size="lg"] .siteplane-menu-icon-bars {
        --siteplane-menu-icon-gap: 0.3125rem;
        --siteplane-menu-icon-bar-height: 0.125rem;
        --siteplane-menu-icon-width: 1.5rem;
      }

      [data-slot="menu-icon-morph-root"][data-size="xl"] .siteplane-menu-icon-bars {
        --siteplane-menu-icon-gap: 0.3125rem;
        --siteplane-menu-icon-bar-height: 0.125rem;
        --siteplane-menu-icon-width: 1.5625rem;
      }
    }

    [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bars {
      --siteplane-menu-icon-pitch: calc(var(--siteplane-menu-icon-gap) + var(--siteplane-menu-icon-bar-height));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: calc(var(--siteplane-menu-icon-pitch) - var(--siteplane-menu-icon-bar-height));
    }

    /* The bars start a whole pixel apart, so the browser snaps all three to the
       same rows and paints them equally thick at every line weight; at a
       fractional distance the middle bar came out thicker or thinner than the
       others. */
    @supports (top: round(1.5px, 1px)) {
      [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bars {
        --siteplane-menu-icon-pitch: round(calc(var(--siteplane-menu-icon-gap) + var(--siteplane-menu-icon-bar-height)), 1px);
      }
    }

    [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bar {
      position: relative;
      display: block;
      height: var(--siteplane-menu-icon-bar-height);
      width: var(--siteplane-menu-icon-width);
      border-radius: var(--radius-4xl);
      background-color: currentColor;
    }

    /* The bars move on the navigation easing, the curve of the navigation
     * motion (M1). */
    [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bar-one {
      top: var(--siteplane-menu-icon-pos-y-bar-one);
      transform: rotate(var(--siteplane-menu-icon-rotate-bar-one));
      transition: top var(--motion-duration-base) var(--motion-ease-navigation) var(--motion-duration-micro), transform var(--motion-duration-micro) var(--motion-ease-navigation);
    }

    [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bar-two {
      transform: scaleX(var(--siteplane-menu-icon-scale-bar));
      transition: transform var(--motion-duration-overlay) var(--motion-ease-navigation) var(--motion-duration-micro);
    }

    [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bar-three {
      bottom: var(--siteplane-menu-icon-pos-y-bar-three);
      transform: rotate(var(--siteplane-menu-icon-rotate-bar-three));
      transition: bottom var(--motion-duration-base) var(--motion-ease-navigation) var(--motion-duration-micro), transform var(--motion-duration-micro) var(--motion-ease-navigation);
    }

    [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-morph[data-state="open"] .siteplane-menu-icon-bars {
      --siteplane-menu-icon-pos-y-bar-one: var(--siteplane-menu-icon-pitch);
      --siteplane-menu-icon-pos-y-bar-three: var(--siteplane-menu-icon-pitch);
      --siteplane-menu-icon-scale-bar: 0;
      --siteplane-menu-icon-rotate-bar-one: 45deg;
      --siteplane-menu-icon-rotate-bar-three: -45deg;
    }

    [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-morph[data-state="open"] .siteplane-menu-icon-bar-one {
      transition: top var(--motion-duration-base) var(--motion-ease-navigation), transform var(--motion-duration-base) var(--motion-ease-navigation) var(--motion-duration-micro);
    }

    [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-morph[data-state="open"] .siteplane-menu-icon-bar-three {
      transition: bottom var(--motion-duration-base) var(--motion-ease-navigation), transform var(--motion-duration-base) var(--motion-ease-navigation) var(--motion-duration-micro);
    }

    /* The open-state transitions are more specific, so each switch uses !important. */
    html[data-motion-reduce="true"] [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bar,
    :where([data-sp-motion="reduced"]) [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bar {
      transition-duration: 0ms !important;
      transition-delay: 0ms !important;
    }

    @media (prefers-reduced-motion: reduce) {
      [data-slot="menu-icon-morph-root"] .siteplane-menu-icon-bar {
        transition-duration: 0ms !important;
        transition-delay: 0ms !important;
      }
    }

  }
`;
