"use client";

import type { ComponentProps, CSSProperties } from "react";
import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import {
  tableAlignmentClassName,
  tableContainerSizeClassName,
  tableFooterClassName,
  type TableAlign,
} from "../table/table-shared";
import "../table/table.css";
import "./native-table.css";

export interface NativeTableProps extends ComponentProps<"table"> {
  containerClassName?: string | undefined;
  hoverable?: boolean | undefined;
  minWidth?: CSSProperties["minWidth"];
  size?: SiteplaneControlSize | undefined;
}

/** Native table semantics: each control keeps its own focus and keyboard behavior. */
export function NativeTable({
  className,
  containerClassName,
  hoverable = true,
  minWidth,
  size,
  style,
  ...props
}: NativeTableProps) {
  const resolvedSize = useResolvedControlSize(size);
  return (
    <div
      data-slot="table-container"
      data-size={resolvedSize}
      className={cn(
        "sp-table-container",
        "relative w-full min-w-0 overflow-x-auto",
        tableContainerSizeClassName,
        containerClassName,
      )}
    >
      <table
        {...props}
        data-slot="table"
        data-hoverable={hoverable}
        className={cn(
          "sp-table",
          "w-full border-collapse caption-bottom text-sm",
          className,
        )}
        style={{ minWidth, ...style }}
      />
    </div>
  );
}

export function NativeTableCaption({
  className,
  ...props
}: ComponentProps<"caption">) {
  return (
    <caption
      {...props}
      data-slot="table-caption"
      className={cn(
        "sp-table-caption",
        "mt-4 text-sm text-muted-foreground",
        className,
      )}
    />
  );
}
export function NativeTableHeader(props: ComponentProps<"thead">) {
  return (
    <thead
      {...props}
      className={cn("sp-table-header", props.className)}
      data-slot="table-header"
    />
  );
}
export function NativeTableBody(props: ComponentProps<"tbody">) {
  return (
    <tbody
      {...props}
      className={cn("sp-table-body", props.className)}
      data-slot="table-body"
    />
  );
}
export function NativeTableFooter({
  className,
  ...props
}: ComponentProps<"tfoot">) {
  return (
    <tfoot
      {...props}
      data-slot="table-footer"
      className={cn("sp-table-footer", tableFooterClassName, className)}
    />
  );
}

export interface NativeTableRowProps extends ComponentProps<"tr"> {
  hoverable?: boolean | undefined;
  tone?: "section" | "total" | "muted" | undefined;
}
export function NativeTableRow({
  className,
  hoverable = true,
  tone,
  ...props
}: NativeTableRowProps) {
  return (
    <tr
      {...props}
      data-slot="table-row"
      data-hoverable={hoverable}
      data-tone={tone}
      className={cn("sp-table-row", className)}
    />
  );
}

export interface NativeTableHeadProps extends Omit<
  ComponentProps<"th">,
  "align"
> {
  align?: TableAlign | undefined;
}
export interface NativeTableCellProps extends Omit<
  ComponentProps<"td">,
  "align"
> {
  align?: TableAlign | undefined;
}
export function NativeTableHead({
  align = "start",
  className,
  scope = "col",
  ...props
}: NativeTableHeadProps) {
  return (
    <th
      {...props}
      scope={scope}
      data-slot="table-head"
      data-align={align}
      className={cn(
        "sp-table-head",
        "whitespace-nowrap align-middle",
        tableAlignmentClassName(align),
        className,
      )}
    />
  );
}
export function NativeTableCell({
  align = "start",
  className,
  ...props
}: NativeTableCellProps) {
  return (
    <td
      {...props}
      data-slot="table-cell"
      data-align={align}
      className={cn(
        "sp-table-cell",
        "align-middle",
        tableAlignmentClassName(align),
        className,
      )}
    />
  );
}
