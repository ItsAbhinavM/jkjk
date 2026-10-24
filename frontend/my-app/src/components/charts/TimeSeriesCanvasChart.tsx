import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { scaleUtc, select, zoom, zoomIdentity, type ScaleLinear, type ScaleTime, type ZoomTransform } from "d3";
import { useElementWidth } from "../../hooks/useElementWidth";
import { COLORS } from "../../lib/chartTheme";
import { MARGIN, drawTimeSeries, makeYScale, nearestIndex } from "../../lib/drawTimeSeries";
import type { DataPoint } from "../../types";

const MAX_ZOOM = 90; // one month down to roughly 8 hours

interface Props {
  data: DataPoint[];
  showActual?: boolean;
  showForecast?: boolean;
  /** Visible window; null shows the whole range. */
  view?: [Date, Date] | null;
  height?: number;
}

interface Scales {
  base: ScaleTime<number, number>; // full range; the zoom transform is applied on top
  y: ScaleLinear<number, number>;
}

/**
 * Actual vs forecast wind on an HTML5 canvas (1,488 points, no DOM nodes per point).
 * Scroll to zoom, drag to pan.
 */
export default function TimeSeriesCanvasChart({ data, showActual = true, showForecast = true, view = null, height = 360 }: Props) {
  const [wrapRef, width] = useElementWidth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const hoverRef = useRef(-1);
  const frameRef = useRef(0);
  const scalesRef = useRef<Scales | null>(null);

  const paint = useCallback(() => {
    frameRef.current = 0;
    const canvas = canvasRef.current;
    const scales = scalesRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !scales) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawTimeSeries(ctx, {
      width,
      height,
      data,
      x: transformRef.current.rescaleX(scales.base),
      y: scales.y,
      showActual,
      showForecast,
      hoverIndex: hoverRef.current,
    });
  }, [data, width, height, showActual, showForecast]);

  // Coalesce bursts of mouse/zoom events into one draw per animation frame.
  const schedule = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(paint);
  }, [paint]);

  // Size the backing store for the screen's pixel density.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }, [width, height]);

  // (Re)build scales and the zoom behaviour when data or size change, keeping the visible window.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length || !width) return;

    const base = scaleUtc()
      .domain([data[0].time, data[data.length - 1].time])
      .range([MARGIN.left, width - MARGIN.right]);
    const previous = scalesRef.current;
    const visible = previous ? transformRef.current.rescaleX(previous.base).domain() : null;
    scalesRef.current = { base, y: makeYScale(data, height) };

    const fit = (domain: Date[]) => {
      const [r0, r1] = base.range();
      const k = Math.min(MAX_ZOOM, (r1 - r0) / (base(domain[1]) - base(domain[0])));
      return zoomIdentity.translate(r0 - k * base(domain[0]), 0).scale(k);
    };

    const behaviour = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .extent([[MARGIN.left, 0], [width - MARGIN.right, height]])
      .translateExtent([[MARGIN.left, 0], [width - MARGIN.right, height]])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        schedule();
      });
    const sel = select(canvas);
    sel.call(behaviour).on("dblclick.zoom", null);
    sel.call(behaviour.transform, view ? fit(view) : visible ? fit(visible) : zoomIdentity);
    schedule();

    return () => {
      sel.on(".zoom", null);
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [data, view, schedule, width, height]);

  // Redraw when toggles change.
  useEffect(() => {
    schedule();
    void document.fonts.ready.then(schedule);
  }, [schedule]);

  const onMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const scales = scalesRef.current;
    if (!scales) return;
    const mx = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const x = transformRef.current.rescaleX(scales.base);
    hoverRef.current = mx < MARGIN.left || mx > width - MARGIN.right ? -1 : nearestIndex(data, x, mx);
    schedule();
  };
  const onLeave = () => {
    hoverRef.current = -1;
    schedule();
  };

  return (
    <div ref={wrapRef} className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
        <Legend colour={COLORS.actual} label="Actual (FUELHH)" />
        <Legend colour={COLORS.forecast} label="Day-ahead forecast (WINDFOR)" dashed />
        <Legend colour={COLORS.over} label="Forecast above actual" swatch />
        <Legend colour={COLORS.under} label="Actual above forecast" swatch />
        <span className="ml-auto hidden sm:inline">Scroll to zoom · drag to pan</span>
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Actual versus day-ahead forecast wind generation over time"
        style={{ width, height, touchAction: "pan-y", cursor: "crosshair", display: "block" }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      />
    </div>
  );
}

function Legend({ colour, label, dashed, swatch }: { colour: string; label: string; dashed?: boolean; swatch?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatch ? (
        <span className="h-2.5 w-2.5 rounded-sm opacity-60" style={{ background: colour }} />
      ) : (
        <span className="w-5 border-t-2" style={{ borderColor: colour, borderStyle: dashed ? "dashed" : "solid" }} />
      )}
      {label}
    </span>
  );
}