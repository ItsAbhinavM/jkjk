import { area, bisector, line, scaleLinear, utcFormat, type ScaleLinear, type ScaleTime } from "d3";
import type { DataPoint } from "../types";
import { COLORS, FONT_FAMILY } from "./chartTheme";
import { fmtMW, fmtSigned } from "./format";

export const MARGIN = { top: 12, right: 16, bottom: 28, left: 56 };

const bisectTime = bisector<DataPoint, Date>((d) => d.time).center;
const tooltipTime = utcFormat("%a %d %b %H:%M UTC");

type ValueKey = "actual_mw" | "forecast_mw";

export interface DrawOptions {
  width: number;
  height: number;
  data: DataPoint[];
  x: ScaleTime<number, number>; // zoomed time scale
  y: ScaleLinear<number, number>;
  showActual: boolean;
  showForecast: boolean;
  hoverIndex: number; // -1 = not hovering
}

/** Y scale shared by every zoom level, so the chart doesn't jump while panning. */
export function makeYScale(data: DataPoint[], height: number) {
  let max = 1;
  for (const d of data) max = Math.max(max, d.actual_mw ?? 0, d.forecast_mw ?? 0);
  return scaleLinear()
    .domain([0, max * 1.05])
    .nice()
    .range([height - MARGIN.bottom, MARGIN.top]);
}

/** Index of the data point nearest to a pixel x position, or -1 if the slot has no data. */
export function nearestIndex(data: DataPoint[], x: ScaleTime<number, number>, px: number) {
  const i = bisectTime(data, x.invert(px));
  const d = data[i];
  return d && (d.actual_mw != null || d.forecast_mw != null) ? i : -1;
}

/**
 * Draws the whole chart: grid, error shading, lines, and (when hovering) crosshair + tooltip.
 * Everything is drawn in CSS pixels; the caller scales the context for the screen's pixel density.
 */
export function drawTimeSeries(
  ctx: CanvasRenderingContext2D,
  { width, height, data, x, y, showActual, showForecast, hoverIndex }: DrawOptions
) {
  const left = MARGIN.left;
  const right = width - MARGIN.right;
  const top = MARGIN.top;
  const bottom = height - MARGIN.bottom;

  ctx.clearRect(0, 0, width, height);
  ctx.font = `11px ${FONT_FAMILY}`;

  // Only draw what is on screen (plus one point either side so lines reach the edges).
  const [t0, t1] = x.domain();
  const from = Math.max(0, bisectTime(data, t0) - 1);
  const to = Math.min(data.length, bisectTime(data, t1) + 2);
  const visible = data.slice(from, to);

  // Grid + y axis labels
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLORS.grid;
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.beginPath();
  for (const t of y.ticks(5)) {
    const py = Math.round(y(t)) + 0.5;
    ctx.moveTo(left, py);
    ctx.lineTo(right, py);
    ctx.fillText(fmtMW(t), left - 8, py);
  }
  ctx.stroke();

  // X axis
  const xTicks = x.ticks(Math.max(2, Math.floor((right - left) / 110)));
  const tickFormat = x.tickFormat();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.beginPath();
  for (const t of xTicks) {
    const tx = Math.round(x(t)) + 0.5;
    ctx.moveTo(tx, bottom);
    ctx.lineTo(tx, bottom + 4);
    ctx.fillText(tickFormat(t), tx, bottom + 8);
  }
  ctx.strokeStyle = COLORS.axis;
  ctx.moveTo(left, bottom + 0.5);
  ctx.lineTo(right, bottom + 0.5);
  ctx.stroke();

  // Everything below is clipped to the plot area.
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.clip();

  const px = (d: DataPoint) => x(d.time);

  // Error shading: red where forecast > actual, amber where actual > forecast.
  if (showActual && showForecast) {
    const shade = (colour: string, pick: (forecast: number, actual: number) => number) => {
      ctx.beginPath();
      area<DataPoint>()
        .defined((d) => d.actual_mw != null && d.forecast_mw != null)
        .x(px)
        .y0((d) => y(d.actual_mw ?? 0))
        .y1((d) => y(pick(d.forecast_mw ?? 0, d.actual_mw ?? 0)))
        .context(ctx)(visible);
      ctx.fillStyle = colour;
      ctx.fill();
    };
    shade("rgba(239, 68, 68, 0.22)", Math.max);      // was 0.28
    shade("rgba(245, 158, 11, 0.25)", Math.min);     // was 0.28
    ctx.fillStyle = "rgba(255, 255, 255, 0.97)";     // tooltip background (was dark)
    ctx.roundRect(tx, ty, w, h, 14);                 // tooltip corners (was 6)
  }

  const draw = (key: ValueKey, colour: string, dash: number[]) => {
    ctx.beginPath();
    line<DataPoint>()
      .defined((d) => d[key] != null)
      .x(px)
      .y((d) => y(d[key] ?? 0))
      .context(ctx)(visible);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.75;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  if (showActual) draw("actual_mw", COLORS.actual, []);
  if (showForecast) draw("forecast_mw", COLORS.forecast, [6, 4]);

  // Crosshair
  const hovered = hoverIndex >= 0 ? data[hoverIndex] : null;
  if (hovered) {
    const cx = Math.round(px(hovered)) + 0.5;
    ctx.strokeStyle = COLORS.muted;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx, bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    const marks: [ValueKey, string, boolean][] = [
      ["actual_mw", COLORS.actual, showActual],
      ["forecast_mw", COLORS.forecast, showForecast],
    ];
    for (const [key, colour, on] of marks) {
      const value = hovered[key];
      if (!on || value == null) continue;
      ctx.beginPath();
      ctx.arc(px(hovered), y(value), 4, 0, Math.PI * 2);
      ctx.fillStyle = colour;
      ctx.fill();
      ctx.strokeStyle = COLORS.surface;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();

  if (hovered) drawTooltip(ctx, hovered, px(hovered), { left, right, top });
}

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  d: DataPoint,
  cx: number,
  { left, right, top }: { left: number; right: number; top: number }
) {
  const diffColour = d.error_mw == null ? undefined : d.error_mw > 0 ? COLORS.over : COLORS.under;
  const rows: [label: string, value: string, colour?: string][] = [
    ["Time", tooltipTime(d.time)],
    ["Settlement period", String(d.settlement_period)],
    ["Actual", d.actual_mw == null ? "no data" : `${fmtMW(d.actual_mw)} MW`, COLORS.actual],
    ["Forecast", d.forecast_mw == null ? "no data" : `${fmtMW(d.forecast_mw)} MW`, COLORS.forecast],
    ["Difference", d.error_mw == null ? "—" : `${fmtSigned(d.error_mw)} MW`, diffColour],
  ];
  const pad = 10;
  const lineH = 18;
  const w = 224;
  const h = pad * 2 + rows.length * lineH - 4;
  // Flip to the left of the cursor when there isn't room on the right.
  const tx = Math.max(left, cx + 14 + w > right ? cx - 14 - w : cx + 14);
  const ty = top + 8;

  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tx, ty, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.textBaseline = "middle";
  rows.forEach(([label, value, colour], i) => {
    const ry = ty + pad + i * lineH + lineH / 2 - 2;
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(label, tx + pad, ry);
    ctx.textAlign = "right";
    ctx.fillStyle = colour ?? COLORS.text;
    ctx.fillText(value, tx + w - pad, ry);
  });
}