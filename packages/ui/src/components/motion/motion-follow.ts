"use client";

import * as React from "react";

import {
  readReducedMotion,
  useReducedMotionPreference,
} from "../../system/motion/use-reduced-motion-preference";
import {
  ghostHolder,
  heightClipPath,
  inSecondFrame,
  keyframeTiming,
  motionGhostAttribute,
  pictureOf,
  type Place,
  planStack,
  playFromSecondFrame,
  type StackBlock,
} from "./motion-presence";

/**
 * How a container follows the height of what it holds when content comes and
 * goes: a swapped pane, a row of wrapping items, a panel that leaves while it
 * stays mounted. It is the one place that moves a container's height, so every
 * part and every component built on them moves it the same way.
 *
 * JavaScript measures and a CSS transition animates, as Base UI's Collapsible
 * and Accordion panels do with the height they measure: the container is held
 * at the height it showed, then given the height of its new content, and the
 * kit's follow rule in motion.css animates between the two. A transition starts
 * with the frame that renders it, however long the commit before that frame
 * took, so the first frame never shows the movement half done; a new height
 * that arrives mid-way retargets it from the height shown.
 */

export type FollowOptions = {
  /**
   * The element that takes over. It is observed until the follow is over, so
   * content that builds a frame later, such as a collection or an editor, is
   * followed instead of popping into place at the end.
   */
  enter?: Element | null;
  /**
   * Whether the container clips what it holds at its bottom edge, to the
   * height it shows, while it follows (the default; `heightClipPath`). An
   * Editable does not: its field's frame grows outward past the row, and every
   * side of it stays in sight.
   */
  clip?: boolean;
  /**
   * An element in the container that keeps the height of the new content
   * while the container follows, such as the scroll area of a popup's list,
   * which would otherwise fill or shrink with the container: what it holds is
   * laid out as it is at the end, so neither its scrolling nor its scrollbar
   * changes on the way.
   */
  hold?: HTMLElement | null;
};

export type HeightFollow = { stop: () => void };

/** The class of the follow rule (motion.css), while a container follows. */
export const heightFollowClassName = "sp-height-follow";

/**
 * The class of a container whose content swaps, such as a MotionSwap or an
 * Editable: its height follows over the whole swap, the base duration
 * (motion.css), where other follows take the expand duration (rulebook M8).
 */
export const swapContainerClassName = "sp-swap-container";

/** A follow that runs, with the height it heads for. */
type Running = HeightFollow & { target: () => number };

/** The follow that runs in a container, to end it before another starts. */
const follows = new Map<HTMLElement, Running>();

/**
 * How much taller the content of `element` will be than it shows now: the
 * containers that follow inside it head for heights they do not show yet. A
 * container that follows around them heads for the height its content will
 * have, not for the frame they are at (a group of tags that builds in a
 * swapped pane).
 */
function innerGrowth(element: Element): number {
  let growth = 0;
  for (const [inner, follow] of follows)
    if (inner !== element && element.contains(inner))
      growth += follow.target() - inner.getBoundingClientRect().height;
  return growth;
}

/** The longest duration of a computed `transition-duration` list, in ms. */
function longestDuration(value: string): number {
  return Math.max(
    0,
    ...value
      .split(",")
      .map(
        (part) =>
          Number.parseFloat(part) * (part.trim().endsWith("ms") ? 1 : 1000),
      )
      .filter(Number.isFinite),
  );
}

const nothing: HeightFollow = { stop: () => undefined };

/**
 * Moves the container from `from`, the height it showed before its content
 * changed, to the height of the new content, measured now in the commit that
 * changed it. The container is held at `from` for the frame that commit
 * renders, and the frame after hands it the new height, which the follow rule
 * animates (`inSecondFrame`). With an entering element the follow keeps
 * watching it: when it
 * grows or shrinks, the container heads for the new height from the one it
 * shows. That is read from the observed size alone, without releasing the
 * container, so following costs no extra layout. Everything the container is
 * given (height, clip, the class), and the size of the element it holds
 * (`hold`), is handed back when the height has arrived, so later changes flow
 * naturally. A container that scrolls keeps its own
 * height, and so does one that had no box before (`from` is `null`). A pane
 * that leaves is positioned by `holdPanePlace`, which lasts as long as the
 * pane and not as long as the height.
 */
export function followHeight(
  container: HTMLElement,
  from: number | null,
  { clip = true, enter, hold }: FollowOptions = {},
): HeightFollow {
  follows.get(container)?.stop();
  if (from === null || typeof requestAnimationFrame === "undefined") {
    return nothing;
  }
  const overflow = getComputedStyle(container);
  if (/auto|scroll/.test(overflow.overflowY)) return nothing;
  // A container that hides its overflow clips it on both axes while it
  // follows: clipping one axis alone computes back to hidden, which a script
  // can still scroll, as a list scrolls its highlighted option into view.
  const clipAcross = clip && overflow.overflowX === "hidden";

  // The element that keeps its size has the one of the new content, laid out
  // before the container is held.
  const held = hold
    ? {
        flex: hold.style.flex,
        height: hold.style.height,
        size: hold.getBoundingClientRect().height,
      }
    : undefined;
  if (hold && held) {
    hold.style.flex = "none";
    hold.style.height = `${held.size}px`;
  }

  // The commit has laid out the new content. Besides its height, the follow
  // keeps what the container holds around the entering element (a tab list,
  // padding), so that the container's height can be told from the entering
  // element's size later on.
  let target =
    container.getBoundingClientRect().height + innerGrowth(container);
  const around = enter
    ? target - enter.getBoundingClientRect().height - innerGrowth(enter)
    : 0;

  const kept = {
    clipPath: container.style.clipPath,
    flexShrink: container.style.flexShrink,
    height: container.style.height,
    overflowX: container.style.overflowX,
    overflowY: container.style.overflowY,
  };
  let pinned = false;
  let pinnedAt = from;
  let started = false;
  let done = false;
  let cancelHead: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // An entering element is watched; see `measured` below.
  const observer =
    enter && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measured)
      : undefined;

  // The container shows the height it had. What is taller is clipped at its
  // bottom edge only, so rings and focus rings that the content draws outside
  // its box at the top and the sides stay whole (`heightClipPath`); a
  // container that hides its overflow keeps clipping every side. A container
  // that is a flex item keeps that height too, where the column around it
  // would shrink it to its new content at once.
  const pin = (height: number) => {
    pinned = true;
    pinnedAt = height;
    container.classList.add(heightFollowClassName);
    if (clipAcross) {
      container.style.overflowX = "clip";
      container.style.overflowY = "clip";
    } else if (clip) {
      container.style.clipPath = heightClipPath;
    }
    container.style.flexShrink = "0";
    container.style.height = `${height}px`;
  };
  const release = () => {
    pinned = false;
    container.classList.remove(heightFollowClassName);
    container.style.clipPath = kept.clipPath;
    container.style.flexShrink = kept.flexShrink;
    container.style.height = kept.height;
    container.style.overflowX = kept.overflowX;
    container.style.overflowY = kept.overflowY;
  };
  const finish = () => {
    if (done) return;
    done = true;
    cancelHead?.();
    clearTimeout(timer);
    observer?.disconnect();
    container.removeEventListener("transitionend", arrived);
    release();
    if (hold && held) {
      hold.style.flex = held.flex;
      hold.style.height = held.height;
    }
    if (follows.get(container) === follow) follows.delete(container);
  };
  // The height has arrived when its transition ends.
  function arrived(event: Event) {
    if (
      event.target === container &&
      (event as TransitionEvent).propertyName === "height"
    )
      finish();
  }
  const follow: Running = { stop: finish, target: () => target };
  follows.set(container, follow);

  pin(from);
  // How long a move takes: the follow rule's duration, or what the app's own
  // transition on the container says. Nothing is held longer than that after
  // the last change, also when no transition runs to say it has ended.
  const duration = longestDuration(
    getComputedStyle(container).transitionDuration,
  );
  const settleBy = () => {
    clearTimeout(timer);
    timer = setTimeout(finish, duration + 100);
  };
  container.addEventListener("transitionend", arrived);
  settleBy();

  // The new height, which the rule animates from the one held. When nothing
  // moves, an entering element is still watched for as long as a move takes;
  // the container meanwhile has its own height again.
  const head = () => {
    cancelHead = undefined;
    if (done) return;
    if (!enter && Math.abs(target - from) < 1) {
      finish();
      return;
    }
    if (Math.abs(target - pinnedAt) < 1) release();
    else container.style.height = `${target}px`;
    settleBy();
  };

  if (!observer || !enter) {
    cancelHead = inSecondFrame(head);
    return follow;
  }
  observer.observe(enter);
  return follow;

  // With an entering element the height is held until that element has been
  // laid out once, at the end of the frame the commit renders: content that
  // builds a moment later (a collection, an editor) is then in place, and the
  // new height follows in the frame after. The observer only reads: after
  // layout, the sizes are known without forcing another layout.
  function measured() {
    if (done || !enter) return;
    // Held, the container shows its pin or the transition's frame; handed back,
    // it showed the height it settled at until this layout grew or shrank it.
    const shown = pinned ? container.getBoundingClientRect().height : target;
    const natural =
      enter.getBoundingClientRect().height + innerGrowth(enter) + around;
    // An entering element that fills all the room the container gives it may
    // be stretched to it (a Tabs panel grows into its root): its size says
    // nothing about its content until it no longer fits.
    const fills = Math.abs(natural - shown) < 1;
    if (!started) {
      started = true;
      if (!fills) target = natural;
      cancelHead = inNextFrame(head);
      return;
    }
    if (fills || Math.abs(natural - target) < 1) return;
    target = natural;
    if (cancelHead) return;
    if (pinned) {
      container.style.height = `${target}px`;
      settleBy();
    } else {
      // The container rests at its own height. Held at what it shows, it
      // heads for the new height in the next frame, so the move has a height
      // to start from.
      pin(shown);
      cancelHead = inNextFrame(head);
    }
  }
}

function inNextFrame(start: () => void): () => void {
  const id = requestAnimationFrame(start);
  return () => cancelAnimationFrame(id);
}

/**
 * Lets a container follow its height when its content changes. Returns
 * `follow`, to call in a layout effect in the commit that changes the content:
 * the container then moves from the height it showed before the commit to the
 * height of the new content. Does nothing when motion is reduced (M5), when the
 * container had no box (hidden) or when `enabled` is false.
 */
export function useHeightFollower(
  ref: React.RefObject<HTMLElement | null>,
  enabled = true,
): (options?: FollowOptions) => void {
  const reduced = useReducedMotionPreference();
  const instant = React.useRef(reduced);
  instant.current = reduced;
  const height = React.useRef<number | null>(null);
  const session = React.useRef<HeightFollow | null>(null);

  // The height at the last frame, including frames of a running follow. A
  // passive effect, because the container may be an ancestor, whose ref is set
  // after the layout effects of the component that follows it. The observer
  // reads in the rendering steps of a frame, from the first frame on, so the
  // height is one the page has shown: a commit that never reached the screen,
  // such as the empty first pass of a React Aria collection, is no height to
  // follow from.
  React.useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      height.current =
        element.getClientRects().length > 0
          ? element.getBoundingClientRect().height
          : null;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, ref]);

  React.useEffect(() => () => session.current?.stop(), []);

  return React.useCallback(
    (options?: FollowOptions) => {
      const container = ref.current;
      if (!enabled || !container || instant.current) return;
      // A follow that still runs shows its own height; at rest it is the one
      // seen at the last frame before this commit.
      const from = follows.has(container)
        ? container.getBoundingClientRect().height
        : height.current;
      session.current = followHeight(container, from, options);
    },
    [enabled, ref],
  );
}

/** Where a pane sits in its container. */
export type PanePlace = {
  height: number;
  left: number;
  top: number;
  width: number;
};

/** The style that keeps a leaving pane where it is, out of the flow. */
export function panePin(place: PanePlace): React.CSSProperties {
  return {
    height: place.height,
    left: place.left,
    margin: 0,
    position: "absolute",
    top: place.top,
    width: place.width,
  };
}

/** The containers panes are pinned in: how many, and the position they had. */
const placeHolders = new WeakMap<
  HTMLElement,
  { panes: number; position: string }
>();

/**
 * Makes the container the box a leaving pane is pinned against (`panePin`): a
 * container that is not positioned becomes `relative`. Returns the release, to
 * call when the pane is gone; the container gets its own position back when the
 * last pane pinned in it is gone. The hold lasts as long as the pane, which can
 * outlast its container's height follow.
 */
export function holdPanePlace(container: HTMLElement): () => void {
  const held = placeHolders.get(container);
  if (held) {
    held.panes += 1;
  } else {
    placeHolders.set(container, {
      panes: 1,
      position: container.style.position,
    });
    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
  }
  let released = false;
  return () => {
    const entry = placeHolders.get(container);
    if (released || !entry) return;
    released = true;
    entry.panes -= 1;
    if (entry.panes > 0) return;
    placeHolders.delete(container);
    container.style.position = entry.position;
  };
}

/**
 * The pane's place against the padding box of its container, where `panePin`
 * keeps it while it leaves.
 */
export function placeOf(pane: HTMLElement, container: HTMLElement): PanePlace {
  const box = pane.getBoundingClientRect();
  const containerBox = container.getBoundingClientRect();
  return {
    height: box.height,
    left:
      box.left -
      containerBox.left -
      container.clientLeft +
      container.scrollLeft,
    top: box.top - containerBox.top - container.clientTop + container.scrollTop,
    width: box.width,
  };
}

/**
 * A pane that leaves while it stays mounted, as a Base UI panel does until its
 * exit transition has run, instead of being replaced by a `MotionSwap` (which
 * would remount a pane that is kept mounted, together with the state in it).
 * `open` says the pane is shown, `leaving` that it is on its way out. The
 * returned style, for the pane while it leaves, keeps it where it was, out of
 * the flow and against its container until it is gone (`holdPanePlace`), so the
 * pane that takes over has the place and the pane's container follows the new
 * height over the expand duration (the follow rule in motion.css); the panel
 * switch rule (panelSwitchClassName) hides it at once. With reduced motion the
 * height changes at once (M5).
 * `enter` finds the pane that takes over in the container, so late content in it
 * is followed; give it a stable function.
 */
export function useLeavingPane(
  ref: React.RefObject<HTMLElement | null>,
  {
    enter,
    leaving,
    open,
  }: {
    enter?: (container: HTMLElement) => Element | null;
    leaving: boolean;
    open: boolean;
  },
): React.CSSProperties | undefined {
  const reduced = useReducedMotionPreference();
  const place = React.useRef<PanePlace | null>(null);
  // The container is the element the pane sits in.
  const container = React.useMemo(
    () => ({
      get current() {
        return ref.current?.parentElement ?? null;
      },
    }),
    [ref],
  );
  const follow = useHeightFollower(container);
  const latest = React.useRef({ enter, follow });
  latest.current = { enter, follow };

  // The pane leaves: it is pinned against its container until it is gone, and
  // the container follows from the height it had to the new one.
  React.useLayoutEffect(() => {
    const element = container.current;
    if (!leaving || reduced || !element || !place.current) return;
    const release = holdPanePlace(element);
    latest.current.follow({ enter: latest.current.enter?.(element) ?? null });
    return release;
  }, [container, leaving, reduced]);

  // At rest: where the pane sits, which is where it is pinned when it leaves.
  React.useLayoutEffect(() => {
    const pane = ref.current;
    const element = pane?.parentElement;
    if (!open || !pane || !element || typeof ResizeObserver === "undefined") {
      return;
    }
    place.current = placeOf(pane, element);
    const observer = new ResizeObserver(() => {
      place.current = placeOf(pane, element);
    });
    observer.observe(pane);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open, ref]);

  if (!leaving) return undefined;
  if (reduced) return { display: "none" };
  return place.current ? panePin(place.current) : undefined;
}

/**
 * The motion of a list in a popup whose options change while it is open, as
 * those of a Combobox, an Autocomplete and a Command palette do when a search
 * filters them or a chosen option leaves (rulebook M6, M7). The options, group
 * labels and separators of the list and the blocks of the popup beside it,
 * such as a header, the empty state and a footer, move as one stack
 * (`planStack`): an option that leaves fades and closes its row where it was,
 * the rows below glide up, an option that comes back opens its row and fades
 * in, and the empty state comes and goes the same way. The popup follows its
 * height over the same step (`followHeight`): a list that grows keeps its new
 * size while the popup opens over it, and a list that shrinks fills the popup
 * while it closes, so the list never scrolls on the way and its scroll area
 * measures nothing that only moves. A row that comes from beyond the bottom of
 * the scroll area glides as a picture (`standIns`). Everything takes the expand
 * duration on the standard curve from the second frame
 * (`playFromSecondFrame`), so the rows, the pictures and the popup's edge stay
 * together.
 *
 * Base UI drops an option that leaves at once, so the keyboard, the highlight
 * and `aria-activedescendant` only ever meet the options that are there. What
 * closes is a picture of it (`pictureOf`) in a ghost holder, which is hidden
 * from assistive technology, inert and takes no pointer, and is removed when
 * it has closed. A change that arrives on the way carries every row, picture
 * and the popup's edge on from where it is seen. Opening and closing are the
 * popup's own motion, and nothing moves while it plays them; with reduced
 * motion everything changes at once (M5).
 */
export type PopupListMotionProps = {
  /**
   * What the options are made of, such as Base UI's filtered items and the
   * list's children: a change of any of them may change the options.
   */
  change: readonly unknown[];
  reduced: boolean;
  /**
   * The element that shows the list in the popup, its scroll area. Its parent
   * is the popup, or the panel the list fills, whose height follows.
   */
  scrollArea: () => HTMLElement | null;
};

/**
 * A block of a popup as it is seen, against the padding box of the popup
 * (`placeIn`): its box, and how much of its height shows and how opaque it is,
 * less while it opens or closes.
 */
type SeenBlock = {
  element: HTMLElement;
  /** It is a row of the list, which its scroll area clips. */
  inList: boolean;
  /** Whether it still plays the motion of a step. */
  moving: boolean;
  opacity: number;
  /** The picture of a status, such as the empty state, whose text may go. */
  picture: HTMLElement | undefined;
  place: Place;
  shown: number;
};

/** The picture of a block that has left, closing where the stack has it. */
type Ghost = {
  animation: Animation | null;
  element: HTMLElement;
  /**
   * What takes the picture over when it comes back while the picture still
   * closes: the text of a row, as Base UI mounts a new element for an option
   * that returns, or the status whose text it shows.
   */
  match: unknown;
  /** Where it stands against the popup: the box the block had. */
  place: Place;
};

type PopupListSnapshot = {
  blocks: SeenBlock[];
  frame: HTMLElement;
  frameHeight: number;
  ghosts: Array<{ ghost: Ghost; opacity: number; shown: number; top: number }>;
  list: HTMLElement;
  area: HTMLElement;
  areaPlace: Place;
};

/** The pictures that still close in a popup. */
const popupGhosts = new WeakMap<HTMLElement, Set<Ghost>>();
/** The glide and the presence a row of a popup list plays. */
const blockMotion = new WeakMap<Element, Animation[]>();
/**
 * The picture that glides for a row of the list while the row waits in its
 * place, hidden: a row that comes from beyond the bottom of the list's scroll
 * area. Moved itself, the row would reach past that edge and the scroll area
 * would measure the reach as content to scroll (Base UI's ScrollArea measures
 * its overflow when the list resizes, not when a move ends); the picture
 * glides in the clipped holder instead, which stands for the edge.
 */
const standIns = new WeakMap<Element, HTMLElement>();
/** The release of the place a holder keeps for its pictures (`holdPanePlace`). */
const holderPlaces = new WeakMap<HTMLElement, () => void>();

/**
 * Where an element is seen against the padding box of the popup, where an
 * absolute child sits, in the popup's content, so a picture placed there
 * stands where the element was seen.
 */
function placeIn(
  element: Element,
  frame: HTMLElement,
  frameBox: DOMRect,
): Place {
  const box = element.getBoundingClientRect();
  return {
    height: box.height,
    left: box.left - frameBox.left - frame.clientLeft + frame.scrollLeft,
    top: box.top - frameBox.top - frame.clientTop + frame.scrollTop,
    width: box.width,
  };
}

/** How much of a block's height the bottom of an `inset()` clip hides. */
export function hiddenBelow(clipPath: string): number {
  const inset = /^inset\((.*)\)$/.exec(clipPath.trim());
  if (!inset) return 0;
  const sides = inset[1]!
    .split(/\s+round\s+/)[0]!
    .trim()
    .split(/\s+/);
  return Number.parseFloat(sides[2] ?? sides[0] ?? "") || 0;
}

/**
 * The blocks of a popup that stack, from the top: the rows of its list (its
 * options, group labels and separators, inside its groups) and the blocks
 * beside the list, such as a header, the empty state and a footer. A block out
 * of the flow, such as a status for screen readers only, takes no part.
 */
function stackParts(
  frame: HTMLElement,
  area: HTMLElement,
  list: HTMLElement,
): Array<{ element: HTMLElement; inList: boolean }> {
  const parts: Array<{ element: HTMLElement; inList: boolean }> = [];
  const rows = (parent: Element) => {
    for (const child of parent.children) {
      if (child.getAttribute("role") === "group") rows(child);
      else parts.push({ element: child as HTMLElement, inList: true });
    }
  };
  for (const child of frame.children) {
    if (child.hasAttribute(motionGhostAttribute)) continue;
    if (child === area || child.contains(list)) rows(list);
    else if (!/absolute|fixed/.test(getComputedStyle(child).position))
      parts.push({ element: child as HTMLElement, inList: false });
  }
  return parts;
}

/**
 * The list a popup list motion follows, in the element that shows it: the
 * listbox or grid inside it, or the element itself when it names itself the
 * list (`data-popup-list`), as the rows of a Menu with a search field do,
 * whose role is the popup's own.
 */
function listIn(area: HTMLElement): HTMLElement | null {
  return (
    area.querySelector<HTMLElement>('[role="listbox"], [role="grid"]') ??
    (area.hasAttribute("data-popup-list") ? area : null)
  );
}

/**
 * Whether the popup plays its own motion, opening or closing, or is hidden:
 * then its list changes at once.
 */
function opensOrCloses(frame: HTMLElement): boolean {
  return (
    Boolean(
      frame.closest(
        "[data-starting-style], [data-ending-style], [data-closed]",
      ),
    ) || frame.getClientRects().length === 0
  );
}

/**
 * How the popup and its blocks are seen before a commit, or null when nothing
 * moves: without a popup that shows, while it opens or closes, and with
 * reduced motion.
 */
function snapshotPopupList(area: HTMLElement | null): PopupListSnapshot | null {
  const frame = area?.parentElement;
  const list = area && listIn(area);
  if (!area || !frame || !list || typeof frame.animate !== "function")
    return null;
  if (opensOrCloses(frame) || readReducedMotion(frame)) return null;
  const frameBox = frame.getBoundingClientRect();
  const blocks = stackParts(frame, area, list).map(
    ({ element, inList }): SeenBlock => {
      const moving = (blockMotion.get(element) ?? []).some(
        (animation) => animation.playState !== "finished",
      );
      // A row that still opens shows part of its height, as faded as it is; a
      // row whose picture glides for it is seen where its picture is.
      const standIn = moving ? standIns.get(element) : undefined;
      const seenAs = standIn?.isConnected ? standIn : element;
      const place = placeIn(seenAs, frame, frameBox);
      const style = moving ? getComputedStyle(seenAs) : undefined;
      return {
        element,
        inList,
        moving,
        opacity: style ? Number(style.opacity) : 1,
        // A status's text is gone after the commit; its picture is taken now.
        picture:
          element.getAttribute("role") === "status" && place.height > 0
            ? (element.cloneNode(true) as HTMLElement)
            : undefined,
        place,
        shown: style
          ? Math.max(0, place.height - hiddenBelow(style.clipPath))
          : place.height,
      };
    },
  );
  const ghosts = [...(popupGhosts.get(frame) ?? [])].map((ghost) => {
    const style = getComputedStyle(ghost.element);
    const place = placeIn(ghost.element, frame, frameBox);
    return {
      ghost,
      opacity: Number(style.opacity),
      shown: Math.max(0, place.height - hiddenBelow(style.clipPath)),
      top: place.top,
    };
  });
  return {
    blocks,
    frame,
    frameHeight: frameBox.height,
    ghosts,
    list,
    area,
    areaPlace: placeIn(area, frame, frameBox),
  };
}

/** Removes a picture, and its holder once it holds no other. */
function dropPicture(picture: HTMLElement) {
  const holder = picture.parentElement;
  picture.remove();
  if (!holder || holder.childElementCount > 0) return;
  holder.remove();
  holderPlaces.get(holder)?.();
}

/** Stops the motion a row still plays; it goes on from where it is seen. */
function stopBlock(element: Element) {
  for (const animation of blockMotion.get(element) ?? []) animation.cancel();
  blockMotion.delete(element);
  const standIn = standIns.get(element);
  standIns.delete(element);
  if (standIn) dropPicture(standIn);
}

function removeGhost(frame: HTMLElement, ghost: Ghost) {
  popupGhosts.get(frame)?.delete(ghost);
  dropPicture(ghost.element);
}

/** Plays one step of a popup list: the follow, the rows and the pictures. */
function playPopupList(before: PopupListSnapshot) {
  const { frame, list, area } = before;
  // The commit can close the popup, as choosing an option of a single
  // Combobox does: its list then changes with it, at once.
  if (!frame.isConnected || !list.isConnected || opensOrCloses(frame)) return;
  // What a row still plays from the last step goes on from where it is seen.
  for (const block of before.blocks) stopBlock(block.element);
  // The popup follows its height. A list that grows keeps the size it has now,
  // so the popup held at its old height does not make it scroll on the way; a
  // list that shrinks fills the popup on the way, so what glides up into its
  // place shows inside it.
  const grows =
    area.getBoundingClientRect().height > before.areaPlace.height + 0.5;
  followHeight(frame, before.frameHeight, { hold: grows ? area : null });
  const frameBox = frame.getBoundingClientRect();
  const now = new Map(
    stackParts(frame, area, list).map(({ element, inList }) => [
      element,
      { inList, place: placeIn(element, frame, frameBox) },
    ]),
  );

  // A row or a status's text that comes back while its picture still closes
  // takes the picture's place and opens on from what it shows, so a change of
  // course never opens a second copy beside the first.
  const live = new Map<unknown, PopupListSnapshot["ghosts"][number]>();
  for (const entry of before.ghosts)
    if (!live.has(entry.ghost.match)) live.set(entry.ghost.match, entry);
  const seenBlocks = new Map(before.blocks.map((seen) => [seen.element, seen]));
  const taken = new Set<Ghost>();
  const back: SeenBlock[] = [];
  for (const [element, { inList, place }] of now) {
    const seen = seenBlocks.get(element);
    const match =
      element.getAttribute("role") === "status"
        ? seen && seen.shown < 0.5 && place.height > 0.5
          ? element
          : undefined
        : !seen && inList
          ? element.textContent
          : undefined;
    const entry = match === undefined ? undefined : live.get(match);
    if (!entry) continue;
    live.delete(match);
    taken.add(entry.ghost);
    const picked = {
      moving: true,
      opacity: entry.opacity,
      place: { ...entry.ghost.place, top: entry.top },
      shown: entry.shown,
    };
    if (seen) Object.assign(seen, picked);
    else back.push({ element, inList, picture: undefined, ...picked });
  }

  // Every block has a key: a row, a picture that closes, or a status's text.
  type Item =
    | { kind: "row"; element: HTMLElement; seen: SeenBlock | undefined }
    | { kind: "left"; seen: SeenBlock; source: HTMLElement }
    | { ghost: Ghost; kind: "ghost"; opacity: number };
  const items = new Map<number, Item>();
  const keyOf = (item: Item) => {
    items.set(items.size, item);
    return items.size - 1;
  };
  const keys = new Map<HTMLElement, number>();
  const old: StackBlock[] = [];
  for (const seen of [...before.blocks, ...back]) {
    const stays = now.get(seen.element);
    // A status whose text is gone leaves as the picture taken before.
    const textLeft =
      stays && seen.picture && seen.shown > 0.5 && stays.place.height < 0.5;
    const key = keyOf(
      stays
        ? { element: seen.element, kind: "row", seen }
        : { kind: "left", seen, source: seen.element },
    );
    if (stays) keys.set(seen.element, key);
    old.push({
      height: textLeft ? 0 : seen.shown,
      key,
      top: seen.place.top,
    });
    if (textLeft)
      old.push({
        height: seen.shown,
        key: keyOf({ kind: "left", seen, source: seen.picture! }),
        top: seen.place.top,
      });
  }
  for (const { ghost, opacity, shown, top } of before.ghosts) {
    // A picture that has closed or been taken over is gone; the others close
    // on from here.
    if (taken.has(ghost) || shown < 0.5 || opacity < 0.01)
      removeGhost(frame, ghost);
    else
      old.push({
        height: shown,
        key: keyOf({ ghost, kind: "ghost", opacity }),
        top,
      });
  }
  old.sort((a, b) => a.top - b.top);
  const next = [...now]
    .map(([element, { place }]) => ({
      height: place.height,
      key:
        keys.get(element) ?? keyOf({ element, kind: "row", seen: undefined }),
      top: place.top,
    }))
    .sort((a, b) => a.top - b.top);

  // A row of the list shows inside its scroll area, before or after the step.
  const areaNow = placeIn(area, frame, frameBox);
  const listBox: Place = {
    height:
      Math.max(
        before.areaPlace.top + before.areaPlace.height,
        areaNow.top + areaNow.height,
      ) - Math.min(before.areaPlace.top, areaNow.top),
    left: areaNow.left,
    top: Math.min(before.areaPlace.top, areaNow.top),
    width: areaNow.width,
  };
  const shows = (inList: boolean, top: number, height: number) =>
    !inList ||
    (top + height >= listBox.top && top <= listBox.top + listBox.height);
  // How far down the list's scroll area shows or scrolls on the way: a row
  // moved past both would make it scroll further.
  const listNow = placeIn(list, frame, frameBox);
  const edge = Math.max(
    areaNow.top + areaNow.height,
    listNow.top + listNow.height,
  );

  const timing = keyframeTiming(
    frame,
    "--motion-duration-expand",
    "--motion-ease-standard",
  );
  const inset = (hidden: number) =>
    `inset(0px 0px ${Math.max(0, hidden)}px 0px)`;
  const holders = new Map<boolean, { element: HTMLElement; place: Place }>();
  const holderFor = (inList: boolean) => {
    const held = holders.get(inList);
    if (held) return held;
    // The pictures of rows are clipped by the list's scroll area, the others by
    // the popup.
    const place: Place = inList
      ? listBox
      : {
          height: frame.clientHeight,
          left: frame.scrollLeft,
          top: frame.scrollTop,
          width: frame.clientWidth,
        };
    const element = ghostHolder(frame, place, inList);
    holderPlaces.set(element, holdPanePlace(frame));
    const holder = { element, place };
    holders.set(inList, holder);
    return holder;
  };
  /** A picture of `source` standing at `at` in the holder it belongs in. */
  const placePicture = (source: HTMLElement, at: Place, inList: boolean) => {
    const holder = holderFor(inList);
    const picture = pictureOf(source, {
      ...at,
      left: at.left - holder.place.left,
      top: at.top - holder.place.top,
    });
    // A picture is no option and no live region, also for what looks for
    // either by its role.
    for (const part of [
      picture,
      ...picture.querySelectorAll("[role], [tabindex], [aria-live]"),
    ])
      for (const name of ["role", "tabindex", "aria-live", "aria-atomic"])
        part.removeAttribute(name);
    holder.element.append(picture);
    return picture;
  };

  for (const move of planStack(old, next)) {
    const item = items.get(move.key as number)!;
    if (item.kind === "row") {
      const { element, seen } = item;
      const { inList, place } = now.get(element)!;
      if (
        !shows(inList, move.from.top, move.from.height) &&
        !shows(inList, move.to.top, move.to.height)
      )
        continue;
      const x = seen ? seen.place.left - place.left : 0;
      const y = move.from.top - move.to.top;
      const glides = Math.abs(x) >= 0.5 || Math.abs(y) >= 0.5;
      // A row that opens shows from its top down and fades in; one that was
      // opening goes on from what it showed.
      const opens = move.from.height < place.height - 0.5;
      const rest =
        opens || seen?.moving ? Number(getComputedStyle(element).opacity) : 1;
      const from = !seen || move.from.height < 0.5 ? 0 : seen.opacity;
      const fades = opens || Math.abs(from - rest) > 0.01;
      const shown = {
        clipPath: inset(place.height - move.from.height),
        opacity: Math.min(from, rest),
      };
      if (inList && glides && move.from.top + place.height > edge + 0.5) {
        // From beyond the scroll area's edge, its picture glides in for it.
        const picture = placePicture(element, place, true);
        playFromSecondFrame(
          picture,
          [
            { ...shown, translate: `${x}px ${y}px` },
            { clipPath: inset(0), opacity: rest, translate: "0px 0px" },
          ],
          { ...timing, fill: "forwards" },
        );
        const wait = playFromSecondFrame(
          element,
          [{ opacity: 0 }, { opacity: 0 }],
          timing,
        );
        wait.onfinish = () => {
          if (standIns.get(element) !== picture) return;
          standIns.delete(element);
          dropPicture(picture);
        };
        standIns.set(element, picture);
        blockMotion.set(element, [wait]);
        continue;
      }
      const animations: Animation[] = [];
      if (glides)
        animations.push(
          playFromSecondFrame(
            element,
            [{ translate: `${x}px ${y}px` }, { translate: "0px 0px" }],
            { ...timing, composite: "add" },
          ),
        );
      if (fades)
        animations.push(
          playFromSecondFrame(
            element,
            [shown, { clipPath: inset(0), opacity: rest }],
            timing,
          ),
        );
      if (animations.length > 0) blockMotion.set(element, animations);
      continue;
    }

    let ghost: Ghost;
    let opacity: number;
    if (item.kind === "ghost") {
      ({ ghost, opacity } = item);
    } else {
      const { seen, source } = item;
      if (!shows(seen.inList, move.from.top, move.from.height)) continue;
      const element = placePicture(source, seen.place, seen.inList);
      ghost = {
        animation: null,
        element,
        match: source === seen.element ? source.textContent : seen.element,
        place: seen.place,
      };
      if (!popupGhosts.has(frame)) popupGhosts.set(frame, new Set());
      popupGhosts.get(frame)!.add(ghost);
      opacity = Number(getComputedStyle(element).opacity);
    }
    // It closes from its top down and fades out, gliding where the stack
    // closes over it; a picture that was closing goes on from where it is.
    const running = ghost.animation;
    ghost.animation = null;
    running?.cancel();
    const animation = playFromSecondFrame(
      ghost.element,
      [
        {
          clipPath: inset(ghost.place.height - move.from.height),
          opacity,
          translate: `0px ${move.from.top - ghost.place.top}px`,
        },
        {
          clipPath: inset(ghost.place.height),
          opacity: 0,
          translate: `0px ${move.to.top - ghost.place.top}px`,
        },
      ],
      { ...timing, fill: "forwards" },
    );
    ghost.animation = animation;
    const gone = () => {
      if (ghost.animation === animation) removeGhost(frame, ghost);
    };
    animation.onfinish = gone;
    animation.oncancel = gone;
  }

  // A popup can close a commit after its options changed, as a Combobox does
  // when an option is chosen while a search is typed. The step then ends at
  // once, in the frame it would have started in, and the popup closes as it
  // always does.
  inSecondFrame(() => {
    if (!opensOrCloses(frame)) return;
    for (const element of now.keys()) stopBlock(element);
    for (const ghost of [...(popupGhosts.get(frame) ?? [])])
      removeGhost(frame, ghost);
    follows.get(frame)?.stop();
  });
}

/** Whether two lists hold the same values, one by one. */
function sameValues(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Plays the motion of a list in a popup whose options change while it is open
 * (see `PopupListMotionProps`). It measures the popup before the commit that
 * changes the options, as `GlideOnChange` measures a set, and plays the step
 * after it; it renders nothing, so the markup of the list stays the same, on
 * the server too. The lifecycle methods are marked `override`, so an app that
 * compiles the installed source with `noImplicitOverride` passes.
 */
export class PopupListMotion extends React.Component<PopupListMotionProps> {
  override getSnapshotBeforeUpdate(
    previous: Readonly<PopupListMotionProps>,
  ): PopupListSnapshot | null {
    if (this.props.reduced || sameValues(previous.change, this.props.change))
      return null;
    return snapshotPopupList(this.props.scrollArea());
  }

  override componentDidUpdate(
    _previous: Readonly<PopupListMotionProps>,
    _state: unknown,
    before: PopupListSnapshot | null,
  ): void {
    if (before) playPopupList(before);
  }

  override render(): null {
    return null;
  }
}
