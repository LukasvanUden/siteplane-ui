"use client";

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";
import * as React from "react";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
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

// A field uses Home and End itself: a text field for its caret, a slider, a
// spin button or a select for its value.
const fieldSelector =
  'input, select, textarea, [role="slider"], [role="spinbutton"]';

/**
 * Home and End move the focus to the toolbar's first and last item, as the
 * toolbar keyboard pattern has them beside the arrow keys (B12, 3 November
 * 2026); Base UI's toolbar moves by the arrow keys only. Its items are the
 * elements that carry its roving tab stop (tabindex 0 or -1) and belong to it
 * rather than to a toolbar inside it, less those a disabled attribute takes
 * out of the tab order and those hidden from assistive technology. A field in
 * the toolbar keeps the two keys. The item takes the tab stop as it takes the
 * focus, so Tab returns to it.
 */
function focusToolbarEnd(event: React.KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== "Home" && event.key !== "End") return;
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return;
  const root = event.currentTarget;
  const target = event.target as HTMLElement;
  if (
    target.closest('[role="toolbar"]') !== root ||
    target.isContentEditable ||
    target.matches(fieldSelector)
  )
    return;
  const items = Array.from(
    root.querySelectorAll<HTMLElement>('[tabindex="0"], [tabindex="-1"]'),
  ).filter(
    (item) =>
      item.closest('[role="toolbar"]') === root &&
      !item.matches(":disabled") &&
      !item.closest('[aria-hidden="true"], [hidden], [inert]'),
  );
  const item = event.key === "Home" ? items[0] : items[items.length - 1];
  if (!item) return;
  event.preventDefault();
  if (item !== target) item.focus();
}

export function Toolbar({
  className,
  onKeyDown,
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
          // A bare icon is the glyph of the Buttons beside it, the glyph
          // ladder's (I3), which the toolbar's size sets (design-rework.css).
          slotClass("toolbar", props),
          "relative flex flex-wrap items-center gap-2 data-[orientation=vertical]:w-fit data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-(--sp-rw-button-icon)",
          className,
        )}
        data-size={resolvedSize}
        data-slot="toolbar"
        {...props}
        onKeyDown={(event) => {
          // The consumer's handler runs first and can keep the keys with
          // preventDefault.
          onKeyDown?.(event);
          focusToolbarEnd(event);
        }}
      />
    </ToolbarSizeContext.Provider>
  );
}
export function ToolbarButton({
  className,
  render,
  shape,
  size,
  ...props
}: WithStringClassName<ToolbarPrimitive.Button.Props> & {
  /**
   * `square` makes an icon-only item: the square of the toolbar's control size,
   * 36 px at the default sm, 40, 44 and 48 px above.
   */
  shape?: "default" | "square" | undefined;
  size?: SiteplaneControlSize | undefined;
}): React.ReactElement {
  const resolvedSize = useToolbarSize(size);
  return (
    <ToolbarPrimitive.Button
      className={cn(slotClass("toolbar-button", props, render), className)}
      data-slot="toolbar-button"
      render={
        render ??
        ((toolbarProps, state) => (
          <Button
            {...(toolbarProps as ButtonStandardProps)}
            aria-disabled={state.disabled || undefined}
            disabled={state.disabled && !state.focusable}
            {...(shape === undefined ? {} : { shape })}
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
      className={cn(slotClass("toolbar-link", props), className)}
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
      className={cn(
        slotClass("toolbar-input", props),
        "min-w-0 flex-1",
        className,
      )}
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
          slotClass("toolbar-group", props),
          // A bare icon is the glyph ladder's, as in the toolbar.
          "flex min-w-0 items-center gap-1 [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-(--sp-rw-button-icon)",
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
      className={cn(
        slotClass("toolbar-separator", props),
        "data-[orientation=horizontal]:my-0.5",
        className,
      )}
      data-slot="toolbar-separator"
      render={<Separator />}
      {...props}
    />
  );
}
export { ToolbarPrimitive };
