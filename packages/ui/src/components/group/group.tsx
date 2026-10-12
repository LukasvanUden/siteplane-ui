"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../system/utils/cn";
import { Separator } from "../separator";
import { KitSeparator } from "../separator/separator-internal";

export const groupVariants = cva(
  "flex w-fit *:focus-visible:z-1 has-[>[data-slot=group]]:gap-2 *:has-focus-visible:z-1 dark:*:[[data-slot=separator]:has(~button:hover):not(:has(~[data-slot=separator]~[data-slot]:hover)),[data-slot=separator]:has(~[data-slot][data-pressed]):not(:has(~[data-slot=separator]~[data-slot][data-pressed]))]:before:bg-input/64 dark:*:[button:hover~[data-slot=separator]:not([data-slot]:hover~[data-slot=separator]~[data-slot=separator]),[data-slot][data-pressed]~[data-slot=separator]:not([data-slot][data-pressed]~[data-slot=separator]~[data-slot=separator])]:before:bg-input/64",
  {
    defaultVariants: {
      orientation: "horizontal",
    },
    variants: {
      orientation: {
        // The children's edges and corners at the joins are design-rework.css's
        // (Group), so the joins of a control's own rules still win.
        horizontal:
          "*:pointer-coarse:after:min-w-auto *:data-slot:not-data-[slot=separator]:has-[~[data-slot]]:before:-end-[0.5px] *:data-slot:has-[~[data-slot]]:before:rounded-e-none *:[[data-slot]~[data-slot]:not([data-slot=separator])]:before:-start-[0.5px] *:[[data-slot]~[data-slot]]:before:rounded-s-none",
        vertical:
          "flex-col *:pointer-coarse:after:min-h-auto *:data-slot:not-data-[slot=separator]:has-[~[data-slot]]:before:-bottom-[0.5px] *:data-slot:not-data-[slot=separator]:has-[~[data-slot]]:before:hidden *:data-slot:has-[~[data-slot]]:before:rounded-b-none dark:*:last:before:hidden dark:*:first:before:block *:[[data-slot]~[data-slot]:not([data-slot=separator])]:before:-top-[0.5px] *:[[data-slot]~[data-slot]]:before:rounded-t-none",
      },
      separator: {
        inset:
          "[&>[data-slot=button]:not(:last-child)]:before:inset-y-auto [&>[data-slot=button]:not(:last-child)]:before:start-auto [&>[data-slot=button]:not(:last-child)]:before:end-0 [&>[data-slot=button]:not(:last-child)]:before:top-1/2 [&>[data-slot=button]:not(:last-child)]:before:h-5 [&>[data-slot=button]:not(:last-child)]:before:-translate-y-1/2",
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
      className={cn(groupVariants({ orientation, separator }), className)}
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
        "pointer-events-none relative z-2 before:absolute before:inset-0 dark:before:bg-input/32",
        className,
      )}
      orientation={orientation}
      profile="group"
      {...props}
    />
  );
}
