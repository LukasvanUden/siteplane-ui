import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: { variant: "default" },
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-6 text-muted-foreground [&_svg:not([class*='size-'])]:size-6",
      },
    },
  },
);

export function Empty({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("empty", props),
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center",
        className,
      )}
      data-slot="empty"
      {...props}
    />
  );
}

export function EmptyHeader({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("empty-header", props),
        "flex max-w-sm flex-col items-center gap-2 text-center",
        className,
      )}
      data-slot="empty-header"
      {...props}
    />
  );
}

export function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof emptyMediaVariants>): React.ReactElement {
  return (
    // The header's 8 px gap spaces the text; the media is set apart from it by
    // 20 px, so it adds the other 12 px while something follows it (rulebook
    // S2): a header with only media adds no space below it.
    <div
      className={cn(
        slotClass("empty-media", props),
        "not-last:mb-3",
        emptyMediaVariants({ variant }),
        className,
      )}
      data-slot="empty-media"
      data-variant={variant}
      {...props}
    />
  );
}

export function EmptyTitle({
  className,
  level,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * The heading level, 1 to 6, so the title takes its place in the page
   * outline as `h1` to `h6`. Without it the title is a div. The look stays the
   * same at every level.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
}): React.ReactElement {
  // A heading takes the same attributes as the div; only the element type
  // names a different interface, so the props are passed on as they are.
  const Title = (level ? `h${level}` : "div") as "div";
  return (
    <Title
      className={cn(
        slotClass("empty-title", props),
        "font-medium text-sm leading-[21px] wrap-anywhere [font-weight:480]",
        className,
      )}
      data-slot="empty-title"
      {...props}
    />
  );
}

export function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("empty-description", props),
        "text-muted-foreground text-sm leading-[21px] wrap-anywhere [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      data-slot="empty-description"
      {...props}
    />
  );
}

export function EmptyContent({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        slotClass("empty-content", props),
        "flex w-full min-w-0 max-w-sm flex-col items-center gap-2 text-balance text-sm",
        className,
      )}
      data-slot="empty-content"
      {...props}
    />
  );
}
