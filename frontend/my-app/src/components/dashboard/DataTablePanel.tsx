import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { downloadCsv } from "../../lib/csv";
import { fmtDayShort, fmtMW, fmtSigned } from "../../lib/format";
import type { DataPoint, DateRange } from "../../types";
import Button from "../common/Button";
import Card from "../common/Card";

const dayOf = (d: DataPoint) => d.start_time.slice(0, 10);

interface DataTablePanelProps {
  data: DataPoint[];
  range: DateRange;
}

/** The half-hourly numbers behind the charts, one day at a time, with a CSV download for the whole range. */
export default function DataTablePanel({ data, range }: DataTablePanelProps) {
  const days = useMemo(() => [...new Set(data.map(dayOf))], [data]);
  const [requested, setRequested] = useState(0);
  const index = Math.min(requested, days.length - 1);
  const rows = useMemo(() => data.filter((d) => dayOf(d) === days[index]), [data, days, index]);

  const th = "sticky top-0 bg-slate-800 px-3 py-2 font-medium text-slate-300 border-b border-slate-600";
  const td = "px-3 py-1.5";

  return (
    <Card
      title="Half-hourly values"
      description="One row per half-hour. A dash means Elexon has no value for that half-hour; it is never filled with zero."
      action={
        <Button variant="primary" onClick={() => downloadCsv(`wind-forecast-${range[0]}_to_${range[1]}.csv`, data)}>
          <Download size={16} aria-hidden />
          Download CSV
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button aria-label="Previous day" disabled={index === 0} onClick={() => setRequested(index - 1)}>
          <ChevronLeft size={16} aria-hidden />
          Previous day
        </Button>
        <select
          aria-label="Day"
          value={index}
          onChange={(e) => setRequested(Number(e.target.value))}
          className="border border-slate-500 bg-slate-900 px-3 py-1.5 text-sm text-slate-50 [color-scheme:dark]"
        >
          {days.map((day, i) => (
            <option key={day} value={i}>
              {fmtDayShort(day)}
            </option>
          ))}
        </select>
        <Button aria-label="Next day" disabled={index >= days.length - 1} onClick={() => setRequested(index + 1)}>
          Next day
          <ChevronRight size={16} aria-hidden />
        </Button>
        <span className="text-sm text-slate-400">
          Day {index + 1} of {days.length}
        </span>
      </div>

      <div className="max-h-[28rem] overflow-auto border border-slate-600">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="text-right">
              <th className={`${th} text-left`}>Time (UTC)</th>
              <th className={th}>Period</th>
              <th className={th}>Actual (MW)</th>
              <th className={th}>Forecast (MW)</th>
              <th className={th}>Forecast − actual (MW)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.start_time} className="border-b border-slate-700 text-right odd:bg-slate-900/40">
                <td className={`${td} text-left`}>{d.start_time.slice(11, 16)}</td>
                <td className={td}>{d.settlement_period}</td>
                <td className={td}>{fmtMW(d.actual_mw)}</td>
                <td className={td}>{fmtMW(d.forecast_mw)}</td>
                <td className={`${td} ${d.error_mw == null ? "" : d.error_mw > 0 ? "text-red-300" : "text-amber-300"}`}>{fmtSigned(d.error_mw)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}