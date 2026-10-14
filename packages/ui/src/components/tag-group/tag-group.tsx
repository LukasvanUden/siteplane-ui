"use client";

import { XIcon } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import {
  Button as TagButtonPrimitive,
  CollectionRendererContext,
  DefaultCollectionRenderer,
  ListStateContext,
  Tag as TagPrimitive,
  TagGroup as TagGroupPrimitive,
  TagList as TagListPrimitive,
  type CollectionRenderer,
  type Selection,
} from "react-aria-components";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { cn } from "../../system/utils/cn";
import { Badge } from "../badge";
import { Button } from "../button";
import { MotionItem, MotionList } from "../motion";
import { leavingTagProps } from "./tag-group-leaving";

const MotionTagPrimitive = motion.create(TagPrimitive);

type InternalTagProps = TagProps & { collectionKey?: string };

type TagEntry = {
  element: React.ReactElement<TagProps>;
  key: string;
};

/**
 * A tag is selectable with an `onSelectedChange` handler or, uncontrolled,
 * with `defaultSelected`; `selected` alone only shows the state.
 */
function isSelectableTag({ element }: TagEntry): boolean {
  return (
    Boolean(element.props.onSelectedChange) ||
    element.props.defaultSelected !== undefined
  );
}

type TagVisualContextValue = {
  groupRef: React.RefObject<HTMLDivElement | null>;
  size: SiteplaneControlSize;
};

const TagVisualContext = React.createContext<TagVisualContextValue | null>(
  null,
);

function getTagEntries(children: React.ReactNode): TagEntry[] {
  const entries: TagEntry[] = [];

  function collect(nodes: React.ReactNode, path: string) {
    React.Children.forEach(nodes, (child, index) => {
      if (!React.isValidElement(child)) return;
      const position = `${path}${index}`;
      if (child.type === React.Fragment) {
        collect(
          (child as React.ReactElement<{ children?: React.ReactNode }>).props
            .children,
          `${position}.`,
        );
        return;
      }
      if (child.type !== Tag) return;
      const element = child as React.ReactElement<TagProps>;
      entries.push({
        element,
        key: String(element.key ?? element.props.id ?? position),
      });
    });
  }

  collect(children, "");
  return entries;
}

function getTextValue(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : React.isValidElement<{ children?: React.ReactNode }>(child)
          ? getTextValue(child.props.children)
          : "",
    )
    .join(" ")
    .trim();
}

type CollectionRootProps = React.ComponentProps<
  CollectionRenderer["CollectionRoot"]
>;
type TagNode =
  CollectionRootProps["collection"] extends Iterable<infer Node> ? Node : never;

/**
 * A tag that has left the collection, drawn as it was. React Aria drops a
 * removed tag at once, so its focus moves on and its element goes as it always
 * did; this copy is only the picture that fades out and takes no input.
 */
function LeavingTag({ node }: { node: TagNode }): React.ReactElement {
  return (
    <div {...leavingTagProps(node.props as Record<string, unknown>)}>
      {node.rendered}
    </div>
  );
}

/** A tag of the collection, or the picture of one that has just left it. */
function TagSlot({ node }: { node: TagNode }): React.ReactNode {
  const state = React.useContext(ListStateContext);
  return state?.collection.getItem(node.key) ? (
    node.render?.(node)
  ) : (
    <LeavingTag node={node} />
  );
}

/**
 * Draws the collection through the motion component: a tag that joins fades in
 * and a tag that leaves fades out, the tags around them glide to their new
 * place, and the height of the group follows when a row of tags appears or
 * goes. The tags themselves stay React Aria's rows.
 */
function TagCollectionRoot({
  collection,
}: CollectionRootProps): React.ReactElement {
  const context = React.useContext(TagVisualContext);

  return (
    // The list adds no box: the group is the box whose height follows.
    <MotionList
      className="contents"
      container={context?.groupRef}
      layout="flow"
      render={<div role="presentation" />}
    >
      {[...collection].map((node) => (
        <MotionItem
          className="flex max-w-full min-w-0"
          key={node.key}
          render={<div />}
        >
          <TagSlot node={node} />
        </MotionItem>
      ))}
    </MotionList>
  );
}

const tagCollectionRenderer: CollectionRenderer = {
  ...DefaultCollectionRenderer,
  CollectionRoot: TagCollectionRoot,
};

export interface TagGroupProps extends Omit<
  React.ComponentProps<"div">,
  "role"
> {
  size?: SiteplaneControlSize;
}

export function TagGroup({
  children,
  className,
  ref,
  size,
  tabIndex = -1,
  ...props
}: TagGroupProps): React.ReactElement {
  const entries = React.useMemo(() => getTagEntries(children), [children]);
  const resolvedSize = useResolvedControlSize(size);
  const groupRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => groupRef.current as HTMLDivElement);

  // An uncontrolled tag (`defaultSelected`, no `selected`) keeps its state
  // here once it has changed; until then its default applies, also for a tag
  // that joins later.
  const [uncontrolledSelection, setUncontrolledSelection] = React.useState<
    ReadonlyMap<string, boolean>
  >(() => new Map());
  const isSelected = ({ element, key }: TagEntry): boolean =>
    element.props.selected ??
    uncontrolledSelection.get(key) ??
    element.props.defaultSelected ??
    false;
  const selectableEntries = entries.filter(isSelectableTag);
  const removableEntries = entries.filter(({ element }) =>
    Boolean(element.props.onRemove),
  );
  const selectedKeys = entries.filter(isSelected).map(({ key }) => key);
  const disabledKeys = entries
    .filter(({ element }) => element.props.disabled)
    .map(({ key }) => key);
  const visualContext = React.useMemo<TagVisualContextValue>(
    () => ({ groupRef, size: resolvedSize }),
    [resolvedSize],
  );

  const handleSelectionChange = (selection: Selection) => {
    if (selection === "all") return;
    const changed = new Map<string, boolean>();
    for (const entry of selectableEntries) {
      const nextSelected = selection.has(entry.key);
      if (nextSelected === isSelected(entry)) continue;
      if (entry.element.props.selected === undefined) {
        changed.set(entry.key, nextSelected);
      }
      entry.element.props.onSelectedChange?.(nextSelected);
    }
    if (changed.size > 0) {
      setUncontrolledSelection((current) => new Map([...current, ...changed]));
    }
  };

  const handleRemove = (keys: Set<React.Key>) => {
    for (const key of keys) {
      entries
        .find((entry) => entry.key === String(key))
        ?.element.props.onRemove?.();
    }
  };

  return (
    <TagVisualContext.Provider value={visualContext}>
      <TagGroupPrimitive
        {...({
          ...props,
          tabIndex,
        } as unknown as React.ComponentProps<typeof TagGroupPrimitive>)}
        className={cn(
          "sp-tag-group sp-base-tag-group",
          "relative flex flex-wrap gap-2",
          className,
        )}
        data-foundation="tag-group"
        data-size={resolvedSize}
        data-slot="tag-group"
        disabledKeys={disabledKeys}
        {...(removableEntries.length > 0 ? { onRemove: handleRemove } : {})}
        {...(selectableEntries.length > 0
          ? { onSelectionChange: handleSelectionChange }
          : {})}
        ref={groupRef}
        selectedKeys={selectedKeys}
        selectionBehavior="toggle"
        selectionMode={selectableEntries.length > 0 ? "multiple" : "none"}
      >
        <CollectionRendererContext.Provider value={tagCollectionRenderer}>
          <TagListPrimitive className="contents data-empty:block data-empty:outline-none">
            {entries.map((entry) =>
              React.cloneElement(entry.element, {
                collectionKey: entry.key,
                key: entry.key,
                selected: isSelected(entry),
              } as InternalTagProps & React.Attributes),
            )}
          </TagListPrimitive>
        </CollectionRendererContext.Provider>
      </TagGroupPrimitive>
    </TagVisualContext.Provider>
  );
}

export interface TagProps extends Omit<
  React.ComponentProps<typeof motion.span>,
  | "children"
  | "layout"
  | "layoutDependency"
  | "onClick"
  | "role"
  | "tabIndex"
  | "transition"
> {
  children: React.ReactNode;
  /** Uncontrolled initial selection; the tag is selectable without a handler. */
  defaultSelected?: boolean | undefined;
  disabled?: boolean | undefined;
  onRemove?: (() => void) | undefined;
  onSelectedChange?: ((selected: boolean) => void) | undefined;
  removeLabel?: string | undefined;
  /** Controlled selection. Omit for uncontrolled usage with `defaultSelected`. */
  selected?: boolean | undefined;
}

export function Tag({
  children,
  className,
  collectionKey,
  defaultSelected,
  disabled = false,
  onRemove,
  onSelectedChange,
  removeLabel = "Remove tag",
  selected = false,
  ...props
}: InternalTagProps): React.ReactElement {
  const context = React.useContext(TagVisualContext);
  if (!context || collectionKey === undefined) {
    throw new Error("Tag must be rendered inside TagGroup.");
  }

  const selectable = Boolean(onSelectedChange) || defaultSelected !== undefined;
  const removable = Boolean(onRemove);

  return (
    <Badge
      {...(props as unknown as React.ComponentProps<typeof Badge>)}
      className={cn(
        "sp-tag group",
        // The tag renders a div, so Badge's :disabled styles never match it.
        "data-disabled:opacity-(--sp-rw-disabled-opacity-action)",
        disabled ? "cursor-not-allowed" : selectable && "cursor-pointer",
        className,
      )}
      data-disabled={disabled || undefined}
      data-removable={removable || undefined}
      data-selected={selected || undefined}
      data-slot="tag"
      render={
        <MotionTagPrimitive
          id={collectionKey}
          isDisabled={disabled}
          textValue={getTextValue(children)}
        />
      }
      size={context.size}
      variant={selected ? "info" : "secondary"}
    >
      {children}
      {removable ? (
        <Button
          aria-label={removeLabel}
          // A disabled tag already dims its remove action; it isn't dimmed
          // again (design-rework.css, "Disabled parts").
          className="sp-tag-remove-action size-3.5 min-w-0 shrink-0"
          disabled={disabled}
          render={<TagButtonPrimitive slot="remove" />}
          size="icon-2xs"
          variant="ghost"
        >
          <XIcon aria-hidden="true" className="size-2.5" />
        </Button>
      ) : null}
    </Badge>
  );
}
