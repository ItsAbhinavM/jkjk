import { useState, type FormEvent } from "react";
import { fmtDay } from "../../lib/format";
import type { DateRange } from "../../types";
import Button from "../common/Button";
import Card from "../common/Card";

const PRESETS: { label: string; range: DateRange }[] = [
  { label: "Whole month", range: ["2026-01-01", "2026-01-31"] },
  { label: "Week 1", range: ["2026-01-01", "2026-01-07"] },
  { label: "Week 2", range: ["2026-01-08", "2026-01-14"] },
  { label: "Week 3", range: ["2026-01-15", "2026-01-21"] },
  { label: "Week 4", range: ["2026-01-22", "2026-01-28"] },
];

interface FilterBarProps {
  value: DateRange;
  min: string; // earliest selectable day, "YYYY-MM-DD"
  max: string;
  onApply: (range: DateRange) => void;
  className?: string;
}

/** Date range editor. Mount it with `key={value.join()}` so the inputs reset when the range changes elsewhere. */
export default function FilterBar({ value, min, max, onApply, className }: FilterBarProps) {
  const [start, setStart] = useState(value[0]);
  const [end, setEnd] = useState(value[1]);

  const problem =
    !start || !end
      ? "Choose both a start and an end date."
      : start > end
        ? "The start date must be on or before the end date."
        : start < min || end > max
          ? `Choose dates between ${fmtDay(min)} and ${fmtDay(max)}.`
          : null;
  const unchanged = start === value[0] && end === value[1];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!problem && !unchanged) onApply([start, end]);
  };

  const inputClass = "mt-1 block w-full border border-slate-500 bg-slate-900 px-3 py-2 text-slate-50 [color-scheme:dark]";

  return (
    <Card title="Dates shown" description="Everything below updates to the dates you pick." className={className}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-300">
            From
            <input type="date" value={start} min={min} max={max} onChange={(e) => setStart(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            To
            <input type="date" value={end} min={min} max={max} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
          </label>
        </div>
        {problem && (
          <p role="alert" className="text-sm text-amber-300">
            {problem}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={problem != null || unchanged}>
          Show these dates
        </Button>
      </form>

      <div className="mt-5 border-t border-dashed border-slate-600 pt-4">
        <p className="mb-2 text-sm text-slate-400">Or jump to</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ label, range }) => (
            <Button
              key={label}
              active={range[0] === value[0] && range[1] === value[1]}
              onClick={() => onApply(range)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}