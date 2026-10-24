/** A soft tint on a tile encodes what it is about. */
export const ACCENTS = {
    none: "",
    emerald: "bg-emerald-50", // actual output
    blue: "bg-blue-50", // forecast
    amber: "bg-amber-50", // wind beat the forecast
    red: "bg-red-50", // forecast too high
  } as const;
  
  export type Accent = keyof typeof ACCENTS;