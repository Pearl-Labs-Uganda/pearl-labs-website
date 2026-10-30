import type { Metadata } from "next";
import Link from "next/link";

// The EAMS group internship report (2026), read here page by page. The PDF isn't offered for
// download (Jeremiah, 2026-10-30): its pages are images in public/projects/eams, made from the
// final PDF with the figure captions filled in.
const PAGES = 79;

export const metadata: Metadata = {
  title: "EAMS Autonomous Rover — Pearl AI Labs",
  description:
    "The full report on EAMS, a low-cost autonomous rover built by Pearl AI Labs interns in 2026: reinforcement learning in a Unity digital twin, on-device inference on an NVIDIA Jetson Orin Nano, and a five-guard safety layer.",
};

export default function EamsReportPage() {
  return (
    <div className="blueprint-grid bg-cream min-h-screen">
      <section className="max-w-[960px] mx-auto px-8 max-sm:px-5 pt-24 max-sm:pt-16 pb-10">
        <Link href="/#projects" className="inline-block font-body text-[.9rem] font-semibold text-green hover:text-orange mb-8">
          ← Research Projects
        </Link>
        <div className="w-fit border border-green/25 rounded-[3px] px-3 py-1.5 mb-5">
          <p className="font-mono text-[.68rem] tracking-[.14em] uppercase text-green/70">[ Research Report — Embodied AI &amp; Robotics ]</p>
        </div>
        <h1 className="font-heading font-bold text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.05] tracking-tight text-green mb-5">
          EAMS Autonomous Rover
          <br />
          <em className="italic text-orange text-[.6em]">Engineering Autonomous Mobility System</em>
        </h1>
        <p className="font-body text-[1rem] leading-relaxed text-text-mid max-w-[620px] font-light mb-4">
          A low-cost autonomous rover built by seven Pearl AI Labs interns between 22 June and 7 August 2026. A navigation
          policy was trained with reinforcement learning (PPO) in a Unity digital twin of the vehicle, exported to ONNX and
          run on its NVIDIA Jetson Orin Nano, where every command — human or learned — passes through the same five safety
          guards. In the densest obstacle course it was trained on, the policy reached its target in about 80% of runs.
        </p>
        <p className="font-mono text-[.68rem] tracking-[.1em] uppercase text-green/50">Group internship report · {PAGES} pages</p>
        <div className="mt-8 border-b border-dashed border-green/25" />
      </section>

      <section className="max-w-[880px] mx-auto px-8 max-sm:px-3 pb-28 space-y-5 max-sm:space-y-3">
        {Array.from({ length: PAGES }, (_, i) => {
          const n = String(i + 1).padStart(2, "0");
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={n}
              src={`/projects/eams/${n}.webp`}
              alt={`EAMS report, page ${i + 1} of ${PAGES}`}
              width={1191}
              height={1684}
              loading={i < 2 ? "eager" : "lazy"}
              decoding="async"
              className="block w-full h-auto bg-white rounded-md shadow-[0_10px_34px_rgba(0,45,91,.10)] border border-green/7"
            />
          );
        })}
      </section>
    </div>
  );
}
