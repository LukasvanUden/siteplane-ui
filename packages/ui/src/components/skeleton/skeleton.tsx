import type React from "react";

import { cn } from "../../system/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "siteplane-skeleton-motion animate-skeleton rounded-sm",
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}
