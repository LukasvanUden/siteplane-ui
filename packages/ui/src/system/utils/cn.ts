import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
