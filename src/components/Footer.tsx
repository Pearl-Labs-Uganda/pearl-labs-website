import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-green text-white/50 px-[5.5vw] max-sm:px-5 py-9 flex items-center justify-between flex-wrap gap-4">
      <Link href="#home" className="flex items-center gap-2.5 no-underline">
        <Image
          src="/logo.jpg"
          alt="Pearl AI Labs"
          width={28}
          height={28}
          className="object-contain"
        />
        <span className="font-heading text-[1.15rem] font-bold text-white tracking-tight">
          Pearl <span className="text-orange italic">AI</span> Labs
        </span>
      </Link>
      <p className="text-[.8rem] font-light">
        © 2026 Pearl AI Labs · ICT Hub, Kampala, Uganda
      </p>
      <p className="text-[.8rem] font-light">
        AI as Infrastructure ·{" "}
        <a
          href="mailto:hello@pearlailabs.ug"
          className="text-gold-light no-underline"
        >
          hello@pearlailabs.ug
        </a>
      </p>
    </footer>
  );
}
