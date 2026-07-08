import { ThemeToggle } from '@/components/ui/theme-toggle'
import { typographyClasses } from '@/lib/typography'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Foundation Day — Theme Test',
  robots: { index: false, follow: false },
}

const swatches = [
  { label: 'background', className: 'bg-sem-background' },
  { label: 'surface', className: 'bg-sem-surface' },
  { label: 'card', className: 'bg-sem-card' },
  { label: 'border', className: 'bg-sem-border' },
  { label: 'gold', className: 'bg-sem-gold' },
  { label: 'olive', className: 'bg-sem-olive' },
  { label: 'danger', className: 'bg-sem-danger' },
  { label: 'warning', className: 'bg-sem-warning' },
] as const

export default function FoundationTestPage() {
  return (
    <main className="min-h-screen bg-sem-background text-sem-text-primary">
      <div className="container-jid py-12">
        <header className="mb-10 flex items-center justify-between gap-4 border-b border-sem-border pb-6">
          <div>
            <p className={typographyClasses('caption', 'en') + ' text-sem-text-secondary'}>
              Foundation Day — infrastructure only
            </p>
            <h1 className={typographyClasses('heading', 'en')}>Semantic token test</h1>
          </div>
          <ThemeToggle />
        </header>

        <section className="mb-10 rounded-xl border border-sem-border bg-sem-surface p-6">
          <h2 className={typographyClasses('title', 'en') + ' mb-2'}>Theme-aware surfaces</h2>
          <p className={typographyClasses('body', 'en') + ' text-sem-text-secondary'}>
            Colors below use <code className="font-mono text-xs">sem-*</code> Tailwind classes backed
            by <code className="font-mono text-xs">--color-*</code> CSS variables. Toggle dark mode —
            no <code className="font-mono text-xs">dark:</code> prefix required.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {swatches.map(({ label, className }) => (
            <div
              key={label}
              className="overflow-hidden rounded-lg border border-sem-border bg-sem-card shadow-sm"
            >
              <div className={`h-16 ${className}`} />
              <p className={typographyClasses('label', 'en') + ' px-3 py-2 text-sem-text-primary'}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-10 rounded-xl border border-sem-border bg-sem-card p-6">
          <h2 className={typographyClasses('title', 'ar') + ' mb-4'}>نموذج عربي — تباعد أحرف صفر</h2>
          <p className={typographyClasses('body', 'ar') + ' text-sem-text-secondary'}>
            هذا النص يستخدم مستوى body مع letter-spacing: 0 إلزامياً للعربية.
          </p>
        </section>
      </div>
    </main>
  )
}
