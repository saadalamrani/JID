'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics/track'
import {
  type UniversityDashboardSnapshot,
  useUniversityDashboard,
} from '@/lib/queries/university-dashboard'
import { CollegeDistributionBars } from './college-distribution-bars'
import { EmptyUniversityState } from './empty-university-state'
import { KpiCard } from './kpi-card'
import { StatusBreakdownBars } from './status-breakdown-bars'

const pdfStyles = StyleSheet.create({
  page: { padding: 24, fontSize: 12 },
  heading: { fontSize: 18, marginBottom: 6 },
  subtitle: { fontSize: 10, marginBottom: 14, color: '#555' }, // @react-pdf/renderer requires inline color — no Tailwind in PDF StyleSheet
  section: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
})

function formatPct(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`
}

function parseMap(input: Record<string, number> | string | null | undefined): Record<string, number> {
  if (!input) return {}
  if (typeof input === 'string') {
    try {
      return (JSON.parse(input) as Record<string, number>) ?? {}
    } catch {
      return {}
    }
  }
  return input
}

function pickSnapshot(rows: UniversityDashboardSnapshot[] | undefined): UniversityDashboardSnapshot | null {
  if (!rows?.length) return null
  return rows[0] ?? null
}

function dateLocaleTag(locale: string): string {
  return locale.startsWith('ar') ? 'ar-SA' : 'en-US'
}

function buildPdfDocument(
  snapshot: UniversityDashboardSnapshot,
  labels: {
    title: string
    refreshedAt: string
    totalStudents: string
    profileCompletion: string
    cvCreation: string
    jobApplications: string
    mentorshipSessions: string
    statusBreakdown: string
    collegeDistribution: string
  },
  locale: string,
) {
  const statuses = parseMap(snapshot.status_breakdown)
  const colleges = parseMap(snapshot.college_distribution)
  const dateTag = dateLocaleTag(locale)

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.heading}>{labels.title}</Text>
        <Text style={pdfStyles.subtitle}>
          {labels.refreshedAt}:{' '}
          {new Date(snapshot.refreshed_at).toLocaleString(dateTag, {
            numberingSystem: 'latn',
          })}
        </Text>

        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}>
            <Text>{labels.totalStudents}</Text>
            <Text>{snapshot.total_students}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text>{labels.profileCompletion}</Text>
            <Text>{formatPct(snapshot.profile_completion_pct)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text>{labels.cvCreation}</Text>
            <Text>{formatPct(snapshot.cv_creation_pct)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text>{labels.jobApplications}</Text>
            <Text>{snapshot.job_applications}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text>{labels.mentorshipSessions}</Text>
            <Text>{snapshot.mentorship_sessions}</Text>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text>{labels.statusBreakdown}</Text>
          {Object.entries(statuses).map(([key, value]) => (
            <View key={key} style={pdfStyles.row}>
              <Text>{key}</Text>
              <Text>{value}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.section}>
          <Text>{labels.collegeDistribution}</Text>
          {Object.entries(colleges).map(([key, value]) => (
            <View key={key} style={pdfStyles.row}>
              <Text>{key}</Text>
              <Text>{value}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Spec 05-B DEF-04/06 — honest snapshot-present / absent / error states with AR/EN parity. */
export function UniversityDashboard() {
  const t = useTranslations('university.dashboard')
  const locale = useLocale()
  const [exporting, setExporting] = useState(false)
  const query = useUniversityDashboard()

  const snapshot = useMemo(() => pickSnapshot(query.data), [query.data])

  useEffect(() => {
    if (!snapshot) return
    track('university_dashboard_viewed', { university_id: snapshot.university_id })
  }, [snapshot])

  async function handleExport() {
    if (!snapshot || exporting) return
    setExporting(true)
    try {
      const blob = await pdf(
        buildPdfDocument(
          snapshot,
          {
            title: t('pdfTitle'),
            refreshedAt: t('refreshedAt'),
            totalStudents: t('kpi.totalStudents'),
            profileCompletion: t('kpi.profileCompletion'),
            cvCreation: t('kpi.cvCreation'),
            jobApplications: t('kpi.jobApplications'),
            mentorshipSessions: t('kpi.mentorshipSessions'),
            statusBreakdown: t('statusBreakdown'),
            collegeDistribution: t('collegeDistribution'),
          },
          locale,
        ),
      ).toBlob()
      downloadBlob(blob, `university-dashboard-${snapshot.university_id}.pdf`)
      track('university_dashboard_pdf_exported', { university_id: snapshot.university_id })
    } finally {
      setExporting(false)
    }
  }

  if (query.isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-background p-6" role="status">
        <p className="text-sm text-foreground/60">{t('loading')}</p>
      </section>
    )
  }

  if (query.isError) {
    return (
      <section
        className="rounded-2xl border border-border bg-background p-6"
        data-testid="university-dashboard-error"
      >
        <p className="text-sm text-destructive" role="alert">
          {t('error')}
        </p>
      </section>
    )
  }

  // Spec 05-B DEF-04: absent snapshot → EmptyUniversityState (not zero-filled KPIs).
  if (!snapshot) {
    return <EmptyUniversityState />
  }

  const refreshedLabel = new Date(snapshot.refreshed_at).toLocaleString(dateLocaleTag(locale), {
    numberingSystem: 'latn',
  })
  const kpiHint = t('kpiHint')

  return (
    <div className="space-y-5" data-testid="university-dashboard-snapshot">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background p-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-foreground/65">
            {t('refreshedAt')}: {refreshedLabel}
          </p>
        </div>
        <Button
          type="button"
          className="min-h-11 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => void handleExport()}
          disabled={exporting}
          aria-label={t('exportAria')}
          data-testid="university-dashboard-export"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? t('exporting') : t('exportPdf')}
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('kpi.totalStudents')} value={snapshot.total_students} hint={kpiHint} />
        <KpiCard
          label={t('kpi.profileCompletion')}
          value={formatPct(snapshot.profile_completion_pct)}
          hint={kpiHint}
        />
        <KpiCard
          label={t('kpi.cvCreation')}
          value={formatPct(snapshot.cv_creation_pct)}
          hint={kpiHint}
        />
        <KpiCard
          label={t('kpi.jobApplications')}
          value={snapshot.job_applications}
          hint={kpiHint}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-background p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{t('statusBreakdown')}</h2>
          <StatusBreakdownBars data={snapshot.status_breakdown} />
        </article>
        <article className="rounded-2xl border border-border bg-background p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{t('collegeDistribution')}</h2>
          <CollegeDistributionBars data={snapshot.college_distribution} />
        </article>
      </section>

      <section className="rounded-2xl border border-accent/40 bg-background/50 p-5">
        <h2 className="text-lg font-semibold text-foreground">{t('mentorshipTitle')}</h2>
        <p className="mt-1 text-sm text-foreground/70">
          {t('mentorshipBody', { count: snapshot.mentorship_sessions })}
        </p>
      </section>
    </div>
  )
}
