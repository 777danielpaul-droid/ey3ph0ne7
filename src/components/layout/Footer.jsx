import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export default function Footer() {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight -
        200

      setIsActive(window.scrollY >= scrollThreshold)
    }

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    handleScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  const links = [
    { label: "Impressum", href: "#impressum" },
    { label: "Datenschutz", href: "#datenschutz" },
  ]

  return (
    <motion.footer
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderBottomColor: "rgba(165, 242, 243, 1)" }}
      className={`fixed bottom-0 inset-x-0 z-50 overflow-hidden transition-all duration-500 ease-in-out ${
        isActive ? "footer-glow max-h-[120px]" : "max-h-[4px]"
      }`}
    >
      <div className="backdrop-blur-md bg-ink/40 border-t border-white/10 glass h-full">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-1 flex items-center justify-between h-full">
          <span className="font-display font-bold tracking-[0.18em] text-sm text-cyan">
            Eyephone 7
          </span>
          <div className="flex items-center gap-4 sm:gap-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="mono-label text-cyan hover:text-neon transition-colors text-sm font-medium"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
