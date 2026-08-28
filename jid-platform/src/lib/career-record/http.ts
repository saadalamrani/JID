import { NextResponse } from 'next/server'
import { CareerRecordError, publicCareerRecordMessage } from '@/lib/career-record/errors'

export function jsonCareerRecordError(error: unknown): NextResponse {
  const mapped = publicCareerRecordMessage(error)
  return NextResponse.json({ error: mapped.message }, { status: mapped.status })
}

export function requireUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new CareerRecordError(`${field} غير صالح`, 422)
  }
  return value
}
