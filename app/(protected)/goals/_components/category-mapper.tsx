"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X } from "lucide-react";

export function CategoryMapper({
  categories,
  allCategories,
  onChange,
}: {
  categories: string[];
  allCategories: string[];
  onChange: (categories: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const suggestions = allCategories.filter(
    (c) =>
      !categories.includes(c) &&
      c.toLowerCase().includes(inputValue.toLowerCase())
  );

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !categories.includes(trimmed)) {
      onChange([...categories, trimmed]);
    }
    setInputValue("");
    setPopoverOpen(false);
  };

  const removeCategory = (name: string) => {
    onChange(categories.filter((c) => c !== name));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">연결 카테고리</label>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="gap-1 pr-1">
              {cat}
              <button
                type="button"
                onClick={() => removeCategory(cat)}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover open={popoverOpen && suggestions.length > 0} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="flex gap-2">
            <Input
              placeholder="카테고리 추가..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setPopoverOpen(true);
              }}
              onFocus={() => setPopoverOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory(inputValue);
                }
              }}
              autoComplete="off"
              className="h-8 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              onClick={() => addCategory(inputValue)}
              disabled={!inputValue.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[200px] p-2"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-wrap gap-1">
            {suggestions.map((cat) => (
              <Button
                key={cat}
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1"
                onClick={() => addCategory(cat)}
              >
                <Badge variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-muted-foreground text-xs">
        이 카테고리의 투두가 자동으로 과제에 연결됩니다
      </p>
    </div>
  );
}
