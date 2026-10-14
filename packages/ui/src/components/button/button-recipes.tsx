"use client";

import {
  Children,
  useState,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../../system/utils/cn";
import { Badge } from "../badge";
import { Spinner } from "../spinner";
import { Button, type ButtonStandardProps } from "./button";

type StandardButtonPropsWithout<K extends keyof ButtonStandardProps> =
  ButtonStandardProps extends infer Props
    ? Props extends ButtonStandardProps
      ? Omit<Props, K>
      : never
    : never;

type IconButtonSize = Extract<
  NonNullable<ButtonStandardProps["size"]>,
  "icon-lg" | "icon-md" | "icon-sm" | "icon-xl" | "icon-xs"
>;

export type IconButtonProps = StandardButtonPropsWithout<
  "aria-label" | "children" | "size" | "shape"
> & {
  icon: ReactNode;
  label: string;
  /** A positive count, displayed as 99+ above 99. Include its meaning in label. */
  count?: number;
  size?: IconButtonSize;
};

export function IconButton({
  icon,
  label,
  count,
  size,
  ...props
}: IconButtonProps): ReactElement {
  return (
    <Button aria-label={label} shape="square" size={size} {...props}>
      {icon}
      {count !== undefined && Number.isFinite(count) && count > 0 && (
        <Badge aria-hidden="true" profile="count">
          {count > 99 ? "99+" : Math.ceil(count)}
        </Badge>
      )}
    </Button>
  );
}

export type ButtonWithIconProps = StandardButtonPropsWithout<"children"> & {
  children: ReactNode;
  icon: ReactNode;
  iconPosition?: "end" | "start";
};

export function ButtonWithIcon({
  children,
  className,
  icon,
  iconPosition = "start",
  ...props
}: ButtonWithIconProps): ReactElement {
  // An empty label renders no span, so it leaves no content gap beside the
  // icon and the icon stays centred.
  const hasLabel = Children.toArray(children).some((child) => child !== "");
  return (
    <Button className={cn("min-w-0", className)} {...props}>
      {iconPosition === "start" ? icon : null}
      {hasLabel && <span className="truncate">{children}</span>}
      {iconPosition === "end" ? icon : null}
    </Button>
  );
}

type LoadingButtonPhase = "idle" | "loading";

export type LoadingButtonProps = StandardButtonPropsWithout<
  "children" | "loading" | "onClick"
> & {
  action?: () => Promise<unknown> | unknown;
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: "end" | "start";
  loading?: boolean;
  loadingText?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onError?: (error: unknown) => void;
};

export function LoadingButton({
  action,
  children,
  className,
  disabled,
  icon,
  iconPosition = "start",
  loading = false,
  loadingText = "Saving",
  onClick,
  onError,
  ...props
}: LoadingButtonProps): ReactElement {
  const [phase, setPhase] = useState<LoadingButtonPhase>("idle");
  const visualPhase: LoadingButtonPhase = loading ? "loading" : phase;
  const isPending = visualPhase === "loading";

  const handleClick: MouseEventHandler<HTMLButtonElement> = async (event) => {
    if (visualPhase !== "idle" || disabled) return;
    onClick?.(event);
    if (event.defaultPrevented || !action) return;

    setPhase("loading");
    try {
      await Promise.resolve(action());
    } catch (error) {
      onError?.(error);
      setPhase("idle");
      return;
    }
    setPhase("idle");
  };

  const content = (
    <span className="relative inline-grid min-w-0 items-center justify-items-center">
      <span
        aria-hidden={isPending || undefined}
        className="sp-loading-button-idle inline-flex min-w-0 items-center gap-2"
      >
        {iconPosition === "start" ? icon : null}
        {children}
        {iconPosition === "end" ? icon : null}
      </span>
      <span
        aria-hidden={!isPending || undefined}
        aria-live="polite"
        className="sp-loading-button-pending absolute inset-0 inline-flex min-w-0 items-center justify-center gap-1.5"
      >
        <Spinner aria-hidden className="size-4 shrink-0" />
        <span className="truncate">{loadingText}</span>
      </span>
    </span>
  );

  return (
    <span
      className="sp-loading-button-shell"
      data-loading-button-phase={visualPhase}
    >
      <Button
        {...props}
        aria-busy={isPending || undefined}
        className={cn("w-full overflow-hidden", className)}
        disabled={Boolean(disabled || isPending)}
        onClick={handleClick}
      >
        {content}
      </Button>
    </span>
  );
}
