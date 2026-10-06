import { vi } from 'vitest'

export class MockEventSource {
  static instances: MockEventSource[] = []
  readyState = 0
  onopen: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((event: { data: string; lastEventId: string }) => void) | null = null
  url: string
  options?: EventSourceInit
  constructor(url: string, options?: EventSourceInit) { this.url = url; this.options = options; MockEventSource.instances.push(this) }
  close = vi.fn(() => { this.readyState = 2 })
  open() { this.readyState = 1; this.onopen?.() }
  message(value: unknown) { this.onmessage?.({ data: JSON.stringify(value), lastEventId: '' }) }
  error(state = 0) { this.readyState = state; this.onerror?.() }
}
