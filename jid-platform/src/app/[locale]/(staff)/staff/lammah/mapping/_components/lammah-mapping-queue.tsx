'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'
import type { LammahStaffMappingItem } from '@/lib/staff/lammah-queries'
import { reviewLammahCandidate } from '../../actions'

export function LammahMappingQueue({queue}:{queue:LammahStaffMappingItem[]}) {
  const t = useTranslations('staff.lammah.mapping')
  const [companyIds,setCompanyIds] = useState<Record<string,string>>({})
  const [notes,setNotes] = useState<Record<string,string>>({})
  const [pending,startTransition] = useTransition()

  if (queue.length === 0) {
    return <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">{t('empty')}</div>
  }

  return (
    <ul className="space-y-3">
      {queue.map((item) => {
        const companyId = companyIds[item.id] ?? item.suggested_company_id ?? ''
        const reason = notes[item.id] ?? ''
        return (
          <li key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-arabic font-semibold">{item.raw_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.locality ?? t('unknownLocality')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.candidate?.title_ar ?? item.candidate?.title_en ?? '-'}</p>
                <pre className="mt-2 max-w-2xl overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(item.suggestion_basis,null,2)}</pre>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/staff/lammah/review/${item.candidate_id}`}>{t('openCandidate')}</Link>
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="font-arabic text-sm">
                {t('companyId')}
                <input value={companyId} onChange={(event)=>setCompanyIds((current)=>({...current,[item.id]:event.target.value}))} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" />
              </label>
              <label className="font-arabic text-sm">
                {t('notes')}
                <input value={reason} onChange={(event)=>setNotes((current)=>({...current,[item.id]:event.target.value}))} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" />
              </label>
            </div>
            <Button
              className="mt-3"
              size="sm"
              disabled={pending || !companyId.trim() || !reason.trim()}
              onClick={()=>startTransition(async()=>{
                const result=await reviewLammahCandidate({candidateId:item.candidate_id,action:'map_organization',notes:reason,resolvedCompanyId:companyId})
                if(!result.ok) window.alert(result.error)
              })}
            >{t('map')}</Button>
          </li>
        )
      })}
    </ul>
  )
}
