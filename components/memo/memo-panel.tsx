"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemoContext } from "./memo-provider";

type PanelState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const STORAGE_KEY = "memo-panel-state-v1";
const MIN_WIDTH = 240;
const MIN_HEIGHT = 180;
const DEFAULT_WIDTH = 340;
const DEFAULT_HEIGHT_RATIO = 0.3;

function loadState(): PanelState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PanelState>;
    if (
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      typeof parsed.width === "number" &&
      typeof parsed.height === "number"
    ) {
      return parsed as PanelState;
    }
    return null;
  } catch {
    return null;
  }
}

function persistState(state: PanelState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota/privacy errors
  }
}

function getDefaultState(): PanelState {
  const height = Math.round(window.innerHeight * DEFAULT_HEIGHT_RATIO);
  return {
    x: 24,
    y: Math.max(24, Math.round((window.innerHeight - height) / 2)),
    width: DEFAULT_WIDTH,
    height,
  };
}

function clampState(state: PanelState): PanelState {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(Math.max(state.width, MIN_WIDTH), vw);
  const height = Math.min(Math.max(state.height, MIN_HEIGHT), vh);
  const x = Math.min(Math.max(state.x, 0), Math.max(0, vw - width));
  const y = Math.min(Math.max(state.y, 0), Math.max(0, vh - 40));
  return { x, y, width, height };
}

function formatRelative(iso: string | null): string {
  if (!iso) return "아직 저장된 적 없음";
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 저장됨";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전 저장됨`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전 저장됨`;
  const day = Math.floor(hr / 24);
  return `${day}일 전 저장됨`;
}

type DragState = {
  mode: "drag" | "resize";
  startX: number;
  startY: number;
  orig: PanelState;
};

export function MemoPanel() {
  const {
    open,
    setOpen,
    content,
    setContent,
    lastSavedContent,
    savedAt,
    save,
    isSaving,
    error,
  } = useMemoContext();

  const [state, setState] = useState<PanelState | null>(() => {
    if (typeof window === "undefined") return null;
    const loaded = loadState();
    return loaded ? clampState(loaded) : getDefaultState();
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    if (state) persistState(state);
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const el = textareaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    function onResize() {
      setState((prev) => (prev ? clampState(prev) : prev));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const startPointer = useCallback(
    (mode: "drag" | "resize") =>
      (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!state) return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
          mode,
          startX: e.clientX,
          startY: e.clientY,
          orig: state,
        };
      },
    [state]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setState(() => {
        const next =
          drag.mode === "drag"
            ? {
                ...drag.orig,
                x: drag.orig.x + dx,
                y: drag.orig.y + dy,
              }
            : {
                ...drag.orig,
                width: drag.orig.width + dx,
                height: drag.orig.height + dy,
              };
        return clampState(next);
      });
    },
    []
  );

  const endPointer = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }, []);

  function handleTextareaKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  }

  if (!open || !state) return null;

  const isDirty = content !== lastSavedContent;

  return (
    <div
      role="dialog"
      aria-label="메모"
      style={{
        position: "fixed",
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        zIndex: 50,
      }}
      className="flex flex-col rounded-xl border border-yellow-300/70 bg-yellow-50 text-popover-foreground shadow-lg ring-1 ring-yellow-500/20 dark:border-yellow-700/40 dark:bg-yellow-950/40 dark:ring-yellow-400/10"
    >
      <div
        onPointerDown={startPointer("drag")}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        className="flex cursor-move items-center justify-between gap-2 rounded-t-xl border-b border-yellow-200/80 bg-yellow-100/80 px-3 py-2 select-none dark:border-yellow-800/40 dark:bg-yellow-900/40"
      >
        <div className="text-xs font-medium text-yellow-900 dark:text-yellow-100">메모</div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setOpen(false)}
          className="flex h-6 w-6 items-center justify-center rounded text-yellow-800 hover:bg-yellow-200/70 dark:text-yellow-200 dark:hover:bg-yellow-800/50"
          aria-label="닫기"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder="생각나는 대로 적어보세요..."
          className="h-full w-full resize-none bg-transparent p-1 text-sm text-yellow-950 outline-none placeholder:text-yellow-700/60 dark:text-yellow-50 dark:placeholder:text-yellow-400/40"
        />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-yellow-200/80 px-3 py-2 text-[11px] text-yellow-800/80 dark:border-yellow-800/40 dark:text-yellow-300/70">
        <span className="flex-1 truncate">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : isDirty ? (
            <>수정됨 · {formatRelative(savedAt)}</>
          ) : (
            formatRelative(savedAt)
          )}
        </span>
        <Button
          type="button"
          onClick={save}
          disabled={!isDirty || isSaving}
          size="sm"
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>

      <div
        onPointerDown={startPointer("resize")}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize"
        aria-label="크기 조절"
      >
        <svg
          viewBox="0 0 16 16"
          className="h-full w-full text-yellow-700/50 dark:text-yellow-400/40"
          aria-hidden="true"
        >
          <path
            d="M 15 6 L 6 15 M 15 11 L 11 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
