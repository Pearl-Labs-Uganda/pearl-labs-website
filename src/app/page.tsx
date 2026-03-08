import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Services from "@/components/Services";
import TryModels from "@/components/TryModels";
import Researchers from "@/components/Researchers";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Projects />
      <Services />
      <TryModels />
      <Researchers />
      <Contact />
      <Footer />
      <ChatBot />
    </>
  );
}
