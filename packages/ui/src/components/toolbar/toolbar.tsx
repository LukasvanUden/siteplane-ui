"use client";

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";
import * as React from "react";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { Button, type ButtonStandardProps } from "../button";
import { Input, type InputProps } from "../input";
import { Separator } from "../separator";

/** The size of the enclosing Toolbar, which its parts take by default. */
const ToolbarSizeContext = React.createContext<SiteplaneControlSize | null>(
  null,
);

/** A part's own size, else the Toolbar's, else the provider's (S1). */
function useToolbarSize(
  size: SiteplaneControlSize | undefined,
): SiteplaneControlSize {
  const toolbarSize = React.useContext(ToolbarSizeContext);
  return useResolvedControlSize(size ?? toolbarSize);
}

export function Toolbar({
  className,
  size,
  ...props
}: WithStringClassName<ToolbarPrimitive.Root.Props> & {
  /** The control size of the toolbar's buttons, links, groups and input. */
  size?: SiteplaneControlSize | undefined;
}): React.ReactElement {
  const resolvedSize = useToolbarSize(size);
  return (
    <ToolbarSizeContext.Provider value={resolvedSize}>
      <ToolbarPrimitive.Root
        className={cn(
          // A bare icon takes the icon of the control scale, like the Buttons
          // and Toggles beside it: 16 px, 20 px at xl.
          "relative flex flex-wrap items-center gap-2 data-[orientation=vertical]:w-fit data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-(--sp-rw-control-icon)",
          resolvedSize === "xl" &&
            "[&>svg:not([class*='size-'])]:size-(--sp-rw-control-icon-xl)",
          className,
        )}
        data-size={resolvedSize}
        data-slot="toolbar"
        {...props}
      />
    </ToolbarSizeContext.Provider>
  );
}
export function ToolbarButton({
  className,
  render,
  size,
  ...props
}: WithStringClassName<ToolbarPrimitive.Button.Props> & {
  size?: SiteplaneControlSize | undefined;
}): React.ReactElement {
  const resolvedSize = useToolbarSize(size);
  return (
    <ToolbarPrimitive.Button
      className={cn(className)}
      data-slot="toolbar-button"
      render={
        render ??
        ((toolbarProps, state) => (
          <Button
            {...(toolbarProps as ButtonStandardProps)}
            aria-disabled={state.disabled || undefined}
            disabled={state.disabled && !state.focusable}
            size={resolvedSize}
            variant="ghost"
          />
        ))
      }
      {...props}
    />
  );
}
export function ToolbarLink({
  className,
  render,
  size,
  ...props
}: WithStringClassName<ToolbarPrimitive.Link.Props> & {
  size?: SiteplaneControlSize | undefined;
}): React.ReactElement {
  const resolvedSize = useToolbarSize(size);
  return (
    <ToolbarPrimitive.Link
      className={cn(className)}
      data-slot="toolbar-link"
      render={
        typeof render === "function" ? (
          (toolbarProps, toolbarState) => (
            <Button
              {...(toolbarProps as unknown as ButtonStandardProps)}
              render={(buttonProps) =>
                render(
                  buttonProps as React.ComponentPropsWithRef<"a">,
                  toolbarState,
                )
              }
              size={resolvedSize}
              variant="ghost"
            />
          )
        ) : (
          <Button
            render={render ?? <a />}
            size={resolvedSize}
            variant="ghost"
          />
        )
      }
      {...props}
    />
  );
}
export function ToolbarInput({
  className,
  insetStart,
  insetEnd,
  render,
  ...props
}: WithStringClassName<ToolbarPrimitive.Input.Props> &
  Pick<InputProps, "insetStart" | "insetEnd">): React.ReactElement {
  const resolvedSize = useToolbarSize(undefined);
  return (
    <ToolbarPrimitive.Input
      className={cn("min-w-0 flex-1", className)}
      data-slot="toolbar-input"
      render={
        typeof render === "function" ? (
          (toolbarProps, toolbarState) => (
            <Input
              size={resolvedSize}
              {...(toolbarProps as InputProps)}
              insetStart={insetStart}
              insetEnd={insetEnd}
              render={(inputProps) => render(inputProps, toolbarState)}
            />
          )
        ) : (
          <Input
            insetStart={insetStart}
            insetEnd={insetEnd}
            render={render}
            size={resolvedSize}
          />
        )
      }
      {...props}
    />
  );
}
export function ToolbarGroup({
  className,
  size,
  ...props
}: WithStringClassName<ToolbarPrimitive.Group.Props> & {
  size?: SiteplaneControlSize | undefined;
}): React.ReactElement {
  const resolvedSize = useToolbarSize(size);
  return (
    <ToolbarSizeContext.Provider value={resolvedSize}>
      <ToolbarPrimitive.Group
        className={cn(
          "flex min-w-0 items-center gap-1 [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-(--sp-rw-control-icon)",
          resolvedSize === "xl" &&
            "[&>svg:not([class*='size-'])]:size-(--sp-rw-control-icon-xl)",
          className,
        )}
        data-size={resolvedSize}
        data-slot="toolbar-group"
        {...props}
      />
    </ToolbarSizeContext.Provider>
  );
}
export function ToolbarSeparator({
  className,
  ...props
}: WithStringClassName<ToolbarPrimitive.Separator.Props>): React.ReactElement {
  return (
    <ToolbarPrimitive.Separator
      className={cn("data-[orientation=horizontal]:my-0.5", className)}
      data-slot="toolbar-separator"
      render={<Separator />}
      {...props}
    />
  );
}
export { ToolbarPrimitive };
