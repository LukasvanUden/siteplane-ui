import { cn } from "../utils/cn";

export type FocusRingRecipeOptions = {
  className?: string;
  inset?: boolean;
  variant?: "outline" | "ring";
  visible?: boolean;
};

export function focusRingRecipe(options: FocusRingRecipeOptions = {}) {
  return cn(
    "sp-focus-ring",
    options.inset && "sp-focus-ring--inset",
    options.variant === "ring" && "sp-focus-ring--ring",
    options.visible && "sp-focus-ring--visible",
    options.className,
  );
}
