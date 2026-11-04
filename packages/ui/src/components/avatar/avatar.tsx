"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import * as React from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";

export type AvatarStatus = "online" | "away" | "busy" | "offline";

/**
 * The avatar sizes: 24, 32, 40, 48, 56 and 64 px, the three profile
 * photo sizes after them: 72, 96 and 160 px, and `2xs`, 20 px, the size of a
 * row icon, before them.
 */
export type AvatarSize =
  "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

/**
 * The circle, `default`, shows a person; `square`, a rounded square, shows a
 * company or a workspace.
 */
export type AvatarShape = "default" | "square";

export type AvatarProps = WithStringClassName<AvatarPrimitive.Root.Props> & {
  /**
   * Draws a hairline ring around the avatar, with a gap between the ring and
   * the image. The avatar keeps its size: the image shrinks by the gap. An
   * avatar in an AvatarScope or an AvatarLabelGroup that sets the ring takes
   * it, unless it names `bordered` itself.
   */
  bordered?: boolean | undefined;
  /**
   * `square` draws a rounded square for a company or a workspace, so it reads
   * apart from a person, who keeps the circle (`default`). Its corners grow
   * with the avatar's width, whatever sets it, and with the provider radius:
   * at `md`, 4 px at 20 and 24 px, 6 px at 32 px, 8 px at 40 px, 10 px at 48
   * px and 12 px from 56 px; sharp at `none`. The image, the fallback, the
   * hairline and a ring take the same corners, the presence dot and the
   * corner marks keep their places, and an avatar Button around it turns
   * square with it. An avatar in an AvatarGroup or an AvatarScope takes the
   * shape of its scope when it names none.
   */
  shape?: AvatarShape | undefined;
  /**
   * The size: `xs` 24 px, `sm` 32 px (the default),
   * `md` 40 px, `lg` 48 px, `xl` 56 px and `2xl` 64 px, and for a profile
   * photo `3xl` 72 px, `4xl` 96 px and `5xl` 160 px, where a bordered avatar
   * keeps a wider gap between the ring and the photo (3, 4 and 6 px) and the
   * verified mark (AvatarBadge) stands 2, 4 and 8 px inside the corner. `2xs`
   * is 20 px, as large as a row icon, such as the mark of a workspace in a
   * Sidebar row and on its collapsed rail. The initials, the placeholder icon
   * and the corner marks (`status`, AvatarBadge) step with it. An avatar in an
   * AvatarGroup takes the group's size, and one in an AvatarScope or an
   * AvatarLabelGroup the size of its scope, when it names none.
   */
  size?: AvatarSize | undefined;
  /** Presence dot at the bottom-end corner of the avatar. */
  status?: AvatarStatus | undefined;
  /**
   * Accessible name of the dot; defaults to the status's name in the
   * `avatar` messages of SiteplaneLocaleProvider, English without one.
   */
  statusLabel?: string | undefined;
};

const avatarStatusClassNames: Record<AvatarStatus, string> = {
  away: "bg-warning",
  busy: "bg-destructive",
  offline: "bg-muted-foreground",
  online: "bg-success",
};

/** What an AvatarScope sets for the avatars inside it. */
export type AvatarScopeValue = {
  /** Draws the hairline ring (`bordered`) on avatars that do not name it. */
  bordered?: boolean | undefined;
  /** The shape of avatars that name none, such as `square` for companies. */
  shape?: AvatarShape | undefined;
  /** The size of avatars that name none. */
  size?: AvatarSize | undefined;
};

const AvatarScopeContext = React.createContext<AvatarScopeValue>({});

/**
 * Sets the size, the shape and the ring of the avatars inside it that name
 * none, as an AvatarGroup and an AvatarLabelGroup do for their avatars: the
 * group's size is the avatar's size, so the initials, the icon and the corner
 * marks step with it. A `size`, `shape` or `bordered` on the Avatar itself
 * wins. A corner mark (AvatarBadge) leaves the scope, so a company logo in it
 * keeps its own size and shape and draws no ring. Context only: it draws
 * nothing.
 */
export function AvatarScope({
  bordered,
  children,
  shape,
  size,
}: AvatarScopeValue & { children?: React.ReactNode }): React.ReactElement {
  const value = React.useMemo(
    () => ({ bordered, shape, size }),
    [bordered, shape, size],
  );
  return (
    <AvatarScopeContext.Provider value={value}>
      {children}
    </AvatarScopeContext.Provider>
  );
}

/** What a corner mark gives the avatars inside it: no scope of the avatar around it. */
const noAvatarScope: AvatarScopeValue = {};

/**
 * The size of the avatar whose clipped root a part stands in. Avatar finds
 * the AvatarBadge elements among its children and sets them beside its root;
 * an AvatarBadge that a component of the caller's own renders reaches the
 * root itself, and reads here that it stands in it. Kit-internal.
 */
const AvatarRootContext = React.createContext<{
  size: AvatarSize | undefined;
} | null>(null);

export type AvatarBadgeProps = React.ComponentProps<"span">;

/**
 * A mark at the bottom-end corner of an Avatar: a verified Badge
 * (`profile="verified"`), a count Badge (`profile="count"`) or another Avatar
 * with a company logo, which takes `shape="square"` as every company does. Put
 * it among the Avatar's children. The avatar clips its image to its shape, so
 * the mark stands beside the image and not inside it, and takes the avatar's
 * size: a tick of 10, 12, 14, 16, 18 and 20 px, a
 * logo of 8, 12, 14, 16, 18 and 20 px and a count of 14 px from `xs` to `2xl`
 * (a `2xs` avatar takes the marks of `xs`), and on a profile photo (`3xl`,
 * `4xl` and `5xl`) a tick of 20, 24 and 32 px that stands 2, 4 and 8 px
 * inside the corner. Each mark draws a ring in the colour of the surface, 1 px
 * at `sm`, `xs` and `2xs` and 2 px from `md`; the count stands 1 px inside the
 * corner from `md`, at the corner at `sm` and 1 px outside it at `xs` and
 * `2xs`. A presence dot is the `status` prop of Avatar instead. A component of
 * your own that renders the AvatarBadge works the same; the mark then stands
 * in the avatar's root, so on an avatar that is a link it is part of the link.
 */
export function AvatarBadge({
  children,
  className,
  ...props
}: AvatarBadgeProps): React.ReactElement {
  const root = React.useContext(AvatarRootContext);
  const badge = (
    <span
      className={cn(slotClass("avatar-badge", props), className)}
      data-slot="avatar-badge"
      {...props}
    >
      <AvatarRootContext.Provider value={null}>
        <AvatarScopeContext.Provider value={noAvatarScope}>
          {children}
        </AvatarScopeContext.Provider>
      </AvatarRootContext.Provider>
    </span>
  );
  if (!root) return badge;
  // Avatar did not find this mark among its children, so it reached the
  // clipped root: it brings the wrapper of the marks, which names their sizes
  // and rings (design-rework.css), as an empty box at the root's bottom-end
  // corner, above the root's hairline. The root then leaves it unclipped.
  return (
    <span
      className="sp-avatar-status-root absolute end-0 bottom-0 z-1"
      data-size={root.size}
      data-slot="avatar-status-root"
    >
      {badge}
    </span>
  );
}

function isAvatarBadge(node: React.ReactNode): boolean {
  return React.isValidElement(node) && node.type === AvatarBadge;
}

/**
 * A person's picture in a circle, or a company's or a workspace's in a rounded
 * square (`shape="square"`), with initials or an icon in its place until the
 * picture loads. An avatar that leads to a profile is the link itself:
 * `render={<a href="…" />}` makes the avatar the link, which takes the
 * keyboard focus ring around its edge (the image's `alt` names it), while the
 * presence dot and an AvatarBadge stay beside it.
 */
export function Avatar({
  bordered: borderedProp,
  children,
  className,
  shape: shapeProp,
  size: sizeProp,
  status,
  statusLabel,
  ...props
}: AvatarProps): React.ReactElement {
  const messages = useSiteplaneMessages("avatar");
  const scope = React.useContext(AvatarScopeContext);
  const size = sizeProp ?? scope.size;
  const shape = shapeProp ?? scope.shape;
  const bordered = borderedProp ?? scope.bordered ?? false;
  // The corner marks (AvatarBadge) are children of the Avatar for whoever
  // writes it, and stand beside the clipped root in the wrapper below. A mark
  // that a component of the caller's own renders reaches the root instead
  // (AvatarRootContext) and brings the marks' wrapper with it: the root then
  // stops clipping and isolates its layers, so the mark is drawn whole, above
  // the hairline, and the image and the fallback keep the avatar's shape.
  const parts = React.Children.toArray(children);
  const badges = parts.filter(isAvatarBadge);
  const rootContext = React.useMemo(() => ({ size }), [size]);
  // A bordered avatar draws its ring outside its edge and keeps a gap between
  // the ring and the image (design-rework.css, "Avatar bordered"). A square
  // one takes its corners from its width there (the Avatar size block).
  const root = (
    <AvatarPrimitive.Root
      className={cn(
        slotClass("avatar", props),
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden align-middle has-[.sp-avatar-badge]:overflow-visible has-[.sp-avatar-badge]:isolate",
        className,
      )}
      data-bordered={bordered ? "" : undefined}
      data-shape={shape}
      data-size={size}
      data-slot="avatar"
      {...props}
    >
      <AvatarRootContext.Provider value={rootContext}>
        {badges.length > 0
          ? parts.filter((part) => !isAvatarBadge(part))
          : children}
      </AvatarRootContext.Provider>
    </AvatarPrimitive.Root>
  );
  if (!status && badges.length === 0) return root;
  // The avatar clips its image to the circle, so the dot and the marks sit
  // beside it in a wrapper that takes the avatar's size. The dot is a quarter
  // of the avatar, so it scales with every avatar size: 8 px at 32 px, 9 px at
  // 36 px, 10 px at 40 px. A ring in the colour of the surface separates it,
  // and every corner mark, from the photo: 1 px at sm and xs and 2 px from md
  // (design-rework.css, --sp-avatar-mark-ring). It reads
  // --sp-rw-surface-color, which Card, Dialog, Popover and the other surfaces
  // publish, and falls back to the page background. Set --avatar-status-ring
  // on a surface that does not publish its colour.
  return (
    <span
      className="sp-avatar-status-root relative inline-flex shrink-0 align-middle"
      data-size={size}
      data-slot="avatar-status-root"
    >
      {root}
      {status ? (
        <span
          aria-label={statusLabel ?? messages[status]}
          className={cn(
            "sp-avatar-status",
            "absolute end-0 bottom-0 size-1/4 rounded-full",
            avatarStatusClassNames[status],
          )}
          data-slot="avatar-status"
          data-status={status}
          role="img"
        />
      ) : null}
      {badges}
    </span>
  );
}

export function AvatarImage({
  className,
  ...props
}: WithStringClassName<AvatarPrimitive.Image.Props>): React.ReactElement {
  return (
    <AvatarPrimitive.Image
      className={cn(slotClass("avatar-image", props), "size-full", className)}
      data-slot="avatar-image"
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: WithStringClassName<AvatarPrimitive.Fallback.Props>): React.ReactElement {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        slotClass("avatar-fallback", props),
        // It keeps the avatar's shape on its own, as the image does, also in
        // a root that leaves a corner mark unclipped.
        "flex size-full items-center justify-center overflow-hidden",
        className,
      )}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

export { AvatarPrimitive };
