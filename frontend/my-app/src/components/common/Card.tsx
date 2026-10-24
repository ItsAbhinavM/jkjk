import type { ReactNode } from "react";
import { ACCENTS, type Accent } from "../../lib/accent";
import { cn } from "../../lib/cn";

interface CardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  accent?: Accent;
  className?: string;
  children?: ReactNode;
}

/** A bento tile. Pass `className` to set its grid span. */
export default function Card({ title, description, action, accent = "none", className, children }: CardProps) {
  return (
    <section className={cn("border border-slate-600 bg-slate-800 p-5", ACCENTS[accent], className)}>
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="font-display text-xl font-semibold leading-tight">{title}</h3>}
            {description && <p className="mt-1 max-w-prose text-sm text-slate-400">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}