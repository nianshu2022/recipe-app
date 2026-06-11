type EventMap = {
  'recipe:deleted': { id: string }
  'recipe:updated': { id: string }
}

type EventHandler<T> = (data: T) => void

const listeners = new Map<string, Set<EventHandler<unknown>>>()

export function on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set())
  }
  listeners.get(event)!.add(handler as EventHandler<unknown>)

  return () => {
    listeners.get(event)?.delete(handler as EventHandler<unknown>)
  }
}

export function emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
  listeners.get(event)?.forEach((handler) => {
    try {
      handler(data)
    } catch (e) {
      console.error(`Event handler error for ${event}:`, e)
    }
  })
}
