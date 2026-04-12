"use client";

import { useEffect } from "react";
import { useMemoContext } from "./memo-provider";

export function MemoHotkey() {
  const { open, setOpen } = useMemoContext();

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return true;
      if (target.isContentEditable) return true;
      return false;
    }

    function handleKeydown(e: KeyboardEvent) {
      if (!e.key || (e.key !== "m" && e.key !== "M")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.isComposing) return;
      if (open) return;
      if (isTypingTarget(e.target)) return;

      e.preventDefault();
      setOpen(true);
    }

    function handleKeyup(e: KeyboardEvent) {
      if (!e.key || e.key !== "ㅡ") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.isComposing) return;
      if (open) return;
      if (isTypingTarget(e.target)) return;

      e.preventDefault();
      setOpen(true);
    }

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [open, setOpen]);

  return null;
}
