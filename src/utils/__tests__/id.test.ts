import { describe, it, expect } from 'vitest'
import { generateId } from '../id'

describe('generateId', () => {
  it('should return a string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
  })

  it('should return a valid UUID format', () => {
    const id = generateId()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    expect(id).toMatch(uuidRegex)
  })

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})
