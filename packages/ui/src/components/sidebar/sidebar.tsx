"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  CaretDownIcon,
  ListIcon,
  SidebarSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import * as React from "react";
import { useMediaQuery } from "../../system/hooks/use-media-query";
import { focusRingRecipe } from "../../system/recipes/focus-ring.recipe";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { dropSlotClass, slotClass } from "../../system/utils/slot-class";
import { Badge } from "../badge";
import { Button, CloseButton, type ButtonBaseProps } from "../button";
import { KitButton } from "../button/button-internal";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../collapsible";
import { Input } from "../input";
import { KitInput } from "../input/input-internal";
import { MenuTriggerIcon } from "../menu";
import { ScrollArea } from "../scroll-area";
import { Separator } from "../separator";
import {
  Sheet,
  SheetClose,
  SheetHeader,
  SheetPrimitive,
  SheetTitle,
} from "../sheet";
import { KitSheetPopup } from "../sheet/sheet-internal";
import type {
  KitSidebarProps,
  KitSidebarProviderProps,
} from "./sidebar-internal";
import {
  SidebarSubTierContext,
  type SidebarTier,
  SidebarTierContext,
} from "./sidebar-tier";
import { Skeleton } from "../skeleton";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";

const SIDEBAR_COOKIE_NAME: string = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE: number = 60 * 60 * 24 * 7;
// The desktop widths are the stylesheet's (design-rework.css, "Sidebar").
const SIDEBAR_WIDTH_MOBILE: string = "18rem";
const SIDEBAR_KEYBOARD_SHORTCUT: string = "b";

export const sidebarMenuPopupWidthClassName = "w-56";

type SidebarMenuButtonSize = SiteplaneControlSize;
type SidebarMenuButtonVariant = "default" | "outline" | "workspace";

export type SidebarLayout = "inset" | "push";

export type SidebarContextProps = {
  layout?: SidebarLayout | undefined;
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  mobileBreakpoint: "md" | "lg";
  toggleSidebar: () => void;
};

export const SidebarContext: React.Context<SidebarContextProps | null> =
  React.createContext<SidebarContextProps | null>(null);

export function useSidebar(): SidebarContextProps {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

// A layout reserves the sidebar's leading 8px gutter on the container itself
// (the default variant only; floating and inset already pad the container).
// Header, groups and footer then add only their trailing inset, so a layout
// sidebar insets rows by the same 8px on both sides and every part keeps its
// block padding.
const SidebarGutterContext: React.Context<boolean> = React.createContext(false);

// The id that SidebarTrigger and SidebarRail name in aria-controls: the
// provider's own, or the id the consumer gives Sidebar.
type SidebarControls = {
  id: string;
  setId: (id: string | undefined) => void;
};

const SidebarControlsContext: React.Context<SidebarControls | null> =
  React.createContext<SidebarControls | null>(null);

type SidebarCollapsible = "offcanvas" | "icon" | "none";

// Sidebar tells its parts how it collapses, so a menu item knows when it sits
// on the collapsed icon rail.
const SidebarCollapsibleContext: React.Context<SidebarCollapsible | null> =
  React.createContext<SidebarCollapsible | null>(null);

// A menu item with an expand trigger tells its row to step aside while the
// trigger stands in for it on the collapsed icon rail.
const SidebarMenuItemContext: React.Context<boolean> =
  React.createContext(false);

// On a phone the current item of the sheet holds the pages of the second tier,
// and its row is the trigger that folds them (sidebar-tier.ts).
const SidebarMenuPagesContext: React.Context<boolean> =
  React.createContext(false);

// Ctrl/Cmd+B stays with a field that edits text: there it is Bold, or a caret
// move in macOS text fields.
const nonTextInputTypes: ReadonlySet<string> = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) return true;
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  return (
    target instanceof HTMLInputElement && !nonTextInputTypes.has(target.type)
  );
}

function isCurrent(ariaCurrent: React.AriaAttributes["aria-current"]): boolean {
  return (
    ariaCurrent !== undefined &&
    ariaCurrent !== false &&
    ariaCurrent !== "false"
  );
}

function getSidebarLengthInPixels(
  element: HTMLElement,
  name: string,
  fallback: number,
): number {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  const parsedValue = Number.parseFloat(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  if (value.endsWith("rem")) {
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );

    return parsedValue * (Number.isFinite(rootFontSize) ? rootFontSize : 16);
  }

  return parsedValue;
}

// Persistence is best effort: the Cookie Store API is missing in some browsers
// and in insecure contexts, and a blocked write must never reject.
function persistSidebarOpenState(open: boolean, name: string): void {
  const value = String(open);
  const store = (globalThis as { cookieStore?: CookieStore }).cookieStore;

  try {
    if (store && typeof store.set === "function") {
      store
        .set({
          expires: Date.now() + SIDEBAR_COOKIE_MAX_AGE * 1000,
          name,
          path: "/",
          value,
        })
        .catch(() => undefined);
      return;
    }

    if (typeof document !== "undefined") {
      document.cookie = `${name}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }
  } catch {
    // Cookies can be unavailable, for example in a sandboxed document.
  }
}

type SidebarProviderProps = React.ComponentProps<"div"> & {
  layout?: SidebarLayout;
  /**
   * Fills its container instead of the viewport. The provider is as tall as
   * the element it sits in, which needs a height of its own, clips what lies
   * outside it and holds the sidebar in it rather than fixed to the screen. Use
   * it for a sidebar in a preview, a panel or a docs example. A shell that
   * fills the viewport, the default, needs nothing.
   */
  contained?: boolean;
  defaultOpen?: boolean;
  mobileBreakpoint?: "md" | "lg";
  keyboardShortcut?: boolean;
  /**
   * The cookie that keeps the desktop state: its name, or `false` for no
   * cookie. The provider writes it on every real change and never reads it;
   * pass its value to `defaultOpen` on the server. Default `sidebar_state`.
   */
  stateCookie?: string | false;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SidebarProvider(
  providerProps: SidebarProviderProps,
): React.ReactElement {
  // Header Navigation passes the internal forceMobile through
  // KitSidebarProvider (sidebar-internal.ts), the same function.
  const {
    layout,
    contained = false,
    defaultOpen = true,
    mobileBreakpoint = "md",
    keyboardShortcut = true,
    stateCookie = SIDEBAR_COOKIE_NAME,
    open: openProp,
    onOpenChange: setOpenProp,
    className,
    style,
    children,
    forceMobile = false,
    ...props
  } = providerProps as KitSidebarProviderProps;
  const viewportMobile = useMediaQuery(`max-${mobileBreakpoint}`);
  const isMobile = forceMobile || viewportMobile;
  const [openMobile, setOpenMobile] = React.useState(false);
  // The second tier on a phone (sidebar-tier.ts).
  const [tierPages, setTierPages] = React.useState(false);
  const [tierList, setTierList] = React.useState<HTMLElement | null>(null);
  const tier = React.useMemo<SidebarTier>(
    () => ({
      list: tierList,
      pages: tierPages,
      setList: setTierList,
      setPages: setTierPages,
    }),
    [tierList, tierPages],
  );
  const generatedId = React.useId();
  const [sidebarId, setSidebarId] = React.useState<string>();
  const controls = React.useMemo<SidebarControls>(
    () => ({ id: sidebarId ?? generatedId, setId: setSidebarId }),
    [generatedId, sidebarId],
  );

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  // An empty name is no cookie either.
  const cookieName = stateCookie || null;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (openProp === undefined) {
        _setOpen(openState);
        // The cookie keeps the sidebar state and records real changes only.
        if (openState !== open && cookieName)
          persistSidebarOpenState(openState, cookieName);
      }
      setOpenProp?.(openState);
    },
    [setOpenProp, openProp, open, cookieName],
  );

  // A controlled state reaches the cookie once its parent has applied it, so
  // a change the parent rejects is never written.
  const persistedOpenProp = React.useRef(openProp);
  React.useEffect(() => {
    if (openProp === persistedOpenProp.current) return;
    persistedOpenProp.current = openProp;
    if (openProp !== undefined && cookieName)
      persistSidebarOpenState(openProp, cookieName);
  }, [openProp, cookieName]);

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    if (!keyboardShortcut) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        event.key !== SIDEBAR_KEYBOARD_SHORTCUT ||
        !(event.metaKey || event.ctrlKey) ||
        // Another handler took the keys, an input method is composing, or a
        // text field or editor has focus: the keys are theirs.
        event.defaultPrevented ||
        event.isComposing ||
        isEditableTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      toggleSidebar();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, keyboardShortcut]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      layout,
      isMobile,
      mobileBreakpoint,
      open,
      openMobile,
      setOpen,
      setOpenMobile,
      state,
      toggleSidebar,
    }),
    [
      layout,
      state,
      open,
      setOpen,
      isMobile,
      mobileBreakpoint,
      openMobile,
      toggleSidebar,
    ],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <SidebarControlsContext.Provider value={controls}>
        <SidebarTierContext.Provider value={tier}>
          <div
            className={cn(
              slotClass("sidebar-wrapper", props),
              "group/sidebar-wrapper flex w-full bg-[var(--sp-rw-bg-base)] text-[var(--sp-rw-fg-primary)]",
              // A contained provider is the height of its container and holds
              // the sidebar in itself (the container below turns absolute).
              contained
                ? "relative isolate h-full min-h-0 overflow-clip"
                : "min-h-svh",
              className,
            )}
            data-contained={contained ? "" : undefined}
            data-layout={layout}
            data-slot="sidebar-wrapper"
            data-state={state}
            // The widths are the stylesheet's (design-rework.css, "Sidebar"),
            // so a policy that blocks style attributes keeps them; an app's style
            // still overrides them.
            style={style}
            {...props}
          >
            {children}
          </div>
        </SidebarTierContext.Provider>
      </SidebarControlsContext.Provider>
    </SidebarContext.Provider>
  );
}

/**
 * Keeps the page in place while a mobile sheet under a bar is open. That sheet
 * is no modal dialog, so the button in the bar stays in reach, and Base UI
 * locks the scroll of modal dialogs only; the bar's sheet locks it as they do:
 * the root takes `overflow: hidden`, and a page that shows a scrollbar beside
 * its content keeps its gutter, so nothing moves.
 */
function useDocumentScrollLock(locked: boolean): void {
  React.useEffect(() => {
    if (!locked || typeof document === "undefined") return;
    const root = document.documentElement;
    const { overflow, scrollbarGutter } = root.style;
    if (window.innerWidth > root.clientWidth)
      root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = overflow;
      root.style.scrollbarGutter = scrollbarGutter;
    };
  }, [locked]);
}

type SidebarProps = React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  mobileVariant?: "default" | "fullscreen";
  collapsible?: SidebarCollapsible;
  /**
   * The name of the close button of the sheet the sidebar is below its
   * breakpoint, "Close sidebar" by default.
   */
  closeLabel?: string;
};

export function Sidebar(sidebarProps: SidebarProps): React.ReactElement {
  // Header Navigation passes the internal mobileBar through KitSidebar
  // (sidebar-internal.ts), the same function.
  const {
    side = "left",
    variant = "sidebar",
    mobileVariant = "default",
    collapsible = "offcanvas",
    id: idProp,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    className,
    style,
    children,
    closeLabel: closeLabelProp,
    mobileBar,
    ...props
  } = sidebarProps as KitSidebarProps;
  const messages = useSiteplaneMessages("sidebar");
  const closeLabel = closeLabelProp ?? messages.close;
  const {
    layout,
    isMobile,
    mobileBreakpoint,
    state,
    openMobile,
    setOpenMobile,
  } = useSidebar();
  useDocumentScrollLock(Boolean(mobileBar) && isMobile && openMobile);
  const controls = React.useContext(SidebarControlsContext);
  const setControlsId = controls?.setId;
  // A consumer's id names the sidebar for the triggers' aria-controls.
  React.useEffect(() => {
    if (idProp === undefined || !setControlsId) return;
    setControlsId(idProp);
    return () => setControlsId(undefined);
  }, [idProp, setControlsId]);
  const id = idProp ?? controls?.id;
  // The landmark (desktop) or the dialog (mobile) carries the name. Only the
  // attributes the consumer sets are passed on: an undefined aria-labelledby
  // would replace the one the sheet's title gives its dialog.
  const labelProps = {
    ...(ariaDescribedBy === undefined
      ? null
      : { "aria-describedby": ariaDescribedBy }),
    ...(ariaLabelledBy === undefined
      ? null
      : { "aria-labelledby": ariaLabelledBy }),
    id,
  };
  // The sidebar sits flat on the page background in every layout: no frame,
  // border or shadow of its own. The main surface carries the edge.
  const layoutClassName = cn(
    layout && "ps-2",
    layout === "push" && "z-20 bg-[var(--sp-rw-bg-base)]",
  );
  // The sidebar's own tooltips open at once; tooltips elsewhere in the app keep
  // their provider's delay.
  const content = (
    <TooltipProvider delay={0}>
      <SidebarCollapsibleContext.Provider value={collapsible}>
        {children}
      </SidebarCollapsibleContext.Provider>
    </TooltipProvider>
  );

  if (collapsible === "none") {
    return (
      <div
        aria-label={ariaLabel}
        className={cn(
          slotClass("sidebar", props),
          "flex h-full w-(--sidebar-width) flex-col bg-[var(--sp-rw-bg-base)] text-[var(--sp-rw-fg-primary)]",
          layoutClassName,
          className,
        )}
        data-slot="sidebar"
        style={style}
        {...labelProps}
        {...props}
      >
        <SidebarGutterContext.Provider value={Boolean(layout)}>
          {content}
        </SidebarGutterContext.Provider>
      </div>
    );
  }

  if (isMobile) {
    // Every prop reaches the sheet popup, the element the sidebar is on a
    // small screen; aria-label becomes the dialog's title. Under a bar (Header
    // Navigation's fullscreen menu) the sheet starts at the bar's bottom edge
    // and the bar's button is its trigger: it stays in view and in reach above
    // the sheet, opens it and closes it, so the sheet is no modal dialog,
    // which would hide the bar from assistive technology and keep the keyboard
    // out of it. It keeps the page in place while it is open (above).
    return (
      <Sheet
        modal={mobileBar ? false : undefined}
        onOpenChange={setOpenMobile}
        open={openMobile}
      >
        {mobileBar ? (
          <SheetPrimitive.Trigger render={mobileBar.trigger} />
        ) : null}
        <KitSheetPopup
          belowOffset={Boolean(mobileBar)}
          className={className}
          data-mobile="true"
          data-sidebar="sidebar"
          data-slot="sidebar"
          {...(mobileBar
            ? {
                portalProps: {
                  style: {
                    "--sheet-offset-top": mobileBar.offset,
                  } as React.CSSProperties,
                },
              }
            : null)}
          profile="sidebar"
          showCloseButton={false}
          side={mobileVariant === "fullscreen" ? "top" : side}
          variant={mobileVariant}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              ...style,
            } as React.CSSProperties
          }
          {...labelProps}
          {...props}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{ariaLabel ?? messages.title}</SheetTitle>
          </SheetHeader>
          <SidebarGutterContext.Provider value={Boolean(layout)}>
            <div
              className={cn("flex h-full w-full flex-col", layout && "ps-2")}
            >
              {mobileBar ? null : (
                // The sheet's close (Lukas, 3 November 2026): the CloseButton
                // at md, the 40 px of the menu button that opens the sheet,
                // at the end of the sheet's first row, 16 px from its edge.
                // It comes first in the sheet, so it is the first stop of the
                // Tab key. The row is the phone bar's height; the band that
                // follows it, the brand's, moves up into it and keeps clear
                // of the button (design-rework.css, "The Sidebar's sheet on a
                // phone"), and a sheet without such a band keeps the row for
                // the button. Under a bar the bar's button closes the sheet.
                <div
                  className="sp-sidebar-close-row flex min-h-(--sp-rw-phone-bar-height) shrink-0 items-center justify-end pe-4"
                  data-sidebar="close-row"
                  data-slot="sidebar-close-row"
                >
                  <SheetClose
                    data-sidebar="close"
                    data-slot="sidebar-close"
                    render={<CloseButton label={closeLabel} size="md" />}
                  />
                </div>
              )}
              {content}
            </div>
          </SidebarGutterContext.Provider>
        </KitSheetPopup>
      </Sheet>
    );
  }

  // The desktop sidebar is a complementary landmark, so its navigation, account
  // controls and header content stay within a landmark region. The landmark
  // takes the id and the name; className, style and the other props stay on
  // the sidebar container they always styled.
  return (
    <aside
      aria-label={ariaLabel}
      className={cn(
        "sp-sidebar",
        "group peer hidden text-[var(--sp-rw-fg-primary)]",
        mobileBreakpoint === "lg" ? "lg:block" : "md:block",
      )}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-side={side}
      data-slot="sidebar"
      data-state={state}
      data-variant={variant}
      {...labelProps}
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        className={cn(
          "sp-sidebar-gap",
          "relative w-[var(--sidebar-gap-width,var(--sidebar-width))] bg-transparent transition-[width] duration-(--motion-duration-base) ease-(--motion-ease-linear)",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
        data-slot="sidebar-gap"
      />
      {/* A collapsed offcanvas sidebar leaves the tab order and the
          accessibility tree once it has slid out (visibility switches at the
          end of the slide and at its start when it opens). The rail stays
          visible to open it again. The side is the inline start or end, so
          a right-to-left page puts a left sidebar on the right, where its gap
          is. */}
      <div
        className={cn(
          slotClass("sidebar-container", props),
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width,visibility] duration-(--motion-duration-base) ease-(--motion-ease-linear) group-data-[contained]/sidebar-wrapper:absolute group-data-[contained]/sidebar-wrapper:h-full",
          mobileBreakpoint === "lg" ? "lg:flex" : "md:flex",
          side === "left"
            ? "start-0 group-data-[collapsible=offcanvas]:start-[calc(var(--sidebar-width)*-1)]"
            : "end-0 group-data-[collapsible=offcanvas]:end-[calc(var(--sidebar-width)*-1)]",
          "group-data-[collapsible=offcanvas]:invisible",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          layoutClassName,
          className,
        )}
        data-layout={layout}
        data-slot="sidebar-container"
        style={style}
        {...props}
      >
        <div
          className="sp-sidebar-inner flex h-full w-full flex-col bg-transparent group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:bg-[var(--sp-rw-bg-primary)] group-data-[variant=floating]:shadow-[var(--sp-rw-surface-xs-shadow)]"
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
        >
          <SidebarGutterContext.Provider
            value={Boolean(layout) && variant === "sidebar"}
          >
            {content}
          </SidebarGutterContext.Provider>
        </div>
      </div>
    </aside>
  );
}

// The state a trigger announces: the desktop expansion, or on a small screen
// whether the sheet is open. aria-controls names the sidebar while it exists.
function useSidebarTriggerState(): {
  "aria-controls": string | undefined;
  "aria-expanded": boolean;
} {
  const { isMobile, open, openMobile } = useSidebar();
  const controls = React.useContext(SidebarControlsContext);
  const expanded = isMobile ? openMobile : open;

  return {
    "aria-controls": isMobile && !openMobile ? undefined : controls?.id,
    "aria-expanded": expanded,
  };
}

export function SidebarTrigger({
  children,
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>): React.ReactElement | null {
  const messages = useSiteplaneMessages("sidebar");
  const { isMobile, mobileBreakpoint, toggleSidebar } = useSidebar();
  const triggerState = useSidebarTriggerState();
  // Below the mobile breakpoint a trigger outside the sidebar opens its sheet:
  // it is the menu button of a phone's bar, the 40 px icon Button with the
  // 20 px hamburger (Phosphor's List) that Header Navigation's menu button has
  // too (Lukas, 3 November 2026). The stylesheet makes the switch at the
  // breakpoint the trigger names (data-menu-button, design-rework.css), so
  // the hamburger shows from the first paint, before a server-rendered page
  // hydrates, and the size an application gives the trigger stays the desktop
  // toggle's. Inside the sidebar it is the compact action with the panel
  // glyph.
  const collapsible = React.useContext(SidebarCollapsibleContext);
  const insideSidebar = collapsible !== null;
  const menuButton = insideSidebar ? undefined : mobileBreakpoint;
  // In the sheet a collapsible sidebar is on a phone, the sheet's own close
  // stands in the first row, so a collapse button inside the sidebar stays
  // out: the sheet has one close (Lukas, 3 November 2026).
  if (insideSidebar && collapsible !== "none" && isMobile) return null;

  return (
    <KitButton
      {...triggerState}
      className={className}
      data-menu-button={menuButton}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        // The mobile sheet has no trigger of its own, so on close Base UI
        // returns focus to the element that had it before the sheet opened.
        // Safari focuses no button it presses; the trigger takes focus itself,
        // without the keyboard ring, so closing returns focus to it there too.
        const trigger = event.currentTarget;
        if (trigger.ownerDocument.activeElement !== trigger)
          trigger.focus({
            focusVisible: false,
            preventScroll: true,
          } as FocusOptions);
        toggleSidebar();
      }}
      profile="compact-icon-action"
      shape="square"
      variant="ghost"
      {...props}
    >
      {children ?? (
        <>
          {/* The panel glyph shows the sidebar at the inline start, so it
              mirrors in a right-to-left page. */}
          <SidebarSimpleIcon
            aria-hidden="true"
            className="sp-sidebar-trigger-panel rtl:-scale-x-100"
          />
          {menuButton ? (
            <ListIcon aria-hidden="true" className="sp-sidebar-trigger-menu" />
          ) : null}
          <span className="sr-only">{messages.toggle}</span>
        </>
      )}
    </KitButton>
  );
}

export function SidebarRail({
  className,
  resizable = false,
  onClick,
  onPointerDown,
  ...props
}: React.ComponentProps<typeof Button> & {
  resizable?: boolean;
}): React.ReactElement {
  const messages = useSiteplaneMessages("sidebar");
  const { state, toggleSidebar } = useSidebar();
  const triggerState = useSidebarTriggerState();
  const didDragRef = React.useRef(false);
  // Ends a resize drag: restores the page's cursor and text selection.
  const endDragRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => () => endDragRef.current?.(), []);

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    onPointerDown?.(event);
    // A new press starts fresh: only a drag in this press may swallow its
    // click.
    didDragRef.current = false;
    if (event.button !== 0 || !resizable || state !== "expanded") {
      return;
    }

    const sidebar = event.currentTarget.closest<HTMLElement>(
      '[data-slot="sidebar"]',
    );
    const sidebarContainer = sidebar?.querySelector<HTMLElement>(
      '[data-slot="sidebar-container"]',
    );
    const sidebarWrapper = event.currentTarget.closest<HTMLElement>(
      '[data-slot="sidebar-wrapper"]',
    );

    if (!sidebar || !sidebarContainer || !sidebarWrapper) {
      return;
    }

    const wrapper = sidebarWrapper;
    // The side is the inline start or end: in a right-to-left page a left
    // sidebar sits on the right, so its edge moves the other way.
    const rightToLeft = getComputedStyle(sidebar).direction === "rtl";
    const onPhysicalRight =
      (sidebar.dataset.side ?? "left") === "right" ? !rightToLeft : rightToLeft;
    const startX = event.clientX;
    const startWidth = sidebarContainer.getBoundingClientRect().width;
    const minWidth = getSidebarLengthInPixels(
      wrapper,
      "--sidebar-width-min",
      192,
    );
    const maxWidth = getSidebarLengthInPixels(
      wrapper,
      "--sidebar-width-max",
      384,
    );
    // A drag that never saw its release ends before the next one starts.
    endDragRef.current?.();
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    didDragRef.current = false;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(moveEvent: PointerEvent): void {
      const delta = onPhysicalRight
        ? startX - moveEvent.clientX
        : moveEvent.clientX - startX;

      if (Math.abs(delta) > 3) {
        didDragRef.current = true;
      }

      const nextWidth = Math.min(
        maxWidth,
        Math.max(minWidth, startWidth + delta),
      );

      wrapper.style.setProperty(
        "--sidebar-width",
        `${Math.round(nextWidth)}px`,
      );
    }

    // A release, a cancelled touch drag or an unmount ends the drag. Only a
    // release is followed by the click that the drag must not turn into a
    // toggle.
    function endDrag(endEvent?: PointerEvent): void {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      endDragRef.current = null;
      if (endEvent?.type !== "pointerup") didDragRef.current = false;
    }

    endDragRef.current = endDrag;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }

  // Supplied handlers run first; the rail still toggles and resizes.
  return (
    <KitButton
      {...triggerState}
      aria-label={messages.toggle}
      // An 8 px strip along the whole edge, on its outer side: it leaves the
      // sidebar's own scrollbar free and reaches as little as it can into the
      // content beside it. A collapsed offcanvas sidebar keeps it at the
      // screen edge. The edge is the sidebar's inline end, or its start for a
      // right sidebar, in either direction.
      className={cn(
        "absolute inset-y-0 z-20 hidden w-2 group-data-[side=left]:start-full group-data-[side=right]:end-full sm:flex",
        "group-data-[collapsible=offcanvas]:visible",
        className,
      )}
      data-resizable={resizable ? "" : undefined}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (didDragRef.current) {
          event.preventDefault();
          didDragRef.current = false;
          return;
        }

        toggleSidebar();
      }}
      onPointerDown={handlePointerDown}
      profile="sidebar-rail"
      tabIndex={-1}
      title={resizable ? messages.resize : undefined}
      variant="link"
      {...props}
    />
  );
}

// The content's desktop surface starts where the desktop sidebar does, at the
// provider's mobile breakpoint, so it never frames itself beside a sidebar that
// is still a sheet. From there SidebarInset is the primary surface beside the
// sidebar on the page canvas, with a layout or without one, so the two never
// share one grey (rulebook B1). Sidebar `variant="inset"` and `layout="inset"`
// frame that surface. Tailwind needs every class spelled out, hence one set
// per breakpoint.
const sidebarInsetClassNames = {
  lg: {
    inset:
      "lg:m-2 lg:ms-0 lg:rounded-2xl lg:shadow-[var(--sp-rw-surface-sm-shadow)]",
    push: "lg:peer-data-[state=expanded]:[--sidebar-content-offset:calc(var(--sidebar-width)-var(--sidebar-width-icon))]",
    surface: "lg:bg-[var(--sp-rw-bg-primary)]",
    variantInset:
      "lg:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-2 lg:peer-data-[variant=inset]:m-2 lg:peer-data-[variant=inset]:ms-0 lg:peer-data-[variant=inset]:rounded-2xl lg:peer-data-[variant=inset]:shadow-[var(--sp-rw-surface-sm-shadow)]",
  },
  md: {
    inset:
      "md:m-2 md:ms-0 md:rounded-2xl md:shadow-[var(--sp-rw-surface-sm-shadow)]",
    push: "md:peer-data-[state=expanded]:[--sidebar-content-offset:calc(var(--sidebar-width)-var(--sidebar-width-icon))]",
    surface: "md:bg-[var(--sp-rw-bg-primary)]",
    variantInset:
      "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-2 md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ms-0 md:peer-data-[variant=inset]:rounded-2xl md:peer-data-[variant=inset]:shadow-[var(--sp-rw-surface-sm-shadow)]",
  },
} as const;

// In the push layout the expanded Sidebar lies over the content surface, which
// starts beside the icon rail. SidebarInset moves its content clear of it by
// --sidebar-content-offset, the expanded width beyond the rail (0 when the
// sidebar is collapsed or a sheet), and moves it with the Sidebar's own pace
// (design-rework.css, [data-slot="sidebar-inset"][data-layout="push"]). Its
// children keep their own padding and need no offset or motion code.
export function SidebarInset({
  className,
  ...props
}: React.ComponentProps<"main">): React.ReactElement {
  const { layout, mobileBreakpoint } = useSidebar();
  const desktop = sidebarInsetClassNames[mobileBreakpoint];
  return (
    <main
      className={cn(
        slotClass("sidebar-inset", props),
        "relative flex w-full flex-1 flex-col bg-background",
        desktop.surface,
        desktop.variantInset,
        layout &&
          "min-w-0 overflow-hidden bg-transparent [--sidebar-content-offset:0px]",
        layout === "push" && desktop.push,
        layout === "inset" && desktop.inset,
        className,
      )}
      data-layout={layout}
      data-slot="sidebar-inset"
      {...props}
    />
  );
}

export function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>): React.ReactElement {
  return (
    <KitInput
      className={className}
      data-sidebar="input"
      data-slot="sidebar-input"
      profile="sidebar"
      {...props}
    />
  );
}

// Header and footer are bands with the same 8px above and below (S2). On the
// collapsed icon rail their items keep the inset they have in the expanded
// sidebar, as the rows do, so nothing moves while the width animates: the rail
// is a clipped view with fixed insets. A 36px item,
// such as the brand's square or a row, stands on the rail's centre axis. The
// items never grow wider than the rail.
const sidebarBandRailClassName = "group-data-[collapsible=icon]:*:max-w-full";

export function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const leadingGutter = React.useContext(SidebarGutterContext);
  // In the pages of a second tier on a phone the item's row stands for the
  // panel's bands, so its header and footer stay out (sidebar-tier.ts).
  const subTier = React.useContext(SidebarSubTierContext);
  if (subTier) return <></>;

  return (
    <div
      className={cn(
        slotClass("sidebar-header", props),
        "flex flex-col gap-2 p-2",
        sidebarBandRailClassName,
        leadingGutter && "ps-0",
        className,
      )}
      data-sidebar="header"
      data-slot="sidebar-header"
      {...props}
    />
  );
}

/**
 * The application's logo at the top of the sidebar: its mark first, then its
 * name or wordmark. It starts where the menu rows start their icons, and the
 * header band around it keeps the top bar's height. On the collapsed icon
 * rail it shows only the mark, in the rail's square like the row icons: the
 * mark keeps its place while the name fades out with the rail's width, as the
 * row labels do. Render it as a link with `render`, such as
 * `render={<a href="/" />}`: it takes the kit's focus outline and, as a logo
 * rather than a row, no hover fill. In a SidebarMenuItem with `expandTrigger`,
 * its mark also expands the collapsed rail.
 */
export function SidebarBrand({
  className,
  children,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  // On the collapsed rail an expand trigger can stand in for the brand, as it
  // does for a menu button.
  const stepsAside = React.useContext(SidebarMenuItemContext);
  // A plain-text name gets a span of its own, so a long one ends with an
  // ellipsis, keeps its full text in title (K5) and leaves the rail whole.
  const content = React.Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span title={String(child)}>{child}</span>
    ) : (
      child
    ),
  );
  const defaultProps = {
    children: content,
    className: cn(
      slotClass("sidebar-brand", props, render),
      focusRingRecipe(),
      className,
    ),
    "data-sidebar": "brand",
    "data-slot": "sidebar-brand",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps(
      defaultProps,
      props,
      stepsAside ? { "aria-hidden": true, tabIndex: -1 } : {},
    ),
    render,
  });
}

export function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const leadingGutter = React.useContext(SidebarGutterContext);
  const subTier = React.useContext(SidebarSubTierContext);
  if (subTier) return <></>;

  return (
    <div
      className={cn(
        slotClass("sidebar-footer", props),
        "flex flex-col gap-4 p-2",
        sidebarBandRailClassName,
        leadingGutter && "ps-0",
        className,
      )}
      data-sidebar="footer"
      data-slot="sidebar-footer"
      {...props}
    />
  );
}

export function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>): React.ReactElement {
  // The sub rows of a second tier on a phone stand on one guide line.
  const subTier = React.useContext(SidebarSubTierContext);
  if (subTier) return <></>;
  return (
    // The line is the kit separator's (data-slot="separator"), like every
    // other divider; the Sidebar adds only its inset. design-rework.css keeps
    // the line inside that inset, where the separator's own width of 100 %
    // ran 8 px past the sidebar.
    <Separator
      className={cn("mx-2", className)}
      data-sidebar="separator"
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  // A layout reserves a leading gutter on the sidebar. Only then may the scroll
  // viewport borrow part of it; without one the viewport must stay inside the
  // sidebar instead of reaching past its edge.
  const hasLayoutGutter = Boolean(React.useContext(SidebarContext)?.layout);
  // The pages of a second tier on a phone scroll with the sheet, in the list
  // under their item: no scroll area or wrapper of their own.
  const subTier = React.useContext(SidebarSubTierContext);
  if (subTier) return <>{props.children}</>;

  return (
    <ScrollArea
      className={cn(
        "-my-[calc(var(--sp-semantic-state-focus-width)+var(--sp-semantic-state-focus-offset))] min-h-0 w-auto flex-1",
        hasLayoutGutter &&
          "-ms-[calc(var(--sp-semantic-state-focus-width)+var(--sp-semantic-state-focus-offset))]",
      )}
      fill
      scrollFade
    >
      {/* With a layout gutter, extend into it and restore content alignment.
          Groups/content already own the trailing inset; keep the scrollbar
          inside that edge. Block insets protect the first and last outline.
          The wrapper grows with its content (min-h-full, not h-full), so the
          trailing block inset stays part of the scroll extent: the last row
          never ends flush with, or under, the footer band. */}
      <div
        className={cn(
          "flex min-h-full flex-col py-[calc(var(--sp-semantic-state-focus-width)+var(--sp-semantic-state-focus-offset))]",
          hasLayoutGutter &&
            "ps-[calc(var(--sp-semantic-state-focus-width)+var(--sp-semantic-state-focus-offset))]",
        )}
      >
        {/* Groups keep their 8px block padding, so two groups sit 16px
            apart, like the groups of the footer, without a gap of their
            own. */}
        <div
          className={cn(
            slotClass("sidebar-content", props),
            "flex flex-1 flex-col",
            className,
          )}
          data-sidebar="content"
          data-slot="sidebar-content"
          {...props}
        />
      </div>
    </ScrollArea>
  );
}

export function SidebarGroup({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const leadingGutter = React.useContext(SidebarGutterContext);
  const subTier = React.useContext(SidebarSubTierContext);
  if (subTier) return <>{props.children}</>;

  return (
    <div
      className={cn(
        slotClass("sidebar-group", props),
        "relative flex w-full min-w-0 flex-col p-2",
        leadingGutter && "ps-0",
        className,
      )}
      data-sidebar="group"
      data-slot="sidebar-group"
      {...props}
    />
  );
}

export function SidebarGroupLabel({
  className,
  render,
  children,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  // Rendered as a button, the label takes the kit focus outline (T3). On the
  // collapsed icon rail it fades out and keeps its row, so the groups stay
  // apart and every icon keeps the place it has in the expanded sidebar.
  // Rendered as a disabled button, such as a CollapsibleTrigger whose group
  // cannot fold, it fades as a disabled label does (T1); Base UI keeps such a
  // trigger focusable with aria-disabled. The rail's fade-out still wins.
  // A plain-text label gets a span of its own, so a long one ends with an
  // ellipsis instead of being cut off, with its full text in title (K5).
  // Its text is the role of every group label of the kit, 12/18 at the label
  // weight in the tertiary colour (the group-label block of
  // design-rework.css); the label keeps its 32 px row.
  const text = plainText(children);
  const label =
    text === undefined ? (
      children
    ) : (
      <span className="truncate" title={text}>
        {children}
      </span>
    );
  const defaultProps = {
    children: label,
    className: cn(
      slotClass("sidebar-group-label", props, render),
      focusRingRecipe(),
      "flex h-8 shrink-0 items-center overflow-hidden whitespace-nowrap rounded-lg px-2 transition-opacity duration-(--motion-duration-base) ease-(--motion-ease-linear) [&>svg]:size-4 [&>svg]:shrink-0",
      "group-data-[collapsible=icon]:opacity-0",
      "not-group-data-[collapsible=icon]:disabled:opacity-(--sp-rw-disabled-opacity-action) not-group-data-[collapsible=icon]:aria-disabled:opacity-(--sp-rw-disabled-opacity-action)",
      className,
    ),
    "data-sidebar": "group-label",
    "data-slot": "sidebar-group-label",
  };

  const element = useRender({
    defaultTagName: "div",
    props: mergeProps(defaultProps, props),
    render,
  });
  // The pages of a second tier on a phone stand under their item, whose row
  // names them.
  const subTier = React.useContext(SidebarSubTierContext);
  return subTier ? <></> : element;
}

export function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button">): React.ReactElement {
  return (
    // The 24px target of the control scale (S1), centred where the 20px one
    // was: on the 32px label row, at its inline end.
    <KitButton
      className={cn(
        "absolute end-2.5 top-3",
        "group-data-[collapsible=icon]:hidden",
        dropSlotClass(className, props),
      )}
      data-sidebar="group-action"
      profile="compact-icon-action"
      render={render}
      size="icon-2xs"
      variant="link"
      {...props}
      // It keeps its own slot when a trigger renders it, as the menu action
      // does.
      data-slot="sidebar-group-action"
    />
  );
}

export function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const subTier = React.useContext(SidebarSubTierContext);
  if (subTier) return <>{props.children}</>;
  return (
    <div
      className={cn(
        slotClass("sidebar-group-content", props),
        "w-full text-sm",
        className,
      )}
      data-sidebar="group-content"
      data-slot="sidebar-group-content"
      {...props}
    />
  );
}

export function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<"ul">): React.ReactElement {
  // The pages of a second tier on a phone render into the sub list of their
  // item, so their rows join it.
  const subTier = React.useContext(SidebarSubTierContext);
  if (subTier) return <>{props.children}</>;
  return (
    <ul
      className={cn(
        slotClass("sidebar-menu", props),
        // Rows stand 2 px apart (design-rework.css gives a row's icon 8 px).
        "flex w-full min-w-0 flex-col gap-0.5",
        className,
      )}
      data-sidebar="menu"
      data-slot="sidebar-menu"
      {...props}
    />
  );
}

export function SidebarMenuItem({
  className,
  children,
  expandTrigger = false,
  expandLabel: expandLabelProp,
  ...props
}: React.ComponentProps<"li"> & {
  /**
   * Places the kit's SidebarTrigger over the item's row. On the collapsed icon
   * rail, hovering or focusing the item swaps the row for the trigger, so the
   * row (a workspace mark, for example) is also the way to expand. A
   * SidebarBrand in the item steps aside for the trigger in the same way.
   */
  expandTrigger?: boolean;
  /** The accessible name of the expand trigger. */
  expandLabel?: string;
}): React.ReactElement {
  const messages = useSiteplaneMessages("sidebar");
  const expandLabel = expandLabelProp ?? messages.expand;
  const sidebar = React.useContext(SidebarContext);
  const collapsible = React.useContext(SidebarCollapsibleContext);
  const tier = React.useContext(SidebarTierContext);
  const subTier = React.useContext(SidebarSubTierContext);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  // On the collapsed desktop icon rail the row steps aside for the trigger:
  // the trigger joins the tab order and the row leaves it.
  const stepsAside =
    expandTrigger &&
    collapsible === "icon" &&
    sidebar?.state === "collapsed" &&
    !sidebar.isMobile;

  // Expanding hides the trigger. If it held focus, focus moves to the row or
  // the brand it stood in for instead of staying on a hidden control.
  const steppedAside = React.useRef(stepsAside);
  React.useEffect(() => {
    const trigger = triggerRef.current;
    if (
      steppedAside.current &&
      !stepsAside &&
      trigger &&
      trigger.ownerDocument.activeElement === trigger
    ) {
      trigger.parentElement
        ?.querySelector<HTMLElement>(
          ':scope > :is([data-sidebar="menu-button"], [data-sidebar="brand"])',
        )
        ?.focus();
    }
    steppedAside.current = stepsAside;
  }, [stepsAside]);

  // A row of the second tier's pages on a phone is a sub row.
  if (subTier) {
    return (
      <SidebarMenuSubItem className={className} {...props}>
        {children}
      </SidebarMenuSubItem>
    );
  }

  // On a phone the current item of the sheet, the one whose row is `active`,
  // holds the pages of a SidebarSecondary: they stand under its row as its sub
  // rows, open, and its row folds them with its caret, as an expandable row
  // does (Lukas, 3 November 2026; the panel rendered nothing on a phone).
  const setList = tier?.setList;
  const holdsPages = Boolean(
    sidebar?.isMobile &&
    collapsible !== null &&
    tier?.pages &&
    setList &&
    holdsCurrentRow(children),
  );
  const itemProps = {
    className: cn(
      slotClass("sidebar-menu-item", props),
      "group/menu-item relative",
      className,
    ),
    "data-expand-trigger": expandTrigger ? "" : undefined,
    "data-sidebar": "menu-item",
    "data-slot": "sidebar-menu-item",
    ...props,
  };
  const content = (
    <>
      <SidebarMenuItemContext.Provider value={stepsAside}>
        <SidebarMenuPagesContext.Provider value={holdsPages}>
          {children}
        </SidebarMenuPagesContext.Provider>
      </SidebarMenuItemContext.Provider>
      {holdsPages && setList ? (
        // Kept mounted while folded, so the pages are in place when the
        // panel opens and measures its height.
        <CollapsiblePanel keepMounted>
          <SidebarMenuSub ref={setList} />
        </CollapsiblePanel>
      ) : null}
      {expandTrigger ? (
        // design-rework.css owns the swap, its motion and reduced motion.
        <SidebarTrigger
          aria-hidden={stepsAside ? undefined : true}
          aria-label={expandLabel}
          className="absolute inset-0"
          data-sidebar="expand-trigger"
          ref={triggerRef}
          tabIndex={stepsAside ? undefined : -1}
        />
      ) : null}
    </>
  );

  return holdsPages ? (
    <Collapsible defaultOpen render={<li {...itemProps} />}>
      {content}
    </Collapsible>
  ) : (
    <li {...itemProps}>{content}</li>
  );
}

/** Whether an item's own row, a SidebarMenuButton among its children, is current. */
function holdsCurrentRow(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child) || child.type !== SidebarMenuButton)
      return false;
    const props = child.props as {
      active?: boolean;
      "aria-current"?: React.AriaAttributes["aria-current"];
    };
    return Boolean(props.active) || isCurrent(props["aria-current"]);
  });
}

export function SidebarMenuButton({
  "aria-current": ariaCurrent,
  active = false,
  variant = "default",
  size,
  tooltip,
  className,
  render,
  children,
  ...props
}: useRender.ComponentProps<"button"> & {
  /** Marks the current destination: `aria-current="page"` and the current fill. */
  active?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipPopup>;
  size?: SidebarMenuButtonSize;
  variant?: SidebarMenuButtonVariant;
}): React.ReactElement {
  const { isMobile, state } = useSidebar();
  const resolvedSize = useResolvedControlSize(size);
  // The row of an item whose expand trigger stands in for it on the rail.
  const stepsAside = React.useContext(SidebarMenuItemContext);
  // A page of the second tier on a phone is a sub row (sidebar-tier.ts).
  const subTier = React.useContext(SidebarSubTierContext);
  // The row of the item that holds those pages folds them, as the trigger of
  // a Collapsible with the caret at its end: a button, also where the row is
  // a link elsewhere, since its pages are the destinations there.
  const pagesTrigger = React.useContext(SidebarMenuPagesContext);

  if (subTier) {
    return (
      <SidebarMenuSubButton
        active={active}
        aria-current={ariaCurrent}
        className={className}
        {...(render ? { render } : null)}
        {...(size ? { size } : null)}
        {...props}
      >
        {children}
      </SidebarMenuSubButton>
    );
  }

  const buttonElement = (
    <KitButton
      align="start"
      aria-current={ariaCurrent ?? (active ? "page" : undefined)}
      // A menu action or badge at the end of the row keeps the label clear of
      // it; the row's padding rule reads the end inset (design-rework.css). A
      // badge counts as the row's own only as a child of its item: one in a
      // sub row belongs to that row.
      className={cn(
        "group/item peer/menu-button group-has-data-[sidebar=menu-action]/menu-item:[--sp-rw-navigation-row-padding-end:--spacing(10)] group-has-[>[data-sidebar=menu-badge]]/menu-item:[--sp-rw-navigation-row-padding-end:--spacing(10)]",
        // As the trigger of the pages it carries the trigger's class, as a
        // row rendered by a CollapsibleTrigger does, so its caret turns.
        pagesTrigger && "sp-collapsible-trigger",
        className,
      )}
      // A current row shows the current fill, whether active or
      // aria-current marks it (T5).
      data-active={active || isCurrent(ariaCurrent)}
      data-sidebar="menu-button"
      data-sidebar-variant={variant}
      data-slot="sidebar-menu-button"
      profile="navigation-row"
      render={pagesTrigger ? undefined : render}
      size={resolvedSize}
      variant={variant === "outline" ? "outline" : "ghost"}
      width="full"
      {...props}
      {...(stepsAside ? { "aria-hidden": true, tabIndex: -1 } : null)}
      // The row keeps its profile when a trigger renders it, such as a
      // CollapsibleTrigger that stamps its own profile on what it renders.
      data-profile="navigation-row"
    >
      {children}
      {pagesTrigger ? <SidebarMenuChevron /> : null}
    </KitButton>
  );

  if (pagesTrigger) {
    return <CollapsibleTrigger render={buttonElement} />;
  }

  if (!tooltip) {
    return buttonElement;
  }

  const tooltipProps: React.ComponentProps<typeof TooltipPopup> =
    typeof tooltip === "string" ? { children: tooltip } : tooltip;

  // The tooltip wrapper stays mounted while the sidebar collapses or expands,
  // so the button keeps focus; the tooltip only opens on the collapsed rail,
  // beside it at its inline end, toward the content in either direction.
  return (
    <Tooltip disabled={state !== "collapsed" || isMobile}>
      <TooltipTrigger
        delay={0}
        render={buttonElement as React.ReactElement<Record<string, unknown>>}
      />
      <TooltipPopup align="center" side="inline-end" {...tooltipProps} />
    </Tooltip>
  );
}

/**
 * The text of a two-line menu row: a title over a quieter description, such as
 * an account's name and email or a workspace's name and plan. Place it in a
 * SidebarMenuButton after the row's icon or avatar; it takes the row's free
 * width, so a trailing chevron stays at the row's end.
 */
export function SidebarMenuButtonText({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      className={cn(slotClass("sidebar-menu-button-text", props), className)}
      data-sidebar="menu-button-text"
      data-slot="sidebar-menu-button-text"
      {...props}
    />
  );
}

/**
 * The first line of a two-line menu row, in the row's own text. A long title
 * ends with an ellipsis; plain text keeps its full value in `title` (K5).
 */
export function SidebarMenuButtonTitle({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      className={cn(slotClass("sidebar-menu-button-title", props), className)}
      data-sidebar="menu-button-title"
      data-slot="sidebar-menu-button-title"
      title={title ?? plainText(children)}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * The second line of a two-line menu row: one kit text step smaller than the
 * row, in the tertiary text colour. A long description ends with an ellipsis;
 * plain text keeps its full value in `title` (K5).
 */
export function SidebarMenuButtonDescription({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      className={cn(
        slotClass("sidebar-menu-button-description", props),
        className,
      )}
      data-sidebar="menu-button-description"
      data-slot="sidebar-menu-button-description"
      title={title ?? plainText(children)}
      {...props}
    >
      {children}
    </span>
  );
}

/** The text of children made of strings and numbers only, such as `Invoice {id}`. */
function plainText(children: React.ReactNode): string | undefined {
  const parts = React.Children.toArray(children);
  const text = parts.every(
    (part) => typeof part === "string" || typeof part === "number",
  )
    ? parts.join("")
    : "";
  return text === "" ? undefined : text;
}

export function SidebarMenuAction({
  className,
  showOnHover = false,
  render,
  ...props
}: useRender.ComponentProps<"button"> & {
  showOnHover?: boolean;
}): React.ReactElement {
  return (
    // The kit's bare action (rulebook T2): Button's muted inline action owns
    // its colours at rest, on hover, on keyboard focus and while its menu is
    // open, and draws no fill in any state. As a square one it keeps the
    // square of its size as the pointer target and draws the focus outline
    // around the glyph (T3).
    <Button
      className={cn(
        // Centred on the row of its menu button at every row size, whatever
        // its own size (S1): design-rework.css sets its top from the row's
        // size and reveals an action that shows on hover.
        "absolute end-1 z-10 -translate-y-1/2",
        "group-data-[collapsible=icon]:hidden",
        dropSlotClass(className, props),
      )}
      data-show-on-hover={showOnHover || undefined}
      data-sidebar="menu-action"
      profile="inline"
      profileTone="muted"
      render={render}
      shape="square"
      variant="link"
      {...props}
      // It keeps its own slot when a trigger renders it, as a menu's trigger
      // does in the documented pattern, so the rules that place it on its row
      // keep reaching it; the trigger's slot class goes.
      data-slot="sidebar-menu-action"
    />
  );
}

/** Whether the children are text alone: a number or words, no element. */
function isPlainCount(children: React.ReactNode): boolean {
  const parts = React.Children.toArray(children);
  return (
    parts.length > 0 &&
    parts.every((part) => typeof part === "string" || typeof part === "number")
  );
}

/**
 * The count at the end of a row, such as the unread items of an inbox. It
 * places the count: at the row's inline end, in the room the row keeps for it,
 * centred on the row, and gone with the label on the collapsed icon rail. A
 * count is the kit's row count, a Badge at `sm` in the secondary variant, as
 * every count at the end of a navigation row or a tab is (Lukas, 4 November
 * 2026; it was a bare figure of its own): a number or a text passed as the
 * children is drawn in that Badge, and a Badge of your own, such as a status,
 * is placed as it is.
 */
export function SidebarMenuBadge({
  children,
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        // The count sits at the row's inline end, in either direction, and
        // centres on its row: design-rework.css sets its top from the row's
        // size.
        slotClass("sidebar-menu-badge", props),
        "pointer-events-none absolute end-1 flex -translate-y-1/2 select-none items-center",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="menu-badge"
      data-slot="sidebar-menu-badge"
      {...props}
    >
      {isPlainCount(children) ? (
        <Badge size="sm" variant="secondary">
          {children}
        </Badge>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * The glyph at the end of a row, last in a SidebarMenuButton that is the
 * trigger of a Collapsible or of a menu. It keeps the row's end and leaves
 * with the label on the collapsed icon rail, and its caret is 16 px in the
 * tertiary text colour. Without children it is a caret that turns half a turn
 * while the panel or the menu of its trigger is open, with every trigger
 * chevron of the kit (design-rework.css, "Trigger chevrons").
 * `variant="switcher"` draws the still up-down caret of a row that switches
 * between accounts or workspaces, such as a workspace switcher: the caret of
 * every switcher, MenuTriggerIcon `variant="switcher"`, as an Account Card
 * draws it. It does not turn, rests in the tertiary text colour and takes the
 * primary on hover, press and while the row's menu is open (rulebook M9).
 * Children replace the caret with a glyph of your own, such as a right caret
 * on a link row; it does not turn.
 */
export function SidebarMenuChevron({
  className,
  children,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  /**
   * `default`, the caret that turns, for an expandable row or a menu; or
   * `switcher`, the still up-down caret of a switcher row.
   */
  variant?: "default" | "switcher" | undefined;
}): React.ReactElement {
  return (
    <span
      className={cn(
        slotClass("sidebar-menu-chevron", props),
        "ms-auto flex shrink-0 items-center group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="menu-chevron"
      data-slot="sidebar-menu-chevron"
      {...props}
    >
      {children ??
        (variant === "switcher" ? (
          <MenuTriggerIcon variant="switcher" />
        ) : (
          <CaretDownIcon
            aria-hidden="true"
            className="sp-collapsible-chevron size-4"
            data-slot="collapsible-chevron"
          />
        ))}
    </span>
  );
}

// A loading row is as high as the menu row it stands in for, at every size.
const sidebarMenuSkeletonHeightClassNames = {
  lg: "h-(--sp-rw-control-lg)",
  md: "h-(--sp-rw-control-md)",
  sm: "h-(--sp-rw-control-sm)",
  xl: "h-(--sp-rw-control-xl)",
} as const;

export function SidebarMenuSkeleton({
  className,
  showIcon = false,
  size,
  width = "72%",
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
  size?: SidebarMenuButtonSize;
  width?: string;
}): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  return (
    <div
      className={cn(
        slotClass("sidebar-menu-skeleton", props),
        "flex items-center gap-2 rounded-lg px-2",
        sidebarMenuSkeletonHeightClassNames[resolvedSize],
        className,
      )}
      data-sidebar="menu-skeleton"
      data-size={resolvedSize}
      data-slot="sidebar-menu-skeleton"
      {...props}
    >
      {/* The 20px icon of a menu row. */}
      {showIcon && (
        <Skeleton
          className="size-5 rounded-lg"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      {/* The width is the run-time value; where a policy blocks the style
          attribute, the line keeps the default 72%. */}
      <Skeleton
        className="h-4 max-w-[var(--skeleton-width,72%)] flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

export function SidebarMenuSub({
  className,
  ...props
}: React.ComponentProps<"ul">): React.ReactElement {
  return (
    <ul
      className={cn(
        // The guide line is the kit's divider colour, at the inline start
        // under the row's icon in either direction.
        slotClass("sidebar-menu-sub", props),
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-0.5 border-[var(--sp-rw-border-translucent)] border-s px-2.5 py-0.5 rtl:-translate-x-px",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="menu-sub"
      data-slot="sidebar-menu-sub"
      {...props}
    />
  );
}

export function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">): React.ReactElement {
  return (
    <li
      className={cn(
        slotClass("sidebar-menu-sub-item", props),
        "group/menu-sub-item relative",
        className,
      )}
      data-sidebar="menu-sub-item"
      data-slot="sidebar-menu-sub-item"
      {...props}
    />
  );
}

export function SidebarMenuSubButton({
  "aria-current": ariaCurrent,
  size,
  active = false,
  className,
  render,
  children,
  ...props
}: Omit<ButtonBaseProps, "size"> & {
  size?: SidebarMenuButtonSize;
  /** Marks the current destination: `aria-current="page"` and the current fill. */
  active?: boolean;
}): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  return (
    <KitButton
      align="start"
      aria-current={ariaCurrent ?? (active ? "page" : undefined)}
      className={cn(
        "-translate-x-px rtl:translate-x-px",
        // A SidebarMenuBadge after the row, in its item, takes the row's end
        // as it does after a menu row: the label keeps clear of it, and it
        // follows the row's hover and current colours.
        "peer/menu-button group-has-data-[sidebar=menu-badge]/menu-sub-item:[--sp-rw-navigation-row-padding-end:--spacing(10)]",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-active={active || isCurrent(ariaCurrent)}
      data-sidebar="menu-sub-button"
      data-slot="sidebar-menu-sub-button"
      profile="navigation-sub-row"
      render={render}
      size={resolvedSize}
      variant="ghost"
      width="full"
      {...props}
      // The row keeps its profile when a trigger renders it (see
      // SidebarMenuButton).
      data-profile="navigation-sub-row"
    >
      {/* A plain-text label gets the row's label span, so a long one ends in
          an ellipsis instead of being cut off (rulebook K5). */}
      {typeof children === "string" || typeof children === "number" ? (
        <span>{children}</span>
      ) : (
        children
      )}
    </KitButton>
  );
}
