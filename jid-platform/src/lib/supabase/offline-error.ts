export function isDbOfflineError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('fetch failed') ||
      error.message.includes('Cannot reach Supabase') ||
      error.message.includes('ECONNREFUSED'))
  )
}

export function dbOfflineHint(locale: string): string {
  return locale === 'ar'
    ? 'قاعدة البيانات غير متصلة. شغّل Docker Desktop ثم نفّذ `pnpm supabase:start` من مجلد jid-platform.'
    : 'Database offline. Start Docker Desktop, then run `pnpm supabase:start` in jid-platform.'
}

export function throwQueryError(error: { message: string }): never {
  if (error.message.includes('fetch failed')) {
    throw new Error(
      'Cannot reach Supabase. Start Docker Desktop, then run `pnpm supabase:start` in jid-platform — or point .env.local at a cloud Supabase project.',
    )
  }
  throw new Error(error.message)
}
