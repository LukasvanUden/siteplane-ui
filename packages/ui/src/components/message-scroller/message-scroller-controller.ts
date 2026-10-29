import { readReducedMotion } from "../../system/motion/use-reduced-motion-preference";
import {
  anchorScrollTop,
  isAtEdge,
  keyScrollsTowardStart,
  maxScrollTop,
  openingScrollTop,
  prependScrollTop,
  scrollableEdges,
  shouldFollow,
  spacerHeight,
  touchScrollsTowardStart,
  wheelScrollsTowardStart,
  type ScrollMetrics,
  type ScrollPosition,
} from "./message-scroller-math";

/**
 * The scroll behavior of a Message Scroller. It lives outside React: a scroll
 * event, a resize or an arriving row is handled here, on the DOM, and React
 * hears of it only when the two `scrollable` flags change (the hot path
 * renders nothing). The component creates one controller, hands it the
 * viewport, the content and the spacer through ref callbacks and calls the
 * methods the hook exposes.
 *
 * What it does, in the words of the plan:
 * - opens at the position the app chose (`defaultScrollPosition`);
 * - lets a row that starts a turn (`data-scroll-anchor`) settle near the top,
 *   with room below it (the spacer) until the reply fills the viewport;
 * - follows a growing thread (`autoScroll`) only while the reader has not
 *   scrolled away from the live edge: a wheel turn, a touch drag, a key, a
 *   scrollbar press or a jump to a message releases it, and reaching the end
 *   again takes it up;
 * - keeps the row the reader looks at in place when rows are added above it.
 */

export type MessageScrollerBehavior = {
  autoScroll: boolean;
  defaultScrollPosition: ScrollPosition;
  preserveScrollOnPrepend: boolean;
  scrollEdgeThreshold: number;
  scrollPreviousItemPeek: number;
};

export type ScrollToOptions = { behavior?: ScrollBehavior | undefined };

/** The edges the viewport can still scroll toward. */
export type Scrollable = { end: boolean; start: boolean };

const itemSlot = "message-scroller-item";
const scrollbarSlot = "scroll-area-scrollbar";

/** How long the scroller waits for a smooth scroll before it stops waiting, in ms. */
const smoothScrollLimit = 1200;
/** How long a thread that has just opened keeps its place while it settles, in ms. */
const openingWindow = 1000;

function isItem(element: Element): element is HTMLElement {
  return element.getAttribute("data-slot") === itemSlot;
}

function isAnchor(element: Element): boolean {
  return element.hasAttribute("data-scroll-anchor");
}

function previousItem(item: Element): HTMLElement | null {
  let sibling = item.previousElementSibling;
  while (sibling && !isItem(sibling)) sibling = sibling.previousElementSibling;
  return sibling as HTMLElement | null;
}

/** Text fields keep their arrow keys: they move a caret, not the thread. */
function isEditable(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element.tagName !== "string") return false;
  return (
    element.isContentEditable === true ||
    /^(?:input|select|textarea)$/i.test(element.tagName)
  );
}

function isScrollbar(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return (
    typeof element?.closest === "function" &&
    element.closest(`[data-slot="${scrollbarSlot}"]`) !== null
  );
}

export class MessageScrollerController {
  /**
   * Whether a row that mounts now arrived after the thread opened and so
   * enters. False on the server, while the thread mounts and for the first
   * frame after it.
   */
  ready = false;

  /** The edges the viewport can still scroll toward, as last told. */
  scrollable: Scrollable = { end: false, start: false };

  private options: MessageScrollerBehavior;
  private readonly onScrollable: (next: Scrollable) => void;

  private viewport: HTMLElement | null = null;
  private root: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private spacer: HTMLElement | null = null;
  private spacerPx = 0;

  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  /** Rows the scroller has seen, to tell the rows that arrive from the rest. */
  private known = new WeakSet<Element>();
  /** The row that started the turn the viewport last settled on. */
  private hold: HTMLElement | null = null;
  /** The viewport as it was when it last changed, before a commit moves it. */
  private snapshot = { scrollHeight: 0, scrollTop: 0 };

  /** Whether the reader is at the live edge and has not scrolled away since. */
  private following = true;
  /** Whether the thread has just opened and keeps its position while it settles. */
  private opening = false;
  private openingTimer: ReturnType<typeof setTimeout> | undefined;
  private frame = 0;
  private opened = false;

  /** A smooth scroll of our own that is on its way. */
  private smooth: {
    target: number;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;
  private touchStartY = 0;

  constructor(
    options: MessageScrollerBehavior,
    onScrollable: (next: Scrollable) => void,
  ) {
    this.options = options;
    this.onScrollable = onScrollable;
  }

  configure(options: MessageScrollerBehavior): void {
    this.options = options;
    if (this.opened) this.syncScrollable();
  }

  // ---------------------------------------------------------------------------
  // The elements

  attachViewport(element: HTMLElement | null): void {
    if (element === this.viewport) return;
    this.detachViewport();
    this.viewport = element;
    if (!element) return;
    this.root = element.parentElement;
    element.addEventListener("scroll", this.onScroll, { passive: true });
    element.addEventListener("scrollend", this.onScrollEnd, { passive: true });
    element.addEventListener("wheel", this.onWheel, { passive: true });
    element.addEventListener("touchstart", this.onTouchStart, {
      passive: true,
    });
    element.addEventListener("touchmove", this.onTouchMove, { passive: true });
    element.addEventListener("keydown", this.onKeyDown);
    // The scrollbars are siblings of the viewport, children of the root.
    this.root?.addEventListener("pointerdown", this.onPointerDown, {
      passive: true,
    });
    this.observe();
    this.openWhenReady();
  }

  attachContent(element: HTMLElement | null): void {
    if (element === this.content) return;
    this.detachContent();
    this.content = element;
    if (!element) return;
    this.observe();
    this.openWhenReady();
  }

  attachSpacer(element: HTMLElement | null): void {
    this.spacer = element;
    if (element) element.style.height = `${this.spacerPx}px`;
  }

  dispose(): void {
    this.attachViewport(null);
    this.attachContent(null);
    this.attachSpacer(null);
  }

  private detachViewport(): void {
    const viewport = this.viewport;
    if (viewport) {
      viewport.removeEventListener("scroll", this.onScroll);
      viewport.removeEventListener("scrollend", this.onScrollEnd);
      viewport.removeEventListener("wheel", this.onWheel);
      viewport.removeEventListener("touchstart", this.onTouchStart);
      viewport.removeEventListener("touchmove", this.onTouchMove);
      viewport.removeEventListener("keydown", this.onKeyDown);
    }
    this.root?.removeEventListener("pointerdown", this.onPointerDown);
    this.finishSmoothScroll(false);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.frame && typeof cancelAnimationFrame !== "undefined")
      cancelAnimationFrame(this.frame);
    this.frame = 0;
    clearTimeout(this.openingTimer);
    this.openingTimer = undefined;
    this.opening = false;
    this.viewport = null;
    this.root = null;
    this.opened = false;
    this.ready = false;
  }

  private detachContent(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.content = null;
    this.hold = null;
    this.opened = false;
  }

  /** Watches the viewport and the content for size changes, and the content for rows. */
  private observe(): void {
    const { content, viewport } = this;
    if (!viewport || !content) return;
    if (typeof ResizeObserver !== "undefined" && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.layoutChanged());
      this.resizeObserver.observe(viewport);
      this.resizeObserver.observe(content);
    }
    if (typeof MutationObserver !== "undefined" && !this.mutationObserver) {
      // Only the rows: text that streams into a row changes nothing here.
      this.mutationObserver = new MutationObserver(() => this.itemsChanged());
      this.mutationObserver.observe(content, { childList: true });
    }
  }

  // ---------------------------------------------------------------------------
  // Opening

  private openWhenReady(): void {
    if (!this.opened && this.viewport && this.content) this.open();
  }

  private open(): void {
    const { viewport } = this;
    if (!viewport || !this.content) return;
    this.opened = true;
    this.hold = null;
    this.setSpacer(0);
    this.known = new WeakSet(this.items());
    this.applyOpening();
    // A thread that opens at the start or in the middle is not at the live edge.
    this.following = isAtEdge(
      this.metrics(),
      "end",
      this.options.scrollEdgeThreshold,
    );
    this.opening = true;
    if (this.openingTimer) clearTimeout(this.openingTimer);
    this.openingTimer = setTimeout(() => {
      this.opening = false;
    }, openingWindow);
    this.syncScrollable();
    this.remember();
    this.markReady();
  }

  /** Puts the viewport where the thread opens. */
  private applyOpening(): void {
    const { viewport } = this;
    if (!viewport) return;
    const last = this.items().filter(isAnchor).at(-1);
    const top = openingScrollTop({
      anchor: last
        ? { target: this.anchorTarget(last), top: this.topOf(last) }
        : undefined,
      metrics: this.metrics(),
      position: this.options.defaultScrollPosition,
    });
    if (Math.abs(top - viewport.scrollTop) >= 1) this.jump(top);
  }

  private markReady(): void {
    if (typeof requestAnimationFrame === "undefined") {
      this.ready = true;
      return;
    }
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.ready = true;
    });
  }

  // ---------------------------------------------------------------------------
  // Reading the layout

  private metrics(): ScrollMetrics {
    const viewport = this.viewport!;
    return {
      clientHeight: viewport.clientHeight,
      scrollHeight: viewport.scrollHeight,
      scrollTop: viewport.scrollTop,
    };
  }

  private items(): HTMLElement[] {
    return this.content ? Array.from(this.content.children).filter(isItem) : [];
  }

  /**
   * Where a row starts in the viewport's scroll space. A row's offset is the
   * layout position, which an entering row's transform does not move, from the
   * content, which is the row's offset parent.
   */
  private topOf(item: HTMLElement): number {
    const viewport = this.viewport!;
    const content = this.content!;
    const contentTop =
      content.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top -
      viewport.clientTop +
      viewport.scrollTop;
    return contentTop + content.clientTop + item.offsetTop;
  }

  /** Where a turn that starts at `item` settles: near the top, with the peek above it. */
  private anchorTarget(item: HTMLElement): number {
    const previous = previousItem(item);
    return previous
      ? Math.max(
          0,
          anchorScrollTop(
            this.topOf(item),
            previous.offsetHeight,
            this.options.scrollPreviousItemPeek,
          ),
        )
      : 0;
  }

  private remember(metrics: ScrollMetrics = this.metrics()): void {
    this.snapshot = {
      scrollHeight: metrics.scrollHeight,
      scrollTop: metrics.scrollTop,
    };
  }

  // ---------------------------------------------------------------------------
  // Moving the viewport

  /** Moves at once, also where the page asks for smooth scrolling. */
  private jump(top: number): void {
    this.viewport?.scrollTo({ behavior: "instant", top });
    this.remember();
  }

  /**
   * Scrolls to `top`: smoothly unless the caller or reduced motion (M5) asks
   * for an instant jump. A smooth scroll marks the root `data-autoscrolling`
   * until it arrives.
   */
  private go(top: number, behavior: ScrollBehavior | undefined): void {
    const { viewport } = this;
    if (!viewport) return;
    const target = Math.min(Math.max(0, top), maxScrollTop(this.metrics()));
    this.finishSmoothScroll(false);
    const smooth =
      (behavior ?? "smooth") === "smooth" && !readReducedMotion(viewport);
    if (!smooth || Math.abs(target - viewport.scrollTop) < 1) {
      this.jump(target);
      return;
    }
    this.smooth = {
      target,
      timer: setTimeout(() => this.finishSmoothScroll(true), smoothScrollLimit),
    };
    this.mark(true);
    viewport.scrollTo({ behavior: "smooth", top: target });
  }

  private finishSmoothScroll(resume: boolean): void {
    if (!this.smooth) return;
    clearTimeout(this.smooth.timer);
    this.smooth = null;
    this.mark(false);
    if (resume) this.followIfNeeded();
  }

  /** `data-autoscrolling` on the root and the viewport while a smooth scroll runs. */
  private mark(on: boolean): void {
    this.viewport?.toggleAttribute("data-autoscrolling", on);
    this.root?.toggleAttribute("data-autoscrolling", on);
  }

  // ---------------------------------------------------------------------------
  // Following

  /** The reader scrolled away, or jumped: stop carrying the viewport along. */
  private release(): void {
    this.following = false;
    this.opening = false;
    this.finishSmoothScroll(false);
  }

  private followIfNeeded(): void {
    if (!this.viewport || this.smooth) return;
    if (this.opening) {
      // A thread that has just opened keeps its place while images and fonts
      // settle, whatever `autoScroll` says: nobody has read it yet.
      this.applyOpening();
      return;
    }
    if (
      !shouldFollow({
        autoScroll: this.options.autoScroll,
        following: this.following,
      })
    )
      return;
    const top = maxScrollTop(this.metrics());
    if (Math.abs(top - this.viewport.scrollTop) >= 1) this.jump(top);
  }

  /** The size of the viewport or of the thread changed: before the next paint. */
  layoutChanged(): void {
    if (!this.viewport) return;
    this.updateSpacer();
    this.followIfNeeded();
    this.syncScrollable();
    this.remember();
  }

  // ---------------------------------------------------------------------------
  // The room below a turn

  private setSpacer(height: number): void {
    this.spacerPx = height;
    if (this.spacer) this.spacer.style.height = `${height}px`;
  }

  /**
   * A turn settles near the top of the viewport, which needs room below its
   * last row. The spacer gives it: it fills what the viewport could not
   * otherwise scroll past, shrinks as the reply grows and is gone when the
   * reply fills the viewport.
   */
  private updateSpacer(): void {
    const { viewport } = this;
    if (!viewport) return;
    if (this.hold && !this.hold.isConnected) this.hold = null;
    // Nothing settled, nothing to size: no layout is read.
    if (!this.hold && this.spacerPx === 0) return;
    const height = this.hold
      ? spacerHeight(
          this.anchorTarget(this.hold),
          viewport.clientHeight,
          // The height of the rows alone, without the room that is there now.
          viewport.scrollHeight - this.spacerPx,
        )
      : 0;
    if (height !== this.spacerPx) this.setSpacer(height);
  }

  /** A row that starts a turn arrived at the end: settle it near the top. */
  private settle(anchor: HTMLElement): void {
    this.hold = anchor;
    this.opening = false;
    this.updateSpacer();
    // The turn settles at the live edge, so the reply that grows into the room
    // below it is followed once it fills the viewport.
    this.following = true;
    this.go(this.anchorTarget(anchor), "smooth");
  }

  // ---------------------------------------------------------------------------
  // Rows that arrive

  /** Rows were added or removed. */
  itemsChanged(): void {
    if (!this.opened || !this.viewport || !this.content) return;
    const items = this.items();
    const survivors = items.filter((item) => this.known.has(item));
    const fresh = items.filter((item) => !this.known.has(item));
    for (const item of fresh) this.known.add(item);
    if (fresh.length === 0) return;

    const order = new Map(items.map((item, index) => [item, index]));
    const firstSurvivor = survivors[0] ? order.get(survivors[0]) : undefined;
    const lastSurvivor = survivors.at(-1)
      ? order.get(survivors.at(-1)!)
      : undefined;
    const appended = fresh.filter(
      (item) => lastSurvivor !== undefined && order.get(item)! > lastSurvivor,
    );
    const prepended = fresh.filter(
      (item) => firstSurvivor !== undefined && order.get(item)! < firstSurvivor,
    );

    // Only a row appended below the reader enters. Rows that fill the thread,
    // join above it or are inserted between others take their place without
    // the entrance, before the first style is resolved and the animation starts.
    for (const item of fresh)
      if (!appended.includes(item)) item.removeAttribute("data-entering");

    if (survivors.length === 0) {
      // The whole thread was replaced, or the first rows arrived: open it again.
      this.open();
      return;
    }
    if (prepended.length > 0 && this.options.preserveScrollOnPrepend)
      this.keepPlace(survivors[0]!, items[0]!);
    const anchor = appended.filter(isAnchor).at(-1);
    if (anchor) this.settle(anchor);
  }

  /**
   * Rows were added above the first row the reader had: move the viewport
   * down by the height they took, so the row in view stays where it was.
   */
  private keepPlace(previousFirst: HTMLElement, first: HTMLElement): void {
    const gained = this.topOf(previousFirst) - this.topOf(first);
    if (gained <= 0) return;
    const { snapshot } = this;
    this.jump(prependScrollTop(snapshot, snapshot.scrollHeight + gained));
  }

  // ---------------------------------------------------------------------------
  // What the reader does

  private readonly onScroll = (): void => {
    const metrics = this.metrics();
    if (isAtEdge(metrics, "end", this.options.scrollEdgeThreshold))
      this.following = true;
    if (this.smooth && Math.abs(metrics.scrollTop - this.smooth.target) <= 1)
      this.finishSmoothScroll(true);
    this.syncScrollable(metrics);
    this.remember(metrics);
  };

  private readonly onScrollEnd = (): void => {
    this.finishSmoothScroll(true);
  };

  private readonly onWheel = (event: WheelEvent): void => {
    this.opening = false;
    if (wheelScrollsTowardStart(event.deltaY)) this.release();
  };

  private readonly onTouchStart = (event: TouchEvent): void => {
    this.opening = false;
    this.touchStartY = event.touches[0]?.clientY ?? 0;
  };

  private readonly onTouchMove = (event: TouchEvent): void => {
    const y = event.touches[0]?.clientY;
    if (y !== undefined && touchScrollsTowardStart(this.touchStartY, y))
      this.release();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || isEditable(event.target)) return;
    this.opening = false;
    if (keyScrollsTowardStart(event.key)) this.release();
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (isScrollbar(event.target)) this.release();
  };

  /** Tells React when an edge becomes scrollable or stops being so. */
  private syncScrollable(metrics?: ScrollMetrics): void {
    if (!this.viewport) return;
    const next = scrollableEdges(
      metrics ?? this.metrics(),
      this.options.scrollEdgeThreshold,
    );
    if (
      next.start === this.scrollable.start &&
      next.end === this.scrollable.end
    )
      return;
    this.scrollable = next;
    this.onScrollable(next);
  }

  // ---------------------------------------------------------------------------
  // The commands the hook gives out

  /** Scrolls to the latest row and follows the thread from there. */
  scrollToEnd(options: ScrollToOptions = {}): void {
    this.opening = false;
    this.following = true;
    this.go(maxScrollTop(this.metrics()), options.behavior);
  }

  scrollToStart(options: ScrollToOptions = {}): void {
    this.release();
    this.go(0, options.behavior);
  }

  /** Scrolls a row to the top of the viewport; false when no such row is mounted. */
  scrollToMessage(id: string, options: ScrollToOptions = {}): boolean {
    if (!this.viewport) return false;
    const item = this.items().find(
      (row) => row.getAttribute("data-message-id") === id,
    );
    if (!item) return false;
    this.release();
    this.go(this.anchorTarget(item), options.behavior);
    return true;
  }

  /** Moves focus to the viewport, for a control that leaves when it is pressed. */
  focusViewport(): void {
    this.viewport?.focus({ preventScroll: true });
  }
}
