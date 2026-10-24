import { cn } from "./cn";

export type ButtonVariant = "primary" | "ghost";

/** Class names shared by <Button> and anchor links that look like buttons. */
export function buttonClasses(variant: ButtonVariant = "ghost", active = false, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-40",
    variant === "primary" && "border-violet-700 bg-violet-700 text-white hover:bg-violet-600 disabled:hover:bg-violet-700",
    variant === "ghost" &&
      (active
        ? "border-violet-200 bg-violet-100 text-violet-900"
        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:hover:bg-white"),
    className
  );
}