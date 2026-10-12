"use client";

import { Toast } from "@base-ui/react/toast";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";

import { useSiteplaneMotionPreset } from "../../system/motion/siteplane-motion-provider";
import { cn, type WithStringClassName } from "../../system/utils/cn";
import { Button } from "../button";
import { KitButton } from "../button/button-internal";
import { Spinner } from "../spinner";
import { useToastStack } from "./toast-stack";
import { toastDismissClassName, toastSurfaceClassName } from "./toast-surface";

import "./toast.css";

// A loading toast shows the kit Spinner instead of an icon of its own.
const TOAST_ICONS = {
  error: CircleAlertIcon,
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
} as const;

/**
 * The content of every toast, the default one and the content `notify()`
 * passes: it fades out as the toast steps behind the front one and back in
 * when the stack expands (toast.css owns the fade), and a toast behind takes
 * no pointer until then.
 */
const toastContentClassName =
  "siteplane-toast-content-motion pointer-events-auto data-behind:not-data-expanded:pointer-events-none data-behind:opacity-0 data-expanded:opacity-100";

type SwipeDirection = "up" | "down" | "left" | "right";

export type ToastData = {
  content?: React.ReactNode;
  rootProps?: Omit<
    React.ComponentProps<typeof Toast.Root>,
    "children" | "className" | "swipeDirection" | "toast"
  >;
};

function getSwipeDirection(position: ToastPosition): SwipeDirection[] {
  const verticalDirection: SwipeDirection = position.startsWith("top")
    ? "up"
    : "down";

  if (position.includes("center")) return [verticalDirection];
  if (position.includes("left")) return ["left", verticalDirection];
  return ["right", verticalDirection];
}

function upsertReplayClassName(toast: {
  type?: string | undefined;
  updateKey?: number | undefined;
}): string | undefined {
  const key = toast.updateKey ?? 0;
  if (key <= 0) return undefined;
  const parity = key % 2 === 0 ? "even" : "odd";
  return toast.type === "error"
    ? `animate-toast-error-${parity}`
    : `animate-toast-success-${parity}`;
}

function Toasts({
  manager,
  position,
  portalProps,
}: {
  manager: object | undefined;
  position: ToastPosition;
  portalProps?:
    WithStringClassName<React.ComponentProps<typeof Toast.Portal>> | undefined;
}): React.ReactElement {
  const { toasts } = Toast.useToastManager();
  const swipeDirection = getSwipeDirection(position);
  // Stacks of other providers at this position take the edge first when they
  // received a toast later; this one stands back by their room.
  const [viewport, setViewport] = React.useState<HTMLDivElement | null>(null);
  const { mirrored, offset } = useToastStack(
    position,
    manager,
    toasts,
    viewport,
  );
  // The viewport portals out of a SiteplaneMotionProvider, so it carries the
  // preset itself for the reduced-motion rules in toast.css.
  const motionPreset = useSiteplaneMotionPreset();

  return (
    <Toast.Portal data-slot="toast-portal" {...portalProps}>
      <Toast.Viewport
        ref={setViewport}
        className={cn(
          "fixed z-60 mx-auto flex w-[calc(100%-var(--toast-inset)*2)] max-w-90 [--toast-inset:--spacing(4)] sm:[--toast-inset:--spacing(8)]",
          "data-[position*=top]:top-(--toast-inset)",
          "data-[position*=bottom]:bottom-(--toast-inset)",
          "data-[position*=left]:left-(--toast-inset)",
          "data-[position*=right]:right-(--toast-inset)",
          "data-[position*=center]:left-1/2 data-[position*=center]:-translate-x-1/2",
          "data-[position*=top]:transform-[translateY(var(--toast-stack-offset,0px))]",
          "data-[position*=bottom]:transform-[translateY(calc(var(--toast-stack-offset,0px)*-1))]",
          "data-mirrored:invisible",
        )}
        data-mirrored={mirrored ? "" : undefined}
        data-position={position}
        data-slot="toast-viewport"
        data-sp-motion={motionPreset}
        data-stacked={toasts.length > 0 ? "" : undefined}
        style={
          offset > 0
            ? ({ "--toast-stack-offset": `${offset}px` } as React.CSSProperties)
            : undefined
        }
      >
        {toasts.map((toast) => {
          const Icon =
            toast.type && toast.type !== "loading"
              ? TOAST_ICONS[toast.type as keyof typeof TOAST_ICONS]
              : null;
          const toastData = toast.data as ToastData | undefined;

          return (
            <Toast.Root
              key={toast.id}
              className={cn(
                toastSurfaceClassName,
                "absolute z-[calc(9999-var(--toast-index))] h-(--toast-calc-height) w-full select-none siteplane-toast-motion data-expanded:bg-(--sp-rw-surface-color) dark:data-expanded:bg-(--sp-rw-surface-color)",
                "data-[position*=right]:right-0 data-[position*=right]:left-auto",
                "data-[position*=left]:right-auto data-[position*=left]:left-0",
                "data-[position*=center]:right-0 data-[position*=center]:left-0",
                "data-[position*=top]:top-0 data-[position*=top]:bottom-auto data-[position*=top]:origin-[50%_calc(50%-50%*min(var(--toast-index,0),1))]",
                "data-[position*=bottom]:top-auto data-[position*=bottom]:bottom-0 data-[position*=bottom]:origin-[50%_calc(50%+50%*min(var(--toast-index,0),1))]",
                "after:absolute after:left-0 after:h-[calc(var(--toast-gap)+1px)] after:w-full",
                "data-[position*=top]:after:top-full",
                "data-[position*=bottom]:after:bottom-full",
                "[--toast-calc-height:var(--toast-frontmost-height,var(--toast-height))] [--toast-gap:--spacing(3)] [--toast-peek:--spacing(3)] [--toast-scale:calc(max(0,1-(var(--toast-index)*.1)))] [--toast-exit-scale:clamp(0.82,calc(var(--toast-scale)-0.04),1)] [--toast-shrink:calc(1-var(--toast-scale))]",
                "data-[position*=top]:[--toast-calc-offset-y:calc(var(--toast-offset-y)+var(--toast-index)*var(--toast-gap)+var(--toast-swipe-movement-y))]",
                "data-[position*=bottom]:[--toast-calc-offset-y:calc(var(--toast-offset-y)*-1+var(--toast-index)*var(--toast-gap)*-1+var(--toast-swipe-movement-y))]",
                "data-[position*=top]:transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--toast-peek))+(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-scale))]",
                "data-[position*=bottom]:transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--toast-peek))-(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-scale))]",
                "data-limited:opacity-0",
                "data-expanded:h-(--toast-height)",
                "data-position:data-expanded:transform-[translateX(var(--toast-swipe-movement-x))_translateY(var(--toast-calc-offset-y))]",
                "data-[position*=top]:data-starting-style:transform-[translateY(calc(-100%-var(--toast-inset)))]",
                "data-[position*=bottom]:data-starting-style:transform-[translateY(calc(100%+var(--toast-inset)))]",
                "data-ending-style:opacity-0",
                "data-[position*=top]:data-ending-style:not-data-limited:not-data-swipe-direction:transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--toast-peek))+(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-exit-scale))]",
                "data-[position*=bottom]:data-ending-style:not-data-limited:not-data-swipe-direction:transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--toast-peek))-(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-exit-scale))]",
                "data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-100%-var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+100%+var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-100%-var(--toast-inset)))]",
                "data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+100%+var(--toast-inset)))]",
                "data-position:data-expanded:data-ending-style:not-data-limited:not-data-swipe-direction:transform-[translateX(var(--toast-swipe-movement-x))_translateY(var(--toast-calc-offset-y))_scale(var(--toast-exit-scale))]",
                "data-expanded:data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-100%-var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-expanded:data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+100%+var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-expanded:data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-100%-var(--toast-inset)))]",
                "data-expanded:data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+100%+var(--toast-inset)))]",
                upsertReplayClassName(toast),
              )}
              {...toastData?.rootProps}
              data-position={position}
              swipeDirection={swipeDirection}
              toast={toast}
            >
              {toastData?.content ? (
                <Toast.Content
                  className={cn(
                    toastContentClassName,
                    "overflow-hidden rounded-[inherit]",
                  )}
                >
                  <Toast.Title className="sr-only" />
                  {toastData.content}
                </Toast.Content>
              ) : (
                <Toast.Content
                  className={cn(
                    toastContentClassName,
                    "flex items-center justify-between gap-1.5 overflow-hidden py-3 ps-3.5 pe-10 text-sm",
                  )}
                >
                  {/* The text column may shrink, so a long title or
                      description wraps instead of pushing the action out
                      (rulebook K5). */}
                  <div className="flex min-w-0 gap-2">
                    {(Icon || toast.type === "loading") && (
                      <div
                        className="[&>svg]:h-lh [&>svg]:w-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
                        data-slot="toast-icon"
                      >
                        {Icon ? (
                          <Icon className="siteplane-spinner-motion in-data-[type=error]:text-destructive in-data-[type=info]:text-info in-data-[type=success]:text-success in-data-[type=warning]:text-warning" />
                        ) : (
                          <Spinner aria-hidden="true" className="opacity-80" />
                        )}
                      </div>
                    )}

                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Toast.Title
                        className="font-medium wrap-anywhere"
                        data-slot="toast-title"
                      />
                      <Toast.Description
                        className="text-muted-foreground wrap-anywhere"
                        data-slot="toast-description"
                      />
                    </div>
                  </div>
                  {toast.actionProps && (
                    <Toast.Action
                      data-slot="toast-action"
                      render={<Button size="xs" />}
                    >
                      {toast.actionProps.children}
                    </Toast.Action>
                  )}
                </Toast.Content>
              )}
              <ToastCloseButton />
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function ToastCloseButton(): React.ReactElement {
  return (
    <Toast.Close
      aria-label="Dismiss toast"
      className={toastDismissClassName}
      data-slot="toast-close"
      render={
        <KitButton profile="overlay-dismiss" shape="square" variant="ghost" />
      }
    >
      <XIcon />
    </Toast.Close>
  );
}

export const toastManager: ReturnType<typeof Toast.createToastManager> =
  Toast.createToastManager();

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastProviderProps extends Toast.Provider.Props {
  position?: ToastPosition;
  portalProps?: WithStringClassName<React.ComponentProps<typeof Toast.Portal>>;
}

export function ToastProvider({
  children,
  position = "bottom-right",
  portalProps,
  ...props
}: ToastProviderProps): React.ReactElement {
  const manager = "toastManager" in props ? props.toastManager : toastManager;
  return (
    <Toast.Provider toastManager={toastManager} {...props}>
      {children}
      <Toasts manager={manager} portalProps={portalProps} position={position} />
    </Toast.Provider>
  );
}

export { Toast as ToastPrimitive };
