"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type React from "react";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";

export function Card({
  className,
  render,
  variant = "raised",
  ...props
}: useRender.ComponentProps<"div"> & {
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
  const defaultProps = {
    // A card nested in a framed card keeps the default inset of its parts: the
    // frame's inset (CardFrame) reaches only the cards joined into it.
    className: cn(
      // Glass is a surface of its own: the shared glass rule draws its fill,
      // edge, text colour and blur instead of the raised surface.
      variant === "glass" ? surfaceClassNames.glass : surfaceClassNames.raised,
      "flex flex-col [--card-inset-inline:initial]",
      className,
    ),
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
    className: cn("self-center font-semibold text-sm wrap-anywhere", className),
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
    className: cn("px-[var(--card-frame-inset,--spacing(6))] py-4", className),
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
  // With an action and a single text part, the text and the action share one
  // row and centre on each other (CardAction).
  const defaultProps = {
    className: cn(
      "grid auto-rows-min grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] [&:has(>[data-slot=card-action]):not(:has(>:not([data-slot=card-action])~:not([data-slot=card-action])))]:items-center",
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

export function CardTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("wrap-anywhere", className),
    "data-slot": "card-title",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("wrap-anywhere", className),
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
  // CardFrameAction does, so it adds no second row (rulebook S2, S11).
  const defaultProps = {
    className: cn(
      "col-start-2 row-start-1 inline-flex self-center justify-self-end in-[[data-slot=card-header]:has(>:not([data-slot=card-action])~:not([data-slot=card-action]))]:row-end-3 in-[[data-slot=card-header]:has(>:not([data-slot=card-action])~:not([data-slot=card-action]))]:self-start",
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
    className: cn("flex-1", className),
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
    className: cn("flex items-center", className),
    "data-slot": "card-footer",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export { CardPanel as CardContent };
