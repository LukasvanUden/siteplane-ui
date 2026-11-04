/*
 * The values of a Tags Input, apart from its markup, so they can be tested on
 * their own: the keys of its tags, the check a new tag must pass and the
 * split of typed or pasted text at the delimiter.
 */

/** A tag as the field renders it: its text and a key that stays its own. */
export type TagsInputEntry = { key: string; label: string };

/**
 * The tags with their keys. A key is made of the text and how often the same
 * text came before it, so the second "react" is always "1:react": the keys
 * stay stable from render to render, also with duplicates allowed, and a tag
 * that is removed takes its own key with it.
 */
export function tagEntries(tags: readonly string[]): TagsInputEntry[] {
  const seen = new Map<string, number>();
  return tags.map((label) => {
    const count = seen.get(label) ?? 0;
    seen.set(label, count + 1);
    return { key: `${count}:${label}`, label };
  });
}

export type TagRules = {
  /** Whether a text that is a tag already may be added again. */
  allowDuplicates?: boolean | undefined;
  /** The most tags the field holds. */
  maxTags?: number | undefined;
  /** Accepts or rejects a new tag; it gets the trimmed text. */
  validate?: ((tag: string) => boolean) | undefined;
};

/**
 * The tag that `text` adds to `tags`, trimmed, or null when it adds none:
 * when it is empty, when it is a tag already and duplicates are not allowed,
 * when the field holds its most tags, or when `validate` rejects it.
 */
export function acceptedTag(
  tags: readonly string[],
  text: string,
  { allowDuplicates = false, maxTags, validate }: TagRules,
): string | null {
  const tag = text.trim();
  if (!tag) return null;
  if (!allowDuplicates && tags.includes(tag)) return null;
  if (maxTags !== undefined && tags.length >= maxTags) return null;
  if (validate && !validate(tag)) return null;
  return tag;
}

/**
 * Typed or pasted text split at the delimiter: every part before the last
 * delimiter is a tag to add, the rest stays in the field. Without a delimiter
 * in the text, or without a delimiter at all, nothing is split.
 */
export function splitAtDelimiter(
  text: string,
  delimiter: string | null | undefined,
): { parts: string[]; rest: string } {
  if (!delimiter || !text.includes(delimiter)) return { parts: [], rest: text };
  const parts = text.split(delimiter);
  const rest = parts.pop() ?? "";
  return { parts, rest: rest.trimStart() };
}

/**
 * The tags after adding each of `parts` that passes the rules, in order, and
 * the tags that were added.
 */
export function addTags(
  tags: readonly string[],
  parts: readonly string[],
  rules: TagRules,
): { added: string[]; tags: string[] } {
  const next = [...tags];
  const added: string[] = [];
  for (const part of parts) {
    const tag = acceptedTag(next, part, rules);
    if (tag === null) continue;
    next.push(tag);
    added.push(tag);
  }
  return { added, tags: next };
}
