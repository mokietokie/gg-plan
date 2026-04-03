import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopCategoryData } from "@/types/stats";

type TopCategoriesProps = {
  data: TopCategoryData[];
};

export function TopCategories({ data }: TopCategoriesProps) {
  const maxCount = data.length > 0 ? data[0].count : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">TOP 카테고리</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            데이터가 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((d, i) => (
              <div key={d.category} className="flex items-center gap-3">
                <span className="text-muted-foreground w-5 text-right text-sm font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">
                      {d.category}
                    </span>
                    <span className="text-muted-foreground text-xs shrink-0 ml-2">
                      {d.count}건 ({d.percentage}%)
                    </span>
                  </div>
                  <div className="bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-chart-1 h-full rounded-full transition-all"
                      style={{
                        width: `${maxCount > 0 ? (d.count / maxCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
