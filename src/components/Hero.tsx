import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="home"
      className="hero-dot-grid min-h-screen flex flex-col justify-center px-[5.5vw] max-sm:px-5 pt-[110px] pb-[72px] relative overflow-hidden bg-cream"
    >
      {/* Orbs */}
      <div
        className="orb w-[500px] h-[500px] bg-orange/13 -top-[130px] -right-[100px] absolute"
        style={{ animationDuration: "13s" }}
      />
      <div
        className="orb w-[380px] h-[380px] bg-green/12 -bottom-[80px] right-[25%] absolute"
        style={{ animationDuration: "16s" }}
      />
      <div
        className="orb w-[240px] h-[240px] bg-gold/18 bottom-[60px] left-[5%] absolute"
        style={{ animationDuration: "9s" }}
      />

      <div className="relative z-1 max-w-[860px]">
        <div className="animate-fade-up inline-flex items-center gap-2 bg-green/8 border border-green/15 text-green px-3.5 py-1.5 rounded-full text-[.72rem] font-semibold tracking-widest uppercase mb-8">
          <span className="badge-dot w-1.5 h-1.5 rounded-full bg-orange" />
          ICT Hub, Kampala · Est. 2026
        </div>

        <h1 className="animate-fade-up-1 font-heading font-bold text-[clamp(2.4rem,5.8vw,5.6rem)] leading-[1.06] tracking-tight text-green mb-6">
          AI as
          <br />
          <em className="italic text-orange font-light">Infrastructure</em>
          <br />
          for the Intelligent
          <br />
          Economy
        </h1>

        <p className="animate-fade-up-2 font-body text-[clamp(1rem,1.45vw,1.2rem)] font-light text-text-mid max-w-[600px] leading-relaxed mb-10">
          Pearl AI Labs conducts foundational research and builds the AI systems
          that underpin a new economic order — treating intelligence not as a
          tool, but as the essential infrastructure of tomorrow.
        </p>

        <div className="animate-fade-up-3 flex gap-3.5 flex-wrap">
          <Link
            href="#projects"
            className="bg-orange text-white px-7 py-3 rounded-[7px] no-underline font-semibold text-[.9rem] tracking-wide shadow-[0_4px_22px_rgba(212,112,10,.32)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(212,112,10,.42)] hover:bg-orange-mid transition-all"
          >
            Explore Research
          </Link>
          <Link
            href="#try-models"
            className="bg-transparent text-green px-7 py-3 rounded-[7px] no-underline font-semibold text-[.9rem] border-[1.5px] border-green/35 hover:bg-green hover:text-white hover:-translate-y-0.5 hover:border-green transition-all"
          >
            Try Our Models
          </Link>
        </div>
      </div>

      <div className="animate-fade-up-4 relative z-1 flex gap-8 max-sm:gap-6 flex-wrap mt-[4.5rem] pt-10 border-t border-gold/30">
        {[
          { num: "2", label: "Research Tracks" },
          { num: "2026", label: "Founded" },
          { num: "ICT Hub", label: "Based at" },
          { num: "UG", label: "Kampala, Uganda" },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="font-heading text-[2rem] font-semibold italic text-orange leading-none">
              {stat.num}
            </div>
            <div className="text-[.74rem] text-text-mid font-medium mt-1 tracking-wider uppercase">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
