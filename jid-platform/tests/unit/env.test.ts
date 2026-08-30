import { describe, expect, it } from 'vitest'
import { parsePublicEnv } from '@/lib/env'

describe('parsePublicEnv', () => {
  it('removes surrounding whitespace from deployment-provided public values', () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: ' https://example.supabase.co\r\n',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ' anon-key\r\n',
        NEXT_PUBLIC_SITE_URL: ' https://jid.example.com\r\n',
        NEXT_PUBLIC_APP_URL: ' https://app.jid.example.com\r\n',
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      NEXT_PUBLIC_SITE_URL: 'https://jid.example.com',
      NEXT_PUBLIC_APP_URL: 'https://app.jid.example.com',
    })
  })
})