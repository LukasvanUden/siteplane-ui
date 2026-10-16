"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Separator } from "../separator";
import { KitSeparator } from "../separator/separator-internal";

// The joins are design-rework.css's (Group): the children's edges and corners,
// so the joins of a control's own rules still win; the ::before layer of each
// child; the short divider of separator="inset"; and the separators' fill in
// Dark, which deepens beside the item under the pointer or pressed.
export const groupVariants = cva(
  "flex w-fit *:focus-visible:z-1 *:has-focus-visible:z-1",
  {
    defaultVariants: {
      orientation: "horizontal",
    },
    variants: {
      orientation: {
        horizontal: "*:pointer-coarse:after:min-w-auto",
        vertical: "flex-col *:pointer-coarse:after:min-h-auto",
      },
      separator: {
        inset: "",
      },
    },
  },
);

type GroupOrientation = NonNullable<
  VariantProps<typeof groupVariants>["orientation"]
>;

// A separator runs across its group: vertical between the items of a
// horizontal group, horizontal between those of a vertical one.
const GroupOrientationContext: React.Context<GroupOrientation> =
  React.createContext<GroupOrientation>("horizontal");

export function Group({
  className,
  orientation,
  separator,
  children,
  ...props
}: {
  className?: string;
  orientation?: VariantProps<typeof groupVariants>["orientation"];
  separator?: VariantProps<typeof groupVariants>["separator"];
  children: React.ReactNode;
} & React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("group", props),
        groupVariants({ orientation, separator }),
        className,
      )}
      data-orientation={orientation}
      data-separator={separator}
      data-slot="group"
      role="group"
      {...props}
    >
      <GroupOrientationContext.Provider value={orientation ?? "horizontal"}>
        {children}
      </GroupOrientationContext.Provider>
    </div>
  );
}

export function GroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("group-text", props, render),
      "relative inline-flex items-center gap-2 whitespace-nowrap bg-muted not-dark:bg-clip-padding px-[calc(--spacing(3)-1px)] text-base text-muted-foreground outline-none transition-shadow duration-(--motion-duration-fast) ease-(--motion-ease-state) sm:text-sm dark:bg-input/64 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:-mx-0.5 [&_svg]:shrink-0",
      className,
    ),
    "data-slot": "group-text",
  };
  return useRender({
    defaultTagName: "div",
    props: mergeProps(defaultProps, props),
    render,
  });
}

export function GroupSeparator({
  className,
  orientation: orientationProp,
  ...props
}: {
  className?: string;
} & React.ComponentProps<typeof Separator>): React.ReactElement {
  const groupOrientation = React.useContext(GroupOrientationContext);
  const orientation =
    orientationProp ??
    (groupOrientation === "vertical" ? "horizontal" : "vertical");
  return (
    <KitSeparator
      className={cn(
        "pointer-events-none relative z-2 before:absolute before:inset-0",
        className,
      )}
      orientation={orientation}
      profile="group"
      {...props}
    />
  );
}
