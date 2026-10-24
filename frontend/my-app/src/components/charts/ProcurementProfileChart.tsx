import { axisBottom, axisLeft, max, scaleBand, scaleLinear, select } from "d3";
import { useEffect, useRef } from "react";
import { useElementWidth } from "../../hooks/useElementWidth";
import { COLORS, styleAxis } from "../../lib/chartTheme";
import { fmtMW } from "../../lib/format";
import { slotLabel, type SlotAverage } from "../../lib/procurement";

const M = { top: 12, right: 16, bottom: 28, left: 56 };

interface Props {
  profile: SlotAverage[];
  peakSlot: number | null;
  height?: number;
}

/** Average thermal top-up for each half-hour of the day. The tallest bar is the slot to plan around. */
export default function ProcurementProfileChart({ profile, peakSlot, height = 300 }: Props) {
  const [wrapRef, width] = useElementWidth();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();
    if (!width) return;

    const x = scaleBand<number>()
      .domain(profile.map((p) => p.slot))
      .range([M.left, width - M.right])
      .padding(0.15);
    const y = scaleLinear()
      .domain([0, Math.max(1, max(profile, (p) => p.mw) ?? 1) * 1.05])
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
      .call(
        axisBottom(x)
          .tickValues(profile.filter((p) => p.slot % 6 === 0).map((p) => p.slot)) // every 3 hours
          .tickFormat((s) => slotLabel(s))
      )
      .call(styleAxis);

    svg
      .append("g")
      .selectAll("rect")
      .data(profile)
      .join("rect")
      .attr("x", (p) => x(p.slot) ?? 0)
      .attr("width", x.bandwidth())
      .attr("y", (p) => y(p.mw))
      .attr("height", (p) => y(0) - y(p.mw))
      .attr("fill", (p) => (p.slot === peakSlot ? COLORS.over : COLORS.body))
      .append("title")
      .text((p) => `${slotLabel(p.slot)} UTC: ${fmtMW(p.mw)} MW on average`);
  }, [profile, peakSlot, width, height]);

  return (
    <div ref={wrapRef} className="w-full">
      <svg ref={svgRef} width={width} height={height} role="img" aria-label="Average procurement by time of day" />
    </div>
  );
}