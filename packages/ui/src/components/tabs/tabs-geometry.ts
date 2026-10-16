/** A box measured on screen (getBoundingClientRect): transforms scale it. */
export interface ScreenBox {
  left: number;
  right: number;
  width: number;
}

/** A box's size in layout px, which transforms do not scale. */
export interface LayoutSize {
  width: number;
  height: number;
}

/**
 * An element's size in layout px: its computed width and height, or its offset
 * size where the computed size is no length, as Floating UI's getCssDimensions
 * reads it.
 */
export function layoutSize(element: HTMLElement): LayoutSize {
  const style = getComputedStyle(element);
  const width = Number.parseFloat(style.width) || 0;
  const height = Number.parseFloat(style.height) || 0;
  return Math.round(width) === element.offsetWidth &&
    Math.round(height) === element.offsetHeight
    ? { width, height }
    : { width: element.offsetWidth, height: element.offsetHeight };
}

/**
 * Where a rail's indicator sits, in the rail's own layout px. The boxes are
 * measured on screen, so inside a scaled ancestor, such as a Dialog popup that
 * zooms in while it opens, every distance is scaled as well. Each one is
 * divided by the rail's scale, the way Base UI's Tabs.Indicator measures its
 * tab; the size comes from the tab's layout box. A rail scaled to nothing keeps
 * the screen distances.
 */
export function railIndicatorGeometry({
  rail,
  railSize,
  target,
  targetSize,
  strip,
}: {
  rail: ScreenBox;
  railSize: LayoutSize;
  target: ScreenBox;
  targetSize: LayoutSize;
  strip?: ScreenBox | undefined;
}): {
  left: number;
  width: number;
  height: number;
  clipStart: number;
  clipEnd: number;
} {
  const scale = railSize.width > 0 ? rail.width / railSize.width : 1;
  const unscale = (length: number) =>
    scale > Number.EPSILON ? length / scale : length;
  return {
    left: unscale(target.left - rail.left),
    width: targetSize.width,
    height: targetSize.height,
    clipStart: strip ? Math.max(0, unscale(strip.left - rail.left)) : 0,
    clipEnd: strip ? Math.max(0, unscale(rail.right - strip.right)) : 0,
  };
}
