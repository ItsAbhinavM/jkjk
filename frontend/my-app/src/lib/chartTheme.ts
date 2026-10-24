import type { Selection } from "d3";

export const COLORS = {
  actual: "#10B981", // emerald
  forecast: "#3B82F6", // electric blue
  over: "#EF4444", // forecast > actual (shortfall risk)
  under: "#F59E0B", // actual > forecast
  body: "#64748B", // neutral bars
  grid: "#334155",
  axis: "#64748B",
  muted: "#94A3B8",
  text: "#F8FAFC",
  surface: "#0F172A",
  border: "#475569",
} as const;

export const FONT_FAMILY = "Barlow, ui-sans-serif, system-ui, sans-serif";

/** Apply the dashboard look to a d3 axis group. */
export function styleAxis(g: Selection<SVGGElement, unknown, null, undefined>) {
  g.selectAll("text").attr("fill", COLORS.muted).attr("font-size", 11).attr("font-family", FONT_FAMILY);
  g.selectAll("line, path").attr("stroke", COLORS.axis);
}