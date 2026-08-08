import Navbar from "./components/layout/Navbar"
import Footer from "./components/layout/Footer"
import HeroSection from "./components/HeroSection"
import NeonEyeSwarm from "./components/NeonEyeSwarm"

export default function App() {
  return (
    <>
      <Navbar />
      <main className="relative z-10">
        <HeroSection />
        <div id="game-wrapper" className="relative">
          <NeonEyeSwarm />
        </div>
      </main>
      <Footer />
    </>
  )
}
