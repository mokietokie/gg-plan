"use client";

import { useEffect } from "react";
import { useMemoContext } from "./memo-provider";

export function MemoHotkey() {
  const { open, setOpen } = useMemoContext();

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key !== "m" && e.key !== "M") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.isComposing) return;
      if (open) return;

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (target.isContentEditable) return;
      }

      e.preventDefault();
      setOpen(true);
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [open, setOpen]);

  return null;
}
