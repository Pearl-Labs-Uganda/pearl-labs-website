"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, MessageCircle, Zap, Link2, BookOpen, Smartphone, BarChart3, Building2, Package } from "lucide-react";

const consultancyServices = [
  {
    icon: Bot,
    title: "Intelligent Agents",
    description:
      "Autonomous AI agents that handle complex workflows — from customer onboarding to supply chain decisions — built around your business logic.",
  },
  {
    icon: MessageCircle,
    title: "Custom Chatbots & Assistants",
    description:
      "Conversational AI tailored to your brand voice, integrated with your knowledge base and internal systems for 24/7 intelligent support.",
  },
  {
    icon: Zap,
    title: "Robotics Solutions",
    description:
      "End-to-end design and deployment of robotic systems for industrial automation, agriculture, and education — hardware meets intelligence.",
  },
  {
    icon: Link2,
    title: "AI System Integration",
    description:
      "Seamlessly embed AI into your existing tech stack — ERP, CRM, databases, and APIs — without rebuilding from scratch.",
  },
];

const productOfferings = [
  {
    icon: BookOpen,
    title: "AI Training Programmes",
    description:
      "Hands-on workshops and certification courses for teams — from foundational literacy to advanced ML engineering, customised per organisation.",
  },
  {
    icon: Smartphone,
    title: "Software Apps & SaaS",
    description:
      "Production-ready applications and cloud platforms built on our foundational models — deploy, scale, and update without the R&D overhead.",
  },
  {
    icon: BarChart3,
    title: "Intelligence Dashboards",
    description:
      "Real-time analytics and predictive insights dashboards that turn your data into decisions — no data-science team required.",
  },
  {
    icon: Building2,
    title: "Institutional AI Licensing",
    description:
      "License our foundational models and toolkits for sovereign or enterprise deployment — full control, on-premise or private cloud.",
  },
];

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

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

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSubmitted(true);
    setTimeout(() => {
      setQuoteSubmitted(false);
      setQuoteOpen(false);
    }, 3000);
  };

  return (
    <section
      id="services"
      ref={sectionRef}
      className="py-26 max-sm:py-16 px-[5.5vw] max-sm:px-5 bg-off-white"
    >
      {/* Section header */}
      <div className="mb-15 reveal">
        <div className="text-[.72rem] font-semibold tracking-[.14em] uppercase text-orange mb-3">
          What We Offer
        </div>
        <h2 className="font-heading font-bold text-[clamp(1.9rem,3.5vw,2.9rem)] text-green leading-tight tracking-tight mb-4">
          Our Services
        </h2>
        <p className="font-body text-[.98rem] font-light text-text-mid max-w-[580px] leading-relaxed">
          From bespoke AI builds to ready-to-deploy products — two pillars
          designed to meet you wherever you are on your AI journey.
        </p>
      </div>

      {/* Two pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Innovation Consultancy */}
        <div className="reveal group relative bg-white border border-green/7 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_54px_rgba(212,112,10,.1)]">
          {/* Header stripe */}
          <div className="bg-gradient-to-r from-orange to-orange-mid px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
              <Zap className="w-6 h-6 text-white" />
              <h3 className="font-heading text-[1.35rem] font-bold text-white leading-snug">
                Innovation Consultancy
              </h3>
            </div>
            <p className="text-white/75 text-[.82rem] font-light leading-relaxed">
              Bespoke AI solutions engineered around your unique challenges
            </p>
          </div>

          {/* Offerings */}
          <div className="p-8 space-y-6">
            {consultancyServices.map((s) => (
              <div key={s.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-pale flex items-center justify-center text-lg shrink-0 mt-0.5">
                  <s.icon className="w-5 h-5 text-orange" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-heading text-[.98rem] font-bold text-green mb-1 leading-snug">
                    {s.title}
                  </h4>
                  <p className="text-[.84rem] font-light text-text-mid leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-4 flex flex-wrap gap-3">
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 bg-orange text-white text-[.84rem] font-semibold px-6 py-2.5 rounded-lg hover:bg-orange-mid hover:-translate-y-px transition-all no-underline shadow-[0_4px_16px_rgba(212,112,10,.22)]"
              >
                Start a project
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <button
                onClick={() => setQuoteOpen(true)}
                className="inline-flex items-center gap-2 border-2 border-orange text-orange text-[.84rem] font-semibold px-6 py-2.5 rounded-lg hover:bg-orange hover:text-white transition-all cursor-pointer"
              >
                Get Quotation
              </button>
            </div>
          </div>
        </div>

        {/* Products for Corporates & Institutions */}
        <div className="reveal group relative bg-white border border-green/7 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_54px_rgba(15,51,32,.1)]">
          {/* Header stripe */}
          <div className="bg-gradient-to-r from-green to-green-mid px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
              <Package className="w-5 h-5 text-orange" strokeWidth={1.5} />
              <h3 className="font-heading text-[1.35rem] font-bold text-white leading-snug">
                Products for Corporates &amp; Institutions
              </h3>
            </div>
            <p className="text-white/65 text-[.82rem] font-light leading-relaxed">
              Packaged AI solutions ready to deploy at institutional scale
            </p>
          </div>

          {/* Offerings */}
          <div className="p-8 space-y-6">
            {productOfferings.map((s) => (
              <div key={s.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-green/8 flex items-center justify-center text-lg shrink-0 mt-0.5">
                  <s.icon className="w-5 h-5 text-green" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-heading text-[.98rem] font-bold text-green mb-1 leading-snug">
                    {s.title}
                  </h4>
                  <p className="text-[.84rem] font-light text-text-mid leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-4 flex flex-wrap gap-3">
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 bg-green text-white text-[.84rem] font-semibold px-6 py-2.5 rounded-lg hover:bg-green-mid hover:-translate-y-px transition-all no-underline shadow-[0_4px_16px_rgba(15,51,32,.22)]"
              >
                Enquire
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <button
                onClick={() => setQuoteOpen(true)}
                className="inline-flex items-center gap-2 border-2 border-green text-green text-[.84rem] font-semibold px-6 py-2.5 rounded-lg hover:bg-green hover:text-white transition-all cursor-pointer"
              >
                Get Quotation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation modal */}
      {quoteOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setQuoteOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,.2)] overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-green to-green-mid px-7 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-[1.15rem] font-bold text-white leading-snug">
                  Request a Quotation
                </h3>
                <p className="text-white/65 text-[.78rem] font-light mt-0.5">
                  Tell us what you need and we&apos;ll get back within 24 hours
                </p>
              </div>
              <button
                onClick={() => setQuoteOpen(false)}
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {quoteSubmitted ? (
              <div className="px-7 py-14 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h4 className="font-heading text-[1.1rem] font-bold text-green mb-2">
                  Quotation Request Sent!
                </h4>
                <p className="text-[.88rem] text-text-mid font-light">
                  Our team will review your requirements and respond within 24
                  hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleQuoteSubmit}
                className="px-7 py-6 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[.75rem] font-medium text-text-mid mb-1.5">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Jane Doe"
                      className="w-full py-2.5 px-3 border border-green/12 rounded-lg text-[.86rem] font-light text-text-dark bg-off-white outline-none focus:border-orange transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[.75rem] font-medium text-text-mid mb-1.5">
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      className="w-full py-2.5 px-3 border border-green/12 rounded-lg text-[.86rem] font-light text-text-dark bg-off-white outline-none focus:border-orange transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[.75rem] font-medium text-text-mid mb-1.5">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="jane@company.com"
                    className="w-full py-2.5 px-3 border border-green/12 rounded-lg text-[.86rem] font-light text-text-dark bg-off-white outline-none focus:border-orange transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[.75rem] font-medium text-text-mid mb-1.5">
                    Service Interest
                  </label>
                  <select
                    required
                    className="w-full py-2.5 px-3 border border-green/12 rounded-lg text-[.86rem] font-light text-text-dark bg-off-white outline-none focus:border-orange transition-colors"
                  >
                    <option value="">Select a service…</option>
                    <optgroup label="Innovation Consultancy">
                      <option>Intelligent Agents</option>
                      <option>Custom Chatbots &amp; Assistants</option>
                      <option>Robotics Solutions</option>
                      <option>AI System Integration</option>
                    </optgroup>
                    <optgroup label="Products">
                      <option>AI Training Programmes</option>
                      <option>Software Apps &amp; SaaS</option>
                      <option>Intelligence Dashboards</option>
                      <option>Institutional AI Licensing</option>
                    </optgroup>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[.75rem] font-medium text-text-mid mb-1.5">
                    Project Details
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Briefly describe what you need…"
                    className="w-full py-2.5 px-3 border border-green/12 rounded-lg text-[.86rem] font-light text-text-dark bg-off-white outline-none focus:border-orange transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-[.75rem] font-medium text-text-mid mb-1.5">
                    Estimated Budget (optional)
                  </label>
                  <select className="w-full py-2.5 px-3 border border-green/12 rounded-lg text-[.86rem] font-light text-text-dark bg-off-white outline-none focus:border-orange transition-colors">
                    <option value="">Prefer not to say</option>
                    <option>Under $5,000</option>
                    <option>$5,000 – $15,000</option>
                    <option>$15,000 – $50,000</option>
                    <option>$50,000+</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange text-white text-[.88rem] font-semibold rounded-lg hover:bg-orange-mid transition-colors cursor-pointer shadow-[0_4px_16px_rgba(212,112,10,.22)] mt-2"
                >
                  Submit Quotation Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
