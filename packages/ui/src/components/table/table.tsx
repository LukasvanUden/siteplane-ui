"use client";

import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import {
  Cell as AriaCell,
  Checkbox as AriaCheckbox,
  Column as AriaColumn,
  composeRenderProps,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableFooter as AriaTableFooter,
  TableHeader as AriaTableHeader,
  type CellProps as AriaCellProps,
  type CheckboxProps as AriaCheckboxProps,
  type ColumnProps as AriaColumnProps,
  type RowProps as AriaRowProps,
  type Selection as AriaSelection,
  type SortDescriptor as AriaSortDescriptor,
  type TableBodyProps as AriaTableBodyProps,
  type TableFooterProps as AriaTableFooterProps,
  type TableHeaderProps as AriaTableHeaderProps,
  type TableProps as AriaTableProps,
} from "react-aria-components";
import {
  Children,
  createContext,
  isValidElement,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
  useRef,
  useState,
} from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { CheckboxGlyph } from "../../system/styles/checkbox-glyph";
import { cn } from "../../system/utils/cn";
import {
  tableAlignmentClassName,
  tableContainerSizeClassName,
  tableFooterClassName,
  type TableAlign,
} from "./table-shared";

import "./table.css";

export type { SortDescriptor } from "react-aria-components";

export type { TableAlign };
export type TableSelectionTrigger = "checkbox" | "row";

/** The table's resolved size, which its selection checkboxes take as theirs. */
const TableSizeContext = createContext<SiteplaneControlSize | undefined>(
  undefined,
);

export interface TableProps extends Omit<
  AriaTableProps,
  "className" | "sortDescriptor"
> {
  className?: string | undefined;
  /**
   * Classes for the scrolling container. The heading row sticks to the top of
   * this container, so it stays in view only when the container has a height
   * limit, such as `max-h-80`.
   */
  containerClassName?: string | undefined;
  hoverable?: boolean | undefined;
  selectionTrigger?: TableSelectionTrigger | undefined;
  size?: SiteplaneControlSize | undefined;
  sortDescriptor?: AriaSortDescriptor | undefined;
}

export interface TableCaptionProps {
  children: ReactNode;
  className?: string;
}

export type TableHeaderProps<T> = Omit<AriaTableHeaderProps<T>, "className"> & {
  className?: string;
};

export interface TableHeadProps extends Omit<AriaColumnProps, "className"> {
  align?: TableAlign;
  className?: string;
}

export type TableBodyProps<T> = Omit<AriaTableBodyProps<T>, "className"> & {
  className?: string;
};

export type TableFooterProps<T> = Omit<AriaTableFooterProps<T>, "className"> & {
  className?: string;
};

export interface TableRowProps<T> extends Omit<AriaRowProps<T>, "className"> {
  className?: string | undefined;
  hoverable?: boolean | undefined;
  inactive?: boolean | undefined;
}

export interface TableCellProps extends Omit<AriaCellProps, "className"> {
  align?: TableAlign;
  className?: string;
}

export interface TableSelectionCheckboxProps extends Omit<
  AriaCheckboxProps,
  "children" | "className" | "slot"
> {
  className?: string;
}

function isTableCaption(
  child: ReactNode,
): child is ReactElement<TableCaptionProps> {
  return isValidElement(child) && child.type === TableCaption;
}

export function Table({
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  containerClassName,
  defaultSelectedKeys,
  hoverable = true,
  onSelectionChange,
  selectedKeys,
  selectionTrigger = "row",
  size,
  sortDescriptor,
  ...props
}: TableProps): ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const generatedCaptionId = useId();
  const childArray = Children.toArray(children);
  const caption = childArray.find(isTableCaption);
  const tableChildren = childArray.filter((child) => !isTableCaption(child));
  const captionId = caption ? generatedCaptionId : undefined;
  const selectionOriginRef = useRef<TableSelectionTrigger>("row");
  const [internalSelectedKeys, setInternalSelectedKeys] =
    useState<AriaSelection>(() =>
      defaultSelectedKeys === "all"
        ? "all"
        : new Set(defaultSelectedKeys ?? []),
    );
  const markSelectionOrigin = (target: EventTarget | null) => {
    selectionOriginRef.current =
      target instanceof Element &&
      target.closest('[data-slot="table-selection-checkbox"]')
        ? "checkbox"
        : "row";
  };
  const handleSelectionChange = (keys: AriaSelection) => {
    if (
      selectionTrigger === "checkbox" &&
      selectionOriginRef.current !== "checkbox"
    ) {
      return;
    }

    if (selectedKeys === undefined) setInternalSelectedKeys(keys);
    onSelectionChange?.(keys);
  };
  const labelledBy = ariaLabelledBy ?? captionId;

  return (
    <div
      className={cn(
        "relative w-full overflow-x-auto data-[size=lg]:[--table-row-height:--spacing(10)] data-[size=xl]:[--table-row-height:--spacing(12)]",
        tableContainerSizeClassName,
        containerClassName,
      )}
      data-size={resolvedSize}
      data-slot="table-container"
      onClickCapture={(event) => markSelectionOrigin(event.target)}
      onKeyDownCapture={(event: KeyboardEvent<HTMLDivElement>) =>
        markSelectionOrigin(event.target)
      }
      onPointerDownCapture={(event: PointerEvent<HTMLDivElement>) =>
        markSelectionOrigin(event.target)
      }
    >
      <TableSizeContext.Provider value={resolvedSize}>
        <AriaTable
          {...props}
          {...(labelledBy === undefined
            ? {}
            : { "aria-labelledby": labelledBy })}
          className={cn("w-full caption-bottom text-sm", className)}
          data-hoverable={hoverable}
          data-selection-trigger={selectionTrigger}
          data-slot="table"
          onSelectionChange={handleSelectionChange}
          selectedKeys={selectedKeys ?? internalSelectedKeys}
          {...(sortDescriptor === undefined ? {} : { sortDescriptor })}
        >
          {tableChildren}
        </AriaTable>
      </TableSizeContext.Provider>
      {caption ? (
        <div
          className={cn(
            "mt-4 text-muted-foreground text-sm",
            caption.props.className,
          )}
          data-slot="table-caption"
          id={captionId}
        >
          {caption.props.children}
        </div>
      ) : null}
    </div>
  );
}

export function TableCaption(props: TableCaptionProps): null {
  void props;
  return null;
}

export function TableHeader<T>({
  className,
  ...props
}: TableHeaderProps<T>): ReactElement {
  return (
    <AriaTableHeader
      {...props}
      className={composeRenderProps(className, (value) => cn(value))}
      data-slot="table-header"
    />
  );
}

export function TableHead({
  align = "start",
  allowsSorting,
  children,
  className,
  ...props
}: TableHeadProps): ReactElement {
  return (
    <AriaColumn
      {...props}
      {...(allowsSorting === undefined ? {} : { allowsSorting })}
      className={composeRenderProps(className, (value) =>
        cn(
          "whitespace-nowrap align-middle",
          tableAlignmentClassName(align),
          value,
        ),
      )}
      data-align={align}
      data-slot="table-head"
    >
      {(renderProps) => (
        <span
          className={cn(
            "inline-flex items-center",
            align === "center" && "justify-center",
            align === "end" && "justify-end",
          )}
          data-slot="table-head-content"
        >
          {typeof children === "function" ? children(renderProps) : children}
          {allowsSorting ? (
            renderProps.sortDirection === "ascending" ? (
              <ChevronUpIcon aria-hidden="true" data-default-size="" />
            ) : renderProps.sortDirection === "descending" ? (
              <ChevronDownIcon aria-hidden="true" data-default-size="" />
            ) : (
              <ChevronsUpDownIcon aria-hidden="true" data-default-size="" />
            )
          ) : null}
        </span>
      )}
    </AriaColumn>
  );
}

export function TableBody<T>({
  className,
  ...props
}: TableBodyProps<T>): ReactElement {
  return (
    <AriaTableBody
      {...props}
      className={composeRenderProps(className, (value) => cn(value))}
      data-slot="table-body"
    />
  );
}

export function TableFooter<T>({
  className,
  ...props
}: TableFooterProps<T>): ReactElement {
  return (
    <AriaTableFooter
      {...props}
      className={cn(tableFooterClassName, className)}
      data-slot="table-footer"
    />
  );
}

export function TableRow<T>({
  className,
  hoverable = true,
  inactive = false,
  ...props
}: TableRowProps<T>): ReactElement {
  const interactive = Boolean(props.href || props.onAction);

  return (
    <AriaRow
      {...props}
      className={composeRenderProps(className, (value) =>
        cn("relative outline-none", value),
      )}
      data-hoverable={hoverable}
      data-inactive={inactive || undefined}
      data-interactive={interactive || undefined}
      data-slot="table-row"
    />
  );
}

export function TableCell({
  align = "start",
  className,
  ...props
}: TableCellProps): ReactElement {
  return (
    <AriaCell
      {...props}
      className={composeRenderProps(className, (value) =>
        cn(
          "whitespace-nowrap bg-clip-padding align-middle outline-none",
          tableAlignmentClassName(align),
          value,
        ),
      )}
      data-align={align}
      data-slot="table-cell"
    />
  );
}

export function TableSelectionCheckbox({
  className,
  ...props
}: TableSelectionCheckboxProps): ReactElement {
  // The box reads the Checkbox's size scale, from the table it sits in.
  const size = useResolvedControlSize(useContext(TableSizeContext));

  return (
    <AriaCheckbox
      {...props}
      className={composeRenderProps(className, (value) => cn(value))}
      data-size={size}
      data-slot="table-selection-checkbox"
      slot="selection"
    >
      {({ isIndeterminate, isSelected }) => (
        // The indicator holds the state for the shared check motion in
        // motion.css (rulebook M1): both glyphs stay mounted, and the check
        // draws in and out as data-selected comes and goes, the dash as
        // data-indeterminate does. An indeterminate box shows the dash only.
        // The glyph takes no shared pop: that has no indeterminate state, so
        // the dash would rest at the pop scale.
        <span
          aria-hidden="true"
          data-indeterminate={isIndeterminate || undefined}
          data-selected={isSelected && !isIndeterminate ? true : undefined}
          data-slot="table-selection-indicator"
        >
          <CheckboxGlyph size={size} />
        </span>
      )}
    </AriaCheckbox>
  );
}
