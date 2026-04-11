"use client";

import { useRouter, useSearchParams } from "next/navigation";

const UNCATEGORIZED = "__uncategorized__";

type CategoryChipsProps = {
  categories: string[];
  selected: string[]; // 빈 배열 = 전체
};

export function CategoryChips({ categories, selected }: CategoryChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(nextSelected: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSelected.length === 0) {
      params.delete("category");
    } else {
      params.set("category", nextSelected.join(","));
    }
    const qs = params.toString();
    router.push(qs ? `/archive?${qs}` : "/archive");
  }

  function toggleCategory(value: string) {
    if (selected.includes(value)) {
      navigate(selected.filter((v) => v !== value));
    } else {
      navigate([...selected, value]);
    }
  }

  function selectAll() {
    navigate([]);
  }

  const chips: { value: string; label: string }[] = [
    ...categories.map((c) => ({ value: c, label: c })),
    { value: UNCATEGORIZED, label: "미지정" },
  ];

  const isAllActive = selected.length === 0;

  return (
    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto">
      <button
        type="button"
        onClick={selectAll}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          isAllActive
            ? "bg-foreground text-background"
            : "border-border text-muted-foreground hover:bg-muted border"
        }`}
      >
        전체
      </button>
      {chips.map((chip) => {
        const isActive = selected.includes(chip.value);
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => toggleCategory(chip.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted border"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
