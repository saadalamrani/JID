'use client'

import { SectionHeader } from '@/components/ui/page-header'
import type { CareerEvidence } from '@/types/contracts'
import type { Locale } from '@/lib/i18n/config'
import { careerEvidenceDisplay } from '@/features/career-record/fact-display'
import type { CvProjectionCopy } from '../copy'
import { type CvProjectionItem, type CvProjectionSection } from '../operations'

type CvPreviewPanelProps = {
  copy: CvProjectionCopy
  locale: Locale
  title: string | null
  summary: string | null
  sections: readonly CvProjectionSection[]
  items: readonly CvProjectionItem[]
  evidence: readonly CareerEvidence[]
}

export function CvPreviewPanel({
  copy,
  locale,
  title,
  summary,
  sections,
  items,
  evidence,
}: CvPreviewPanelProps) {
  const evidenceById = new Map(evidence.map((item) => [item.evidence_id, item]))
  const orderedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order)
  const selected = items.filter((item) => item.is_selected)

  const hasBody = Boolean(title?.trim()) || Boolean(summary?.trim()) || selected.length > 0

  return (
    <section className="space-y-4" aria-labelledby="cv-preview-heading">
      <SectionHeader id="cv-preview-heading" title={copy.preview} />
      {!hasBody ? (
        <p className="text-sm text-muted-foreground">{copy.previewEmpty}</p>
      ) : (
        <div className="space-y-6 border-s-2 border-border ps-4">
          <header className="space-y-2">
            <h3 className="text-xl font-semibold tracking-normal text-foreground">
              {title?.trim() ? title : copy.untitled}
            </h3>
            {summary?.trim() ? (
              <p className="max-w-2xl text-sm text-muted-foreground">{summary}</p>
            ) : null}
          </header>
          {orderedSections
            .filter((section) => section.is_visible && section.section_key !== 'HEADER')
            .map((section) => {
              const sectionItems = selected
                .filter((item) => item.section_key === section.section_key)
                .sort((a, b) => a.sort_order - b.sort_order)
              if (section.section_key === 'SUMMARY') return null
              if (sectionItems.length === 0) return null
              return (
                <section key={section.section_key} className="space-y-2">
                  <h4 className="text-sm font-semibold tracking-normal text-foreground">
                    {section.heading_override ?? copy.section[section.section_key]}
                  </h4>
                  <ul className="space-y-3">
                    {sectionItems.map((item) => {
                      const record = evidenceById.get(item.evidence_id)
                      if (!record) return null
                      const display = careerEvidenceDisplay(record, locale)
                      const heading =
                        item.presentation_payload.display_title ?? display.title ?? copy.untitled
                      const wording = item.presentation_payload.summary
                      return (
                        <li key={item.evidence_id} className="min-w-0">
                          <p className="font-medium text-foreground">{heading}</p>
                          {display.subtitle ? (
                            <p className="text-sm text-muted-foreground">{display.subtitle}</p>
                          ) : null}
                          {wording ? (
                            <p className="mt-1 text-sm text-foreground">{wording}</p>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
        </div>
      )}
    </section>
  )
}
