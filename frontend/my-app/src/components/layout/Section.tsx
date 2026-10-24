import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  intro: string;
  children: ReactNode;
}

/** A page section: a centred heading with a one-line intro, then its tiles. */
export default function Section({ id, title, intro, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 space-y-10">
      <div className="text-center">
        <h2 id={`${id}-title`} className="font-display text-5xl font-semibold leading-none">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{intro}</p>
      </div>
      {children}
    </section>
  );
}