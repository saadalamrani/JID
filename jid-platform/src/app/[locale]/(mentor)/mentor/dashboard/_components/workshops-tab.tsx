'use client'

import { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { MentorWorkshopRow } from '@/lib/mentor-workshops/crud'

type WorkshopsTabProps = {
  initialWorkshops: MentorWorkshopRow[]
}

const EMPTY_FORM = {
  title: '',
  title_ar: '',
  description: '',
  scheduled_at: '',
  capacity: '20',
  external_url: '',
  status: 'draft' as 'draft' | 'published',
}

/** Section 4.15 — mentor workshop CRUD in hub. */
export function WorkshopsTab({ initialWorkshops }: WorkshopsTabProps) {
  const t = useTranslations('mentorship.hub.workshops')
  const locale = useLocale()
  const [workshops, setWorkshops] = useState(initialWorkshops)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setWorkshops(initialWorkshops)
  }, [initialWorkshops])

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  async function refreshList() {
    const response = await fetch('/api/mentor/workshops', { credentials: 'include' })
    const body = (await response.json()) as { workshops?: MentorWorkshopRow[] }
    if (response.ok && body.workshops) setWorkshops(body.workshops)
  }

  async function handleSubmit(publish = false) {
    if (saving) return
    setSaving(true)
    try {
      const scheduledAt = form.scheduled_at
        ? new Date(form.scheduled_at).toISOString()
        : undefined
      if (!scheduledAt) throw new Error(t('dateRequired'))

      const payload = {
        title: form.title.trim(),
        title_ar: form.title_ar.trim() || undefined,
        description: form.description.trim() || undefined,
        scheduled_at: scheduledAt,
        capacity: Number(form.capacity),
        external_url: form.external_url.trim() || undefined,
        status: publish ? 'published' : form.status,
      }

      const response = await fetch(
        editingId ? `/api/mentor/workshops/${editingId}` : '/api/mentor/workshops',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      )
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(body?.error ?? t('saveError'))

      toast.success(t('saveSuccess'))
      resetForm()
      await refreshList()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('deleteConfirm'))) return
    const response = await fetch(`/api/mentor/workshops/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) {
      toast.error(t('deleteError'))
      return
    }
    toast.success(t('deleteSuccess'))
    await refreshList()
  }

  function startEdit(workshop: MentorWorkshopRow) {
    setEditingId(workshop.id)
    setForm({
      title: workshop.title,
      title_ar: workshop.title_ar ?? '',
      description: workshop.description ?? '',
      scheduled_at: workshop.scheduled_at
        ? new Date(workshop.scheduled_at).toISOString().slice(0, 16)
        : '',
      capacity: String(workshop.capacity),
      external_url: workshop.external_url ?? '',
      status: workshop.status === 'published' ? 'published' : 'draft',
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-arabic text-sm font-semibold text-foreground">
          {editingId ? t('editTitle') : t('createTitle')}
        </h2>
        <div className="mt-4 space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t('titlePlaceholder')}
            className="w-full rounded-xl border border-border px-3 py-2 font-arabic text-sm"
          />
          <input
            value={form.title_ar}
            onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
            placeholder={t('titleArPlaceholder')}
            className="w-full rounded-xl border border-border px-3 py-2 font-arabic text-sm"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder={t('descriptionPlaceholder')}
            className="w-full resize-none rounded-xl border border-border px-3 py-2 font-arabic text-sm"
          />
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
            className="w-full rounded-xl border border-border px-3 py-2 font-arabic text-sm"
          />
          <input
            type="number"
            min={1}
            max={500}
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
            className="w-full rounded-xl border border-border px-3 py-2 font-arabic text-sm"
          />
          <input
            value={form.external_url}
            onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))}
            placeholder={t('urlPlaceholder')}
            className="w-full rounded-xl border border-border px-3 py-2 font-arabic text-sm"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="font-arabic"
            disabled={saving}
            onClick={() => void handleSubmit(false)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('saveDraft')}
          </Button>
          <Button
            type="button"
            className="bg-primary font-arabic hover:bg-primary/90"
            disabled={saving}
            onClick={() => void handleSubmit(true)}
          >
            {t('publish')}
          </Button>
          {editingId ? (
            <Button type="button" variant="ghost" className="font-arabic" onClick={resetForm}>
              {t('cancelEdit')}
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        {workshops.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center font-arabic text-sm text-foreground/55">
            {t('empty')}
          </div>
        ) : (
          workshops.map((workshop) => (
            <article key={workshop.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-arabic text-sm font-semibold text-foreground">
                    {locale === 'ar' && workshop.title_ar ? workshop.title_ar : workshop.title}
                  </h3>
                  <p className="mt-1 font-arabic text-xs text-foreground/55">
                    {workshop.scheduled_at
                      ? new Date(workshop.scheduled_at).toLocaleString()
                      : '—'}
                    {' · '}
                    {t('spots', { count: workshop.spots_remaining, capacity: workshop.capacity })}
                  </p>
                  <p className="mt-1 font-arabic text-xs text-primary">{workshop.status}</p>
                </div>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => startEdit(workshop)}>
                    {t('edit')}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={t('delete')}
                    onClick={() => void handleDelete(workshop.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
        <p className="font-arabic text-xs text-muted-foreground">{t('chipHint')}</p>
      </section>
    </div>
  )
}
