function parseCubicBezier(
  value: string,
): [number, number, number, number] | undefined {
  const match = value.match(
    /^cubic-bezier\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)$/,
  );
  return match
    ? [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])]
    : undefined;
}
export function getMotionTransitionFromCss(
  element: Element,
  durationVariable: `--motion-${string}`,
  easingVariable: `--motion-${string}`,
) {
  const styles = getComputedStyle(element);
  const duration = styles.getPropertyValue(durationVariable).trim();
  const easing = styles.getPropertyValue(easingVariable).trim();
  return {
    duration:
      (Number.parseFloat(duration) || 0) / (duration.endsWith("ms") ? 1000 : 1),
    ease:
      easing === "linear"
        ? ("linear" as const)
        : (parseCubicBezier(easing) ?? [0.16, 1, 0.3, 1]),
  };
}
