import { z } from 'zod'

const supabaseUrlSchema = z
  .string()
  .url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' })
  .refine((url) => url.includes('supabase.co'), {
    message: 'NEXT_PUBLIC_SUPABASE_URL must point to a Supabase project',
  })

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' }),
  NEXT_PUBLIC_SITE_URL: z.string().url({ message: 'NEXT_PUBLIC_SITE_URL must be a valid URL' }),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url({ message: 'NEXT_PUBLIC_APP_URL must be a valid URL' })
    .optional(),
})

const serverEnvSchema = publicEnvSchema.extend({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required on the server' })
    .optional(),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
}

export function parsePublicEnv(
  source: Record<string, string | undefined> = process.env,
): PublicEnv {
  const result = publicEnvSchema.safeParse(source)
  if (!result.success) {
    throw new Error(`Invalid public environment variables:\n${formatZodErrors(result.error)}`)
  }
  return result.data
}

export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source)
  if (!result.success) {
    throw new Error(`Invalid server environment variables:\n${formatZodErrors(result.error)}`)
  }
  return result.data
}

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })
}
