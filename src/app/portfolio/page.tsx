import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import Portfolio from "@/components/Portfolio";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const GALLERY_DIR = "past internships";

function getGalleryImages(): string[] {
  const dir = path.join(process.cwd(), "public", GALLERY_DIR);
  let files: string[];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => `/${encodeURIComponent(GALLERY_DIR)}/${encodeURIComponent(f)}`);
}

export const metadata: Metadata = {
  title: "Portfolio — Pearl AI Labs",
  description:
    "Photos from Pearl AI Labs' internship programme with Lwera Electronics & Semi-conductors, at National ICT Hub, Nakawa and UniPod, Makerere.",
};

export default function PortfolioPage() {
  return <Portfolio galleryImages={getGalleryImages()} />;
}
