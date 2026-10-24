import { useEffect, useState } from "react";

/** Returns the id of the section currently being read, for highlighting the nav. */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el != null);
    if (!sections.length) return;

    // A band near the top of the screen: whichever section crosses it is the one being read.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" }
    );
    sections.forEach((el) => observer.observe(el));

    // The last section is short, so it never reaches the band; pick it when scrolled to the bottom.
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setActive(ids[ids.length - 1]);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [ids]);

  return active;
}