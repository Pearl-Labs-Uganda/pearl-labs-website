"use client";

import { useEffect, useRef } from "react";
import { Brain, Mic, Bot } from "lucide-react";

const projects = [
  {
    icon: Brain,
    tag: "Foundational AI",
    title: "AIHub",
    subtitle: "AI Platform",
    description:
      "A unified platform giving researchers, developers, and businesses in Uganda access to state-of-the-art AI models and tools. AIHub democratizes access to artificial intelligence across East Africa.",
    badge: "LIVE",
    link: "https://apps.pearllabs.ug",
  },
  {
    icon: Mic,
    tag: "Foundational AI",
    title: "Minuteman",
    subtitle: "Speech Intelligence",
    description:
      "A free, high-accuracy speech-to-text engine built for African languages and accents. Minuteman enables seamless voice transcription for individuals and institutions across Uganda.",
    badge: "LIVE",
    link: "https://minuteman.pearllabs.ug",
  },
  {
    icon: Bot,
    tag: "Embodied AI & Robotics",
    title: "Robotic Arms Research",
    subtitle: "Embodied Intelligence",
    description:
      "Hands-on research into robotic arm systems, focusing on training robots to perform physical tasks through machine learning. Pearl Labs is building the foundations for industrial and educational robotics in Uganda.",
    badge: "IN RESEARCH",
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
              <project.icon className="w-6 h-6 text-orange" strokeWidth={1.5} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-[.68rem] font-semibold tracking-wider uppercase text-green-mid bg-green/7 px-2.5 py-0.5 rounded-full inline-block">
                {project.tag}
              </span>
              {project.badge ? (
                <span className="text-[.65rem] font-semibold uppercase tracking-[.16em] text-white bg-green px-2.5 py-1 rounded-full">
                  {project.badge}
                </span>
              ) : null}
            </div>
            <h3 className="font-heading text-[1.25rem] font-bold text-green mb-2 leading-snug">
              {project.title}
            </h3>
            {project.subtitle ? (
              <p className="text-[.875rem] font-semibold text-green-mid mb-3">
                {project.subtitle}
              </p>
            ) : null}
            <p className="text-[.875rem] font-light text-text-mid leading-relaxed mb-5">
              {project.description}
            </p>
            {project.link ? (
              <a
                href={project.link}
                className="text-[.9rem] font-semibold text-green transition-colors duration-200 hover:text-orange"
              >
                Visit project
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
