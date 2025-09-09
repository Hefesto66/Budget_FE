import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description?: string;
  className?: string;
}

export function ResultCard({ icon, title, value, description, className }: ResultCardProps) {
  return (
    <Card className={cn("shadow-md transition-all hover:shadow-lg hover:-translate-y-1", className)}>
      <CardHeader>
         <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="p-2 bg-secondary rounded-md">
                {icon}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
      </CardContent>
    </Card>
  );
}
