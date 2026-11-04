"use client";

import * as React from "react";

import {
  SiteplaneControlSizeScope,
  useRelativeControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { FeaturedIconSizeScope } from "../featured-icon";
import { type EmptySize, EmptySizeContext } from "./empty-size-context";

/*
 * The client leaves of Empty, which leave Empty and its parts Server
 * Components: the size reaches the type, the gaps, the media and the
 * decorations through the root's `data-size` and the custom properties of its
 * size, and reaches in React only the parts that need it there. Both leaves
 * are context only: they draw nothing.
 */

/** Gives the content of an Empty its size in React: the control size of its actions and the size the decorations count by. */
export function EmptyScope({
  children,
  size,
}: {
  children?: React.ReactNode;
  size: EmptySize;
}): React.ReactElement {
  // The actions step with the size: md controls at lg and md, sm at sm, from
  // the provider's control size on.
  const controlSize = useRelativeControlSize(size === "sm" ? "sm" : "md");
  return (
    <SiteplaneControlSizeScope controlSize={controlSize}>
      <EmptySizeContext.Provider value={size}>
        {children}
      </EmptySizeContext.Provider>
    </SiteplaneControlSizeScope>
  );
}

/** Gives a featured icon in the media of an Empty the step of the Empty: xl in an lg Empty, lg in md and sm. */
export function EmptyMediaScope({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const size = React.useContext(EmptySizeContext);
  return (
    <FeaturedIconSizeScope size={size === "lg" ? "xl" : "lg"}>
      {children}
    </FeaturedIconSizeScope>
  );
}
