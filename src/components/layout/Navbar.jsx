import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toggleTheme, getInitialTheme } from "../../lib/theme"

const NEON = ["#c026d3", "#7c3aed", "#c9a227"]

export default function Navbar({ onSwarmToggle }) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState(() => getInitialTheme())
  const [hover, setHover] = useState({})

  const randomNeon = (key) =>
    setHover((h) => ({ ...h, [key]: NEON[(Math.random() * NEON.length) | 0] }))
  const resetNeon = (key) => setHover((h) => ({ ...h, [key]: "#22d3ee" }))
  const onToggle = () => setTheme(toggleTheme())

  const links = [
    { label: "Start", href: "#hero" },
    { label: "Swarm", href: "#swarm" },
    { label: "Test", label: "Test" },
  ]

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50 header-glow"
    >
      <nav className="backdrop-blur-md bg-ink/40 border-b border-white/10 glass">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-1 md:h-12 md:py-0 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
          <a href="#hero" className="flex items-center gap-3 group">
            <span className="relative grid place-items-center w-7 h-7 rounded-md bg-neon/15 border border-neon/40">
              <span className="text-sm leading-none">👁</span>
            </span>
            <span className="font-display font-bold tracking-[0.18em] text-sm">
              Eyephone 7
            </span>
          </a>

          <ul className="hidden md:flex items-center gap-8">
            {links.map((n) => (
              <li key={n.href || n.label}>
                {n.onClick ? (
                  <button
                    onClick={n.onClick}
                    onMouseEnter={() => randomNeon(n.label)}
                    onMouseLeave={() => resetNeon(n.label)}
                    style={{ color: hover[n.label] || "#22d3ee" }}
                    className="mono-label text-cyan hover:text-cyan transition-colors"
                  >
                    {n.label}
                  </button>
                ) : (
                  <a
                    href={n.href}
                    onMouseEnter={() => randomNeon(n.href)}
                    onMouseLeave={() => resetNeon(n.href)}
                    style={{ color: hover[n.href] || "#22d3ee" }}
                    className="mono-label text-cyan hover:text-cyan transition-colors"
                  >
                    {n.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              aria-label="Theme umschalten"
              onClick={onToggle}
              className="grid place-items-center w-9 h-9 rounded-md border border-white/10 hover:border-neon/50 text-bone transition-colors"
            >
              <span className="text-base leading-none">
                {theme === "dark" ? "☀" : "☾"}
              </span>
            </button>
            <button
              type="button"
              aria-label="Navigation öffnen"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden grid place-items-center w-9 h-9 rounded-md border border-white/20 text-bone hover:border-neon/50"
            >
              <span className="text-xl leading-none">{open ? "✕" : "≡"}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-white/5 bg-ink/95"
            >
              <ul className="px-5 py-4 flex flex-col gap-3">
                {links.map((n) => (
                  <li key={n.href || n.label}>
                    {n.onClick ? (
                      <button
                        onClick={() => {
                          n.onClick()
                          setOpen(false)
                        }}
                        className="mono-label text-cyan"
                      >
                        {n.label}
                      </button>
                    ) : (
                      <a
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className="mono-label text-cyan"
                      >
                        {n.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}
