"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { useFormReset } from "../../system/form/use-form-reset";
import {
  SiteplaneUIPortalScope,
  useResolvedControlSize,
  type SiteplaneControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { ChoiceMenuItemCheck } from "../../system/styles/choice-menu-item";
import { surfaceClassNames } from "../../system/styles/surface";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { KitButton } from "../button/button-internal";
import { useFieldLabelPlacement } from "../field";
import { Separator } from "../separator";
import { Input } from "../input";

function SelectCaretIcon(
  props: React.ComponentProps<"svg">,
): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      data-slot="select-caret"
      fill="currentColor"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M11.5263 15.582C11.8209 15.8223 12.2556 15.8049 12.5302 15.5303L17.5302 10.5303C17.8231 10.2374 17.8231 9.76263 17.5302 9.46973C17.2373 9.17684 16.7626 9.17684 16.4697 9.46973L11.9999 13.9395L7.53022 9.46973C7.23732 9.17684 6.76256 9.17684 6.46967 9.46973C6.17678 9.76263 6.17678 10.2374 6.46967 10.5303L11.4697 15.5303L11.5263 15.582Z" />
    </svg>
  );
}

export function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
): React.ReactElement {
  const [resetKey, setResetKey] = React.useState(0);
  const markerRef = useFormReset<HTMLInputElement>(props.form, () => {
    if (props.value === undefined) setResetKey((current) => current + 1);
  });
  return (
    <>
      <SelectPrimitive.Root data-slot="select" {...props} key={resetKey} />
      <Input
        aria-hidden="true"
        disabled
        form={props.form}
        ref={markerRef}
        type="hidden"
      />
    </>
  );
}

export type SelectTriggerSize = SiteplaneControlSize;
/** The trigger surface, the same four as the other form controls. */
export type SelectTriggerMode = "default" | "elevated" | "ghost" | "inset";

export interface SelectButtonProps extends useRender.ComponentProps<"button"> {
  size?: SelectTriggerSize;
  variant?: SelectTriggerMode;
}

export function SelectButton({
  className,
  size,
  variant,
  render,
  children,
  ...props
}: SelectButtonProps): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const resolvedMode = variant ?? "default";
  return (
    <KitButton
      align="between"
      className={cn("min-w-0", className)}
      data-select-trigger=""
      data-slot="select-button"
      {...props}
      profile="select-trigger"
      profileMode={resolvedMode}
      render={render}
      size={resolvedSize}
      variant="outline"
      width="full"
    >
      <>
        <span
          className="flex-1 truncate in-data-placeholder:text-muted-foreground/72"
          data-slot="select-value"
        >
          {children}
        </span>
        <span data-slot="select-icon">
          <SelectCaretIcon />
        </span>
      </>
    </KitButton>
  );
}

export function SelectTrigger({
  className,
  size,
  variant,
  children,
  render,
  ...props
}: WithStringClassName<SelectPrimitive.Trigger.Props> & {
  size?: SelectTriggerSize | undefined;
  variant?: SelectTriggerMode | undefined;
}): React.ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const resolvedMode = variant ?? "default";
  // A floating Field lays out the trigger it holds (design-rework.css,
  // "Floating label fields"); the ghost mode draws no field to hold a label.
  const floating =
    useFieldLabelPlacement() === "floating" && resolvedMode !== "ghost";

  return (
    <SelectPrimitive.Trigger
      {...props}
      className={cn("min-w-36", className)}
      data-label-placement={floating ? "floating" : undefined}
      data-profile="select-trigger"
      data-profile-mode={resolvedMode}
      data-select-trigger=""
      data-size={resolvedSize}
      data-slot="select-trigger"
      render={
        render ?? (
          <KitButton
            align="between"
            profile="select-trigger"
            profileMode={resolvedMode}
            size={resolvedSize}
            variant="outline"
            width="full"
          />
        )
      }
    >
      {children}
      <SelectPrimitive.Icon data-slot="select-icon">
        <SelectCaretIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectValue({
  className,
  ...props
}: WithStringClassName<SelectPrimitive.Value.Props>): React.ReactElement {
  return (
    <SelectPrimitive.Value
      className={cn("flex-1 truncate", className)}
      data-slot="select-value"
      {...props}
    />
  );
}

export function SelectPopup({
  className,
  children,
  side = "bottom",
  // 8 px, measured across the reference's selects; action and filter menus
  // keep 4 px.
  sideOffset = 8,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  anchor,
  portalProps,
  ...props
}: WithStringClassName<SelectPrimitive.Popup.Props> & {
  portalProps?: WithStringClassName<SelectPrimitive.Portal.Props>;
  side?: SelectPrimitive.Positioner.Props["side"];
  sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"];
  align?: SelectPrimitive.Positioner.Props["align"];
  alignOffset?: SelectPrimitive.Positioner.Props["alignOffset"];
  alignItemWithTrigger?: SelectPrimitive.Positioner.Props["alignItemWithTrigger"];
  anchor?: SelectPrimitive.Positioner.Props["anchor"];
}): React.ReactElement {
  return (
    <SelectPrimitive.Portal {...portalProps}>
      <SiteplaneUIPortalScope>
        <SelectPrimitive.Positioner
          align={align}
          alignItemWithTrigger={alignItemWithTrigger}
          alignOffset={alignOffset}
          anchor={anchor}
          className="z-50 select-none"
          data-slot="select-positioner"
          side={side}
          sideOffset={sideOffset}
        >
          <SelectPrimitive.Popup
            className={cn(
              "siteplane-floating-panel origin-(--transform-origin) text-foreground outline-none",
              className,
            )}
            data-slot="select-popup"
            {...props}
          >
            <SelectPrimitive.ScrollUpArrow
              className="top-0 z-50 hidden h-6 w-full cursor-pointer items-center justify-center data-[visible]:flex before:pointer-events-none before:absolute before:inset-x-px before:top-px before:h-[200%] before:rounded-t-[inherit] before:bg-linear-to-b before:from-50% before:from-popover"
              data-slot="select-scroll-up-arrow"
            >
              <ChevronUpIcon className="relative size-4.5 sm:size-4" />
            </SelectPrimitive.ScrollUpArrow>
            <div
              className={cn(
                surfaceClassNames.overlay,
                "h-full min-w-(--anchor-width) w-max max-w-(--available-width) before:rounded-[inherit]",
              )}
            >
              <SelectPrimitive.List
                className="max-h-(--available-height) overflow-y-auto"
                data-slot="select-list"
              >
                {children}
              </SelectPrimitive.List>
            </div>
            <SelectPrimitive.ScrollDownArrow
              className="bottom-0 z-50 hidden h-6 w-full cursor-pointer items-center justify-center data-[visible]:flex before:pointer-events-none before:absolute before:inset-x-px before:bottom-px before:h-[200%] before:rounded-b-[inherit] before:bg-linear-to-t before:from-50% before:from-popover"
              data-slot="select-scroll-down-arrow"
            >
              <ChevronDownIcon className="relative size-4.5 sm:size-4" />
            </SelectPrimitive.ScrollDownArrow>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SiteplaneUIPortalScope>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: WithStringClassName<SelectPrimitive.Item.Props>): React.ReactElement {
  return (
    <SelectPrimitive.Item
      className={cn(
        "grid cursor-pointer items-center outline-none data-disabled:pointer-events-none data-disabled:opacity-(--sp-rw-disabled-opacity-action) [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-slot="select-item"
      {...props}
    >
      {/* The check leads the row, in a slot every option keeps, so every
          label starts at the same x, as in Combobox and the menus (I8). */}
      <SelectPrimitive.ItemIndicator
        className="col-start-1 row-start-1"
        data-slot="select-item-indicator"
        keepMounted
      >
        <ChoiceMenuItemCheck />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText
        className="col-start-2 row-start-1 min-w-0 truncate"
        data-slot="select-item-text"
      >
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({
  className,
  ...props
}: WithStringClassName<SelectPrimitive.Separator.Props>): React.ReactElement {
  return (
    <SelectPrimitive.Separator
      className={cn("mx-2 my-1", className)}
      data-slot="select-separator"
      render={<Separator />}
      {...props}
    />
  );
}

export function SelectGroup(
  props: WithStringClassName<SelectPrimitive.Group.Props>,
): React.ReactElement {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

/**
 * The label of a Select. Like FieldLabel and Label it carries no outer
 * margin: the stack around it spaces it, as a Field's gap does (S10). Its
 * colour and disabled state are the labels' shared rules (design-rework.css).
 */
export function SelectLabel({
  className,
  ...props
}: WithStringClassName<SelectPrimitive.Label.Props>): React.ReactElement {
  return (
    <SelectPrimitive.Label
      className={cn(
        "inline-flex cursor-default items-center gap-2 font-medium text-base/4.5 sm:text-sm/4",
        className,
      )}
      data-slot="select-label"
      {...props}
    />
  );
}

export function SelectGroupLabel({
  className,
  ...props
}: WithStringClassName<SelectPrimitive.GroupLabel.Props>): React.ReactElement {
  return (
    <SelectPrimitive.GroupLabel
      className={cn(
        "px-2 py-1.5 font-medium text-muted-foreground text-xs",
        className,
      )}
      data-slot="select-group-label"
      {...props}
    />
  );
}

export { SelectPrimitive, SelectPopup as SelectContent };
