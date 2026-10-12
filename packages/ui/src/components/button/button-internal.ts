import type * as React from "react";

import {
  Button,
  type ButtonBaseProps,
  type ButtonProfile,
  type ButtonProfileTone,
  type InlineButtonProps,
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
  | "overlay-dismiss"
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
  "default" | "elevated" | "ghost" | "inset";

export type KitButtonProfileMode =
  | ResponsiveNavigationButtonProps["profileMode"]
  | SelectTriggerButtonMode
  | TabsTabButtonProps["profileMode"];

export type KitButtonProfileTone = ButtonProfileTone | TaskPillTone;

interface KitDefaultProfileProps extends ButtonBaseProps {
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

interface ResponsiveNavigationButtonProps extends ButtonBaseProps {
  profile: "responsive-navigation";
  profileMode?: "responsive" | "compact";
  profileTone?: never;
}

interface TabsTabButtonProps extends ButtonBaseProps {
  profile: "tabs-tab";
  profileMode: "default" | "pill" | "underline";
  profileTone?: never;
}

interface SelectTriggerButtonProps extends ButtonBaseProps {
  profile: "select-trigger";
  profileMode: SelectTriggerButtonMode;
  profileTone?: never;
}

interface TaskPillButtonProps extends ButtonBaseProps {
  profile: "task-pill";
  profileMode?: never;
  profileTone?: TaskPillTone;
}

export type KitButtonProps =
  | KitDefaultProfileProps
  | (InlineButtonProps & { profileMode?: never })
  | ResponsiveNavigationButtonProps
  | SelectTriggerButtonProps
  | TabsTabButtonProps
  | TaskPillButtonProps;

/** Button with the kit's composition profiles; the same component. */
export const KitButton = Button as (
  props: KitButtonProps,
) => React.ReactElement;
