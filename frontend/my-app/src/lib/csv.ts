import type { DataPoint } from "../types";

/** Saves the given half-hourly rows as a CSV file. Missing values stay blank. */
export function downloadCsv(filename: string, rows: DataPoint[]) {
  const cell = (v: number | null) => (v == null ? "" : String(v));
  const lines = [
    "start_time,settlement_period,actual_mw,forecast_mw,error_mw",
    ...rows.map((r) => [r.start_time, r.settlement_period, cell(r.actual_mw), cell(r.forecast_mw), cell(r.error_mw)].join(",")),
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}