"use client";

import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
} from "react";

const VisualScopeContext = createContext<RefObject<HTMLElement | null> | null>(
  null,
);

export function VisualScopeBoundary({
  children,
  scopeRef,
}: {
  children: ReactNode;
  scopeRef: RefObject<HTMLElement | null>;
}) {
  return (
    <VisualScopeContext.Provider value={scopeRef}>
      {children}
    </VisualScopeContext.Provider>
  );
}

export function useVisualScopeRef() {
  return useContext(VisualScopeContext);
}
