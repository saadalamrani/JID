'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
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
  subtitle: { fontSize: 10, marginBottom: 14, color: '#555' },
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

function buildPdfDocument(snapshot: UniversityDashboardSnapshot) {
  const statuses = parseMap(snapshot.status_breakdown)
  const colleges = parseMap(snapshot.college_distribution)

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.heading}>University Dashboard Report</Text>
        <Text style={pdfStyles.subtitle}>
          Refreshed at: {new Date(snapshot.refreshed_at).toLocaleString()}
        </Text>

        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}>
            <Text>Total Students</Text>
            <Text>{snapshot.total_students}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text>Profile Completion</Text>
            <Text>{formatPct(snapshot.profile_completion_pct)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text>CV Creation</Text>
            <Text>{formatPct(snapshot.cv_creation_pct)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text>Job Applications</Text>
            <Text>{snapshot.job_applications}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text>Mentorship Sessions</Text>
            <Text>{snapshot.mentorship_sessions}</Text>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text>Status Breakdown</Text>
          {Object.entries(statuses).map(([key, value]) => (
            <View key={key} style={pdfStyles.row}>
              <Text>{key}</Text>
              <Text>{value}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.section}>
          <Text>College Distribution</Text>
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

export function UniversityDashboard() {
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
      const blob = await pdf(buildPdfDocument(snapshot)).toBlob()
      downloadBlob(blob, `university-dashboard-${snapshot.university_id}.pdf`)
      track('university_dashboard_pdf_exported', { university_id: snapshot.university_id })
    } finally {
      setExporting(false)
    }
  }

  if (query.isLoading) {
    return (
      <section className="rounded-2xl border border-jid-line bg-white p-6">
        <p className="text-sm text-jid-ink/60">جاري تحميل مؤشرات الجامعة...</p>
      </section>
    )
  }

  if (query.isError || !snapshot) {
    return (
      <section className="rounded-2xl border border-jid-line bg-white p-6">
        <p className="text-sm text-red-600">تعذر تحميل بيانات لوحة الجامعة حالياً.</p>
      </section>
    )
  }

  if (snapshot.total_students === 0) {
    return <EmptyUniversityState />
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-jid-line bg-white p-5">
        <div>
          <h1 className="text-2xl font-semibold text-jid-ink">لوحة إحصاءات الجامعة</h1>
          <p className="mt-1 text-sm text-jid-ink/65">
            آخر تحديث: {new Date(snapshot.refreshed_at).toLocaleString()}
          </p>
        </div>
        <Button
          type="button"
          className="gap-2 bg-jid-olive hover:bg-jid-olive/90"
          onClick={() => void handleExport()}
          disabled={exporting}
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="إجمالي الطلاب" value={snapshot.total_students} />
        <KpiCard label="اكتمال الملفات" value={formatPct(snapshot.profile_completion_pct)} />
        <KpiCard label="إنشاء السيرة الذاتية" value={formatPct(snapshot.cv_creation_pct)} />
        <KpiCard label="طلبات التوظيف" value={snapshot.job_applications} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-jid-line bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold text-jid-ink">التوزيع حسب الحالة الدراسية</h2>
          <StatusBreakdownBars data={snapshot.status_breakdown} />
        </article>
        <article className="rounded-2xl border border-jid-line bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold text-jid-ink">التوزيع حسب الكليات</h2>
          <CollegeDistributionBars data={snapshot.college_distribution} />
        </article>
      </section>

      <section className="rounded-2xl border border-jid-gold/40 bg-jid-beige/50 p-5">
        <h2 className="text-lg font-semibold text-jid-ink">أثر الإرشاد</h2>
        <p className="mt-1 text-sm text-jid-ink/70">
          عدد جلسات الإرشاد المؤكدة/المكتملة: <span className="font-semibold">{snapshot.mentorship_sessions}</span>
        </p>
      </section>
    </div>
  )
}
