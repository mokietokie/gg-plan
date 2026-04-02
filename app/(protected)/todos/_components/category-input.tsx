"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CategoryInput({
  categories,
  value,
  onChange,
  compact,
}: {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const filtered = categories.filter(
    (c) => c.toLowerCase().includes(value.toLowerCase()) && c !== value
  );

  return (
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Tag className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            name="category"
            placeholder="카테고리 (선택)"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
            className={`pl-8 ${compact ? "h-8 text-sm" : ""}`}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-2"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-wrap gap-1">
          {filtered.map((cat) => (
            <Button
              key={cat}
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2"
              onClick={() => {
                onChange(cat);
                setOpen(false);
              }}
            >
              <Badge variant="secondary" className="text-xs">
                {cat}
              </Badge>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
