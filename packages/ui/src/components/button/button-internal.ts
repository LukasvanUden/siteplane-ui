import type { VariantProps } from "class-variance-authority";
import { createElement, type ComponentProps, type ReactElement } from "react";

import {
  Button,
  type ButtonBaseProps,
  type ButtonProfile,
  type ButtonProfileTone,
  type InlineButtonProps,
  type buttonVariants,
} from "./button";

/*
 * Kit-internal Button. Not public API: the button index does not export this
 * module, and its names and profiles may change in any release.
 *
 * Kit components compose Button with these composition profiles, which give
 * Accordion, Tabs, Select, Sidebar and the other owners their geometry and
 * states. Applications use the owning component instead, or a documented
 * profile on the public Button.
 *
 * `step-trigger` is the header of a Stepper step: a text button around a
 * marker and its text. Its box reaches 4px past that content on every side
 * without moving it, so the keyboard focus outline clears the marker and the
 * marker stays on the connector; the height follows the content and the text
 * wraps.
 */
export type KitButtonProfile =
  | ButtonProfile
  | "accordion-trigger"
  | "animated-arrow"
  | "animated-expand"
  | "close"
  | "animated-fill"
  | "chip-remove"
  | "compact-icon-action"
  | "compact-role-control"
  | "collapsible-trigger"
  | "full-cell-action"
  | "joined-end"
  | "joined-start"
  | "menu-row"
  | "morph-trigger"
  | "navigation-row"
  | "navigation-sub-row"
  | "responsive-navigation"
  | "select-trigger"
  | "sidebar-rail"
  | "step-trigger"
  | "submenu-trigger"
  | "tabs-tab"
  | "task-pill";

/** The task-pill tones: a chart colour or muted. */
export type TaskPillTone =
  "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5" | "muted";

export type SelectTriggerButtonMode =
  "default" | "ghost" | "outline" | "segment";

export type KitButtonProfileMode =
  | ResponsiveNavigationButtonProps["profileMode"]
  | SelectTriggerButtonMode
  | TabsTabButtonProps["profileMode"];

export type KitButtonProfileTone = ButtonProfileTone | TaskPillTone;

/**
 * The Button's props with every size the chassis draws: the public sizes and
 * the CloseButton's own 28 px step, `close-xs`, which only the close profile
 * sizes (design-rework.css).
 */
interface KitButtonBaseProps extends Omit<ButtonBaseProps, "size"> {
  size?: VariantProps<typeof buttonVariants>["size"];
}

interface KitDefaultProfileProps extends KitButtonBaseProps {
  profile?: Exclude<
    KitButtonProfile,
    | "inline"
    | "responsive-navigation"
    | "select-trigger"
    | "tabs-tab"
    | "task-pill"
  >;
  profileMode?: never;
  profileTone?: never;
}

interface ResponsiveNavigationButtonProps extends KitButtonBaseProps {
  profile: "responsive-navigation";
  profileMode?: "responsive" | "compact";
  profileTone?: never;
}

interface TabsTabButtonProps extends KitButtonBaseProps {
  profile: "tabs-tab";
  profileMode: "default" | "pill" | "underline" | "ghost" | "minimal";
  profileTone?: never;
}

interface SelectTriggerButtonProps extends KitButtonBaseProps {
  profile: "select-trigger";
  profileMode: SelectTriggerButtonMode;
  profileTone?: never;
}

interface TaskPillButtonProps extends KitButtonBaseProps {
  profile: "task-pill";
  profileMode?: never;
  profileTone?: TaskPillTone;
}

export type KitButtonProps =
  | KitDefaultProfileProps
  | (Omit<InlineButtonProps, "size"> & {
      profileMode?: never;
      size?: KitButtonBaseProps["size"];
    })
  | ResponsiveNavigationButtonProps
  | SelectTriggerButtonProps
  | TabsTabButtonProps
  | TaskPillButtonProps;

/** Button with the kit's composition profiles; the same component. */
export const KitButton = Button as (props: KitButtonProps) => ReactElement;

/**
 * The X of every close and remove action in the kit, exported from the
 * Button's recipes: the CloseButton, the corner close of the overlays, Alert,
 * Notification and Toast, and the remove action of a Badge, a Tag and a
 * Combobox chip. It is Phosphor's X in the Regular weight, the centre lines of
 * its two strokes with their 16-unit stroke in the 256-unit box, drawn here so
 * that the Button's registry item needs no icon package. The Button it sits in
 * sizes it; elsewhere it is 1em, as a Phosphor icon is.
 */
export function CloseGlyph(props: ComponentProps<"svg">): ReactElement {
  return createElement(
    "svg",
    {
      "aria-hidden": true,
      fill: "none",
      height: "1em",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 16,
      viewBox: "0 0 256 256",
      width: "1em",
      ...props,
    },
    createElement("path", { d: "M200 56 56 200" }),
    createElement("path", { d: "M56 56l144 144" }),
  );
}
