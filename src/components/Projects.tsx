"use client";

import { useEffect, useRef } from "react";

const projects = [
  {
    icon: "🧠",
    tag: "Foundational Research",
    title: "Institutional Grade Foundational Model Research",
    description:
      "Developing and studying large-scale foundational models built for institutional deployment — prioritising reliability, interpretability, and alignment with the specific requirements of sovereign and enterprise-grade systems in emerging economies.",
  },
  {
    icon: "🤖",
    tag: "Embodied AI",
    title: "Industrial Robotics & Embodied Intelligence",
    description:
      "Bridging the gap between software intelligence and the physical world through industrial robotics research and novel embodied AI systems — including intelligent toys and educational robotics platforms that make machine learning tangible.",
  },
];

export default function Projects() {
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
      id="projects"
      ref={sectionRef}
      className="py-26 max-sm:py-16 px-[5.5vw] max-sm:px-5 bg-off-white"
    >
      <div className="mb-15 reveal">
        <div className="text-[.72rem] font-semibold tracking-[.14em] uppercase text-orange mb-3">
          What We Build
        </div>
        <h2 className="font-heading font-bold text-[clamp(1.9rem,3.5vw,2.9rem)] text-green leading-tight tracking-tight mb-4">
          Research Projects
        </h2>
        <p className="font-body text-[.98rem] font-light text-text-mid max-w-[520px] leading-relaxed">
          Two focused tracks pushing the frontier — institutional AI foundations
          and physical intelligence in machines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {projects.map((project) => (
          <div
            key={project.title}
            className="project-card reveal relative overflow-hidden bg-white border border-green/7 rounded-2xl p-9 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_54px_rgba(15,51,32,.09)]"
          >
            <div className="w-13 h-13 rounded-xl bg-orange-pale flex items-center justify-center text-2xl mb-5">
              {project.icon}
            </div>
            <div className="text-[.68rem] font-semibold tracking-wider uppercase text-green-mid bg-green/7 px-2.5 py-0.5 rounded-full inline-block mb-3">
              {project.tag}
            </div>
            <h3 className="font-heading text-[1.25rem] font-bold text-green mb-3 leading-snug">
              {project.title}
            </h3>
            <p className="text-[.875rem] font-light text-text-mid leading-relaxed">
              {project.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
