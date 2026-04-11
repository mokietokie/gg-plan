"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { saveMemo } from "@/app/(protected)/memos/actions";

type MemoContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  content: string;
  setContent: (content: string) => void;
  lastSavedContent: string;
  savedAt: string | null;
  save: () => void;
  isSaving: boolean;
  error: string | null;
};

const MemoContext = createContext<MemoContextValue | null>(null);

export function useMemoContext(): MemoContextValue {
  const ctx = useContext(MemoContext);
  if (!ctx) {
    throw new Error("useMemoContext must be used within MemoProvider");
  }
  return ctx;
}

export function MemoProvider({
  initialContent,
  initialUpdatedAt,
  children,
}: {
  initialContent: string;
  initialUpdatedAt: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const [savedAt, setSavedAt] = useState<string | null>(initialUpdatedAt);
  const [isSaving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(() => {
    const snapshot = content;
    startTransition(async () => {
      setError(null);
      const result = await saveMemo(snapshot);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setLastSavedContent(snapshot);
      setSavedAt(result.updatedAt);
    });
  }, [content]);

  return (
    <MemoContext.Provider
      value={{
        open,
        setOpen,
        content,
        setContent,
        lastSavedContent,
        savedAt,
        save,
        isSaving,
        error,
      }}
    >
      {children}
    </MemoContext.Provider>
  );
}
