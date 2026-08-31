'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Audience, NetworkSnapshot, UpdateKind } from '@/types/contracts/professional-network'
const text = {
  ar: {
    title: 'شبكتي المهنية',
    intro: 'علاقات باختيارك وتحديثات مهنية مرتبة زمنياً دون ترتيب تفاعلي.',
    new: 'تحديث مهني',
    publish: 'نشر',
    requests: 'طلبات واردة',
    connections: 'العلاقات',
    accept: 'قبول',
    decline: 'رفض',
    disconnect: 'قطع العلاقة',
    remove: 'حذف',
    empty: 'لا توجد تحديثات بعد.',
    privacy: 'الخصوصية',
    allow: 'السماح بطلبات التواصل',
    show: 'إظهار تحديثاتي لعلاقاتي',
    save: 'حفظ',
    boundary: 'هذا سياق مهني ولا يصبح دليلاً في السجل المهني تلقائياً.',
    failed: 'تعذر إكمال الإجراء.',
    target: 'معرّف الملف المهني',
    connect: 'إرسال طلب تواصل',
  },
  en: {
    title: 'My professional network',
    intro:
      'Connections by choice and chronological professional updates without engagement ranking.',
    new: 'Professional update',
    publish: 'Publish',
    requests: 'Incoming requests',
    connections: 'Connections',
    accept: 'Accept',
    decline: 'Decline',
    disconnect: 'Disconnect',
    remove: 'Remove',
    empty: 'No updates yet.',
    privacy: 'Privacy',
    allow: 'Allow connection requests',
    show: 'Show my updates to connections',
    save: 'Save',
    boundary:
      'This is professional context and never becomes Career Record evidence automatically.',
    failed: 'The action could not be completed.',
    target: 'Professional profile ID',
    connect: 'Send connection request',
  },
} as const
export function NetworkClient({
  initial,
  locale,
}: {
  initial: NetworkSnapshot
  locale: 'ar' | 'en'
}) {
  const [data, setData] = useState(initial),
    [body, setBody] = useState(''),
    [target, setTarget] = useState(''),
    [kind, setKind] = useState<UpdateKind>('project'),
    [audience, setAudience] = useState<Audience>(initial.preferences.defaultAudience),
    [error, setError] = useState<string | null>(null)
  const t = text[locale]
  async function act(payload: Record<string, unknown>) {
    setError(null)
    const response = await fetch('/api/me/professional-network', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      setError(t.failed)
      return false
    }
    const fresh = await fetch('/api/me/professional-network')
    if (fresh.ok) setData((await fresh.json()) as NetworkSnapshot)
    return true
  }
  return (
    <main className="container-jid max-w-4xl space-y-8 py-8" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.intro}</p>
      </header>
      {error ? (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {error}
        </p>
      ) : null}
      <section className="rounded-xl border p-4">
        <label className="font-semibold" htmlFor="network-target">
          {t.target}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="network-target"
            className="min-w-0 flex-1 rounded-md border bg-background p-2"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <Button
            disabled={!target}
            onClick={() =>
              void act({ action: 'request', profileId: target }).then((ok) => {
                if (ok) setTarget('')
              })
            }
          >
            {t.connect}
          </Button>
        </div>
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-xl font-semibold">{t.new}</h2>
        <p className="my-2 text-sm text-muted-foreground">{t.boundary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-md border bg-background p-2"
            value={kind}
            onChange={(e) => setKind(e.target.value as UpdateKind)}
            aria-label={t.new}
          >
            <option value="project">Project / مشروع</option>
            <option value="achievement">Achievement / إنجاز</option>
            <option value="learning">Learning / تعلّم</option>
            <option value="credential">Credential / شهادة</option>
            <option value="career">Career / مسار مهني</option>
          </select>
          <select
            className="rounded-md border bg-background p-2"
            value={audience}
            onChange={(e) => setAudience(e.target.value as Audience)}
            aria-label={t.privacy}
          >
            <option value="connections">Connections / العلاقات</option>
            <option value="private">Private / خاص</option>
          </select>
        </div>
        <textarea
          className="mt-3 min-h-28 w-full rounded-md border bg-background p-3"
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label={t.new}
        />
        <Button
          className="mt-3"
          disabled={!body.trim()}
          onClick={() =>
            void act({ action: 'create', kind, body, audience }).then((ok) => {
              if (ok) setBody('')
            })
          }
        >
          {t.publish}
        </Button>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">{t.requests}</h2>
          {data.incoming.map((p) => (
            <div key={p.id} className="mt-3 border-t pt-3">
              <p>{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.headline}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => void act({ action: 'respond', connectionId: p.id, accept: true })}
                >
                  {t.accept}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void act({ action: 'respond', connectionId: p.id, accept: false })}
                >
                  {t.decline}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">{t.connections}</h2>
          {data.connections.map((p) => (
            <div key={p.id} className="mt-3 flex items-center justify-between border-t pt-3">
              <div>
                <p>{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.headline}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void act({ action: 'disconnect', connectionId: p.id })}
              >
                {t.disconnect}
              </Button>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        {data.updates.length === 0 ? (
          <p className="rounded-xl border p-6 text-muted-foreground">{t.empty}</p>
        ) : (
          data.updates.map((u) => (
            <article key={u.id} className="rounded-xl border bg-card p-4">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold">{u.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.kind} ·{' '}
                    {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US').format(
                      new Date(u.createdAt),
                    )}
                  </p>
                </div>
                {u.isOwner ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void act({ action: 'delete', updateId: u.id })}
                  >
                    {t.remove}
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap">{u.body}</p>
            </article>
          ))
        )}
      </section>
      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">{t.privacy}</h2>
        <label className="mt-3 flex gap-2">
          <input
            type="checkbox"
            checked={data.preferences.acceptsConnections}
            onChange={(e) =>
              setData({
                ...data,
                preferences: { ...data.preferences, acceptsConnections: e.target.checked },
              })
            }
          />
          {t.allow}
        </label>
        <label className="mt-3 flex gap-2">
          <input
            type="checkbox"
            checked={data.preferences.updatesEnabled}
            onChange={(e) =>
              setData({
                ...data,
                preferences: { ...data.preferences, updatesEnabled: e.target.checked },
              })
            }
          />
          {t.show}
        </label>
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => void act({ action: 'preferences', ...data.preferences })}
        >
          {t.save}
        </Button>
      </section>
    </main>
  )
}
