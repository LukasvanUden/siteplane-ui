"use client";

import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import {
  Cell as AriaCell,
  Checkbox as AriaCheckbox,
  CollectionRendererContext,
  Column as AriaColumn,
  composeRenderProps,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableFooter as AriaTableFooter,
  TableHeader as AriaTableHeader,
  TableStateContext,
  type CellProps as AriaCellProps,
  type CheckboxProps as AriaCheckboxProps,
  type ColumnProps as AriaColumnProps,
  type Key,
  type PressEvent,
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
  type ComponentProps,
  createContext,
  isValidElement,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
  useContext,
  useId,
  useMemo,
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

/**
 * What a row needs from its table to run its action under
 * `selectionTrigger="checkbox"`: the root `onRowAction`, and a count of the
 * row actions React Aria ran, so a row tells whether a press ran one.
 */
type TableRowActions = {
  checkboxTrigger: boolean;
  onRowAction: ((key: Key) => void) | undefined;
  ran: { current: number };
};

const TableRowActionsContext = createContext<TableRowActions>({
  checkboxTrigger: false,
  onRowAction: undefined,
  ran: { current: 0 },
});

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
  onRowAction,
  onSelectionChange,
  selectedKeys,
  selectionBehavior,
  selectionTrigger = "row",
  size,
  sortDescriptor,
  ...props
}: TableProps): ReactElement {
  const resolvedSize = useResolvedControlSize(size);
  const checkboxTrigger = selectionTrigger === "checkbox";
  const actionsRan = useRef(0);
  const rowActions = useMemo<TableRowActions>(
    () => ({ checkboxTrigger, onRowAction, ran: actionsRan }),
    [checkboxTrigger, onRowAction],
  );
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
        "sp-table-container",
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
        <TableRowActionsContext.Provider value={rowActions}>
          <AriaTable
            {...props}
            {...(labelledBy === undefined
              ? {}
              : { "aria-labelledby": labelledBy })}
            {...(onRowAction === undefined
              ? {}
              : {
                  onRowAction: (key: Key) => {
                    actionsRan.current += 1;
                    onRowAction(key);
                  },
                })}
            // Only the checkboxes select, so a press on a row never selects
            // it and there is no double click that runs the action instead.
            {...(checkboxTrigger
              ? { selectionBehavior: "toggle" as const }
              : selectionBehavior === undefined
                ? {}
                : { selectionBehavior })}
            className={cn(
              "sp-table",
              "w-full caption-bottom text-sm",
              className,
            )}
            data-hoverable={hoverable}
            data-selection-trigger={selectionTrigger}
            data-slot="table"
            onSelectionChange={handleSelectionChange}
            selectedKeys={selectedKeys ?? internalSelectedKeys}
            {...(sortDescriptor === undefined ? {} : { sortDescriptor })}
          >
            {tableChildren}
          </AriaTable>
        </TableRowActionsContext.Provider>
      </TableSizeContext.Provider>
      {caption ? (
        <div
          className={cn(
            "sp-table-caption",
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
      className={composeRenderProps(className, (value) =>
        cn("sp-table-header", value),
      )}
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
          "sp-table-head",
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
            "sp-table-head-content",
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
      className={composeRenderProps(className, (value) =>
        cn("sp-table-body", value),
      )}
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
      className={cn("sp-table-footer", tableFooterClassName, className)}
      data-slot="table-footer"
    />
  );
}

/**
 * A row of the table. Under `selectionTrigger="checkbox"` only the checkboxes
 * select, so a press on the row runs its action, also while rows are
 * selected: React Aria still takes such a press as a selection toggle, which
 * the table drops, and the row then runs the action itself when the press
 * ends. Space stays the selection key and runs no action; a press that React
 * Aria already ran an action for runs none again.
 */
export function TableRow<T>({
  className,
  hoverable = true,
  inactive = false,
  onAction,
  onPress,
  onPressStart,
  ...props
}: TableRowProps<T>): ReactElement {
  const interactive = Boolean(props.href || onAction);
  const actions = useContext(TableRowActionsContext);
  const actionsAtPressStart = useRef(0);
  const { id } = props;
  const runsOwnAction =
    actions.checkboxTrigger &&
    (onAction !== undefined || actions.onRowAction !== undefined);
  const pressProps = runsOwnAction
    ? {
        ...(onAction === undefined
          ? {}
          : {
              onAction: () => {
                actions.ran.current += 1;
                onAction();
              },
            }),
        onPress: (event: PressEvent) => {
          onPress?.(event);
          if (actions.ran.current !== actionsAtPressStart.current) return;
          if (event.pointerType === "keyboard" && event.key !== "Enter") return;
          onAction?.();
          if (id !== undefined) actions.onRowAction?.(id);
        },
        onPressStart: (event: PressEvent) => {
          actionsAtPressStart.current = actions.ran.current;
          onPressStart?.(event);
        },
      }
    : {
        ...(onAction === undefined ? {} : { onAction }),
        ...(onPress === undefined ? {} : { onPress }),
        ...(onPressStart === undefined ? {} : { onPressStart }),
      };

  return (
    <AriaRow
      {...props}
      {...pressProps}
      className={composeRenderProps(className, (value) =>
        cn("sp-table-row", "relative outline-none", value),
      )}
      data-hoverable={hoverable}
      data-inactive={inactive || undefined}
      data-interactive={interactive || undefined}
      data-slot="table-row"
    />
  );
}

// What a press or a key in a cell can start on besides the cell itself: an
// element the browser activates or focuses, a label that passes a click on to
// its control, and an item of another React Aria collection, such as a tag.
const cellControlSelector = [
  "a[href]",
  "area[href]",
  "audio[controls]",
  "button",
  "embed",
  "iframe",
  "input",
  "label",
  "object",
  "select",
  "summary",
  "textarea",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[data-collection]",
  "[tabindex]",
].join(", ");

/** Whether the event started on a control inside the cell, not the cell. */
function startsOnCellControl(event: SyntheticEvent): boolean {
  const cell = event.currentTarget;
  const control =
    event.target instanceof Element
      ? event.target.closest(cellControlSelector)
      : null;

  return control !== null && control !== cell && cell.contains(control);
}

/**
 * React Aria's own controls stop their presses from reaching the row, and the
 * row ignores a press that starts on an element it can focus. A control that
 * is not React Aria's, such as a Menu trigger, gets the same: a press or a
 * click that starts in it, also on its icon, and Enter or Space while it has
 * focus stay with it, so they neither run the row's action nor change the
 * selection. Events from a popup of the control reach the cell through
 * React's tree but not through the document, and pass.
 */
function keepPressInControl(event: SyntheticEvent): void {
  if (startsOnCellControl(event)) event.stopPropagation();
}

function keepKeyInControl(event: KeyboardEvent): void {
  if (
    (event.key === "Enter" || event.key === " ") &&
    startsOnCellControl(event)
  )
    event.stopPropagation();
}

function chain<E>(
  own: (event: E) => void,
  given: ((event: E) => void) | undefined,
): (event: E) => void {
  return (event) => {
    given?.(event);
    own(event);
  };
}

export function TableCell({
  align = "start",
  className,
  render,
  ...props
}: TableCellProps): ReactElement {
  // A virtualized table renders its cells as divs.
  const { isVirtualized } = useContext(CollectionRendererContext);

  return (
    <AriaCell
      {...props}
      className={composeRenderProps(className, (value) =>
        cn(
          "sp-table-cell",
          "whitespace-nowrap bg-clip-padding align-middle outline-none",
          tableAlignmentClassName(align),
          value,
        ),
      )}
      data-align={align}
      data-slot="table-cell"
      // React Aria takes no key handlers on a cell, so the cell element is
      // rendered here, with the handlers React Aria gives it kept.
      render={(elementProps, renderProps) => {
        const cellProps = elementProps as ComponentProps<"td">;
        const guarded: ComponentProps<"td"> = {
          ...cellProps,
          onClick: chain(keepPressInControl, cellProps.onClick),
          onDoubleClick: chain(keepPressInControl, cellProps.onDoubleClick),
          onKeyDown: chain(keepKeyInControl, cellProps.onKeyDown),
          onMouseDown: chain(keepPressInControl, cellProps.onMouseDown),
          onPointerDown: chain(keepPressInControl, cellProps.onPointerDown),
          onPointerUp: chain(keepPressInControl, cellProps.onPointerUp),
        };

        if (render) return render(guarded, renderProps);

        return isVirtualized ? (
          <div {...(guarded as ComponentProps<"div">)} />
        ) : (
          <td {...guarded} />
        );
      }}
    />
  );
}

export function TableSelectionCheckbox({
  className,
  ...props
}: TableSelectionCheckboxProps): ReactElement {
  // The box reads the Checkbox's size scale, from the table it sits in.
  const size = useResolvedControlSize(useContext(TableSizeContext));
  // React Aria counts every one of no rows as selected, so a table whose rows
  // are gone while keys stay selected showed its select-all box checked. With
  // no rows there is nothing to select: the box is unchecked, as TanStack
  // Table's getIsAllRowsSelected() reports for an empty table, and React Aria
  // keeps it disabled. Only the header box can render then.
  const tableState = useContext(TableStateContext);
  const noRows = tableState !== null && tableState.collection.size === 0;

  return (
    <AriaCheckbox
      {...props}
      {...(noRows ? { isIndeterminate: false, isSelected: false } : {})}
      className={composeRenderProps(className, (value) =>
        cn("sp-table-selection-checkbox", value),
      )}
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
          className="sp-table-selection-indicator"
          data-slot="table-selection-indicator"
        >
          <CheckboxGlyph size={size} />
        </span>
      )}
    </AriaCheckbox>
  );
}
