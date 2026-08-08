# eyephone7 — Produktions-Prototyp

## Ziel
Neon-Style-Produkt-Präsentation: dark-theme, React + Vite + Tailwind v4, inspiriert von `businesscard`. Kern-Interaktion = `NeonEyeSwarm` Canvas-Effekt.

---

## 1. Project Scaffold (einmalig)
| Schritt | Action | Quelle |
|---|---|---|
| `package.json` | Vite + React 18 + Tailwind v4 + Framer Motion kopieren | `businesscard/package.json` |
| `vite.config.js` | Tailwind Vite Plugin, host, chunk split | `businesscard/vite.config.js` |
| `index.html` | Font-Preconnects (Space Grotesk/Mono, Noto Sans Runic), `#root` | `businesscard/index.html` |
| `src/main.jsx` | Theme-vor-Paint, root mount | `businesscard/src/main.jsx` |

## 2. Design-System (Tailwind)
| Token | Wert | Zweck |
|---|---|---|
| `--color-ink: #07060d` | Background | tiefer schwarz-lila |
| `--color-neon: #c026d3` | Akzent | Neon-Rosa |
| `--color-cyan: #22d3ee` | Akzent | Tiffany-Blau |
| `--color-bone: #f4f1bb` | Text | hell |
| `--font-display` / `--font-mono` | Space Grotesk / Mono | Typography |
| `.glass`, `.hud-grid`, `.pulse-glow`, `.header-glow`, `.footer-glow`, `.crt-vignette` | kopiert aus `index.css` | konsistente Neon-Überfläche |

→ **keine neuen Farben erfinden** — exakt die businesscard-Palette übernehmen.

## 3. Header (Navbar) — nach businesscard
- `fixed top-0 z-50` + `motion.header` (slide-down)
- `backdrop-blur-md bg-ink/40 glass`
- Nav-Links mit Hover-Neon-Farbwechsel (zufällig `#c026d3` / `#7c3aed` / `#c9a227`, reset → `#22d3ee`)
- Theme-Toggle (☀/☾), Mobile-Menu (framer-motion collapse)
- **Role:** navigiert → Hero / Swarm / Projekte / Kontakt

## 4. Footer — nach businesscard
- `fixed bottom-0 z-50 overflow-hidden transition-all`
- Scroll-getriggert: `max-h-[4px]` (dünne Bar) → `max-h-[120px]` + `.footer-glow` + Blur
- `glass` + `border-t`
- Links: Impressum / Datenschutz / AGB

## 5. NeonEyeSwarm — portiert aus `.tsx`
- TypeScript → JSX (keine TS-Abhängigkeit nötig, hält es leicht)
- Canvas-Container mit:
  - 80 leuchtende Augen (radialer Glow, Blink-Animation, Pupill-Tracking zum Mouse)
  - Klick → Stomp-Ring (Mehrschwingungs-Kreise), WebAudio-Bass-Thump, Augen-Explosion + magnetischer Rückzug
  - HUD-Overlays: `Neon Eye Swarm // Click to STOMP`, `EYES: 80`
  - 15s RECORD-Button (VP9 WebM via `captureStream`)
  - Eck-Corner-Decoration-Divs (border-L/T/R/B)
- CSS: dunkler radialer BG-Gradient, grid-overlay, vignette — aus der `.tsx` styles extrahiert

## 6. Hauptseite (App.jsx)
```
<SpaceBg/>           // optionales statisches Hintergrund-Layer
<Navbar/>
<main>
  <HeroSection/>    // Produkt-Titel + CTA → #swarm
  <NeonEyeSwarm/>   // id=swarm, sticky-vollbild canvas
</main>
<Footer/>
```

## 7. Verifizierung
- `npm install`
- `npm run dev` (host=true) → curl + getComputedStyle prüfen (keine Screenshots)
- `npm run build` → finaler Gate, Source-Map-check

---

## Vorgehen
1. **Jetzt:** Scaffold + Core (package, vite, html, css, lib) — fertig
2. **Navbar + Footer** — nach businesscard exakt
3. **NeonEyeSwarm.jsx** — portiert + getestet
4. **HeroSection + App** — Verdichtung, CTA scrollt zu Swarm
5. **Build + Verifikation**

> Keine Over-Engineering. Keine neuen Farben. Keine unnötigen Abstraktionen. businesscard ist die Quelle der Wahrheit.
