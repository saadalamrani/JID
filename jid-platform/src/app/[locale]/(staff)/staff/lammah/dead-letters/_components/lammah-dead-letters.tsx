'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { LammahStaffDeadLetter } from '@/lib/staff/lammah-queries'
import { closeLammahDeadLetter, redriveLammahDeadLetter } from '../../actions'

export function LammahDeadLetters({letters,isSuperAdmin}:{letters:LammahStaffDeadLetter[];isSuperAdmin:boolean}) {
  const t=useTranslations('staff.lammah.deadLetters')
  const [reasons,setReasons]=useState<Record<string,string>>({})
  const [pending,startTransition]=useTransition()

  if(letters.length===0) return <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">{t('empty')}</div>

  return <ul className="space-y-3">{letters.map((letter)=>{
    const reason=reasons[letter.id]??''
    const act=(kind:'redrive'|'close')=>startTransition(async()=>{
      const result=kind==='redrive'
        ? await redriveLammahDeadLetter(letter.id,reason)
        : await closeLammahDeadLetter(letter.id,reason)
      if(!result.ok) window.alert(result.error)
    })
    return <li key={letter.id} className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-medium">{letter.error_class}</h2><p className="mt-1 text-sm text-muted-foreground">{letter.source_record_id??'-'} / {letter.retry_state} / {t('attempts',{count:letter.attempts})}</p><p className="mt-1 text-xs text-muted-foreground">{letter.attributed_worker_identity} / {letter.created_at}</p></div>
      </div>
      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(letter.sanitized_details,null,2)}</pre>
      {isSuperAdmin && letter.retry_state!=='closed' ? <div className="mt-4 flex flex-wrap items-end gap-2"><label className="min-w-64 flex-1 font-arabic text-sm">{t('reason')}<input value={reason} onChange={(event)=>setReasons((current)=>({...current,[letter.id]:event.target.value}))} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" /></label><Button size="sm" variant="outline" disabled={pending||!reason.trim()} onClick={()=>act('redrive')}>{t('redrive')}</Button><Button size="sm" variant="outline" disabled={pending||!reason.trim()} onClick={()=>act('close')}>{t('close')}</Button></div>:null}
    </li>
  })}</ul>
}
