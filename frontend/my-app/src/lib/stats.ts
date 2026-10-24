import { bin, deviation, extent, scaleLinear, tickStep, ticks } from "d3";

export interface HistBin {
  x0: number;
  x1: number;
  count: number;
}

export interface Histogram {
  domain: [number, number];
  binWidth: number;
  bins: HistBin[];
}

/** Histogram with "nice" bin edges, always including 0 in the domain. */
export function histogram(values: number[], bins = 30): Histogram {
  const [lo = 0, hi = 0] = extent(values);
  let [x0, x1] = scaleLinear()
    .domain([Math.min(lo, 0), Math.max(hi, 0)])
    .nice(bins)
    .domain();
  if (x0 === x1) [x0, x1] = [x0 - 1, x1 + 1];

  const counted = bin<number, number>().domain([x0, x1]).thresholds(ticks(x0, x1, bins))(values);
  return {
    domain: [x0, x1],
    binWidth: tickStep(x0, x1, bins),
    bins: counted.map((b) => ({ x0: b.x0 ?? x0, x1: b.x1 ?? x1, count: b.length })),
  };
}

/** Gaussian kernel density estimate (Silverman bandwidth), in probability per MW. */
export function kde(values: number[], xs: number[]): number[] {
  const n = values.length;
  const h = 1.06 * (deviation(values) || 1) * n ** -0.2;
  const norm = 1 / (n * h * Math.sqrt(2 * Math.PI));
  return xs.map((x) => {
    let sum = 0;
    for (const v of values) {
      const u = (x - v) / h;
      sum += Math.exp(-0.5 * u * u);
    }
    return sum * norm;
  });
}