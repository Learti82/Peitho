import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const variantConfig: Record<
  AlertVariant,
  { classes: string; icon: React.ComponentType<{ className?: string }> }
> = {
  info: {
    classes: "bg-blue-50 border-blue-200 text-blue-800",
    icon: Info,
  },
  success: {
    classes: "bg-green-50 border-green-200 text-green-800",
    icon: CheckCircle2,
  },
  warning: {
    classes: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: AlertCircle,
  },
  error: {
    classes: "bg-red-50 border-red-200 text-red-800",
    icon: XCircle,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
  onDismiss,
}: AlertProps) {
  const { classes, icon: Icon } = variantConfig[variant];

  return (
    <div
      role="alert"
      className={clsx(
        "flex gap-3 p-4 rounded-lg border",
        classes,
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm mb-1">{title}</p>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto -mt-0.5 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Mbyll"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
