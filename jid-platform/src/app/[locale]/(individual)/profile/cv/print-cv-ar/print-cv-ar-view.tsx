'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import {
  CATEGORY_LABELS,
  formatAdditionalItem,
  formatDateRange,
  formatDegreeLine,
  LANGUAGE_PROFICIENCY_LABELS,
  sortByOrder,
} from '@/lib/cv/pdf-helpers'
import { clearCvArPrintSession, readCvDataFromArPrintSession } from '@/lib/cv/formats/render-format-pdf'
import type { CvData } from '@/types/cv'
import './print-cv-ar.css'

/**
 * AR print-CSS engine (Prompt 1) — browser-native shaping via window.print().
 * CV payload is read from sessionStorage only; never sent to the server.
 */
export function PrintCvArView() {
  const locale = useLocale() as 'ar' | 'en'
  const [data, setData] = useState<CvData | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const payload = readCvDataFromArPrintSession()
    setData(payload)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || !data) return
    const timer = window.setTimeout(() => {
      window.print()
    }, 400)
    return () => window.clearTimeout(timer)
  }, [ready, data])

  useEffect(() => {
    return () => {
      clearCvArPrintSession()
    }
  }, [])

  if (!ready) {
    return (
      <div className="print-cv-ar-shell" dir="rtl">
        <p className="print-cv-ar-muted">جاري التحميل…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="print-cv-ar-shell" dir="rtl">
        <p className="print-cv-ar-muted">لا توجد بيانات للطباعة. ارجع إلى منشئ السيرة وحاول مرة أخرى.</p>
      </div>
    )
  }

  const labels = {
    education: 'التعليم',
    experience: 'الخبرة',
    skills: 'المهارات',
    additional: 'إضافي',
    summary: 'نبذة',
  }

  return (
    <div className="print-cv-ar-shell" dir="rtl" lang="ar">
      <div className="print-cv-ar-no-print print-cv-ar-toolbar">
        <button type="button" className="print-cv-ar-btn" onClick={() => window.print()}>
          {locale === 'ar' ? 'طباعة / حفظ PDF' : 'Print / Save as PDF'}
        </button>
      </div>

      <article className="print-cv-ar-page">
        <header className="print-cv-ar-header">
          <h1 className="print-cv-ar-name">{data.full_name}</h1>
          <p className="print-cv-ar-contact">
            {[data.city, data.country, data.email, data.phone].filter(Boolean).join(' · ')}
          </p>
        </header>

        {data.summary?.trim() ? (
          <section className="print-cv-ar-section">
            <h2 className="print-cv-ar-section-title">{labels.summary}</h2>
            <p className="print-cv-ar-body">{data.summary.trim()}</p>
          </section>
        ) : null}

        {data.experience.length > 0 ? (
          <section className="print-cv-ar-section">
            <h2 className="print-cv-ar-section-title">{labels.experience}</h2>
            {sortByOrder(data.experience).map((entry, index) => {
              const dates = formatDateRange(
                entry.start_month,
                entry.start_year,
                entry.end_month,
                entry.end_year,
                entry.is_current,
                'ar',
              )
              return (
                <div key={`exp-${index}`} className="print-cv-ar-entry">
                  <div className="print-cv-ar-entry-row">
                    <strong>{entry.company_name}</strong>
                    {dates ? <span className="print-cv-ar-date">{dates}</span> : null}
                  </div>
                  <p className="print-cv-ar-subtitle">{entry.job_title}</p>
                  <ul className="print-cv-ar-bullets">
                    {entry.bullets.map((bullet, bulletIndex) => (
                      <li key={`b-${bulletIndex}`}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </section>
        ) : null}

        {data.education.length > 0 ? (
          <section className="print-cv-ar-section">
            <h2 className="print-cv-ar-section-title">{labels.education}</h2>
            {sortByOrder(data.education).map((entry, index) => {
              const dates = formatDateRange(
                entry.start_month,
                entry.start_year,
                entry.end_month,
                entry.end_year,
                entry.is_current,
                'ar',
              )
              const degreeLine = formatDegreeLine(entry.degree, entry.field_of_study)
              return (
                <div key={`edu-${index}`} className="print-cv-ar-entry">
                  <div className="print-cv-ar-entry-row">
                    <strong>{entry.institution_name}</strong>
                    {dates ? <span className="print-cv-ar-date">{dates}</span> : null}
                  </div>
                  {degreeLine ? <p className="print-cv-ar-subtitle">{degreeLine}</p> : null}
                </div>
              )
            })}
          </section>
        ) : null}

        {(data.technical_skills.length > 0 || data.languages.length > 0) ? (
          <section className="print-cv-ar-section">
            <h2 className="print-cv-ar-section-title">{labels.skills}</h2>
            {data.technical_skills.length > 0 ? (
              <p className="print-cv-ar-body">{data.technical_skills.join('، ')}</p>
            ) : null}
            {data.languages.length > 0 ? (
              <p className="print-cv-ar-body">
                {data.languages
                  .map((l) => `${l.name} (${LANGUAGE_PROFICIENCY_LABELS.ar[l.proficiency]})`)
                  .join('، ')}
              </p>
            ) : null}
          </section>
        ) : null}

        {data.additional.length > 0 ? (
          <section className="print-cv-ar-section">
            <h2 className="print-cv-ar-section-title">{labels.additional}</h2>
            {sortByOrder(data.additional).map((item, index) => (
              <p key={`add-${index}`} className="print-cv-ar-body">
                <strong>{CATEGORY_LABELS.ar[item.category]}: </strong>
                {formatAdditionalItem(item, 'ar')}
              </p>
            ))}
          </section>
        ) : null}
      </article>
    </div>
  )
}
