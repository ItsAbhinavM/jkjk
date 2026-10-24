import { useEffect, useRef } from "react";
import { axisBottom, axisLeft, curveBasis, line, max, scaleLinear, select } from "d3";
import { useElementWidth } from "../../hooks/useElementWidth";
import { COLORS, FONT_FAMILY, styleAxis } from "../../lib/chartTheme";
import { fmtSigned } from "../../lib/format";
import { histogram, kde, type HistBin } from "../../lib/stats";

const M = { top: 26, right: 16, bottom: 44, left: 48 };

interface Props {
  errors: number[];
  p10: number | null;
  p50: number | null;
  p90: number | null;
  height?: number;
}

/**
 * Histogram of forecast error (F - A) with a KDE curve.
 * Right of zero = over-forecast (red), left = under-forecast (amber).
 * Bars outside the P10-P90 range are drawn at full strength to show the tails.
 */
export default function ErrorDistributionD3({ errors, p10, p50, p90, height = 300 }: Props) {
  const [wrapRef, width] = useElementWidth();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();
    if (!width || !errors.length) return;

    const { domain, binWidth, bins } = histogram(errors);
    const x = scaleLinear().domain(domain).range([M.left, width - M.right]);
    const y = scaleLinear()
      .domain([0, (max(bins, (b) => b.count) ?? 1) * 1.1])
      .nice()
      .range([height - M.bottom, M.top]);

    // Axes + light horizontal grid
    svg
      .append("g")
      .attr("transform", `translate(${M.left},0)`)
      .call(axisLeft(y).ticks(5).tickSize(-(width - M.left - M.right)))
      .call(styleAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", COLORS.grid));
    svg
      .append("g")
      .attr("transform", `translate(0,${height - M.bottom})`)
      .call(axisBottom(x).ticks(Math.max(3, Math.floor(width / 90))).tickFormat((d) => fmtSigned(+d)))
      .call(styleAxis);

    // Bars
    const mid = (b: HistBin) => (b.x0 + b.x1) / 2;
    const shade = (b: HistBin) => {
      if (b.x0 < 0 && b.x1 > 0) return COLORS.body; // zero-error centre
      return mid(b) > 0 ? COLORS.over : COLORS.under;
    };
    const inTail = (b: HistBin) => p10 != null && p90 != null && (mid(b) < p10 || mid(b) > p90);
    svg
      .append("g")
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", (b) => x(b.x0) + 0.5)
      .attr("width", (b) => Math.max(0, x(b.x1) - x(b.x0) - 1))
      .attr("y", (b) => y(b.count))
      .attr("height", (b) => y(0) - y(b.count))
      .attr("fill", shade)
      .attr("opacity", (b) => (inTail(b) ? 1 : 0.55));

    // KDE curve, scaled to the histogram's counts
    const xs = Array.from({ length: 120 }, (_, i) => domain[0] + ((domain[1] - domain[0]) * i) / 119);
    const density = kde(errors, xs);
    svg
      .append("path")
      .datum(xs.map((v, i): [number, number] => [v, density[i] * errors.length * binWidth]))
      .attr("d", line().x((d) => x(d[0])).y((d) => y(d[1])).curve(curveBasis))
      .attr("fill", "none")
      .attr("stroke", COLORS.text)
      .attr("stroke-width", 1.75);

        // Zero line and quantile markers. The zero label sits on its own row so it never collides with P10.
        const marker = (value: number | null, label: string, colour: string, dash: string | null, row: 0 | 1) => {
            if (value == null || value < domain[0] || value > domain[1]) return;
            const labelY = M.top - 9 - row * 16;
            const g = svg.append("g");
            g.append("line")
              .attr("x1", x(value))
              .attr("x2", x(value))
              .attr("y1", labelY + 4)
              .attr("y2", height - M.bottom)
              .attr("stroke", colour)
              .attr("stroke-dasharray", dash)
              .attr("stroke-width", 1.25);
            g.append("text")
              .attr("x", x(value))
              .attr("y", labelY)
              .attr("text-anchor", "middle")
              .attr("fill", colour)
              .attr("font-size", 11)
              .attr("font-family", FONT_FAMILY)
              .text(label);
          };
          marker(0, "0", COLORS.text, null, 1);
          marker(p10, "P10", COLORS.muted, "4 3", 0);
          marker(p50, "P50", COLORS.muted, "4 3", 0);
          marker(p90, "P90", COLORS.muted, "4 3", 0);

    // Axis captions
    const caption = (px: number, anchor: string, text: string) =>
      svg
        .append("text")
        .attr("x", px)
        .attr("y", height - 6)
        .attr("text-anchor", anchor)
        .attr("fill", COLORS.muted)
        .attr("font-size", 11)
        .attr("font-family", FONT_FAMILY)
        .text(text);
    caption(M.left, "start", "← under-forecast");
    caption(width - M.right, "end", "over-forecast →");
    caption((M.left + width - M.right) / 2, "middle", "Forecast − actual (MW)");
  }, [errors, p10, p50, p90, width, height]);

  return (
    <div ref={wrapRef} className="w-full">
      <svg ref={svgRef} width={width} height={height} role="img" aria-label="Histogram of forecast errors" />
    </div>
  );
}