"use client";

import { useEffect, useRef, useState } from "react";

function Corners() {
  return (
    <>
      <span aria-hidden className="viewport-corner viewport-corner-tl" />
      <span aria-hidden className="viewport-corner viewport-corner-tr" />
      <span aria-hidden className="viewport-corner viewport-corner-bl" />
      <span aria-hidden className="viewport-corner viewport-corner-br" />
    </>
  );
}

function figTag(index: number, total: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `FIG. ${pad(index + 1)} / ${pad(total)}`;
}

export default function Portfolio({ galleryImages }: { galleryImages: string[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? i : (i - 1 + galleryImages.length) % galleryImages.length));
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? i : (i + 1) % galleryImages.length));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, galleryImages.length]);

  // ── Scroll-reveal, staggered — same mechanism used across the rest of the site ──
  useEffect(() => {
    const els = gridRef.current?.querySelectorAll(".reveal");
    if (!els) return;

    const observers: IntersectionObserver[] = [];
    els.forEach((el) => {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const siblings = [...(e.target.parentNode?.children ?? [])].filter((c) =>
              c.classList.contains("reveal"),
            );
            const idx = siblings.indexOf(e.target as Element);
            (e.target as HTMLElement).style.transitionDelay = `${idx * 0.045}s`;
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          });
        },
        { threshold: 0.15 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [galleryImages.length]);

  return (
    <div className="blueprint-grid bg-cream min-h-screen">
      <section className="max-w-[960px] mx-auto px-8 max-sm:px-5 pt-24 max-sm:pt-16 pb-10">
        <div className="inline-block border border-green/25 rounded-[3px] px-3 py-1.5 mb-5">
          <p className="font-mono text-[.68rem] tracking-[.14em] uppercase text-green/70">
            [ Field Log — Internship Archive ]
          </p>
        </div>
        <h1 className="font-heading font-bold text-[clamp(2.6rem,6vw,4.6rem)] leading-[1.03] tracking-tight text-green mb-5">
          A Real Lab.
          <br />
          <em className="italic text-orange">Real Work.</em>
        </h1>
        <p className="font-body text-[1rem] leading-relaxed text-text-mid max-w-[560px] font-light mb-6">
          Etched circuit boards, project reviews on the big screen, robots
          built one phase at a time — this is Pearl AI Labs&apos; internship
          programme with Lwera Electronics &amp; Semi-conductors, split between
          the lab at National ICT Hub, Nakawa and UniPod at Makerere.
        </p>
        {galleryImages.length > 0 && (
          <p className="font-mono text-[.68rem] tracking-[.1em] uppercase text-green/50">
            {galleryImages.length} photographs on file
          </p>
        )}
        <div className="mt-8 border-b border-dashed border-green/25" />
      </section>

      <section className="max-w-[1120px] mx-auto px-8 max-sm:px-5 pb-28">
        {galleryImages.length > 0 ? (
          <div
            ref={gridRef}
            className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(230px,1fr))]"
          >
            {galleryImages.map((src, i) => (
              <button
                key={src}
                type="button"
                className="gallery-frame reveal group relative block w-full aspect-[4/3] p-0 border border-green/20 rounded-[2px] overflow-hidden cursor-pointer bg-white"
                onClick={() => setLightboxIndex(i)}
                aria-label={`Open photo ${i + 1} of ${galleryImages.length}`}
              >
                {/* Hover-lift lives on this inner wrapper, not the button itself —
                    the button also carries .reveal, whose own transition/transform
                    rules would otherwise fight this one for the same property. */}
                <div className="relative w-full h-full transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover grayscale scale-100 transition-[filter,transform] duration-500 ease-out"
                  />
                  <Corners />
                  <span className="absolute bottom-2 left-2 font-mono text-[.62rem] tracking-[.08em] text-cream bg-green/70 px-1.5 py-0.5 rounded-[2px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300">
                    {figTag(i, galleryImages.length)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-green/25 rounded-[2px] py-16 px-6 text-center">
            <p className="font-mono text-[.68rem] tracking-[.14em] uppercase text-green/50 mb-2">
              [ Archive Empty ]
            </p>
            <p className="font-body text-[.9rem] text-text-mid">
              Photos are coming soon — check back shortly.
            </p>
          </div>
        )}
      </section>

      {lightboxIndex !== null && (
        <div
          className="lightbox-overlay fixed inset-0 bg-green/95 flex items-center justify-center z-[1000] p-8 max-sm:p-4"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute left-4 max-sm:left-2 top-1/2 -translate-y-1/2 font-mono text-cream/70 hover:text-orange text-sm tracking-widest px-2 py-3 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length); }}
            aria-label="Previous photo"
          >
            [ &lt; ]
          </button>

          <div
            key={lightboxIndex}
            className="lightbox-image relative max-w-[min(88vw,1000px)] max-h-[80vh] border border-cream/25 rounded-[2px] p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[lightboxIndex]}
              alt=""
              className="block max-w-[calc(88vw-24px)] max-h-[calc(80vh-24px)] object-contain"
            />
            <Corners />
          </div>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[.68rem] tracking-[.14em] text-cream/60">
            {figTag(lightboxIndex, galleryImages.length)}
          </p>

          <button
            type="button"
            className="absolute right-4 max-sm:right-2 top-1/2 -translate-y-1/2 font-mono text-cream/70 hover:text-orange text-sm tracking-widest px-2 py-3 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % galleryImages.length); }}
            aria-label="Next photo"
          >
            [ &gt; ]
          </button>

          <button
            type="button"
            className="absolute top-5 right-5 font-mono text-cream/70 hover:text-orange text-xs tracking-widest transition-colors"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            [ ESC ]
          </button>
        </div>
      )}
    </div>
  );
}
