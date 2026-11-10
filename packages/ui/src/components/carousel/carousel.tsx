"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import * as React from "react";

import { useSiteplaneMessages } from "../../system/locale/messages-context";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button, type ButtonDefaultProfileProps } from "../button";
import { PageIndicator, type PageIndicatorProps } from "../page-indicator";

import "./carousel.css";

/** `md`, the default, has 36 px arrows 16 px from the edge; `lg` has 44 px arrows 20 px from it. */
export type CarouselSize = "md" | "lg";

/** What the parts of a carousel share, and what a part of an application can read from it. */
export type CarouselContextValue = {
  /** Whether the carousel can show the slide after the current one. */
  canScrollNext: boolean;
  /** Whether the carousel can show the slide before the current one. */
  canScrollPrevious: boolean;
  /** The number of slides. */
  count: number;
  /** The current slide, counted from 0. */
  index: number;
  /** Shows the slide after the current one. */
  scrollNext: () => void;
  /** Shows the slide before the current one. */
  scrollPrevious: () => void;
  /** Shows a slide, counted from 0. */
  scrollTo: (index: number) => void;
  size: CarouselSize;
};

type CarouselInternals = CarouselContextValue & {
  /** The slides in the order of the page, which they register themselves in. */
  items: readonly HTMLElement[];
  register: (element: HTMLElement) => () => void;
};

const CarouselContext = React.createContext<CarouselInternals | null>(null);

function useCarouselInternals(part: string): CarouselInternals {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error(`${part} must be used within a Carousel.`);
  return context;
}

/**
 * The state of the carousel for a part of an application that sits inside it,
 * such as a caption that follows the slide or an indicator of its own.
 */
export function useCarousel(): CarouselContextValue {
  const context = useCarouselInternals("useCarousel");
  return {
    canScrollNext: context.canScrollNext,
    canScrollPrevious: context.canScrollPrevious,
    count: context.count,
    index: context.index,
    scrollNext: context.scrollNext,
    scrollPrevious: context.scrollPrevious,
    scrollTo: context.scrollTo,
    size: context.size,
  };
}

/** Whether the element reads right to left, where it stands. */
function readsRightToLeft(element: Element): boolean {
  return getComputedStyle(element).direction === "rtl";
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as React.RefObject<T | null>).current = value;
}

export interface CarouselProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  /** The current slide, counted from 0, for a carousel that the application controls. */
  index?: number | undefined;
  /** The slide shown first, counted from 0, in a carousel that keeps its own state. */
  defaultIndex?: number | undefined;
  /** Called with the slide a person moves to, counted from 0. */
  onIndexChange?: ((index: number) => void) | undefined;
  /**
   * The size of its arrows and its indicator: `md` has
   * 36 px arrows 16 px from the edge and 8 px dots, `lg` 44 px arrows 20 px
   * from the edge and 10 px dots. `md` by default.
   */
  size?: CarouselSize | undefined;
}

/**
 * A row of slides that shows one at a time: the previous and next arrows sit
 * over the slide at its edges, the indicator at
 * its bottom, the arrow keys move between slides when focus is inside it, and a
 * swipe or a drag moves it on touch screens and with a mouse. Slides sit 8 px
 * apart and settle in 800 ms (rulebook M3), at once with reduced motion. The
 * region is a carousel and every slide a group of it, named by its place
 * ("2 of 3"); the slides that are out of view are inert, so their links and
 * buttons stay out of the focus order. The application can keep the slide in
 * state (`index`, `onIndexChange`) or leave it to the carousel
 * (`defaultIndex`). The parts are CarouselContent with CarouselItems, and
 * CarouselPrevious, CarouselNext and CarouselIndicator over them.
 */
export function Carousel({
  children,
  className,
  defaultIndex = 0,
  index: indexProp,
  onIndexChange,
  onKeyDownCapture,
  size = "md",
  ...props
}: CarouselProps): React.ReactElement {
  const messages = useSiteplaneMessages("carousel");
  const [items, setItems] = React.useState<readonly HTMLElement[]>([]);
  const [uncontrolled, setUncontrolled] = React.useState(defaultIndex);
  const controlled = indexProp !== undefined;
  // Until the slides have registered, which happens after the first render,
  // the carousel counts the slides its markup declares, so the server's
  // markup already shows a dot for every slide and the arrows in their state,
  // and nothing moves when the page hydrates (app finding, real-world check,
  // 10 November 2026: the dots appeared only after hydration).
  const declared = React.useMemo(() => declaredSlides(children), [children]);
  const count = items.length > 0 ? items.length : declared;
  const last = Math.max(count - 1, 0);
  // Before the slides have registered (the server's markup and the first
  // render) the slide asked for stands, so the track does not travel to it.
  const asked = Math.max(controlled ? indexProp : uncontrolled, 0);
  const index = count === 0 ? asked : Math.min(asked, last);

  const scrollTo = React.useCallback(
    (next: number) => {
      const target = Math.min(Math.max(Math.round(next), 0), last);
      if (target === index) return;
      if (!controlled) setUncontrolled(target);
      onIndexChange?.(target);
    },
    [controlled, index, last, onIndexChange],
  );

  const register = React.useCallback((element: HTMLElement) => {
    setItems((previous) =>
      previous.includes(element)
        ? previous
        : [...previous, element].sort((a, b) =>
            a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
              ? -1
              : 1,
          ),
    );
    return () =>
      setItems((previous) => previous.filter((item) => item !== element));
  }, []);

  const value = React.useMemo<CarouselInternals>(
    () => ({
      canScrollNext: index < last,
      canScrollPrevious: index > 0,
      count,
      index,
      items,
      register,
      scrollNext: () => scrollTo(index + 1),
      scrollPrevious: () => scrollTo(index - 1),
      scrollTo,
      size,
    }),
    [count, index, items, last, register, scrollTo, size],
  );

  return (
    <CarouselContext.Provider value={value}>
      <div
        aria-roledescription={messages.label}
        className={cn(slotClass("carousel", props), className)}
        data-size={size}
        data-slot="carousel"
        onKeyDownCapture={(event) => {
          onKeyDownCapture?.(event);
          if (
            event.defaultPrevented ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
          )
            return;
          // A field inside a slide keeps its own arrow keys.
          if ((event.target as Element).closest("input, textarea, select"))
            return;
          event.preventDefault();
          // The arrows point the way the page reads: right goes on in a
          // left-to-right page and back in a right-to-left one.
          const rightToLeft = readsRightToLeft(event.currentTarget);
          const forward = (event.key === "ArrowRight") !== rightToLeft;
          scrollTo(index + (forward ? 1 : -1));
        }}
        role="region"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

/**
 * The slides a carousel's markup declares: every element among the children
 * of its CarouselContent, each a slide, as the parts are composed. A slide
 * that a component of the application renders elsewhere counts once it has
 * registered.
 */
function declaredSlides(children: React.ReactNode): number {
  let slides = 0;
  React.Children.forEach(children, (child) => {
    if (
      !React.isValidElement<{ children?: React.ReactNode }>(child) ||
      child.type !== CarouselContent
    )
      return;
    React.Children.forEach(child.props.children, (slide) => {
      if (React.isValidElement(slide)) slides += 1;
    });
  });
  return slides;
}

/** How far a drag must go to turn the slide: a fifth of it, or a quick flick. */
const dragShare = 0.2;
const flickSpeed = 0.5;
const flickDistance = 24;
/** The way a drag must go before it is one, so a tap is still a tap. */
const dragStart = 6;

/**
 * The slides: a viewport that clips them and the track that carries them, 8
 * px apart. A drag or a swipe along it moves the track with the pointer and
 * turns the slide when it has gone a fifth of the way, or fast enough; past
 * the first and the last slide it gives a third of the way. The browser keeps
 * vertical scrolling (`touch-action: pan-y`).
 */
export function CarouselContent({
  children,
  className,
  onClickCapture,
  onDragStart,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ref,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const { count, index, scrollTo } = useCarouselInternals("CarouselContent");
  const viewport = React.useRef<HTMLDivElement | null>(null);
  const track = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const drag = React.useRef<{
    at: number;
    id: number;
    moved: boolean;
    x: number;
  } | null>(null);
  const suppressClick = React.useRef(false);

  const setViewport = React.useCallback(
    (element: HTMLDivElement | null) => {
      viewport.current = element;
      assignRef(ref, element);
    },
    [ref],
  );

  /** Where the drag has taken the track, in px along the page's reading direction. */
  const travel = (event: React.PointerEvent): number => {
    const start = drag.current;
    if (!start) return 0;
    const distance = event.clientX - start.x;
    const sign = readsRightToLeft(event.currentTarget) ? -1 : 1;
    // Past the first or the last slide the track gives only a third of the way.
    const onwards = distance * sign < 0;
    return (onwards ? index >= count - 1 : index <= 0)
      ? distance / 3
      : distance;
  };

  const finish = (event: React.PointerEvent, cancelled: boolean) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    drag.current = null;
    track.current?.style.removeProperty("--sp-carousel-drag");
    if (!start.moved) return;
    setDragging(false);
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    if (cancelled) return;
    const distance = event.clientX - start.x;
    const sign = readsRightToLeft(event.currentTarget) ? -1 : 1;
    const width = viewport.current?.clientWidth ?? 1;
    const speed = Math.abs(distance) / Math.max(event.timeStamp - start.at, 1);
    const turns =
      Math.abs(distance) > width * dragShare ||
      (speed > flickSpeed && Math.abs(distance) > flickDistance);
    if (turns) scrollTo(index + (distance * sign < 0 ? 1 : -1));
  };

  return (
    <div
      className={cn(slotClass("carousel-content", props), className)}
      data-dragging={dragging ? "" : undefined}
      data-slot="carousel-content"
      onClickCapture={(event) => {
        onClickCapture?.(event);
        if (!suppressClick.current) return;
        // The click that ends a drag belongs to the drag, not to what is under it.
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
      onDragStart={(event) => {
        onDragStart?.(event);
        // A picture in a slide would start the browser's own drag and cancel
        // the pointer, so the carousel never saw the drag.
        event.preventDefault();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        finish(event, true);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || count < 2) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        drag.current = {
          at: event.timeStamp,
          id: event.pointerId,
          moved: false,
          x: event.clientX,
        };
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;
        if (!start.moved) {
          if (Math.abs(event.clientX - start.x) < dragStart) return;
          start.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }
        track.current?.style.setProperty(
          "--sp-carousel-drag",
          `${travel(event)}px`,
        );
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        finish(event, false);
      }}
      ref={setViewport}
      {...props}
    >
      <div
        className="sp-carousel-track"
        data-slot="carousel-track"
        ref={track}
        style={{ "--sp-carousel-index": index } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

/** One slide: a group of the carousel named by its place, inert while it is out of view. */
export function CarouselItem({
  className,
  ref,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  const messages = useSiteplaneMessages("carousel");
  const { count, index, items, register } =
    useCarouselInternals("CarouselItem");
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  React.useLayoutEffect(
    () => (node ? register(node) : undefined),
    [node, register],
  );
  const setRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      setNode(element);
      assignRef(ref, element);
    },
    [ref],
  );
  const position = node ? items.indexOf(node) : -1;
  return (
    <div
      aria-label={
        position >= 0 ? messages.slidePosition(position + 1, count) : undefined
      }
      aria-roledescription={messages.slide}
      className={cn(slotClass("carousel-item", props), className)}
      data-slot="carousel-item"
      // The slides out of view stay out of the focus order and the reading
      // order, as a person sees one slide at a time.
      inert={position >= 0 && position !== index ? true : undefined}
      ref={setRef}
      role="group"
      {...props}
    />
  );
}

type CarouselArrowProps = Omit<
  ButtonDefaultProfileProps,
  "profile" | "profileTone" | "shape" | "size" | "variant"
>;

function CarouselArrow({
  direction,
  onClick,
  ...props
}: CarouselArrowProps & {
  direction: "next" | "previous";
}): React.ReactElement {
  const messages = useSiteplaneMessages("carousel");
  const context = useCarouselInternals(
    direction === "next" ? "CarouselNext" : "CarouselPrevious",
  );
  const next = direction === "next";
  const Icon = next ? CaretRightIcon : CaretLeftIcon;
  const slot = next ? "carousel-next" : "carousel-previous";
  return (
    <Button
      aria-label={next ? messages.next : messages.previous}
      className={cn(slotClass(slot, props), props.className)}
      data-slot={slot}
      disabled={next ? !context.canScrollNext : !context.canScrollPrevious}
      shape="pill"
      size={context.size === "lg" ? "icon-lg" : "icon-sm"}
      variant="default"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented)
          (next ? context.scrollNext : context.scrollPrevious)();
      }}
    >
      <Icon aria-hidden="true" className="sp-carousel-arrow-glyph" />
    </Button>
  );
}

/** The arrow that shows the previous slide: over the slide at its start edge, disabled on the first. */
export function CarouselPrevious(
  props: CarouselArrowProps,
): React.ReactElement {
  return <CarouselArrow {...props} direction="previous" />;
}

/** The arrow that shows the next slide: over the slide at its end edge, disabled on the last. */
export function CarouselNext(props: CarouselArrowProps): React.ReactElement {
  return <CarouselArrow {...props} direction="next" />;
}

/**
 * The kit's PageIndicator for the carousel: one dot for each slide, the
 * current one filled, and a click goes to that slide. Over the slide at its
 * bottom middle, in the carousel's size; `framed` sets the dots on a
 * translucent pill, for an indicator on an image.
 */
export function CarouselIndicator({
  className,
  framed,
  labels,
  variant,
  ...props
}: Omit<
  PageIndicatorProps,
  "count" | "onPageChange" | "page" | "size"
>): React.ReactElement {
  const messages = useSiteplaneMessages("carousel");
  const { count, index, scrollTo, size } =
    useCarouselInternals("CarouselIndicator");
  return (
    <div
      className={cn(slotClass("carousel-indicator", props), className)}
      data-slot="carousel-indicator"
      // A line takes the width of its box, which the carousel gives it
      // (carousel.css), where the dots set the width of theirs.
      data-variant={variant}
    >
      <PageIndicator
        count={count}
        framed={framed}
        labels={{
          group: messages.slides,
          page: messages.goToSlide,
          ...labels,
        }}
        onPageChange={(page) => scrollTo(page - 1)}
        page={index + 1}
        size={size}
        variant={variant}
        {...props}
      />
    </div>
  );
}
