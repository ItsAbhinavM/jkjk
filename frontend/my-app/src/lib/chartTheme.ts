export const COLORS = {
    actual: "#059669",
    forecast: "#2563EB",
    over: "#EF4444",
    under: "#F59E0B",
    body: "#CBD5E1",
    grid: "#E2E8F0",
    axis: "#94A3B8",
    muted: "#64748B",
    text: "#0F172A",
    surface: "#FFFFFF",
    border: "#E2E8F0",
  } as const;
  
  export const FONT_FAMILY = "ui-sans-serif, system-ui, sans-serif";

  /** Apply the dashboard look to a d3 axis group. */
  export function styleAxis(g) {
    g.selectAll("text").attr("fill", COLORS.muted).attr("font-size", 11).attr("font-family", FONT_FAMILY);
    g.selectAll("line, path").attr("stroke", COLORS.axis);
    return g;
  }