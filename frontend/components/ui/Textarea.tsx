import { TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={props.rows ?? 4}
          className={clsx(
            "w-full px-3.5 py-2.5 text-sm border rounded-lg transition-colors duration-150 resize-y",
            "placeholder:text-gray-400 text-gray-900 bg-white",
            "focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold",
            error
              ? "border-red-400 focus:ring-red-300"
              : "border-gray-300 hover:border-gray-400",
            props.disabled && "bg-gray-50 cursor-not-allowed opacity-60",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
