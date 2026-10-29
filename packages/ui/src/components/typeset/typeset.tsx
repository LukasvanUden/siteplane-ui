"use client";

import {
  Children,
  isValidElement,
  type ComponentProps,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { Button } from "../button";
import { Code, CodeBlock } from "../code";
import {
  NativeTable,
  NativeTableBody,
  NativeTableCell,
  NativeTableFooter,
  NativeTableHead,
  NativeTableHeader,
  NativeTableRow,
} from "../native-table";
import { Separator } from "../separator";

import "./typeset.css";

/**
 * How roomy the text is. `chat` is the kit's body type with a tight rhythm,
 * for a message; `document` is a size up with more room between blocks.
 */
export type TypesetDensity = "chat" | "document";

export type TypesetProps = ComponentProps<"div"> & {
  /** Defaults to `chat`. */
  density?: TypesetDensity | undefined;
};

/**
 * Kit typography for rendered markdown: it sets the kit's body type on its
 * container and stacks the blocks with a gap. The blocks are the Typeset parts
 * and the kit's own Code, CodeBlock and table, which `typesetComponents` maps
 * the elements of a markdown renderer to. The three values that tune it are
 * the custom properties `--sp-typeset-size`, `--sp-typeset-leading` and
 * `--sp-typeset-flow`.
 */
export function Typeset({
  className,
  density = "chat",
  ...props
}: TypesetProps): ReactElement {
  return (
    <div
      className={cn(slotClass("typeset", props), className)}
      data-density={density}
      data-slot="typeset"
      {...props}
    />
  );
}

/** A paragraph. */
export function TypesetParagraph({
  className,
  ...props
}: ComponentProps<"p">): ReactElement {
  return (
    <p
      className={cn(slotClass("typeset-paragraph", props), className)}
      data-slot="typeset-paragraph"
      {...props}
    />
  );
}

export type TypesetHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type TypesetHeadingProps = ComponentProps<"h1"> & {
  /**
   * The heading level, which is also the element. Levels 1 to 3 have a size
   * of their own; 4 to 6 share the body size in a heavier weight. Defaults
   * to 2.
   */
  level?: TypesetHeadingLevel | undefined;
};

const headingTags = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

/** A heading, from `h1` to `h6` by `level`. */
export function TypesetHeading({
  className,
  level = 2,
  ...props
}: TypesetHeadingProps): ReactElement {
  const Tag = headingTags[level];
  return (
    <Tag
      className={cn(slotClass("typeset-heading", props), className)}
      data-level={level}
      data-slot="typeset-heading"
      {...props}
    />
  );
}

export type TypesetListProps = Omit<ComponentProps<"ol">, "ref"> & {
  /** A numbered list (`ol`) instead of a bulleted one (`ul`). */
  ordered?: boolean | undefined;
  ref?: Ref<HTMLOListElement | HTMLUListElement> | undefined;
};

/** A bulleted or numbered list, with a gap between its items. */
export function TypesetList({
  className,
  ordered = false,
  ...props
}: TypesetListProps): ReactElement {
  // An `ul` takes the same attributes as far as it uses any; the casts only
  // give both elements one type.
  const Tag = (ordered ? "ol" : "ul") as "ol";
  return (
    <Tag
      className={cn(slotClass("typeset-list", props), className)}
      data-ordered={ordered ? "" : undefined}
      data-slot="typeset-list"
      {...(props as ComponentProps<"ol">)}
    />
  );
}

/** An item of a list. */
export function TypesetListItem({
  className,
  ...props
}: ComponentProps<"li">): ReactElement {
  return (
    <li
      className={cn(slotClass("typeset-list-item", props), className)}
      data-slot="typeset-list-item"
      {...props}
    />
  );
}

/**
 * A link, in the kit's link look: the inline link Button, underlined in the
 * text colour, which fades on hover and press and keeps the kit's focus ring.
 */
export function TypesetLink({
  children,
  className,
  ...props
}: ComponentProps<"a">): ReactElement {
  return (
    <Button
      className={className}
      data-slot="typeset-link"
      profile="inline"
      render={<a {...props} />}
      variant="link"
    >
      {children}
    </Button>
  );
}

/** A quote: its text is quieter, and a bar marks its start. */
export function TypesetQuote({
  className,
  ...props
}: ComponentProps<"blockquote">): ReactElement {
  return (
    <blockquote
      className={cn(slotClass("typeset-quote", props), className)}
      data-slot="typeset-quote"
      {...props}
    />
  );
}

/** A thematic break: the kit's Separator, with the slot of a Typeset part. */
export function TypesetRule(
  props: ComponentProps<typeof Separator>,
): ReactElement {
  return <Separator data-slot="typeset-rule" {...props} />;
}

/** Strong text, in the kit's strong weight. */
export function TypesetStrong({
  className,
  ...props
}: ComponentProps<"strong">): ReactElement {
  return (
    <strong
      className={cn(slotClass("typeset-strong", props), className)}
      data-slot="typeset-strong"
      {...props}
    />
  );
}

/** The text a node renders, for the code of a fence. */
function textOf(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return textOf(node.props.children);
  return "";
}

export type TypesetCodeBlockProps = Omit<ComponentProps<"pre">, "title"> & {
  /**
   * Whether the closing fence has not come yet: the copy action stays
   * disabled until it has. Streamdown tells this with
   * `useIsCodeFenceIncomplete`.
   */
  streaming?: boolean | undefined;
};

/**
 * A fenced code block, as a markdown renderer passes it to `pre`: a `code`
 * element, with `language-x` as its class when the fence names a language. It
 * renders the kit's CodeBlock with that language, which it also shows as the
 * title, and the copy action; the language-less fence has the floating copy
 * action. `typesetComponents.pre` is this part.
 */
export function TypesetCodeBlock({
  children,
  streaming,
  ...props
}: TypesetCodeBlockProps): ReactElement {
  const fence = Children.toArray(children).find(
    (
      child,
    ): child is ReactElement<{ children?: ReactNode; className?: string }> =>
      isValidElement(child),
  );
  const language = /(?:^|\s)language-(\S+)/.exec(
    fence?.props.className ?? "",
  )?.[1];
  // The fence ends its last line with a line break of its own.
  const value = textOf(fence ? fence.props.children : children).replace(
    /\n$/,
    "",
  );
  return (
    <CodeBlock
      copyable
      language={language}
      streaming={streaming}
      title={language}
      value={value}
      {...props}
    />
  );
}

/*
 * The map for the `components` prop of a markdown renderer, react-markdown or
 * Streamdown: each element becomes a Typeset part, or the kit component that
 * owns it. A renderer passes the hast `node` along with the props of the
 * element; the parts below drop it, since a DOM element must not get it.
 */

type MarkdownProps<Tag extends keyof JSX.IntrinsicElements> =
  ComponentProps<Tag> & { node?: unknown };

function withoutNode<Props extends { node?: unknown }>(
  props: Props,
): Omit<Props, "node"> {
  const { node, ...rest } = props;
  void node;
  return rest;
}

/**
 * The props of a table element without `node` and without `style`. A markdown
 * table part forwards no inline style: the one thing a renderer puts in it is
 * the alignment of a column, which becomes the part's `align`, and the rest of
 * the style is dropped, so the table keeps the look of its owner.
 */
function withoutNodeAndStyle<Props extends { node?: unknown; style?: unknown }>(
  props: Props,
): Omit<Props, "node" | "style"> {
  const { node, style, ...rest } = props;
  void node;
  void style;
  return rest;
}

type CellAlignment = "center" | "end" | "start" | undefined;

/** The alignment a markdown table gives a column, as a style or an attribute. */
function cellAlignment(
  align: string | undefined,
  style: ComponentProps<"td">["style"],
): CellAlignment {
  const value = style?.textAlign ?? align;
  if (value === "center") return "center";
  if (value === "right" || value === "end") return "end";
  if (value === "left" || value === "start") return "start";
  return undefined;
}

function MarkdownHeading(level: TypesetHeadingLevel) {
  return function Heading(props: MarkdownProps<"h1">) {
    return <TypesetHeading level={level} {...withoutNode(props)} />;
  };
}

function MarkdownTableHead(props: MarkdownProps<"th">) {
  const { align, ...rest } = withoutNodeAndStyle(props);
  return (
    <NativeTableHead align={cellAlignment(align, props.style)} {...rest} />
  );
}

function MarkdownTableCell(props: MarkdownProps<"td">) {
  const { align, ...rest } = withoutNodeAndStyle(props);
  return (
    <NativeTableCell align={cellAlignment(align, props.style)} {...rest} />
  );
}

/**
 * Typeset parts for the elements of rendered markdown, for the `components`
 * prop of react-markdown and Streamdown:
 *
 * - paragraphs, headings (`h1` to `h6`), lists, list items, links, quotes,
 *   rules and strong text are the Typeset parts;
 * - inline code is the kit's Code, and a fence (`pre` with its `code`) is
 *   CodeBlock with the fence's language (see TypesetCodeBlock);
 * - a table is the kit's NativeTable, with its rows and cells. A table in
 *   written text has no hover, since nothing in it acts, and takes no style:
 *   a column's alignment becomes the part's `align`, the rest is dropped.
 *
 * The renderer itself is the app's; the kit has none.
 */
export const typesetComponents = {
  a: (props: MarkdownProps<"a">) => <TypesetLink {...withoutNode(props)} />,
  blockquote: (props: MarkdownProps<"blockquote">) => (
    <TypesetQuote {...withoutNode(props)} />
  ),
  code: (props: MarkdownProps<"code">) => <Code {...withoutNode(props)} />,
  h1: MarkdownHeading(1),
  h2: MarkdownHeading(2),
  h3: MarkdownHeading(3),
  h4: MarkdownHeading(4),
  h5: MarkdownHeading(5),
  h6: MarkdownHeading(6),
  hr: () => <TypesetRule />,
  li: (props: MarkdownProps<"li">) => (
    <TypesetListItem {...withoutNode(props)} />
  ),
  ol: (props: MarkdownProps<"ol">) => (
    <TypesetList ordered {...withoutNode(props)} />
  ),
  p: (props: MarkdownProps<"p">) => (
    <TypesetParagraph {...withoutNode(props)} />
  ),
  pre: (props: MarkdownProps<"pre">) => (
    <TypesetCodeBlock {...withoutNode(props)} />
  ),
  strong: (props: MarkdownProps<"strong">) => (
    <TypesetStrong {...withoutNode(props)} />
  ),
  table: (props: MarkdownProps<"table">) => (
    <NativeTable hoverable={false} {...withoutNodeAndStyle(props)} />
  ),
  tbody: (props: MarkdownProps<"tbody">) => (
    <NativeTableBody {...withoutNodeAndStyle(props)} />
  ),
  td: MarkdownTableCell,
  tfoot: (props: MarkdownProps<"tfoot">) => (
    <NativeTableFooter {...withoutNodeAndStyle(props)} />
  ),
  th: MarkdownTableHead,
  thead: (props: MarkdownProps<"thead">) => (
    <NativeTableHeader {...withoutNodeAndStyle(props)} />
  ),
  tr: (props: MarkdownProps<"tr">) => (
    <NativeTableRow hoverable={false} {...withoutNodeAndStyle(props)} />
  ),
  ul: (props: MarkdownProps<"ul">) => <TypesetList {...withoutNode(props)} />,
};
