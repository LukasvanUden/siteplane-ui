"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type * as React from "react";

import { useTruncated } from "../../system/hooks/use-truncated";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../tooltip";

/** The props of the TooltipPopup that shows the full text. */
export type TruncateTooltipProps = React.ComponentProps<typeof TooltipPopup>;

export interface TruncateProps extends useRender.ComponentProps<"span"> {
  /**
   * The lines the text keeps before it ends in an ellipsis. One, the default,
   * keeps the text on one line and cuts it where its box ends: the width of
   * its container, or a width a class sets, such as `max-w-1/2`. More lines
   * wrap the text and cut it at the end of the last of them. A value below two
   * counts as one.
   */
  lines?: number | undefined;
  /**
   * Shows the full text in the kit's Tooltip on hover while the text is cut,
   * and on focus where the element takes focus, such as a link. `false` turns
   * it off. An object passes props to the TooltipPopup, such as `side`, or
   * `children` for content other than the text.
   */
  tooltip?: boolean | TruncateTooltipProps | undefined;
}

/**
 * Text that ends in an ellipsis after one line or a number of `lines`, with the
 * full text in a Tooltip on hover while it is cut. It renders a `span`, or the
 * element of `render`. The cut is visual: the element keeps the whole text, so
 * assistive technology reads it once, and the tooltip is hidden from it. The
 * server and the first render in the browser render no tooltip; the text is
 * measured before the first paint and whenever its size changes. The layout is
 * the Truncate rules in design-rework.css.
 */
export function Truncate({
  children,
  className,
  lines = 1,
  render,
  tooltip = true,
  ...props
}: TruncateProps): React.ReactElement {
  const count = Number.isFinite(lines) && lines >= 2 ? Math.floor(lines) : 1;
  const tooltipOn = tooltip !== false;
  const [ref, truncated] = useTruncated<HTMLElement>(tooltipOn);
  // A clamp of several lines takes its count from the style attribute, as
  // Textarea's line counts do; a policy that blocks the attribute keeps two.
  const defaultProps = {
    children,
    className: cn(slotClass("truncate", props, render), className),
    "data-lines": count > 1 ? count : undefined,
    "data-slot": "truncate",
    style:
      count > 1
        ? ({ "--truncate-lines": count } as React.CSSProperties)
        : undefined,
  };
  const element = useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    ref: tooltipOn ? ref : undefined,
    render,
  });
  if (!tooltipOn) return element;

  const {
    children: content = children,
    className: popupClassName,
    ...popupProps
  } = tooltip === true ? {} : tooltip;
  // The Tooltip stays mounted, so the element stays the same node; it opens
  // only while the text is cut. The trigger reads `disabled` as it renders, so
  // the server and the first render already have no tooltip; the root, which
  // takes it a moment later, closes an open tooltip once the text fits. The
  // popup repeats text the element already gives assistive technology, so it
  // is hidden from it, and Base UI links no description to the trigger. It
  // wraps the full text in the Tooltip's own width.
  return (
    <Tooltip disabled={!truncated}>
      <TooltipTrigger
        disabled={!truncated}
        render={element as React.ReactElement<Record<string, unknown>>}
      />
      <TooltipPopup aria-hidden className={popupClassName} {...popupProps}>
        {content}
      </TooltipPopup>
    </Tooltip>
  );
}
