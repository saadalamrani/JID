import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { NetworkSnapshot } from '@/types/contracts/professional-network'

type UntypedRpcClient = {
  rpc: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>
}

async function call<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const client = (await createClient()) as unknown as UntypedRpcClient
  const { data, error } = args
    ? await client.rpc(name, args)
    : await client.rpc(name)
  if (error) throw new Error(error.message)
  return data as T
}

export const getNetwork = () => call<NetworkSnapshot>('get_professional_network')
export const mutateNetwork = (name: string, args: Record<string, unknown>) =>
  call<string>(name, args)
