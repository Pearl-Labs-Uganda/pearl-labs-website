"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type NavLink =
  | { href: string; label: string; dropdown?: undefined }
  | { label: string; href?: undefined; dropdown: { href: string; label: string }[] };

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const navLinks: NavLink[] = [
    { href: "#home", label: "Home" },
    { href: "#projects", label: "Projects" },
    { href: "#services", label: "Services" },
    { href: "#researchers", label: "Researchers" },
    { href: "#try-models", label: "Try Models" },
    { label: "Opportunities", dropdown: [{ href: "/bootcamps", label: "Bootcamps" }] },
    { href: "/portfolio", label: "Portfolio" },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setOpenMobileDropdown(null);
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-200 flex items-center justify-between px-[5.5vw] bg-cream/94 backdrop-blur-[18px] border-b border-orange/14 transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_28px_rgba(15,51,32,.08)]" : ""
      } ${mobileMenuOpen ? "h-auto" : "h-[68px]"}`}
    >
      <Link href="#home" className="flex items-center gap-2.5 no-underline py-4">
        <Image
          src="/icon.png"
          alt="Pearl AI Labs"
          width={32}
          height={32}
          className="object-contain"
        />
        <span className="font-heading text-[1.15rem] font-bold text-green tracking-tight">
          Pearl <span className="text-orange italic">AI</span> Labs
        </span>
      </Link>

      {/* Desktop Menu */}
      <ul className="hidden md:flex gap-9 list-none items-center">
        {navLinks.map((link) =>
          link.dropdown ? (
            <li key={link.label} className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === link.label ? null : link.label)
                }
                className="nav-link flex items-center gap-1 bg-transparent border-none cursor-pointer text-[.855rem] font-medium text-text-mid tracking-wide hover:text-orange transition-colors"
                aria-expanded={openDropdown === link.label}
              >
                {link.label}
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    openDropdown === link.label ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openDropdown === link.label && (
                <ul className="absolute top-full left-0 mt-2 min-w-[160px] list-none bg-white border border-green/10 rounded-lg shadow-[0_12px_32px_rgba(15,51,32,.12)] py-2 overflow-hidden">
                  {link.dropdown.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className="block no-underline px-4 py-2 text-[.855rem] font-medium text-text-mid hover:text-orange hover:bg-orange-pale transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ) : (
            <li key={link.href}>
              <Link
                href={link.href}
                className="nav-link no-underline text-[.855rem] font-medium text-text-mid tracking-wide hover:text-orange transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ),
        )}
        <li>
          <Link
            href="#contact"
            className="no-underline bg-green text-white text-[.855rem] font-medium px-5 py-2 rounded-md hover:bg-green-mid hover:-translate-y-px transition-all"
          >
            Contact
          </Link>
        </li>
      </ul>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
        aria-label="Toggle menu"
      >
        <span
          className={`block w-6 h-0.5 bg-green transition-all ${
            mobileMenuOpen ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-green transition-opacity ${
            mobileMenuOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-green transition-all ${
            mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </button>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <ul className="md:hidden absolute top-[68px] left-0 right-0 flex flex-col gap-3 list-none p-4 bg-cream border-b border-orange/14">
          {navLinks.map((link) =>
            link.dropdown ? (
              <li key={link.label}>
                <button
                  onClick={() =>
                    setOpenMobileDropdown(
                      openMobileDropdown === link.label ? null : link.label,
                    )
                  }
                  className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer nav-link no-underline text-[.9rem] font-medium text-text-mid hover:text-orange transition-colors py-2"
                  aria-expanded={openMobileDropdown === link.label}
                >
                  {link.label}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      openMobileDropdown === link.label ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openMobileDropdown === link.label && (
                  <ul className="flex flex-col gap-1 list-none pl-4 pb-1">
                    {link.dropdown.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="no-underline text-[.85rem] font-medium text-text-mid hover:text-orange transition-colors block py-1.5"
                          onClick={handleLinkClick}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ) : (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link no-underline text-[.9rem] font-medium text-text-mid hover:text-orange transition-colors block py-2"
                  onClick={handleLinkClick}
                >
                  {link.label}
                </Link>
              </li>
            ),
          )}
          <li className="border-t border-orange/14 pt-3 mt-2">
            <Link
              href="#contact"
              className="no-underline bg-green text-white text-[.9rem] font-medium px-5 py-2 rounded-md hover:bg-green-mid hover:-translate-y-px transition-all block text-center"
              onClick={handleLinkClick}
            >
              Contact
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
}
