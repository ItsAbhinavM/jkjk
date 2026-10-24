import { useEffect, useRef } from "react";
import { area, axisBottom, axisLeft, extent, line, max, scaleLinear, scaleUtc, select } from "d3";
import { useElementWidth } from "../../hooks/useElementWidth";
import { COLORS, styleAxis } from "../../lib/chartTheme";
import { fmtMW } from "../../lib/format";
import type { BandPoint } from "../../types";

const M = { top: 12, right: 16, bottom: 28, left: 56 };

interface Props {
  bandData: BandPoint[];
  coverage: number | null;
  height?: number;
}

/**
 * Forecast line with a shaded band showing where actual output usually lands.
 * Band = forecast - P90 error to forecast - P10 error (about 80% of past outcomes).
 */
export default function QuantileBandChart({ bandData, coverage, height = 300 }: Props) {
  const [wrapRef, width] = useElementWidth();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();
    const [t0, t1] = extent(bandData, (d) => d.time);
    if (!width || !t0 || !t1) return;

    const x = scaleUtc().domain([t0, t1]).range([M.left, width - M.right]);
    const top = max(bandData, (d) => Math.max(d.upper ?? 0, d.forecast ?? 0, d.actual ?? 0)) ?? 1;
    const y = scaleLinear()
      .domain([0, top * 1.05])
      .nice()
      .range([height - M.bottom, M.top]);

    svg
      .append("g")
      .attr("transform", `translate(${M.left},0)`)
      .call(axisLeft(y).ticks(5).tickFormat((d) => fmtMW(+d)).tickSize(-(width - M.left - M.right)))
      .call(styleAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", COLORS.grid));
    svg
      .append("g")
      .attr("transform", `translate(0,${height - M.bottom})`)
      .call(axisBottom(x).ticks(Math.max(2, Math.floor(width / 110))))
      .call(styleAxis);

    svg
      .append("path")
      .datum(bandData)
      .attr("fill", COLORS.forecast)
      .attr("fill-opacity", 0.22)
      .attr(
        "d",
        area<BandPoint>()
          .defined((d) => d.lower != null && d.upper != null)
          .x((d) => x(d.time))
          .y0((d) => y(d.lower ?? 0))
          .y1((d) => y(d.upper ?? 0))
      );

    const path = (key: "actual" | "forecast", colour: string, strokeWidth: number, dash: string | null, opacity = 1) =>
      svg
        .append("path")
        .datum(bandData)
        .attr("fill", "none")
        .attr("stroke", colour)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", dash)
        .attr("stroke-opacity", opacity)
        .attr(
          "d",
          line<BandPoint>()
            .defined((d) => d[key] != null)
            .x((d) => x(d.time))
            .y((d) => y(d[key] ?? 0))
        );
    path("actual", COLORS.actual, 1, null, 0.7);
    path("forecast", COLORS.forecast, 1.75, "6 4");
  }, [bandData, width, height]);

  return (
    <div ref={wrapRef} className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-blue-500/25" /> Likely range of actual (P10–P90)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-dashed" style={{ borderColor: COLORS.forecast }} /> Forecast
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-5 border-t" style={{ borderColor: COLORS.actual }} /> Actual
        </span>
        {coverage != null && (
          <span className="ml-auto tabular-nums">Actual inside band: {(coverage * 100).toFixed(0)}% of half-hours (target 80%)</span>
        )}
      </div>
      <svg ref={svgRef} width={width} height={height} role="img" aria-label="Forecast with P10 to P90 band" />
    </div>
  );
}