"use client";

import { useEffect, useRef, useState } from "react";

const responses: Record<string, string[]> = {
  foundational: [
    "Institutional-grade foundational models are built for reliability, auditability and long-term stability — properties that consumer models often trade away for novelty. At Pearl AI Labs, our research focuses on training dynamics that produce predictable, inspectable outputs essential for enterprise and government deployment.",
    "Sovereign AI infrastructure means a nation controls the compute, data and model weights underlying its critical systems. Pearl's foundational research track works on the architecture decisions, training protocols and governance frameworks that make this possible at scale in Uganda and across the continent.",
    "A key challenge in institutional AI is aligning model behaviour with organisational policy — not just human values in the abstract. Our research formalises this as constraint satisfaction during fine-tuning, allowing deployers to embed hard rules while preserving model capability.",
  ],
  robotics: [
    "Embodied AI refers to intelligence that operates through a physical body — sensors, actuators and feedback loops that ground abstract reasoning in real-world experience. Pearl's robotics track explores how transformer-based policies can control physical systems in industrial and educational settings.",
    "Sensor fusion combines data streams from multiple sensors — cameras, LiDAR, IMUs — into a unified world model. Our research focuses on efficient fusion architectures that run reliably on edge hardware common in Ugandan industrial environments, without depending on cloud connectivity.",
    "Our intelligent toy platform embeds a compact language-action model into child-scale robotics, enabling natural language interaction and physical task execution. The goal is to make machine learning tangible and accessible as a learning tool from an early age.",
  ],
};

export default function TryModels() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeModel, setActiveModel] = useState("foundational");
  const [prompt, setPrompt] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);

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

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setHasResponded(false);
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));
    const pool = responses[activeModel];
    setResponseText(pool[Math.floor(Math.random() * pool.length)]);
    setHasResponded(true);
    setIsLoading(false);
    setPrompt("");
  };

  return (
    <section
      id="try-models"
      ref={sectionRef}
      className="bg-green py-24 max-sm:py-16 px-[5.5vw] max-sm:px-5"
    >
      <div className="text-center mb-12 reveal">
        <div className="text-[.72rem] font-semibold tracking-[.14em] uppercase text-gold-light mb-3">
          Live Demo
        </div>
        <h2 className="font-heading font-bold text-[clamp(1.9rem,3.5vw,2.9rem)] text-white leading-tight tracking-tight mb-4">
          Try Our Models
        </h2>
        <p className="font-body text-[.98rem] font-light text-white/55 max-w-[520px] leading-relaxed mx-auto">
          Interact directly with Pearl AI Labs models. Select a research track
          and enter a prompt below.
        </p>
      </div>

      <div className="reveal max-w-[800px] mx-auto bg-white/4 border border-white/9 rounded-2xl overflow-hidden">
        {/* Top bar */}
        <div className="bg-white/6 border-b border-white/7 px-5 py-3 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-auto text-[.73rem] text-white/35 tracking-wider">
            Pearl AI Labs · Model Playground
          </span>
        </div>

        {/* Body */}
        <div className="p-7 max-sm:p-4">
          {/* Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {[
              { key: "foundational", label: "Foundational Research" },
              { key: "robotics", label: "Robotics & Embodied AI" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveModel(tab.key)}
                className={`px-4 py-1.5 rounded-md text-[.8rem] font-medium transition-colors cursor-pointer border-none ${
                  activeModel === tab.key
                    ? "bg-orange text-white font-semibold"
                    : "bg-white/7 text-white/45 hover:bg-white/12 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Prompt */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
              }}
              placeholder={
                activeModel === "foundational"
                  ? "Ask anything — e.g. 'What makes a model institutional-grade?'"
                  : "Ask anything — e.g. 'How does embodied AI perceive the world?'"
              }
              className="w-full bg-black/22 border border-white/9 rounded-[10px] py-4 pl-4 pr-14 font-body text-[.88rem] font-light text-white resize-y min-h-[88px] outline-none focus:border-orange/55 transition-colors placeholder:text-white/28 leading-relaxed"
            />
            <button
              onClick={handleSend}
              className="absolute right-3 bottom-3 bg-orange border-none rounded-[7px] text-white px-3 py-2 cursor-pointer text-[.85rem] hover:bg-orange-mid transition-colors"
            >
              ▶
            </button>
          </div>

          {/* Response */}
          <div className="mt-5 p-4 bg-white/4 rounded-[10px] border-l-2 border-orange min-h-[58px]">
            <div className="text-[.68rem] font-semibold text-gold-light tracking-wider uppercase mb-2">
              Model Response
            </div>
            {isLoading ? (
              <div className="demo-loading flex gap-1.5 items-center h-5">
                <span className="w-[7px] h-[7px] rounded-full bg-orange inline-block" />
                <span className="w-[7px] h-[7px] rounded-full bg-orange inline-block" />
                <span className="w-[7px] h-[7px] rounded-full bg-orange inline-block" />
              </div>
            ) : (
              <div
                className={`font-body text-[.875rem] font-light leading-relaxed ${
                  hasResponded ? "text-white/72" : "text-white/30 italic"
                }`}
              >
                {hasResponded
                  ? responseText
                  : "Select a model track and enter a prompt to begin…"}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
