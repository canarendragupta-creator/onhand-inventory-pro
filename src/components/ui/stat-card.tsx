import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  variant = 'default',
  className 
}: StatCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-card",
      {
        'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10': variant === 'primary',
        'border-success/20 bg-gradient-to-br from-success/5 to-success/10': variant === 'success',
        'border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10': variant === 'warning',
      },
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn(
          "h-5 w-5",
          {
            'text-primary': variant === 'primary',
            'text-success': variant === 'success', 
            'text-warning': variant === 'warning',
            'text-muted-foreground': variant === 'default',
          }
        )} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}