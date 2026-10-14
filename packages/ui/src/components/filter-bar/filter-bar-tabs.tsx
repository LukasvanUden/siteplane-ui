"use client";

import { SearchIcon, XIcon } from "lucide-react";
import * as React from "react";

import { useResolvedControlSize } from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { Button } from "../button";
import { KitButton } from "../button/button-internal";
import { Input, type InputProps } from "../input";
import { swapFadeClassName } from "../motion/motion-presence";
import { ScrollArea } from "../scroll-area";
import { Tabs, TabsList, TabsRail, type TabsProps } from "../tabs";

/** The search input's own props; the bar owns its value, type, size and surface. */
export type FilterBarTabsInputProps = Omit<
  InputProps,
  | "children"
  | "defaultValue"
  | "nativeInput"
  | "onChange"
  | "onValueChange"
  | "profile"
  | "profileMode"
  | "ref"
  | "renderInput"
  | "size"
  | "textSize"
  | "type"
  | "unstyled"
  | "value"
  | "variant"
>;

export interface FilterBarTabsProps extends Omit<
  TabsProps,
  "children" | "orientation"
> {
  /** Names the tab list. */
  "aria-label"?: string;
  /** Names the tab list from another element. */
  "aria-labelledby"?: string;
  /** The views: `TabsTab` elements, each with a `value`. */
  children?: React.ReactNode;
  /** The clear button's accessible name. */
  clearLabel?: string;
  /** The search is open and the bar holds the field instead of the tabs. Uncontrolled by default. */
  defaultSearching?: boolean;
  /** The search text. Uncontrolled by default; closing the search empties it. */
  defaultQuery?: string;
  /** Props of the search input, such as `placeholder` or `aria-label`. */
  inputProps?: FilterBarTabsInputProps;
  /** Called with the new text as it is typed, and with an empty text when the search closes. */
  onQueryChange?: (query: string) => void;
  /** Called when the search opens or closes. */
  onSearchingChange?: (searching: boolean) => void;
  /** The search text, for a controlled search. */
  query?: string;
  /** The visible name of the leading search segment. */
  searchLabel?: string;
  /** Whether the search is open, for a controlled search. */
  searching?: boolean;
  /** `default` shares the Tabs surface; `pill` rounds the rail and the tabs fully. */
  variant?: "default" | "pill";
}

/** Controlled when the prop is set, uncontrolled from `defaultValue` otherwise. */
function useControllableState<Value>(
  controlled: Value | undefined,
  defaultValue: Value,
  onChange: ((value: Value) => void) | undefined,
): [Value, (value: Value) => void] {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = controlled !== undefined;
  const setValue = React.useCallback(
    (next: Value) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [isControlled ? controlled : uncontrolled, setValue];
}

/**
 * View tabs that open into a search field inside the same bar. The leading
 * Search segment takes the place of the selected tab; while it is open the tabs
 * give way to the field and the clear button, and the shared Tabs indicator
 * stays on Search. Escape or the clear button empties the search and returns to
 * the tabs, with the selected tab unchanged and the focus back on Search.
 *
 * The tab selection stays with Tabs (`value`, `onValueChange`); the search
 * state is separate (`searching`, `query`), so the application decides what a
 * search means for its list. Tabs that do not fit scroll beside the Search
 * segment, in a ScrollArea that fades the edge where more tabs wait.
 */
export function FilterBarTabs({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  clearLabel = "Clear search",
  defaultQuery = "",
  defaultSearching = false,
  inputProps,
  onQueryChange,
  onSearchingChange,
  query: queryProp,
  searchLabel = "Search",
  searching: searchingProp,
  size,
  variant = "default",
  ...props
}: FilterBarTabsProps): React.ReactElement {
  const [searching, setSearching] = useControllableState(
    searchingProp,
    defaultSearching,
    onSearchingChange,
  );
  const [query, setQuery] = useControllableState(
    queryProp,
    defaultQuery,
    onQueryChange,
  );
  const resolvedSize = useResolvedControlSize(size);
  const fieldId = React.useId();
  const searchRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // The field takes the focus when the search opens, not when it starts open.
  const wasSearching = React.useRef(searching);
  React.useEffect(() => {
    if (searching && !wasSearching.current) inputRef.current?.focus();
    wasSearching.current = searching;
  }, [searching]);

  function closeSearch() {
    // The focus moves first: the field is inert as soon as the search is closed.
    searchRef.current?.focus();
    if (query !== "") setQuery("");
    setSearching(false);
  }

  const { className: inputClassName, ...restInputProps } = inputProps ?? {};

  return (
    <Tabs
      className={cn("min-w-0 flex-1", className)}
      data-pattern="filter-bar-tabs"
      data-searching={searching || undefined}
      size={resolvedSize}
      {...props}
    >
      <TabsRail
        activeIndicatorRef={searching ? searchRef : undefined}
        onKeyDown={(event) => {
          if (
            !searching ||
            event.key !== "Escape" ||
            event.nativeEvent.isComposing
          )
            return;
          // The first Escape leaves the search; a surrounding overlay keeps its own.
          event.preventDefault();
          event.stopPropagation();
          closeSearch();
        }}
        variant={variant}
      >
        <KitButton
          aria-controls={fieldId}
          aria-expanded={searching}
          data-active={searching || undefined}
          onClick={() => {
            if (searching) inputRef.current?.focus();
            else setSearching(true);
          }}
          profile="tabs-tab"
          profileMode={variant}
          ref={searchRef}
          size={resolvedSize}
          variant="text"
        >
          <SearchIcon aria-hidden="true" />
          {searchLabel}
        </KitButton>
        <div className="relative min-w-0 flex-1">
          {/* Tabs that do not fit scroll, and the ScrollArea fades the edge
              where more tabs wait. Its viewport would join the tab order, so
              the strip is inert with the tabs while the field is open. */}
          <ScrollArea
            aria-hidden={searching || undefined}
            inert={searching || undefined}
            scrollbar="hidden"
            scrollFade
          >
            <TabsList
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              className={cn(
                swapFadeClassName,
                "w-max max-w-none overflow-visible",
              )}
              data-ending-style={searching ? "" : undefined}
              embedded
              variant={variant}
            >
              {children}
            </TabsList>
          </ScrollArea>
          <div
            aria-hidden={!searching || undefined}
            className={cn(
              "sp-filter-bar-tabs-field",
              swapFadeClassName,
              "absolute inset-0 flex items-center gap-1 pe-1",
            )}
            data-ending-style={searching ? undefined : ""}
            data-slot="filter-bar-tabs-field"
            id={fieldId}
            inert={!searching || undefined}
            onMouseDown={(event) => {
              // The space around the text belongs to the field: a press there focuses it.
              if (event.target !== event.currentTarget) return;
              event.preventDefault();
              inputRef.current?.focus();
            }}
          >
            <Input
              aria-label={searchLabel}
              autoComplete="off"
              enterKeyHint="search"
              {...restInputProps}
              className={cn("min-w-0 flex-1", inputClassName)}
              onValueChange={setQuery}
              ref={inputRef}
              size={resolvedSize}
              textSize={resolvedSize === "xl" ? "base" : "sm"}
              type="search"
              unstyled
              value={query}
            />
            <Button
              aria-label={clearLabel}
              onClick={closeSearch}
              profile="field-action"
              size={resolvedSize === "xl" ? "icon-sm" : "icon-xs"}
              variant="ghost"
            >
              <XIcon aria-hidden="true" className="size-3" />
            </Button>
          </div>
        </div>
      </TabsRail>
    </Tabs>
  );
}
