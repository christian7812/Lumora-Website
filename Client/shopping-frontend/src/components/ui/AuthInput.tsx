import type { InputHTMLAttributes } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function AuthInput({
  label,
  error,
  id,
  className = "",
  ...props
}: AuthInputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <input
        id={inputId}
        className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}