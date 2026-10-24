import type { DataPoint } from "../types";

type Cell = string | number | null;

/** Saves rows as a CSV file. Missing values stay blank. */
export function downloadRows(filename: string, header: string[], rows: Cell[][]) {
  const lines = [header.join(","), ...rows.map((r) => r.map((v) => (v == null ? "" : String(v))).join(","))];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Saves the half-hourly actual/forecast rows as a CSV file. */
export function downloadCsv(filename: string, rows: DataPoint[]) {
  downloadRows(
    filename,
    ["start_time", "settlement_period", "actual_mw", "forecast_mw", "error_mw"],
    rows.map((r) => [r.start_time, r.settlement_period, r.actual_mw, r.forecast_mw, r.error_mw])
  );
}