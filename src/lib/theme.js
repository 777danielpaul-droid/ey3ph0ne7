// Theme: "dark" (default) | "light". Persistiert in localStorage,
// gesetzt als data-theme auf <html>.
const KEY = "eyephone7-theme"

export function getInitialTheme() {
  if (typeof window === "undefined") return "dark"
  const saved = localStorage.getItem(KEY)
  if (saved === "dark" || saved === "light") return saved
  return "dark"
}

export function applyTheme(theme) {
  const el = document.documentElement
  el.setAttribute("data-theme", theme)
  el.classList.toggle("dark", theme === "dark")
  localStorage.setItem(KEY, theme)
}

export function toggleTheme() {
  const next = getInitialTheme() === "dark" ? "dark" : "light"
  applyTheme(next)
  return next
}
