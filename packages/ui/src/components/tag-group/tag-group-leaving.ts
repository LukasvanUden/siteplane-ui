/**
 * What a tag that has left the collection still shows while it fades out: the
 * classes and data attributes React Aria was given for it. Everything that
 * makes a tag interactive is left out, because the tag is gone.
 */
export function leavingTagProps(props: Record<string, unknown>): {
  className: string | undefined;
} & Record<string, unknown> {
  const kept: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props))
    if (name.startsWith("data-")) kept[name] = value;
  return {
    ...kept,
    className:
      typeof props.className === "string" ? props.className : undefined,
  };
}
