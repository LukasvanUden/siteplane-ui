import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  const merged = twMerge(clsx(inputs));
  // A part's class (`sp-<slot>`, slot-class.ts) can arrive twice: from the
  // part itself and from the host that renders it through `render`.
  return merged.includes("sp-")
    ? Array.from(new Set(merged.split(" "))).join(" ")
    : merged;
}

/**
 * The props of a Base UI part as a kit component takes them: `className` is a
 * string. Base UI also accepts a function of the part's state, but the kit
 * merges its own classes with `cn()` and styles states through data
 * attributes, so every kit component takes the string alone.
 */
export type WithStringClassName<Props> = Omit<Props, "className"> & {
  className?: string | undefined;
};
