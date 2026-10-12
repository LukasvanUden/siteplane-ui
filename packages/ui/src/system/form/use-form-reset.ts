import { useEffect, useLayoutEffect, useRef } from "react";

export function useFormReset<T extends HTMLElement>(
  formId: string | undefined,
  onReset: () => void,
) {
  const elementRef = useRef<T>(null);
  const resetRef = useRef(onReset);
  // Refs aren't written during render; the latest callback is stored when the
  // render commits, before a later reset event can read it.
  useLayoutEffect(() => {
    resetRef.current = onReset;
  });

  useEffect(() => {
    const associatedForm = formId
      ? document.getElementById(formId)
      : elementRef.current?.closest("form");

    if (!(associatedForm instanceof HTMLFormElement)) return;

    const handleReset = (event: Event) =>
      queueMicrotask(() => {
        if (!event.defaultPrevented) resetRef.current();
      });
    associatedForm.addEventListener("reset", handleReset);
    return () => associatedForm.removeEventListener("reset", handleReset);
  }, [formId]);

  return elementRef;
}
