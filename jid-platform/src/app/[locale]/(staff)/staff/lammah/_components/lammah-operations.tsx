'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { LammahStaffOverview } from '@/lib/staff/lammah-queries'
import { configureLammahPhase1, runLammahRetention, transitionLammahOpportunity } from '../actions'

function shown(value: unknown): string {
  if (value == null) return '-'
  if (typeof value==='string') return value
  return JSON.stringify(value)
}

export function LammahOperations({overview,isSuperAdmin}:{overview:LammahStaffOverview;isSuperAdmin:boolean}) {
  const t=useTranslations('staff.lammah')
  const flagValues=useMemo(()=>Object.fromEntries(overview.flags.map((flag)=>[flag.key,flag.is_enabled])),[overview.flags])
  const [ingestion,setIngestion]=useState(Boolean(flagValues['lammah.phase1_ingestion']))
  const [connector,setConnector]=useState(Boolean(flagValues['lammah.connector_enabled']))
  const [autoGlobal,setAutoGlobal]=useState(Boolean(flagValues['lammah.auto_publication_enabled']))
  const [sourceEnabled,setSourceEnabled]=useState(Boolean(overview.source?.is_active))
  const [sourceAuto,setSourceAuto]=useState(Boolean(overview.source?.auto_publication_enabled))
  const [reason,setReason]=useState('')
  const [pending,startTransition]=useTransition()

  const run=(action:()=>Promise<{ok:boolean;error?:string}>)=>startTransition(async()=>{
    const result=await action()
    if(!result.ok) window.alert(result.error??'lammah_action_failed')
  })

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('realCounts')}>
        {Object.entries(overview.counts).map(([key,value])=>(
          <div key={key} className="rounded-lg border border-border bg-card p-4">
            <p className="font-arabic text-sm text-muted-foreground">{t(`counts.${key}`)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      {overview.source ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-arabic text-lg font-semibold">{t('qualificationTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{overview.source.name} / {overview.source.health_state}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ['licence',overview.source.licence_basis],['terms',overview.source.terms_url],
              ['robots',overview.source.robots_review_result],['applyPattern',overview.source.apply_url_pattern],
              ['identity',overview.source.record_identity_strategy],['format',overview.source.technical_format],
              ['retention',overview.source.evidence_retention_terms],['rate',overview.source.rate_limit_policy],
            ].map(([key,value])=>(
              <div key={key as string}>
                <dt className="font-arabic font-medium text-foreground">{t(`qualification.${key}`)}</dt>
                <dd className="mt-1 break-words text-muted-foreground">{shown(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ):null}

      {isSuperAdmin ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-arabic text-lg font-semibold">{t('controlsTitle')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['ingestion',ingestion,setIngestion],['connector',connector,setConnector],
              ['autoGlobal',autoGlobal,setAutoGlobal],['sourceEnabled',sourceEnabled,setSourceEnabled],
              ['sourceAuto',sourceAuto,setSourceAuto],
            ].map(([key,value,setter])=>(
              <label key={key as string} className="flex items-center gap-2 font-arabic text-sm">
                <input type="checkbox" checked={value as boolean} onChange={(event)=>(setter as (value:boolean)=>void)(event.target.checked)} />
                {t(`controls.${key}`)}
              </label>
            ))}
          </div>
          <label className="mt-4 block font-arabic text-sm">
            {t('reason')}
            <textarea value={reason} onChange={(event)=>setReason(event.target.value)} className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={pending||!reason.trim()} onClick={()=>run(()=>configureLammahPhase1({
              ingestionEnabled:ingestion,connectorEnabled:connector,autoPublicationEnabled:autoGlobal,
              sourceEnabled,sourceAutoPublicationEnabled:sourceAuto,reason,
            }))}>{t('saveControls')}</Button>
            <Button variant="outline" disabled={pending||!reason.trim()} onClick={()=>run(()=>runLammahRetention(reason))}>{t('runRetention')}</Button>
          </div>
        </section>
      ):null}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-arabic text-lg font-semibold">{t('publishedTitle')}</h2>
        {overview.opportunities.length===0?<p className="mt-3 text-sm text-muted-foreground">{t('publishedEmpty')}</p>:(
          <ul className="mt-3 space-y-3">
            {overview.opportunities.map((item)=>(
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 first:border-0 first:pt-0">
                <div><p className="font-arabic font-medium">{item.title_ar||item.title_en||'-'}</p><p className="text-xs text-muted-foreground">{item.company_name_raw} / {item.status}</p></div>
                {item.status==='active'||item.status==='hidden'?<div className="flex gap-2">
                  {item.status==='active'?<Button size="sm" variant="outline" disabled={pending||!reason.trim()} onClick={()=>run(()=>transitionLammahOpportunity(item.id,'hide',reason))}>{t('actions.hide')}</Button>:<Button size="sm" variant="outline" disabled={pending||!reason.trim()} onClick={()=>run(()=>transitionLammahOpportunity(item.id,'unhide',reason))}>{t('actions.unhide')}</Button>}
                  <Button size="sm" variant="outline" disabled={pending||!reason.trim()} onClick={()=>run(()=>transitionLammahOpportunity(item.id,'expire',reason))}>{t('actions.expire')}</Button>
                </div>:null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
