import { motion, useScroll, useTransform } from "framer-motion"
import { useState, useEffect, useRef } from "react"

export default function HeroSection() {
  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 600], [0, 120])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])
  const [showText, setShowText] = useState(false)
  const videoRef = useRef(null)

  // Fallback: falls Video nicht autoplay kann, zeige Text nach 5s.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!videoRef.current?.ended) setShowText(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const replay = () => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play()
    setShowText(false)
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen h-screen flex items-center justify-center text-center overflow-hidden"
    >
      {/* ── Hintergrund-Blob (unter Video) ── */}
      <motion.div
        className="absolute inset-0 w-[20rem] h-[20rem] sm:w-[32rem] sm:h-[32rem] rounded-full bg-neon/25 blur-[60px] sm:blur-[120px] z-0"
        style={{ y: bgY, opacity }}
        aria-hidden="true"
      />

      {/* ── Video-Intro ── bleibt am letzten Frame, wenn nicht nachgespielt ── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-10"
        onPlay={(e) => { e.target.playbackRate = 0.9; }}
        onEnded={() => {
          // Letzter Frame bleibt sichtbar — Video bleibt im DOM, Text erscheint darüber.
          setShowText(true)
        }}
        onClick={replay}
      >
        <source src="/hailuo-hero-intro.mp4" type="video/mp4" />
      </video>

      {/* ── Text sichtbar nach Videoende ── */}
      {showText && (
        <motion.div
          className="relative z-20 max-w-4xl mx-auto px-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="font-display font-bold leading-[1.05] tracking-tight text-4xl sm:text-6xl lg:text-7xl break-words neon-text text-cyan pulse-glow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Eyephone 7
          </motion.h1>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <a
              href="#swarm"
              className="mono-label text-sm text-bone hover:text-cyan border border-cyan/50 hover:border-neon transition-all px-6 py-2.5 rounded-sm"
            >
              Zur Interaktion
            </a>
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}
