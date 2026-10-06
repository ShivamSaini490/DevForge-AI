import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  toggleTheme: () => {
    const theme = get().theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('devforge-theme', theme) } catch { /* Keep toggling available when storage is blocked. */ }
    set({ theme })
  },
}))
