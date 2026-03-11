"use client";

import { useEffect, useRef } from "react";

const researchers = [
  {
    initials: "AM",
    name: "Dr. Amara Mutesaaaaa",
    role: "Director of Research",
    color: "bg-green",
    focus:
      "Leads Pearl's foundational model programme and institutional AI strategy. Expert in large-scale model alignment and sovereign AI systems.",
    tags: ["Foundational Models", "AI Policy", "Alignment"],
  },
  {
    initials: "NK",
    name: "Naledi Kigozi",
    role: "Lead — Embodied AI",
    color: "bg-orange",
    focus:
      "Researches physical intelligence, sensor fusion and robotic control systems. Pioneering educational robotics platforms for the Ugandan market.",
    tags: ["Robotics", "Control Systems", "Sensor Fusion"],
  },
  {
    initials: "JO",
    name: "Julius Okello",
    role: "Research Engineer",
    color: "bg-green-mid",
    focus:
      "Builds training pipelines and evaluation frameworks for institutional-grade models. Focused on efficiency for low-resource environments.",
    tags: ["MLOps", "Model Evaluation", "Infrastructure"],
  },
  {
    initials: "BN",
    name: "Brenda Nakabuye",
    role: "Robotics Engineer",
    color: "bg-[#1a1a1a]",
    focus:
      "Designs the hardware–software interface for Pearl's industrial robotics track, with a focus on embedded AI and edge intelligence.",
    tags: ["Embedded AI", "Edge Computing", "Hardware"],
  },
];

export default function Researchers() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal");
    if (!els) return;
    const observers: IntersectionObserver[] = [];
    els.forEach((el) => {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const siblings = [...(e.target.parentNode?.children ?? [])].filter(
              (c) => c.classList.contains("reveal"),
            );
            const idx = siblings.indexOf(e.target as Element);
            (e.target as HTMLElement).style.transitionDelay = `${idx * 0.09}s`;
            e.target.classList.add("visible");
          });
        },
        { threshold: 0.1 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section
      id="researchers"
      ref={sectionRef}
      className="py-26 max-sm:py-16 px-[5.5vw] max-sm:px-5 bg-cream"
    >
      <div className="mb-15 reveal">
        <div className="text-[.72rem] font-semibold tracking-[.14em] uppercase text-orange mb-3">
          The Team
        </div>
        <h2 className="font-heading font-bold text-[clamp(1.9rem,3.5vw,2.9rem)] text-green leading-tight tracking-tight mb-4">
          Our Researchers
        </h2>
        <p className="font-body text-[.98rem] font-light text-text-mid max-w-[520px] leading-relaxed">
          A focused team of researchers, engineers and academics building at the
          frontier of AI in Uganda and beyond.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
        {researchers.map((r) => (
          <div
            key={r.name}
            className="reveal bg-white rounded-2xl px-7 py-8 border border-green/7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(15,51,32,.1)]"
          >
            <div
              className={`r-avatar relative z-0 w-[76px] h-[76px] rounded-full mx-auto mb-4 flex items-center justify-center font-heading text-[1.45rem] font-bold italic text-white ${r.color}`}
            >
              {r.initials}
            </div>
            <h3 className="font-heading text-[1.08rem] font-bold text-green mb-1 leading-snug">
              {r.name}
            </h3>
            <div className="text-[.76rem] font-semibold text-orange tracking-wider uppercase mb-2.5">
              {r.role}
            </div>
            <p className="text-[.84rem] font-light text-text-mid leading-relaxed mb-3.5">
              {r.focus}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {r.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-cream text-green-mid text-[.68rem] font-medium px-2.5 py-0.5 rounded-full border border-green/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
