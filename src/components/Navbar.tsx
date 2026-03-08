"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-200 h-[68px] flex items-center justify-between px-[5.5vw] bg-cream/94 backdrop-blur-[18px] border-b border-orange/14 transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_28px_rgba(15,51,32,.08)]" : ""
      }`}
    >
      <Link href="#home" className="flex items-center gap-2.5 no-underline">
        <Image
          src="/logo.jpg"
          alt="Pearl AI Labs"
          width={32}
          height={32}
          className="object-contain"
        />
        <span className="font-heading text-[1.15rem] font-bold text-green tracking-tight">
          Pearl <span className="text-orange italic">AI</span> Labs
        </span>
      </Link>

      <ul className="flex gap-9 list-none items-center max-md:gap-4">
        <li className="max-md:hidden">
          <Link
            href="#home"
            className="nav-link no-underline text-[.855rem] font-medium text-text-mid tracking-wide hover:text-orange transition-colors"
          >
            Home
          </Link>
        </li>
        <li className="max-md:hidden">
          <Link
            href="#projects"
            className="nav-link no-underline text-[.855rem] font-medium text-text-mid tracking-wide hover:text-orange transition-colors"
          >
            Projects
          </Link>
        </li>
        <li className="max-md:hidden">
          <Link
            href="#researchers"
            className="nav-link no-underline text-[.855rem] font-medium text-text-mid tracking-wide hover:text-orange transition-colors"
          >
            Researchers
          </Link>
        </li>
        <li className="max-md:hidden">
          <Link
            href="#try-models"
            className="nav-link no-underline text-[.855rem] font-medium text-text-mid tracking-wide hover:text-orange transition-colors"
          >
            Try Models
          </Link>
        </li>
        <li>
          <Link
            href="#contact"
            className="no-underline bg-green text-white text-[.855rem] font-medium px-5 py-2 rounded-md hover:bg-green-mid hover:-translate-y-px transition-all"
          >
            Contact
          </Link>
        </li>
      </ul>
    </nav>
  );
}
