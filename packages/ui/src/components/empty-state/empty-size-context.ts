import * as React from "react";

/** The size of the Empty around a part, for the parts that step with it in React. */
export type EmptySize = "sm" | "md" | "lg";

/**
 * The size of the Empty around a part, for the parts that step with it in
 * React rather than in custom properties: the featured icon of the media and
 * the avatars that the decorations of a header count by size. It lives in its
 * own module so the decorations read it without the Empty's public exports
 * naming it.
 */
export const EmptySizeContext = React.createContext<EmptySize>("lg");
