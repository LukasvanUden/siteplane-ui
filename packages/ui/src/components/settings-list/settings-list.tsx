"use client";

import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { Card } from "../card";
import { Separator } from "../separator";

import { cn } from "../../system/utils/cn";

export interface SettingsListProps extends Omit<
  ComponentPropsWithoutRef<"section">,
  "title"
> {
  description?: ReactNode;
  title: ReactNode;
}

/**
 * What `control` receives. Spread it on a switch, a select trigger or an input:
 * the title becomes their accessible name. An action button keeps its own text
 * as its name, so pass it `aria-describedby` only; with `aria-labelledby` too,
 * the title would replace the button's label for assistive technology.
 */
export interface SettingsListControlProps {
  "aria-describedby"?: string | undefined;
  "aria-labelledby": string;
}

export interface SettingsListItemProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "title"
> {
  control: (props: SettingsListControlProps) => ReactNode;
  description?: ReactNode;
  layout?: "inline" | "responsive";
  tag?: ReactNode;
  title: ReactNode;
}

/**
 * The list is a size container: its rows, its card padding and its header
 * inset switch once the list itself is 36rem wide. A list in a page column
 * keeps the rows it had at the old viewport `md` switch; beside a sidebar or
 * in a narrow column it stays stacked. The gaps and the header inset are the
 * rules in design-rework.css.
 */
export function SettingsList({
  children,
  className,
  description,
  title,
  ...props
}: SettingsListProps): React.ReactElement {
  return (
    <section
      className={cn("@container/settings-list flex w-full flex-col", className)}
      data-recipe="settings-list"
      data-slot="settings-list"
      {...props}
    >
      <header className="grid min-w-0" data-slot="settings-list-header">
        <h2 data-slot="settings-list-title">{title}</h2>
        {description ? (
          <p data-slot="settings-list-description">{description}</p>
        ) : null}
      </header>
      <div className="min-w-0" data-slot="settings-list-surface">
        <Card className="grid min-w-0 px-4 py-5 @min-[36rem]/settings-list:px-6">
          {children}
        </Card>
      </div>
    </section>
  );
}

export function SettingsListItem({
  className,
  control,
  description,
  layout = "responsive",
  tag,
  title,
  ...props
}: SettingsListItemProps): React.ReactElement {
  const descriptionId = useId();
  const titleId = useId();

  return (
    <div
      className={cn(
        "group/settings-item flex",
        layout === "inline"
          ? "items-center justify-between"
          : "flex-col @min-[36rem]/settings-list:flex-row @min-[36rem]/settings-list:items-center @min-[36rem]/settings-list:justify-between",
        className,
      )}
      data-layout={layout}
      data-slot="settings-list-item"
      {...props}
    >
      {/* A drawn divider between rows: the list already separates them. */}
      <Separator
        className="absolute inset-x-0 bottom-0 group-last/settings-item:hidden"
        role="presentation"
      />
      <div
        className="flex min-w-0 flex-auto flex-col"
        data-slot="settings-list-item-copy"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5">
          <span className="min-w-0 wrap-anywhere" id={titleId}>
            {title}
          </span>
          {tag}
        </div>
        {description ? (
          <div
            className="min-w-0 wrap-anywhere"
            data-slot="settings-list-item-description"
            id={descriptionId}
          >
            {description}
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          "flex min-w-0 shrink-0 items-center @min-[36rem]/settings-list:justify-end @min-[36rem]/settings-list:text-right",
          layout === "inline"
            ? "justify-end text-right"
            : "@max-[36rem]/settings-list:w-full",
        )}
        data-slot="settings-list-item-control"
      >
        {control({
          "aria-describedby": description ? descriptionId : undefined,
          "aria-labelledby": titleId,
        })}
      </div>
    </div>
  );
}
