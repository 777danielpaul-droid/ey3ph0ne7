import Navbar from "./components/layout/Navbar"
import Footer from "./components/layout/Footer"
import HeroSection from "./components/HeroSection"
import NeonEyeSwarm from "./components/NeonEyeSwarm"

export default function App() {
  return (
    <>
      <Navbar />
      <main className="relative z-10">
        <NeonEyeSwarm />
        <HeroSection />
      </main>
      <Footer />
      <div className="crt-vignette" aria-hidden="true" />
    </>
  )
}
