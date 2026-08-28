import { describe, expect, it } from 'vitest'
import { CareerRecordError, mapRpcError } from '@/lib/career-record/errors'

describe('mapRpcError', () => {
  it('maps authentication to 401', () => {
    expect(() => mapRpcError({ message: 'authentication required', code: '42501' })).toThrow(
      CareerRecordError,
    )
    try {
      mapRpcError({ message: 'authentication required', code: '42501' })
    } catch (error) {
      expect(error).toBeInstanceOf(CareerRecordError)
      expect((error as CareerRecordError).status).toBe(401)
    }
  })

  it('maps existing snapshot overwrite to 409', () => {
    try {
      mapRpcError({ message: 'application x already has a cv snapshot', code: '23505' })
    } catch (error) {
      expect((error as CareerRecordError).status).toBe(409)
    }
  })

  it('maps disclosure fail-closed to 403', () => {
    try {
      mapRpcError({
        message: 'disclosure authorization is not active for this evidence',
        code: '42501',
      })
    } catch (error) {
      expect((error as CareerRecordError).status).toBe(403)
    }
  })

  it('maps stale revision to 409', () => {
    try {
      mapRpcError({ message: 'stale revision: expected 1, current 2', code: '40001' })
    } catch (error) {
      expect((error as CareerRecordError).status).toBe(409)
    }
  })
})
