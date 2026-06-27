import { clsx } from "clsx";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  color?: "primary" | "gold" | "green" | "blue";
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const colorClasses = {
  primary: "bg-primary",
  gold: "bg-gold",
  green: "bg-green-500",
  blue: "bg-blue-500",
};

export function Progress({
  value,
  className,
  barClassName,
  size = "md",
  showLabel = false,
  color = "primary",
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={clsx("w-full", className)}>
      <div
        className={clsx(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={clsx(
            "rounded-full transition-all duration-500 ease-out",
            sizeClasses[size],
            colorClasses[color],
            barClassName
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-gray-500 text-right">{clamped}%</p>
      )}
    </div>
  );
}
