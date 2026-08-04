'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { LammahReviewDetail } from '@/lib/staff/lammah-queries'
import {
  claimLammahCandidate,publishLammahCandidate,releaseLammahCandidate,
  reviewLammahCandidate,reviewLammahFact,setLammahEvidenceLegalHold,
} from '../../../actions'

function shown(value:unknown):string {
  if(value==null)return '-'
  if(typeof value==='string')return value
  return JSON.stringify(value,null,2)
}

export function LammahReviewDetailClient({detail,isSuperAdmin}:{detail:LammahReviewDetail;isSuperAdmin:boolean}) {
  const t=useTranslations('staff.lammah.detail')
  const candidateId=detail.candidate.id
  const [notes,setNotes]=useState('')
  const [companyId,setCompanyId]=useState('')
  const [correctedType,setCorrectedType]=useState(String(detail.candidate.opportunity_type??'job'))
  const [pending,startTransition]=useTransition()
  const run=(action:()=>Promise<{ok:boolean;error?:string}>)=>startTransition(async()=>{const result=await action();if(!result.ok)window.alert(result.error??'lammah_action_failed')})
  const decide=(action:string)=>run(()=>reviewLammahCandidate({candidateId,action,notes,correctedType,resolvedCompanyId:companyId||null}))
  const panels=[
    ['evidence',detail.evidence],['nativeMatches',detail.nativeMatches],['duplicates',detail.duplicates],
    ['lifecycle',detail.lifecycle],['audit',detail.audit],
  ] as const

  return <div className="space-y-6">
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="font-arabic text-lg font-semibold">{shown(detail.candidate.title_ar||detail.candidate.title_en)}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{shown(detail.candidate.organization_raw_name)} / {shown(detail.candidate.state)} / {shown(detail.candidate.match_outcome)}</p>
      <p className="mt-2 text-xs text-muted-foreground">{shown(detail.candidate.review_flags)}</p>
      <label className="mt-4 block font-arabic text-sm">{t('notes')}<textarea value={notes} onChange={(event)=>setNotes(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2" /></label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={()=>run(()=>claimLammahCandidate(candidateId))}>{t('actions.claim')}</Button>
        <Button size="sm" variant="outline" disabled={pending||!notes.trim()} onClick={()=>run(()=>releaseLammahCandidate(candidateId,notes))}>{t('actions.release')}</Button>
        <Button size="sm" disabled={pending||!notes.trim()} onClick={()=>decide('approve')}>{t('actions.approve')}</Button>
        <Button size="sm" variant="outline" disabled={pending||!notes.trim()} onClick={()=>run(()=>publishLammahCandidate(candidateId,notes))}>{t('actions.publish')}</Button>
        <Button size="sm" variant="outline" disabled={pending||!notes.trim()} onClick={()=>decide('return')}>{t('actions.return')}</Button>
        <Button size="sm" variant="outline" disabled={pending||!notes.trim()} onClick={()=>decide('quarantine')}>{t('actions.quarantine')}</Button>
        {isSuperAdmin?<Button size="sm" variant="outline" disabled={pending||!notes.trim()} onClick={()=>decide('release_quarantine')}>{t('actions.releaseQuarantine')}</Button>:null}
        <Button size="sm" variant="destructive" disabled={pending||!notes.trim()} onClick={()=>decide('reject')}>{t('actions.reject')}</Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="font-arabic text-sm">{t('correctType')}<select value={correctedType} onChange={(event)=>setCorrectedType(event.target.value)} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3"><option value="job">job</option><option value="co_op">co_op</option><option value="internship">internship</option><option value="fellowship">fellowship</option><option value="scholarship">scholarship</option></select></label>
        <label className="font-arabic text-sm">{t('companyId')}<input value={companyId} onChange={(event)=>setCompanyId(event.target.value)} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" /></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={pending||!notes.trim()} onClick={()=>decide('correct_type')}>{t('actions.correctType')}</Button>
        <Button size="sm" variant="outline" disabled={pending||!notes.trim()||!companyId.trim()} onClick={()=>decide('map_organization')}>{t('actions.mapOrganization')}</Button>
        <Button size="sm" variant="outline" disabled={pending||!notes.trim()} onClick={()=>decide('resolve_duplicate_independent')}>{t('actions.resolveDuplicate')}</Button>
      </div>
    </section>

    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="font-arabic text-lg font-semibold">{t('facts')}</h2>
      <ul className="mt-3 space-y-3">{detail.facts.map((fact)=><li key={fact.id} className="border-t border-border pt-3 first:border-0 first:pt-0"><p className="font-medium">{fact.fact_key}</p><pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{shown(fact.normalized_value)}</pre><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={()=>run(()=>reviewLammahFact({factId:fact.id,action:'accept'}))}>{t('actions.acceptFact')}</Button><Button size="sm" variant="outline" disabled={pending} onClick={()=>run(()=>reviewLammahFact({factId:fact.id,action:'reject'}))}>{t('actions.rejectFact')}</Button></div></li>)}</ul>
    </section>

    {panels.map(([key,value])=><section key={key} className="rounded-lg border border-border bg-card p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-arabic text-lg font-semibold">{t(`panels.${key}`)}</h2>{key==='evidence'&&isSuperAdmin?<Button size="sm" variant="outline" disabled={pending||!notes.trim()} onClick={()=>run(()=>setLammahEvidenceLegalHold(String(detail.evidence.id),!Boolean(detail.evidence.legal_hold),notes))}>{Boolean(detail.evidence.legal_hold)?t('actions.releaseLegalHold'):t('actions.legalHold')}</Button>:null}</div><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{shown(value)}</pre></section>)}
  </div>
}
