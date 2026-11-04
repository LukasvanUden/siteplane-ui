"use client";

import * as React from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Avatar, AvatarImage, type AvatarShape } from "../avatar";
import { EmptySizeContext } from "./empty-size-context";

/** One picture of a decoration: the image and the text of its `alt`, empty by default. */
export type EmptyAvatarSource = {
  alt?: string | undefined;
  src: string;
};

export type EmptyAvatarDecorationProps = Omit<
  React.ComponentProps<"div">,
  "children"
> & {
  /** The pictures, in the order the decoration places them. */
  avatars?: readonly EmptyAvatarSource[] | undefined;
};

const radiusRings = [1, 2, 3, 4, 5] as const;

/** The most avatars that the rings have places for. */
const radiusSlots = 9;

function Picture({
  avatar,
  bordered,
  shape,
  step,
}: {
  avatar: EmptyAvatarSource;
  bordered?: boolean;
  shape?: AvatarShape;
  step?: number;
}) {
  return (
    <Avatar bordered={bordered} data-step={step} shape={shape}>
      <AvatarImage alt={avatar.alt ?? ""} src={avatar.src} />
    </Avatar>
  );
}

/**
 * Avatars scattered over concentric rings behind the media of an Empty, for a
 * list of people: five rings 96 to 352 px across and up to nine avatars on them, 32 px on the inner ring, 28 px on the
 * next and 24 px on the outer, fading out towards the edge. It is decoration,
 * hidden from assistive technology, and takes no space: put it in an EmptyMedia
 * beside the icon, and leave the room it needs to the host.
 */
export function EmptyAvatarRadius({
  avatars = [],
  className,
  ...props
}: EmptyAvatarDecorationProps): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn(slotClass("empty-avatar-radius", props), className)}
      data-slot="empty-avatar-radius"
      {...props}
    >
      {radiusRings.map((ring) => (
        <span
          className="sp-empty-avatar-ring"
          data-ring={ring}
          data-slot="empty-avatar-ring"
          key={ring}
        />
      ))}
      {avatars.slice(0, radiusSlots).map((avatar, index) => (
        <span
          className="sp-empty-avatar-slot"
          data-index={index + 1}
          data-slot="empty-avatar-slot"
          key={`${avatar.src}-${index}`}
        >
          <Picture avatar={avatar} bordered />
        </span>
      ))}
    </div>
  );
}

/**
 * A row of avatars either side of its children, for inviting people: the first
 * avatars fill the group before the
 * children and the next ones the group after them, growing towards the
 * children, and the row fades out towards its edges. The groups hold four
 * avatars each in an sm Empty (32 to 44 px) and three in a larger one (40 to
 * 48 px); more are ignored. It is decoration, hidden from assistive
 * technology, so the children, usually a featured icon, are decoration too.
 */
export function EmptyAvatarRow({
  avatars = [],
  children,
  className,
  ...props
}: EmptyAvatarDecorationProps & {
  /** The content between the two groups, usually the media's featured icon. */
  children?: React.ReactNode;
}): React.ReactElement {
  const size = React.useContext(EmptySizeContext);
  const count = size === "sm" ? 4 : 3;
  return (
    <div
      aria-hidden="true"
      className={cn(slotClass("empty-avatar-row", props), className)}
      data-slot="empty-avatar-row"
      {...props}
    >
      <div className="sp-empty-avatar-group" data-slot="empty-avatar-group">
        {avatars.slice(0, count).map((avatar, index) => (
          <Picture
            avatar={avatar}
            key={`${avatar.src}-${index}`}
            step={index}
          />
        ))}
      </div>
      {children}
      <div className="sp-empty-avatar-group" data-slot="empty-avatar-group">
        {avatars.slice(count, count * 2).map((avatar, index) => (
          <Picture
            avatar={avatar}
            key={`${avatar.src}-${index}`}
            step={count - 1 - index}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Two rows of avatars that drift in opposite directions behind the content of
 * an Empty, for a list of integrations: the logos of the tools it connects,
 * which are company marks, so each is the Avatar's rounded square
 * (`shape="square"`). The first half of the pictures fills the top row and the rest the bottom row,
 * each repeated so the row loops without a seam, fading out towards its
 * edges, and 32, 40 or 48 px high in an sm, md or lg Empty. The drift is slow
 * (a loop takes four minutes) and stops with reduced motion. It is
 * decoration, hidden from assistive technology.
 */
export function EmptyAvatarGrid({
  avatars = [],
  className,
  ...props
}: EmptyAvatarDecorationProps): React.ReactElement {
  const middle = Math.ceil(avatars.length / 2);
  const lanes = [avatars.slice(0, middle), avatars.slice(middle)];
  return (
    <div
      aria-hidden="true"
      className={cn(slotClass("empty-avatar-grid", props), className)}
      data-slot="empty-avatar-grid"
      {...props}
    >
      {lanes.map((lane, laneIndex) => (
        <div
          className="sp-empty-avatar-lane"
          data-lane={laneIndex}
          data-slot="empty-avatar-lane"
          key={laneIndex}
        >
          {[0, 1].map((copy) => (
            <div
              className="sp-empty-avatar-strip"
              data-slot="empty-avatar-strip"
              key={copy}
            >
              {[...lane, ...lane, ...lane].map((avatar, index) => (
                <Picture
                  avatar={avatar}
                  bordered
                  key={`${avatar.src}-${index}`}
                  shape="square"
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
