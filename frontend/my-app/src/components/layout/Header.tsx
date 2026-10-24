import { CalendarRange } from "lucide-react";
import { cn } from "../../lib/cn";

interface HeaderProps {
  sections: readonly { id: string; label: string }[];
  active: string;
  rangeLabel: string;
  loading: boolean;
}

/** A floating pill that stays at the top while scrolling. */
export default function Header({ sections, active, rangeLabel, loading }: HeaderProps) {
  return (
    <header className="sticky top-3 z-30 px-3 sm:px-6">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-3 rounded-full bg-white/90 pl-5 pr-2 shadow-md ring-1 ring-slate-900/5 backdrop-blur">
        <a href="#top" className="whitespace-nowrap font-display text-xl font-semibold">
          Wind day-ahead
        </a>
        <nav aria-label="Sections" className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
          <ul className="flex justify-center gap-1">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={active === id ? "location" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active === id ? "bg-violet-100 text-violet-900" : "text-slate-600 hover:bg-slate-100"
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
          className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-tonal px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-violet-100 md:inline-flex"
        >
          <CalendarRange size={16} aria-hidden />
          {rangeLabel}
        </a>
        <div
          className={cn("absolute inset-x-8 bottom-0 h-0.5 rounded-full bg-violet-500", loading ? "animate-pulse" : "opacity-0")}
          role="status"
          aria-label={loading ? "Loading data" : undefined}
        />
      </div>
    </header>
  );
}