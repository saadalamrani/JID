'use client'

import { createClient } from '@/lib/supabase/client'
import type { JidPlusPlan } from './types'

export async function fetchJidPlusPlan(): Promise<JidPlusPlan | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('plans')
    .select('id, key, name_ar, name_en, price_monthly_sar, price_yearly_sar')
    .eq('key', 'jid_plus')
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.key !== 'jid_plus') return null

  return {
    id: data.id,
    key: 'jid_plus',
    nameAr: data.name_ar,
    nameEn: data.name_en,
    priceMonthlySar: Number(data.price_monthly_sar),
    priceYearlySar: Number(data.price_yearly_sar),
  }
}
