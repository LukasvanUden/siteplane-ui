"use client";

import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useRef,
} from "react";

import { cn } from "../utils/cn";
import { VisualScopeBoundary } from "../provider/visual-scope-context";

export type SiteplaneMotionPreset = "standard" | "reduced";

const SiteplaneMotionContext = createContext<SiteplaneMotionPreset | undefined>(
  undefined,
);

export type SiteplaneMotionProviderProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  preset: SiteplaneMotionPreset;
};

export function SiteplaneMotionProvider({
  children,
  className,
  preset,
  ...props
}: SiteplaneMotionProviderProps) {
  const scopeRef = useRef<HTMLDivElement>(null);

  return (
    <SiteplaneMotionContext.Provider value={preset}>
      <VisualScopeBoundary scopeRef={scopeRef}>
        <div
          {...props}
          className={cn("sp-motion-scope", className)}
          data-sp-motion={preset}
          data-sp-scope="motion"
          ref={scopeRef}
        >
          {children}
        </div>
      </VisualScopeBoundary>
    </SiteplaneMotionContext.Provider>
  );
}

export function useSiteplaneMotionPreset() {
  return useContext(SiteplaneMotionContext);
}
