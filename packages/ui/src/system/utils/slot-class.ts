import * as React from "react";

import { cn } from "./cn";

/*
 * Kit stylesheets key their rules on one class per part (rulebook P6):
 * `sp-<slot>` for the part's `data-slot` and `sp-base-<foundation>` for its
 * `data-foundation`. With a class as the last compound of a selector, the
 * browser tries a rule only on the parts it styles. The data attributes stay
 * the public hooks; the classes are internal.
 *
 * A part can end up with another slot than its own: the props spread after it
 * replace its `data-slot` when a composite re-slots a kit part, and so does
 * the element of a `render` prop. These helpers return the class of the value
 * the element ends up with, so the class always follows the data attribute.
 */

type Props = object | null | undefined;

/** The element of a part's `render` prop, given on its own or in `props`. */
function renderElement(props: Props, render: unknown): unknown {
  return render === undefined && props && "render" in props
    ? (props as { render?: unknown }).render
    : render;
}

function finalValue(
  name: "data-foundation" | "data-slot",
  own: string | undefined,
  props: Props,
  render: unknown,
): string | undefined {
  let value: unknown = own;
  if (props && name in props) value = (props as Record<string, unknown>)[name];
  const element = renderElement(props, render);
  if (React.isValidElement(element)) {
    const elementProps = element.props as Record<string, unknown> | null;
    if (elementProps && name in elementProps) value = elementProps[name];
  }
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * The class for a part, unless the element of its `render` prop carries it
 * already: a kit element that names its own part merges its className with the
 * part's, so the class would appear twice.
 */
function classFor(name: string, props: Props, render: unknown) {
  const element = renderElement(props, render);
  if (!React.isValidElement(element)) return name;
  const className = (element.props as { className?: unknown } | null)
    ?.className;
  return typeof className === "string" && className.split(/\s+/).includes(name)
    ? undefined
    : name;
}

/**
 * The class of the slot a part ends up with: `slot`, unless `props` (spread
 * after it) or a `render` element give the part another `data-slot`.
 */
export function slotClass(
  slot: string | undefined,
  props?: Props,
  render?: unknown,
): string | undefined {
  const value = finalValue("data-slot", slot, props, render);
  return value === undefined
    ? undefined
    : classFor(`sp-${value}`, props, render);
}

/**
 * The class of the foundation a part ends up with, `sp-base-<foundation>`,
 * by the same rules as `slotClass`.
 */
export function baseClass(
  foundation: string | undefined,
  props?: Props,
  render?: unknown,
): string | undefined {
  const value = finalValue("data-foundation", foundation, props, render);
  return value === undefined
    ? undefined
    : classFor(`sp-base-${value}`, props, render);
}

/**
 * The `className` a part is given, without the class of the slot it is given.
 * For a part that does not keep that slot: one that sets its own over it, or
 * one that passes it on to an inner element while its own element takes the
 * className.
 */
export function dropSlotClass(
  className: string | undefined,
  props?: Props,
): string | undefined {
  const given = slotClass(undefined, props);
  if (!className || given === undefined) return className;
  return (
    className
      .split(/\s+/)
      .filter((name) => name !== given)
      .join(" ") || undefined
  );
}

/**
 * A `className` that a part takes through its props, with the part's classes
 * added: a string, or the function of the part's state that Base UI and React
 * Aria accept.
 */
export function withClass<ClassName>(
  className: ClassName,
  ...classes: Array<string | undefined>
): ClassName {
  if (typeof className === "function")
    return ((state: unknown) =>
      cn(...classes, className(state)) || undefined) as ClassName;
  return (cn(...classes, className as string | undefined) ||
    undefined) as ClassName;
}
