import { getTranslations } from 'next-intl/server'
import { fetchStaffLammahRuns } from '@/lib/staff/lammah-queries'
import { LammahNav } from '../_components/lammah-nav'

export default async function StaffLammahRunsPage() {
  const [t,runs]=await Promise.all([
    getTranslations('staff.lammah.runs'),
    fetchStaffLammahRuns(),
  ])

  return <div className="space-y-6">
    <header><h1 className="text-2xl font-semibold">{t('title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></header>
    <LammahNav />
    {runs.length===0?<div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">{t('empty')}</div>:<ul className="space-y-3">{runs.map((run)=><li key={run.id} className="rounded-lg border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-medium">{run.external_run_id}</h2><p className="mt-1 text-sm text-muted-foreground">{run.status} / {run.mode} / {run.parser_version}</p><p className="mt-1 text-xs text-muted-foreground">{run.worker_identity} / {run.started_at}</p></div><span className="rounded-full bg-muted px-2 py-1 text-xs">{t('pages',{count:run.page_count})}</span></div><dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-7">{(['retrieved','accepted','replayed','review','published','rejected','deadLetter'] as const).map((key)=><div key={key}><dt className="text-muted-foreground">{t(`counts.${key}`)}</dt><dd className="font-semibold tabular-nums">{key==='retrieved'?run.retrieved_count:key==='accepted'?run.accepted_count:key==='replayed'?run.replayed_count:key==='review'?run.review_count:key==='published'?run.published_count:key==='rejected'?run.rejected_count:run.dead_letter_count}</dd></div>)}</dl>{run.failure_class?<p className="mt-3 text-sm text-destructive">{run.failure_class}: {run.failure_detail}</p>:null}</li>)}</ul>}
  </div>
}
