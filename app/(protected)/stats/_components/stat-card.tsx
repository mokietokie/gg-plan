import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  change?: number | null;
};

export function StatCard({ title, value, description, change }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-muted-foreground text-xs mt-1">{description}</p>
        )}
        {change !== undefined && change !== null && (
          <p
            className={`text-xs mt-1 ${
              change > 0
                ? "text-green-600"
                : change < 0
                  ? "text-red-600"
                  : "text-muted-foreground"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change}% 이전 기간 대비
          </p>
        )}
      </CardContent>
    </Card>
  );
}
