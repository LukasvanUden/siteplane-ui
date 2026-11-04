"use client";

import { type ReactElement, useState } from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import type { ButtonBaseProps } from "../button";
import { KitButton } from "../button/button-internal";

import "./icon-morphs.css";

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
  const messages = useSiteplaneMessages("iconMorphs");
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const currentOpen = isControlled ? open : internalOpen;
  const resolvedSize = useResolvedControlSize(size);

  return (
    <span
      data-size={resolvedSize}
      className="sp-menu-icon-morph-root"
      data-slot="menu-icon-morph-root"
    >
      <KitButton
        {...props}
        aria-expanded={currentOpen}
        aria-label={ariaLabel ?? (currentOpen ? messages.close : messages.open)}
        className={cn("sp-menu-icon-morph", className)}
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
        // The ghost icon Button of its size: its rules own the box, the text
        // colour and the hover and pressed fills, as on the Sidebar's trigger
        // that opens a menu from the same bar (Lukas, 3 November 2026; it was
        // a link and showed no fill). The profile only leaves it out of the
        // border flash, as the Sidebar's trigger is.
        profile="morph-trigger"
        size={`icon-${resolvedSize}`}
        type={type}
        variant="ghost"
      >
        <span aria-hidden="true" className="sp-menu-icon-bars">
          <span className="sp-menu-icon-bar sp-menu-icon-bar-one" />
          <span className="sp-menu-icon-bar sp-menu-icon-bar-two" />
          <span className="sp-menu-icon-bar sp-menu-icon-bar-three" />
        </span>
      </KitButton>
    </span>
  );
}
