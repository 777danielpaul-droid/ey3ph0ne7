import { motion, useScroll, useTransform } from "framer-motion"

export default function HeroSection() {
  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 600], [0, 120])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])

  return (
    <section
      id="hero"
      className="hero-holo relative min-h-screen h-screen flex items-center justify-center text-center overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 w-[20rem] h-[20rem] sm:w-[32rem] sm:h-[32rem] rounded-full bg-neon/25 blur-[60px] sm:blur-[120px]"
        style={{ y: bgY, opacity }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-5">
        <motion.h1
          className="font-display font-bold leading-[1.05] tracking-tight text-4xl sm:text-6xl lg:text-7xl break-words neon-text text-cyan pulse-glow"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Eyephone 7
        </motion.h1>

        <motion.p
          className="mt-6 text-xl sm:text-2xl text-cyan font-display max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Neon-Interaktive Produkt-Demonstration
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <a
            href="#swarm"
            className="mono-label text-sm text-bone hover:text-cyan border border-cyan/50 hover:border-neon transition-all px-6 py-2.5 rounded-sm"
          >
            Zur Interaktion
          </a>
        </motion.div>

        <motion.p
          className="mt-12 mono-label text-xs text-cyan/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          Klick in den Swarm unten → Stomp-Welle + Sound
        </motion.p>
      </div>
    </section>
  )
}
