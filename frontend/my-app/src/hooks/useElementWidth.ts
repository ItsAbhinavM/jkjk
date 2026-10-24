import { useEffect, useRef, useState } from "react";

/** Track an element's width with ResizeObserver. The ref'd element must always be rendered. */
export function useElementWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}