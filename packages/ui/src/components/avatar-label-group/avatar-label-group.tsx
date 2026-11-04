"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { AvatarScope } from "../avatar";

import "./avatar-label-group.css";

/** `sm`, `md` or `lg`: a 32, 40 or 48 px avatar with the text that goes with it. */
export type AvatarLabelGroupSize = "sm" | "md" | "lg";

export interface AvatarLabelGroupProps extends Omit<
  useRender.ComponentProps<"figure">,
  "title"
> {
  /**
   * The size: `sm` is a 32 px avatar beside a 14 px
   * title and a 12 px subtitle, `md` a 40 px avatar with 14 px text and `lg` a
   * 48 px avatar with 16 px text. The avatar takes the size, so its initials,
   * its icon and its corner marks step with it. `sm` by default, the size of a
   * single Avatar.
   */
  size?: AvatarLabelGroupSize | undefined;
  /**
   * The main line beside the avatar, such as a person's name or an account. It
   * wraps where the line is full.
   */
  title?: React.ReactNode;
  /**
   * The line under the title, such as an email address or a role. It stays on
   * one line and ends with an ellipsis where the group is full.
   */
  subtitle?: React.ReactNode;
}

/**
 * An avatar with a title and a subtitle beside it: the person, team or account
 * a row, a menu header or an account card stands for. Put the Avatar in as the
 * child, with its image, its fallback and the marks it needs (`status`,
 * AvatarBadge, a verified Badge): the group gives it its size and its
 * hairline ring, so it passes neither, and the title and the subtitle take the
 * kit's text roles. The group is a figure, and its title and subtitle are the
 * figure's caption. Rendered as another element (`render`), such as the span
 * that a button, a link or a menu row takes (`render={<span />}`), it holds
 * the same caption and lines as spans, so it stays phrasing content there,
 * with the same slots, classes and look. It fills the row it stands in.
 */
export function AvatarLabelGroup({
  children,
  className,
  render,
  size = "sm",
  subtitle,
  title,
  ...props
}: AvatarLabelGroupProps): React.ReactElement {
  const hasText = !isEmpty(title) || !isEmpty(subtitle);
  // Only a figure holds a figcaption, and an element that takes phrasing
  // content alone, such as a button, holds no paragraph: any other root holds
  // its caption and lines as spans.
  const figure =
    render === undefined ||
    (React.isValidElement(render) && render.type === "figure");
  const Caption = figure ? "figcaption" : "span";
  const Line = figure ? "p" : "span";
  const defaultProps = {
    children: (
      <>
        <AvatarScope bordered size={size}>
          {children}
        </AvatarScope>
        {hasText ? (
          <Caption
            className="sp-avatar-label-group-caption"
            data-slot="avatar-label-group-caption"
          >
            {isEmpty(title) ? null : (
              <Line
                className="sp-avatar-label-group-title"
                data-slot="avatar-label-group-title"
              >
                {title}
              </Line>
            )}
            {isEmpty(subtitle) ? null : (
              <Line
                className="sp-avatar-label-group-subtitle"
                data-slot="avatar-label-group-subtitle"
                // A truncated subtitle carries its full text (rulebook K5).
                title={typeof subtitle === "string" ? subtitle : undefined}
              >
                {subtitle}
              </Line>
            )}
          </Caption>
        ) : null}
      </>
    ),
    className: cn(slotClass("avatar-label-group", props, render), className),
    "data-size": size,
    "data-slot": "avatar-label-group",
  };

  return useRender({
    defaultTagName: "figure",
    props: mergeProps<"figure">(defaultProps, props),
    render,
  });
}

/** Whether a line has nothing to show, so its element and its gap stay out. */
function isEmpty(node: React.ReactNode): boolean {
  return node === undefined || node === null || node === false || node === "";
}
