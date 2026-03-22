interface ProgressBarProps {
  progress: number; // 0 to 100
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "destructive";
}

export default function ProgressBar({ progress, size = "md", color = "primary" }: ProgressBarProps) {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const colorClasses = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };

  return (
    <div className={`w-full bg-secondary rounded-full ${sizeClasses[size]}`}>
      <div
        className={`h-full rounded-full ${colorClasses[color]} transition-all duration-300 ease-out`}
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
}