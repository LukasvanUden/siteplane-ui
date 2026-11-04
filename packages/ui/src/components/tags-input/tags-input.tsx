"use client";

import * as React from "react";

import {
  type SiteplaneControlSize,
  useResolvedControlSize,
} from "../../system/provider/siteplane-ui-provider";
import { useSiteplaneMessages } from "../../system/locale/messages-context";
import type { FormControlVariant } from "../../system/styles/surface";
import { cn } from "../../system/utils/cn";
import { slotClass } from "../../system/utils/slot-class";
import { useFieldControlBridge } from "../field/field-control-bridge";
import { Input, unnamedInputRender } from "../input/input";
import { KitInput } from "../input/input-internal";
import { FieldStatus } from "../input-group/field-status";
import { Tag, TagGroup } from "../tag-group";
import {
  acceptedTag,
  addTags,
  splitAtDelimiter,
  tagEntries,
  type TagRules,
} from "./tags-input-entries";

import "./tags-input.css";

/*
 * The tags of a field are the Tag sizes of its chips (the chip rule,
 * design-rework.css): sm in an sm field, md in an md or lg field and xl in an
 * xl field.
 */
const tagSizes = {
  lg: "md",
  md: "md",
  sm: "sm",
  xl: "xl",
} as const satisfies Record<SiteplaneControlSize, SiteplaneControlSize>;

export type TagsInputProps = Omit<
  React.ComponentProps<"div">,
  | "aria-describedby"
  | "aria-invalid"
  | "aria-label"
  | "aria-labelledby"
  | "children"
  | "defaultValue"
  | "id"
  | "onChange"
> &
  TagRules & {
    /** The tags, controlled. */
    value?: readonly string[] | undefined;
    /** The tags the field starts with, uncontrolled. */
    defaultValue?: readonly string[] | undefined;
    /** Called with the new tags when a tag is added or removed. */
    onValueChange?: ((tags: string[]) => void) | undefined;
    /** What the field shows while it holds no tag. */
    placeholder?: string | undefined;
    /** The control size, as Input takes it; unset, the provider's. */
    size?: SiteplaneControlSize | undefined;
    /**
     * The surface, as on Input and ComboboxChips: `default` rests inset on
     * the field's light shade, `soft` lays a subtle fill under the same edge
     * and takes the page background while the field has focus. Default:
     * `default`.
     */
    variant?: FormControlVariant | undefined;
    disabled?: boolean | undefined;
    /**
     * The name of the tags in the form data, one entry per tag; a Field's
     * name comes first. The text being typed is not sent.
     */
    name?: string | undefined;
    /** The id of the form that the tags belong to. */
    form?: string | undefined;
    /**
     * Marks the field as required for assistive technology and for a Field's
     * `requiredIndicator`. The field does not stop a form that is sent
     * without a tag.
     */
    required?: boolean | undefined;
    /**
     * Typing this text, or pasting text with it, adds the text before it as a
     * tag, as Enter does. `null` turns it off. Default: a comma.
     */
    delimiter?: string | null | undefined;
    /**
     * A help text behind a help icon at the end of the field, shown in a
     * Tooltip on hover and keyboard focus, as Input's `tooltip`.
     */
    tooltip?: React.ReactNode;
    /**
     * While the field is invalid (`aria-invalid`, which an invalid Field
     * sets), an alert icon stands at its end in the help icon's place.
     * `false` turns it off. Default: `true`.
     */
    showInvalidIcon?: boolean | undefined;
    /**
     * The name of a tag's remove action. Default: the `chip.remove` message
     * with the tag, "Remove" and the tag in English.
     */
    removeLabel?: ((tag: string) => string) | undefined;
    /** The id of the text input, which a label's `htmlFor` names. */
    id?: string | undefined;
    "aria-describedby"?: string | undefined;
    "aria-invalid"?: React.AriaAttributes["aria-invalid"];
    /** The name of the text input, and of the tags without a Field label. */
    "aria-label"?: string | undefined;
    "aria-labelledby"?: string | undefined;
  };

/**
 * A field that takes free text as tags: the tags stand in the field before
 * the text, Enter adds what was typed (and so does the delimiter, a comma by
 * default), and each tag's remove action takes it out. A new tag is trimmed,
 * and an empty one, a duplicate (unless `allowDuplicates`), one past
 * `maxTags` or one that `validate` rejects is not added.
 *
 * Backspace in the empty text, and ArrowLeft at its start, move to the last
 * tag; the arrows move between the tags, Backspace or Delete removes the
 * focused tag, and ArrowRight on the last tag returns to the text. Once the
 * last tag is removed, the text takes focus.
 *
 * The field is the chips field of the kit (design-rework.css) on the field
 * scale of its size; the tags are a TagGroup of Tags, and the text is the
 * kit's Input, which takes a Field's label, description, error and state.
 */
export function TagsInput({
  allowDuplicates,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  defaultValue,
  delimiter = ",",
  disabled,
  form,
  id,
  maxTags,
  name,
  onMouseDown,
  onValueChange,
  placeholder,
  removeLabel: removeLabelProp,
  required,
  showInvalidIcon = true,
  size,
  tooltip,
  validate,
  value,
  variant = "default",
  ...props
}: TagsInputProps): React.ReactElement {
  const messages = useSiteplaneMessages("tagsInput");
  const resolvedSize = useResolvedControlSize<SiteplaneControlSize>(size);
  // The Field's name, label and disabled state reach the tags as they reach
  // the text.
  const field = useFieldControlBridge({
    "aria-labelledby": ariaLabelledBy,
    disabled,
    name,
  });
  const [ownTags, setOwnTags] = React.useState<readonly string[]>(
    () => defaultValue ?? [],
  );
  const tags = value ?? ownTags;
  const entries = React.useMemo(() => tagEntries(tags), [tags]);
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const tagsRef = React.useRef<HTMLDivElement | null>(null);
  const focusTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(focusTimer.current), []);
  const rules: TagRules = { allowDuplicates, maxTags, validate };

  function commit(next: string[]) {
    if (value === undefined) setOwnTags(next);
    onValueChange?.(next);
  }

  /** The tags that are in the collection, without one that fades out. */
  function tagRows(): HTMLElement[] {
    return [
      ...(tagsRef.current?.querySelectorAll<HTMLElement>('[role="row"]') ?? []),
    ];
  }

  function remove(key: string) {
    const remaining = entries.filter((entry) => entry.key !== key);
    if (remaining.length === entries.length) return;
    commit(remaining.map((entry) => entry.label));
    // Without a tag to move to, focus returns to the text, after the tag
    // group has moved its own.
    if (remaining.length === 0) {
      clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  return (
    <div
      {...props}
      className={cn(
        slotClass("tags-input", props),
        // The field of its size: its height, padding and text (the field
        // scale), and the size of its tags; a Field reads it for its hint.
        "sp-field-scale",
        className,
      )}
      data-disabled={field.disabled || undefined}
      data-size={resolvedSize}
      data-slot="tags-input"
      // The surface, from the field family's soft block (design-rework.css).
      data-variant={variant}
      // A press on the field outside its tags and the text puts the caret in
      // the text.
      onMouseDown={(event) => {
        onMouseDown?.(event);
        if (event.defaultPrevented || field.disabled) return;
        if ((event.target as Element).closest('input, button, [role="row"]'))
          return;
        event.preventDefault();
        inputRef.current?.focus();
      }}
      role="group"
    >
      <div
        className="sp-tags-input-area"
        data-slot="tags-input-area"
        // ArrowRight on the last tag returns to the text. It runs before the
        // tag group, which would move on to the first tag.
        onKeyDownCapture={(event) => {
          if (event.key !== "ArrowRight") return;
          const last = tagRows().at(-1);
          if (!last?.contains(event.target as Node)) return;
          event.preventDefault();
          event.stopPropagation();
          inputRef.current?.focus();
        }}
      >
        {/* The tags flow in the field's row with the text after them (the
            group adds no box of its own). */}
        <TagGroup
          aria-label={
            field.labelledBy ? undefined : (ariaLabel ?? messages.label)
          }
          aria-labelledby={field.labelledBy}
          className="contents"
          ref={tagsRef}
          size={tagSizes[resolvedSize]}
        >
          {entries.map((entry) => (
            <Tag
              disabled={field.disabled}
              key={entry.key}
              onRemove={() => remove(entry.key)}
              // Without a removeLabel the Tag names its remove action, the
              // chip.remove message with the tag.
              removeLabel={removeLabelProp?.(entry.label)}
            >
              {entry.label}
            </Tag>
          ))}
        </TagGroup>
        <KitInput
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-required={required || undefined}
          disabled={field.disabled}
          id={id}
          onChange={(event) => {
            const text = event.currentTarget.value;
            const { parts, rest } = splitAtDelimiter(text, delimiter);
            if (parts.length === 0) {
              setDraft(text);
              return;
            }
            const { added, tags: next } = addTags(tags, parts, rules);
            if (added.length > 0) commit(next);
            // A text the field does not take stays in it, without the
            // delimiter, as it does on Enter.
            setDraft(
              added.length === 0 && parts.length === 1 ? parts[0] + rest : rest,
            );
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            const input = event.currentTarget;
            const atStart =
              input.selectionStart === 0 && input.selectionEnd === 0;
            if (event.key === "Enter") {
              // Enter adds the text and never sends the form.
              event.preventDefault();
              const tag = acceptedTag(tags, draft, rules);
              if (tag === null) return;
              commit([...tags, tag]);
              setDraft("");
              return;
            }
            const toTags =
              (event.key === "Backspace" && draft === "") ||
              event.key === "ArrowLeft";
            if (!toTags || !atStart) return;
            const last = tagRows().at(-1);
            if (!last) return;
            event.preventDefault();
            last.focus();
          }}
          placeholder={entries.length === 0 ? placeholder : undefined}
          profile="input-group"
          ref={inputRef}
          // Base UI writes the Field's name on its input. The text is not
          // the value, the tags are, so it renders without a name.
          render={unnamedInputRender}
          showInvalidIcon={false}
          size={resolvedSize}
          unstyled
          value={draft}
        />
      </div>
      <FieldStatus alert={showInvalidIcon} tooltip={tooltip} />
      {field.name
        ? entries.map((entry) => (
            <Input
              disabled={field.disabled}
              form={form}
              key={entry.key}
              name={field.name}
              type="hidden"
              value={entry.label}
            />
          ))
        : null}
    </div>
  );
}
