import { CalendarRange } from "lucide-react";
import { cn } from "../../lib/cn";

interface HeaderProps {
  sections: readonly { id: string; label: string }[];
  active: string;
  rangeLabel: string;
  loading: boolean;
}

export default function Header({ sections, active, rangeLabel, loading }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-600 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <a href="#top" className="whitespace-nowrap font-display text-xl font-semibold">
          Wind day-ahead
        </a>
        <nav aria-label="Sections" className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
          <ul className="flex gap-1">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={active === id ? "location" : undefined}
                  className={cn(
                    "block whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors",
                    active === id ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:bg-slate-800"
                  )}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="#range"
          className="hidden items-center gap-2 whitespace-nowrap border border-slate-500 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800 md:inline-flex"
        >
          <CalendarRange size={16} aria-hidden />
          {rangeLabel}
        </a>
      </div>
      <div className={cn("h-0.5 w-full bg-emerald-500", loading ? "animate-pulse" : "opacity-0")} role="status" aria-label={loading ? "Loading data" : undefined} />
    </header>
  );
}