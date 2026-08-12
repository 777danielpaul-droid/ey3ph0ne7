import { useState } from "react";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HeroSection from "./components/HeroSection";
import NeonEyeSwarm from "./components/NeonEyeSwarm";

export default function App() {
  const [swarmOpen, setSwarmOpen] = useState(false);

  return (
    <>
      <Navbar onSwarmToggle={() => setSwarmOpen(true)} />
      <main className="relative z-10">
        <HeroSection />
        <NeonEyeSwarm open={swarmOpen} onClose={() => setSwarmOpen(false)} />
      </main>
      <Footer />
    </>
  );
}
