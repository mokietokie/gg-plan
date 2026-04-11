"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

type ArchiveSearchProps = {
  defaultValue: string;
};

export function ArchiveSearch({ defaultValue }: ArchiveSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function pushWithQuery(nextQ: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQ) {
      params.set("q", nextQ);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.replace(qs ? `/archive?${qs}` : "/archive");
  }

  function onChange(next: string) {
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      pushWithQuery(next);
    }, 300);
  }

  function clear() {
    setValue("");
    if (timerRef.current) clearTimeout(timerRef.current);
    pushWithQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") clear();
        }}
        placeholder="업무 검색..."
        className="bg-muted/50 focus:ring-primary/20 focus:bg-background h-12 w-full rounded-2xl border-0 pr-11 pl-11 text-base transition-all outline-none focus:ring-2"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 transition-colors"
          aria-label="검색어 지우기"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
