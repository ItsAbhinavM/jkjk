/** A coloured top edge on a tile encodes what it is about. */
export const ACCENTS = {
    none: "",
    emerald: "border-t-4 border-t-emerald-500", // actual output
    blue: "border-t-4 border-t-blue-500", // forecast
    amber: "border-t-4 border-t-amber-500", // wind beat the forecast
    red: "border-t-4 border-t-red-500", // forecast too high
  } as const;
  
  export type Accent = keyof typeof ACCENTS;