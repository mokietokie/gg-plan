"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, CalendarDays, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type Segment = {
  text: string;
  className?: string;
  breakAfter?: boolean;
};

const SEGMENTS: Segment[] = [
  { text: "어떠한 꿈이라도,", breakAfter: true },
  { text: "수첩에 적으면", className: "text-primary" },
  { text: " 계획이 된다." },
];

const TOTAL_CHARS = SEGMENTS.reduce((sum, s) => sum + s.text.length, 0);
const CHAR_DELAY = 80;
const LINE_PAUSE = 400;

function renderTypedText(charIndex: number) {
  let remaining = charIndex;
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < SEGMENTS.length; i++) {
    const seg = SEGMENTS[i];
    if (remaining <= 0) break;

    const visibleCount = Math.min(remaining, seg.text.length);
    const visibleText = seg.text.slice(0, visibleCount);
    remaining -= visibleCount;

    nodes.push(
      <span key={i} className={seg.className}>
        {visibleText}
      </span>,
    );

    if (seg.breakAfter && visibleCount === seg.text.length) {
      nodes.push(<br key={`br-${i}`} />);
    }
  }

  return nodes;
}

export function HeroTypewriter() {
  const [charIndex, setCharIndex] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setCharIndex(TOTAL_CHARS);
      setTypingComplete(true);
      return;
    }
  }, []);

  useEffect(() => {
    if (charIndex >= TOTAL_CHARS) {
      if (charIndex > 0) setTypingComplete(true);
      return;
    }

    let pauseDelay = 0;
    let consumed = 0;
    for (const seg of SEGMENTS) {
      consumed += seg.text.length;
      if (charIndex === consumed && seg.breakAfter) {
        pauseDelay = LINE_PAUSE;
        break;
      }
    }

    const timer = setTimeout(
      () => setCharIndex((i) => i + 1),
      CHAR_DELAY + pauseDelay,
    );
    return () => clearTimeout(timer);
  }, [charIndex]);

  return (
    <>
      <h1 className="text-4xl font-bold leading-[1.25] tracking-tight sm:text-5xl">
        {renderTypedText(charIndex)}
        {!typingComplete && (
          <span className="animate-blink ml-0.5 inline-block h-[1em] w-[3px] translate-y-[0.1em] bg-foreground align-middle" />
        )}
      </h1>

      <p
        className={cn(
          "text-muted-foreground mt-4 max-w-md text-lg transition-opacity duration-700",
          typingComplete ? "opacity-100" : "opacity-0",
        )}
      >
        Grow Your Goal!
      </p>

      <div
        className={cn(
          "mt-8 flex gap-3 transition-opacity duration-700",
          typingComplete ? "opacity-100" : "opacity-0",
        )}
      >
        <Button asChild size="lg">
          <Link href="/signup">시작하기</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">로그인</Link>
        </Button>
      </div>

      <div
        className={cn(
          "mt-16 grid max-w-2xl gap-8 transition-opacity duration-700 sm:grid-cols-3",
          typingComplete ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <ClipboardCheck className="text-primary h-8 w-8" />
          <h3 className="font-semibold">To-Do 기록</h3>
          <p className="text-muted-foreground text-sm">
            날짜별로 할 일을 간편하게 기록
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CalendarDays className="text-primary h-8 w-8" />
          <h3 className="font-semibold">개인성과 관리</h3>
          <p className="text-muted-foreground text-sm">
            나의 업무를 한눈에 파악
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <FileText className="text-primary h-8 w-8" />
          <h3 className="font-semibold">보고서 자동 생성</h3>
          <p className="text-muted-foreground text-sm">
            투두 기반 주간보고서를 클릭 한 번에
          </p>
        </div>
      </div>
    </>
  );
}
