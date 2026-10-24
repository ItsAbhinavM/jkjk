import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  intro: string;
  children: ReactNode;
}

/** A page section: a heading with a one-line intro, then its tiles. */
export default function Section({ id, title, intro, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 space-y-5">
      <div>
        <h2 id={`${id}-title`} className="font-display text-4xl font-semibold leading-none">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-slate-300">{intro}</p>
      </div>
      {children}
    </section>
  );
}