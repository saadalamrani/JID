import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import type { IndividualHomeModel } from '@/lib/individual-home/get-individual-home-model'

type RecordPanelProps = {
  model: IndividualHomeModel
}

/**
 * D1 R2, section 4 — "my Career Record at a glance". A compact summary of the
 * spine, with its derived views named as outputs, not peer destinations
 * (R1-C P1 / Article 3): the full record, the public projection ("how employers
 * see me"), and a CV are all reached *from* the record, never siblings of it.
 */
export async function RecordPanel({ model }: RecordPanelProps) {
  const t = await getTranslations('individualHome.record')

  return (
    <section aria-labelledby="record-title" className="border border-border bg-card p-5 md:p-6">
      <h2 id="record-title" className="text-base font-semibold text-foreground">
        {t('title')}
      </h2>

      {model.skills.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {model.skills.slice(0, 6).map((skill) => (
            <li
              key={skill.id}
              className="text-foreground/75 rounded-full border border-border px-2.5 py-1 text-xs"
            >
              {skill.name_ar ?? skill.name}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <Link
          href="/profile/career-record"
          className="font-medium text-jid-olive hover:text-jid-gold"
        >
          {t('viewFull')}
        </Link>
        <Link
          href={`/profile/${model.userId}`}
          className="font-medium text-jid-olive hover:text-jid-gold"
        >
          {t('viewProjection')}
        </Link>
        <Link href="/cv-builder" className="font-medium text-jid-olive hover:text-jid-gold">
          {t('createCv')}
        </Link>
      </div>
    </section>
  )
}
