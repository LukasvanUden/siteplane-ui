import type React from "react";

/**
 * Whether an `aria-invalid` value marks the control invalid, for the React
 * Aria controls that take a boolean `isInvalid` instead. `true`, `"true"`,
 * `"grammar"` and `"spelling"` do; `false`, `"false"` and no value do not.
 */
export function isInvalidAriaValue(
  value: React.AriaAttributes["aria-invalid"],
): boolean {
  return (
    value === true ||
    value === "true" ||
    value === "grammar" ||
    value === "spelling"
  );
}
