"use client";

import * as React from "react";
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import { ChevronDown } from "lucide-react";
import { SiteplaneUIPortalScope } from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button } from "../button";
import "./navigation-menu.css";

// Links inside NavigationMenuContent take the panel row style without a
// hand-set `popup` flag: the content tells its links where they sit.
const NavigationMenuContentContext: React.Context<boolean> =
  React.createContext(false);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Base UI's own default for the item value type.
export function NavigationMenu<Value = any>(
  props: WithStringClassName<NavigationMenuPrimitive.Root.Props<Value>>,
): React.ReactElement {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      {...props}
      className={cn(slotClass("navigation-menu", props), props.className)}
    />
  );
}

export function NavigationMenuItem(
  props: WithStringClassName<NavigationMenuPrimitive.Item.Props>,
): React.ReactElement {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      {...props}
      className={cn(slotClass("navigation-menu-item", props), props.className)}
    />
  );
}

export function NavigationMenuList({
  className,
  ...props
}: WithStringClassName<NavigationMenuPrimitive.List.Props>): React.ReactElement {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        slotClass("navigation-menu-list", props),
        "flex items-center gap-1",
        className,
      )}
      {...props}
    />
  );
}

export function NavigationMenuTrigger({
  children,
  render,
  ...props
}: WithStringClassName<NavigationMenuPrimitive.Trigger.Props>): React.ReactElement {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      // The trigger is a Button. A render of the consumer's replaces the
      // element inside that Button, which keeps its styling and states; a
      // render function still receives the trigger's state.
      render={(triggerProps, triggerState) => (
        <Button
          {...triggerProps}
          variant="ghost"
          profile="navigation-link"
          render={
            typeof render === "function"
              ? (elementProps) => render(elementProps, triggerState)
              : render
          }
        />
      )}
      {...props}
      className={cn(
        slotClass("navigation-menu-trigger", props),
        props.className,
      )}
    >
      {children}
      <NavigationMenuPrimitive.Icon
        className="sp-navigation-menu-icon"
        data-slot="navigation-menu-icon"
      >
        <ChevronDown />
      </NavigationMenuPrimitive.Icon>
    </NavigationMenuPrimitive.Trigger>
  );
}

export function NavigationMenuLink({
  popup: popupProp,
  description,
  children,
  render,
  ...props
}: WithStringClassName<NavigationMenuPrimitive.Link.Props> & {
  /**
   * Row style for a link in a panel: full width and aligned to the start.
   * Defaults to true inside NavigationMenuContent and false elsewhere.
   */
  popup?: boolean;
  description?: React.ReactNode;
}): React.ReactElement {
  const inContent = React.useContext(NavigationMenuContentContext);
  const popup = popupProp ?? inContent;
  return (
    <NavigationMenuPrimitive.Link
      closeOnClick
      data-slot="navigation-menu-link"
      // The link is a Button-styled anchor. A render of the consumer's, such
      // as a router link, takes the place of the anchor inside that Button,
      // which keeps its styling and states; a render function still receives
      // the link's state.
      render={(linkProps, linkState) => (
        <Button
          // The link's props and ref are an anchor's, and the Button renders
          // that anchor; its props are typed for its default button.
          {...(linkProps as React.ComponentPropsWithRef<"button">)}
          variant="ghost"
          profile={popup ? "default" : "navigation-link"}
          align={popup ? "start" : "center"}
          width={popup ? "full" : "auto"}
          multiline={Boolean(description)}
          render={
            typeof render === "function"
              ? (elementProps) => render(elementProps, linkState)
              : (render ?? <a />)
          }
        />
      )}
      {...props}
      className={cn(slotClass("navigation-menu-link", props), props.className)}
    >
      <span className="min-w-0">
        <span
          className="sp-navigation-menu-link-title flex items-center gap-2"
          data-slot="navigation-menu-link-title"
        >
          {children}
        </span>
        {description && (
          // Beside a leading icon the description starts under the title text
          // (I7): the icon, which the Button pulls 2 px out on each side, and
          // the 8 px gap put that text 4 px past the icon's width.
          <span
            className="sp-navigation-menu-link-description block text-sm font-normal text-muted-foreground [[data-slot=navigation-menu-link-title]:has(>svg:first-child)+&]:ps-[calc(var(--sp-rw-button-icon,var(--sp-rw-control-icon))+--spacing(1))]"
            data-slot="navigation-menu-link-description"
          >
            {description}
          </span>
        )}
      </span>
    </NavigationMenuPrimitive.Link>
  );
}

export function NavigationMenuContent({
  children,
  className,
  ...props
}: WithStringClassName<NavigationMenuPrimitive.Content.Props>): React.ReactElement {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        slotClass("navigation-menu-content", props),
        "sp-navigation-content",
        className,
      )}
      {...props}
    >
      <NavigationMenuContentContext.Provider value>
        {children}
      </NavigationMenuContentContext.Provider>
    </NavigationMenuPrimitive.Content>
  );
}

export function NavigationMenuPopup({
  anchor,
  ...props
}: WithStringClassName<NavigationMenuPrimitive.Popup.Props> & {
  anchor?: NavigationMenuPrimitive.Positioner.Props["anchor"];
}): React.ReactElement {
  return (
    <NavigationMenuPrimitive.Portal>
      <SiteplaneUIPortalScope>
        <NavigationMenuPrimitive.Positioner
          anchor={anchor}
          sideOffset={8}
          align="start"
          collisionPadding={16}
          className="sp-navigation-menu-positioner z-50"
          data-slot="navigation-menu-positioner"
        >
          <NavigationMenuPrimitive.Popup
            data-slot="navigation-menu-popup"
            {...props}
            className={cn(
              slotClass("navigation-menu-popup", props),
              props.className,
            )}
          >
            <NavigationMenuPrimitive.Viewport className="relative size-full overflow-hidden" />
          </NavigationMenuPrimitive.Popup>
        </NavigationMenuPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </NavigationMenuPrimitive.Portal>
  );
}
