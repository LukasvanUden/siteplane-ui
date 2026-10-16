"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type React from "react";
import { useResolvedDensity } from "../../system/provider/siteplane-ui-provider";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { baseClass, slotClass } from "../../system/utils/slot-class";

export function Card({
  className,
  density,
  render,
  variant = "raised",
  ...props
}: useRender.ComponentProps<"div"> & {
  /**
   * The inset of the card's parts: 20 px, or 16 px compact. Without it the
   * card takes the density of the SiteplaneUIProvider around it. A theme's
   * --sp-rw-card-inset, --sp-rw-card-inset-block or --sp-rw-card-inset-inline
   * takes the place of the density's inset (design-rework.css).
   */
  density?: "default" | "compact" | undefined;
  variant?:
    | "raised"
    | "subtle"
    | "header"
    | "message"
    | "error"
    | "inset"
    | "elevated"
    | "glass";
}): React.ReactElement {
  const resolvedDensity = useResolvedDensity(density);
  const defaultProps = {
    // A card nested in a framed card keeps the default inset of its parts: the
    // frame's inset (CardFrame) reaches only the cards joined into it.
    className: cn(
      // Glass is a surface of its own: the shared glass rule draws its fill,
      // edge, text colour and blur instead of the raised surface.
      slotClass("card", props, render),
      baseClass("card", props, render),
      variant === "glass" ? surfaceClassNames.glass : surfaceClassNames.raised,
      "flex flex-col [--card-inset-inline:initial]",
      className,
    ),
    "data-density": resolvedDensity,
    // Stays when the Card renders as another part and takes its slot (a
    // ContextMenu trigger), so the Card's base radius still reaches it.
    "data-foundation": "card",
    "data-slot": "card",
    "data-variant": variant,
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrame({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    // A joined card's header, panel and footer take the frame's inset, like a
    // table's outer columns, so their text starts with the frame header's; the
    // extra pixel offsets the card's negative margin.
    className: cn(
      slotClass("card-frame", props, render),
      surfaceClassNames.raised,
      "flex flex-col [--card-frame-inset:--spacing(6)] [--clip-bottom:-1rem] [--clip-top:-1rem] before:rounded-[inherit] *:data-[slot=card]:[--card-inset-inline:calc(var(--card-frame-inset)+1px)] *:data-[slot=card]:[--table-edge-padding:calc(var(--card-frame-inset)+1px)] *:data-[slot=card]:-m-px *:data-[slot=card]:before:hidden *:not-first:data-[slot=card]:before:rounded-t-[inherit] *:not-last:data-[slot=card]:before:rounded-b-[inherit] *:data-[slot=card]:[clip-path:inset(var(--clip-top)_1px_var(--clip-bottom)_1px_round_calc(var(--sp-rw-radius-surface)-1px))] *:data-[slot=card]:last:[--clip-bottom:1px] *:data-[slot=card]:first:[--clip-top:1px]",
      className,
    ),
    "data-slot": "card-frame",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameBleed({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    // Tables inside align their outer columns with the frame header and footer;
    // the extra pixel offsets the negative margin that covers the frame border.
    className: cn(
      slotClass("card-frame-bleed", props, render),
      "-m-px w-[calc(100%+2px)] [--table-edge-padding:calc(var(--card-frame-inset)+1px)]",
      className,
    ),
    "data-slot": "card-frame-bleed",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-frame-header", props, render),
      "relative flex grid auto-rows-min grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto] flex-col items-start gap-x-4 px-[var(--card-frame-inset,--spacing(6))] py-4 has-data-[slot=card-frame-action]:grid-cols-[minmax(0,1fr)_auto]",
      className,
    ),
    "data-slot": "card-frame-header",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-frame-title", props, render),
      "self-center font-(--sp-rw-font-weight-strong) text-sm wrap-anywhere",
      className,
    ),
    "data-slot": "card-frame-title",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-frame-description", props, render),
      "self-center text-muted-foreground text-sm wrap-anywhere",
      className,
    ),
    "data-slot": "card-frame-description",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-frame-action", props, render),
      "col-start-2 nth-3:row-span-2 nth-3:row-start-1 inline-flex self-center justify-self-end",
      className,
    ),
    "data-slot": "card-frame-action",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameFooter({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-frame-footer", props, render),
      "px-[var(--card-frame-inset,--spacing(6))] py-4",
      className,
    ),
    "data-slot": "card-frame-footer",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  // The text parts share one column; a media (CardMedia) takes a column of its
  // own before it and an action (CardAction) one after it. The text parts are
  // the children that are neither of the two. How the parts align in the rows
  // follows from how many text parts the header holds, which design-rework.css
  // decides in one block of its Card section.
  const defaultProps = {
    className: cn(
      slotClass("card-header", props, render),
      "grid auto-rows-min grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto] has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] has-data-[slot=card-media]:grid-cols-[auto_minmax(0,1fr)] has-data-[slot=card-media]:has-data-[slot=card-action]:grid-cols-[auto_minmax(0,1fr)_auto]",
      className,
    ),
    "data-slot": "card-header",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

/**
 * The leading avatar or icon of a header, before its title and description
 * (rulebook I7). A bare icon is 20 px and centres on the title's first line; an
 * avatar taller than that line starts at its top (I3, I5). Beside a title
 * alone it centres on the title, as CardAction does.
 */
export function CardMedia({
  className,
  render,
  tone = "accent",
  ...props
}: useRender.ComponentProps<"div"> & {
  /**
   * The color of a bare icon: `accent`, or `neutral` for the secondary text
   * color (--sp-rw-fg-secondary), for a module icon that leaves color to
   * states. An avatar or an image keeps its own colors.
   */
  tone?: "accent" | "neutral" | undefined;
}): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-media", props, render),
      "col-start-1 row-start-1 flex",
      className,
    ),
    "data-slot": "card-media",
    "data-tone": tone,
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-title", props, render),
      "wrap-anywhere",
      className,
    ),
    "data-slot": "card-title",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

/**
 * Context beside the title, in its row: a period, a count or a short status.
 * Place it inside CardTitle, after the title's text. It takes the quieter text
 * of CardDescription and moves below the title when the row is full.
 */
export function CardTitleMeta({
  className,
  render,
  ...props
}: useRender.ComponentProps<"span">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-title-meta", props, render),
      "min-w-0 wrap-anywhere",
      className,
    ),
    "data-slot": "card-title-meta",
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}

export function CardDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-description", props, render),
      "wrap-anywhere",
      className,
    ),
    "data-slot": "card-description",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  // Beside a title and a description the action spans both rows from the top.
  // Beside one text part it stays in that part's row and centres on it, as
  // CardFrameAction does, so it adds no second row (rulebook S2, S11); the
  // Card section of design-rework.css owns both. It takes the last column,
  // after the text and after a media's column before it.
  const defaultProps = {
    className: cn(
      slotClass("card-action", props, render),
      "-col-start-2 row-start-1 inline-flex justify-self-end",
      className,
    ),
    "data-slot": "card-action",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardPanel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(slotClass("card-panel", props, render), "flex-1", className),
    "data-slot": "card-panel",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFooter({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      slotClass("card-footer", props, render),
      "flex items-center",
      className,
    ),
    "data-slot": "card-footer",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export { CardPanel as CardContent };
