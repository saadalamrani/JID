'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from '@/lib/i18n/navigation'
import type { LammahStaffQueueItem } from '@/lib/staff/lammah-queries'
import { claimLammahCandidate } from '../../actions'

export function LammahReviewQueue({queue}:{queue:LammahStaffQueueItem[]}) {
  const t=useTranslations('staff.lammah.review')
  const [search,setSearch]=useState('')
  const [state,setState]=useState('all')
  const [type,setType]=useState('all')
  const [outcome,setOutcome]=useState('all')
  const [flag,setFlag]=useState('all')
  const [run,setRun]=useState('all')
  const [pending,startTransition]=useTransition()
  const options=useMemo(()=>({
    states:Array.from(new Set(queue.map((item)=>item.candidate.state))),
    types:Array.from(new Set(queue.map((item)=>item.candidate.opportunity_type))),
    outcomes:Array.from(new Set(queue.map((item)=>item.candidate.match_outcome))),
    flags:Array.from(new Set(queue.flatMap((item)=>item.candidate.review_flags))),
    runs:Array.from(new Set(queue.map((item)=>item.candidate.run_id))),
  }),[queue])
  const filtered=useMemo(()=>queue.filter((item)=>{
    const candidate=item.candidate
    const needle=search.trim().toLowerCase()
    if(needle&&![candidate.normalized_title,candidate.normalized_organization,candidate.source_record_id].some((value)=>value?.toLowerCase().includes(needle))) return false
    if(state!=='all'&&candidate.state!==state) return false
    if(type!=='all'&&candidate.opportunity_type!==type) return false
    if(outcome!=='all'&&candidate.match_outcome!==outcome) return false
    if(flag!=='all'&&!candidate.review_flags.includes(flag)) return false
    if(run!=='all'&&candidate.run_id!==run) return false
    return true
  }),[flag,outcome,queue,run,search,state,type])

  const select=(label:string,value:string,setter:(value:string)=>void,values:string[])=><label className="space-y-1 text-xs text-muted-foreground"><span>{label}</span><select value={value} onChange={(event)=>setter(event.target.value)} className="block h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"><option value="all">{t('all')}</option>{values.map((option)=><option key={option} value={option}>{option}</option>)}</select></label>
  return <div className="space-y-4">
    <div className="rounded-lg border border-border bg-card p-4">
      <Input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchLabel')} />
      <div className="mt-3 flex flex-wrap gap-3">
        {select(t('filters.state'),state,setState,options.states)}
        {select(t('filters.type'),type,setType,options.types)}
        {select(t('filters.outcome'),outcome,setOutcome,options.outcomes)}
        {select(t('filters.flag'),flag,setFlag,options.flags)}
        {select(t('filters.run'),run,setRun,options.runs)}
      </div>
    </div>
    <p className="font-arabic text-sm text-muted-foreground">{t('count',{count:filtered.length})}</p>
    {filtered.length===0?<div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">{t('empty')}</div>:
      <ul className="space-y-3">{filtered.map((item)=><li key={item.id} className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-arabic font-semibold">{item.candidate.title_ar||item.candidate.title_en||'-'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.candidate.organization_raw_name} / {item.candidate.opportunity_type}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.candidate.source?.name} / {item.candidate.source_record_id}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.candidate.match_outcome} / {item.candidate.review_flags.join(', ')||t('noFlags')} / {item.assigned_to??t('unassigned')}</p>
          </div>
          <div className="flex gap-2">
            {!item.assigned_to?<Button size="sm" disabled={pending} onClick={()=>startTransition(async()=>{const result=await claimLammahCandidate(item.candidate_id);if(!result.ok)window.alert(result.error)})}>{t('claim')}</Button>:null}
            <Button asChild size="sm" variant="outline"><Link href={`/staff/lammah/review/${item.candidate_id}`}>{t('open')}</Link></Button>
          </div>
        </div>
      </li>)}</ul>}
  </div>
}
