"use client";

import { useEffect, useRef, useState } from "react";

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="py-26 max-sm:py-16 px-[5.5vw] max-sm:px-5 bg-off-white grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-22 items-start"
    >
      {/* Info */}
      <div className="reveal">
        <div className="text-[.72rem] font-semibold tracking-[.14em] uppercase text-orange mb-3">
          Get In Touch
        </div>
        <h2 className="font-heading font-bold text-[clamp(1.9rem,3.5vw,2.9rem)] text-green leading-tight tracking-tight mb-4">
          Let&apos;s Build the Intelligent Economy Together
        </h2>
        <p className="font-body text-[.98rem] font-light text-text-mid max-w-[520px] leading-relaxed mb-9">
          Whether you&apos;re a researcher, institution, government partner or
          investor — Pearl AI Labs is actively building relationships at the
          frontier of AI infrastructure.
        </p>

        <div className="flex flex-col gap-4.5">
          {[
            {
              icon: "📍",
              label: "Location",
              value: "ICT Hub, Kampala, Uganda",
            },
            { icon: "✉️", label: "Email", value: "hello@pearlailabs.ug" },
            {
              icon: "🤝",
              label: "Research Partnerships",
              value: "research@pearlailabs.ug",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3.5">
              <div className="w-[42px] h-[42px] rounded-[9px] bg-green text-white flex items-center justify-center text-base shrink-0">
                {item.icon}
              </div>
              <div>
                <strong className="block text-[.72rem] font-semibold text-green uppercase tracking-wider mb-0.5">
                  {item.label}
                </strong>
                <span className="text-[.875rem] font-light text-text-mid">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="reveal bg-white rounded-2xl p-10 border border-green/7 shadow-[0_8px_44px_rgba(15,51,32,.07)]">
        <h3 className="font-heading text-[1.4rem] font-bold text-green mb-6 leading-snug">
          Send us a message
        </h3>

        <div className="mb-4.5">
          <label className="block text-[.72rem] font-semibold text-green tracking-wider uppercase mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Your name"
            className="w-full py-3 px-4 border-[1.5px] border-green/12 rounded-lg font-body text-[.88rem] font-light text-text-dark bg-off-white outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(212,112,10,.08)] transition-all"
          />
        </div>

        <div className="mb-4.5">
          <label className="block text-[.72rem] font-semibold text-green tracking-wider uppercase mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="you@organisation.com"
            className="w-full py-3 px-4 border-[1.5px] border-green/12 rounded-lg font-body text-[.88rem] font-light text-text-dark bg-off-white outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(212,112,10,.08)] transition-all"
          />
        </div>

        <div className="mb-4.5">
          <label className="block text-[.72rem] font-semibold text-green tracking-wider uppercase mb-1">
            Interest
          </label>
          <select className="w-full py-3 px-4 border-[1.5px] border-green/12 rounded-lg font-body text-[.88rem] font-light text-text-dark bg-off-white outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(212,112,10,.08)] transition-all">
            <option>Research Collaboration</option>
            <option>Institutional Partnership</option>
            <option>Investment / Funding</option>
            <option>Try Our Models</option>
            <option>Media / Press</option>
            <option>General Enquiry</option>
          </select>
        </div>

        <div className="mb-4.5">
          <label className="block text-[.72rem] font-semibold text-green tracking-wider uppercase mb-1">
            Message
          </label>
          <textarea
            placeholder="Tell us about your project or question…"
            className="w-full py-3 px-4 border-[1.5px] border-green/12 rounded-lg font-body text-[.88rem] font-light text-text-dark bg-off-white outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(212,112,10,.08)] transition-all resize-y min-h-[112px]"
          />
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-3.5 border-none rounded-lg font-body text-[.9rem] font-semibold cursor-pointer tracking-wide transition-all mt-2 text-white shadow-[0_4px_18px_rgba(212,112,10,.26)] hover:-translate-y-px hover:shadow-[0_8px_26px_rgba(212,112,10,.36)] ${
            submitted ? "bg-green" : "bg-orange hover:bg-orange-mid"
          }`}
        >
          {submitted ? "✓ Message Received" : "Send Message"}
        </button>
      </div>
    </section>
  );
}
