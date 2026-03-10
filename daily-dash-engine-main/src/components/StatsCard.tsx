interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: "primary" | "success" | "warning" | "destructive";
}

export default function StatsCard({ title, value, icon, trend, color = "primary" }: StatsCardProps) {
  const colorClasses = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <div className="glass-card p-6 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg bg-secondary ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend.value >= 0 ? "text-success" : "text-destructive"}`}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}