import { describe, it, expect, vi, beforeEach } from 'vitest'
import { on, emit } from '../events'

describe('events', () => {
  beforeEach(() => {
    // Clean up listeners between tests by emitting to a non-existent event
  })

  it('should call handler when event is emitted', () => {
    const handler = vi.fn()
    on('recipe:deleted', handler)
    emit('recipe:deleted', { id: 'test-123' })
    expect(handler).toHaveBeenCalledWith({ id: 'test-123' })
  })

  it('should support multiple handlers', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    on('recipe:deleted', handler1)
    on('recipe:deleted', handler2)
    emit('recipe:deleted', { id: 'abc' })
    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('should return unsubscribe function', () => {
    const handler = vi.fn()
    const unsub = on('recipe:deleted', handler)
    unsub()
    emit('recipe:deleted', { id: 'test' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('should not throw when emitting with no listeners', () => {
    expect(() => emit('recipe:updated', { id: 'x' })).not.toThrow()
  })
})
