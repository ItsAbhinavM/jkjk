import { cn } from "./cn";

export type ButtonVariant = "primary" | "ghost";

/** Class names shared by <Button> and anchor links that look like buttons. */
export function buttonClasses(variant: ButtonVariant = "ghost", active = false, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 border px-3 py-1.5 text-sm font-medium transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-40",
    variant === "primary" && "border-emerald-400 bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:hover:bg-emerald-500",
    variant === "ghost" &&
      (active
        ? "border-slate-100 bg-slate-100 text-slate-900"
        : "border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:hover:bg-slate-800"),
    className
  );
}