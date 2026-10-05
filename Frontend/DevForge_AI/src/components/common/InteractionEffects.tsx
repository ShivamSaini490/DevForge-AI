import { useEffect, useRef } from 'react'

// Decorative only: keep the native cursor and never intercept a click.
export default function InteractionEffects() {
  const cursor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const halo = cursor.current
    if (!halo || !window.matchMedia) return
    const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let surface: HTMLElement | null = null
    let frame = 0
    let x = 0
    let y = 0
    const clearSurface = () => {
      surface?.removeAttribute('data-spotlight')
      surface?.style.removeProperty('--pointer-x')
      surface?.style.removeProperty('--pointer-y')
      surface = null
    }
    const hide = () => {
      cancelAnimationFrame(frame)
      frame = 0
      halo.removeAttribute('data-visible')
      halo.removeAttribute('data-pressed')
      clearSurface()
    }
    const move = (event: PointerEvent) => {
      if (!enabled.matches || event.pointerType !== 'mouse') { hide(); return }
      const target = event.target instanceof Element ? event.target : null
      x = event.clientX
      y = event.clientY
      // Text editing keeps its familiar, unobstructed text cursor.
      const editing = target?.closest('input, textarea, select, [contenteditable="true"]')
      halo.toggleAttribute('data-visible', !editing)
      halo.toggleAttribute('data-interactive', !!target?.closest('a, button:not(:disabled), [role="button"]'))
      const next = target?.closest<HTMLElement>('.stat-card, .project-card, .workflow-preview, .welcome-panel') ?? null
      if (surface !== next) { clearSurface(); surface = next }
      if (frame) return
      frame = requestAnimationFrame(() => {
        halo.style.transform = `translate3d(${x}px, ${y}px, 0)`
        if (surface) {
          const rect = surface.getBoundingClientRect()
          surface.style.setProperty('--pointer-x', `${x - rect.left}px`)
          surface.style.setProperty('--pointer-y', `${y - rect.top}px`)
          surface.setAttribute('data-spotlight', '')
        }
        frame = 0
      })
    }
    const press = (event: PointerEvent) => {
      if (enabled.matches && event.pointerType === 'mouse') halo.setAttribute('data-pressed', '')
    }
    const release = () => halo.removeAttribute('data-pressed')
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide() }
    const keyboard = () => hide()
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerdown', press, { passive: true })
    document.addEventListener('pointerup', release, { passive: true })
    document.addEventListener('pointercancel', hide)
    document.addEventListener('pointerout', leave)
    document.addEventListener('keydown', keyboard)
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('blur', hide)
    window.addEventListener('scroll', hide, true)
    enabled.addEventListener('change', hide)
    return () => {
      hide()
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerdown', press)
      document.removeEventListener('pointerup', release)
      document.removeEventListener('pointercancel', hide)
      document.removeEventListener('pointerout', leave)
      document.removeEventListener('keydown', keyboard)
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('blur', hide)
      window.removeEventListener('scroll', hide, true)
      enabled.removeEventListener('change', hide)
    }
  }, [])

  return <div ref={cursor} className="cursor-halo" aria-hidden="true"><span /></div>
}
