import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "default",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold tracking-wider transition-all duration-150 ease-in-out cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-none border";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm",
    lg: "px-6 py-3 text-xs sm:text-sm",
  }[size];

  const variantStyles = {
    // Exact match for the retro/clean SUBMIT EVENT button from homepage
    default:
      "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 active:bg-gray-300 dark:active:bg-slate-600",
    primary:
      "border-[#186BA7] bg-[#186BA7] text-white hover:bg-[#155d91] active:bg-[#104b75]",
    danger:
      "border-red-300 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    ghost:
      "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-3.5 w-3.5 text-current"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
