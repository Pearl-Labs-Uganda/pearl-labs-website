import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import TryModels from "@/components/TryModels";
import Researchers from "@/components/Researchers";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Projects />
      <TryModels />
      <Researchers />
      <Contact />
      <Footer />
    </>
  );
}
