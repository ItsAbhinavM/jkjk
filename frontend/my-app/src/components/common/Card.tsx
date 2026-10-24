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

/** A rounded tile. Pass `className` to set its grid span. */
export default function Card({ title, description, action, accent = "none", className, children }: CardProps) {
  return (
    <section className={cn("rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8", ACCENTS[accent], className)}>
      {(title || action) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && <h3 className="font-display text-2xl font-semibold leading-tight">{title}</h3>}
            {description && <p className="mt-1.5 max-w-prose text-sm text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}