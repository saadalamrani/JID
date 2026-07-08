'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type BulletEditorProps = {
  bullets: string[]
  onChange: (bullets: string[]) => void
  error?: string
  maxBullets?: number
}

/** Section 7.8 — achievements bullet list with add/remove/edit. */
export function BulletEditor({
  bullets,
  onChange,
  error,
  maxBullets = 20,
}: BulletEditorProps) {
  const t = useTranslations('cv.builder.experience')

  function updateBullet(index: number, value: string) {
    const next = [...bullets]
    next[index] = value
    onChange(next)
  }

  function removeBullet(index: number) {
    const next = bullets.filter((_, bulletIndex) => bulletIndex !== index)
    onChange(next.length > 0 ? next : [''])
  }

  function addBullet() {
    if (bullets.length >= maxBullets) return
    onChange([...bullets, ''])
  }

  const displayBullets = bullets.length > 0 ? bullets : ['']

  return (
    <fieldset className="space-y-3 rounded-md border border-border p-3">
      <legend className="px-1 text-xs font-medium text-muted-foreground">{t('achievementsTitle')}</legend>
      <p className="text-xs text-foreground/55">{t('achievementsHint')}</p>

      <div className="space-y-2">
        {displayBullets.map((bullet, index) => (
          <div key={`bullet-${index}`} className="flex items-start gap-2">
            <span className="mt-2.5 text-sm text-foreground/40" aria-hidden>
              •
            </span>
            <Input
              value={bullet}
              onChange={(event) => updateBullet(index, event.target.value)}
              placeholder={t('bulletPlaceholder')}
              aria-label={t('bulletLabel', { index: index + 1 })}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeBullet(index)}
              disabled={displayBullets.length === 1 && !bullet.trim()}
              aria-label={t('removeBullet', { index: index + 1 })}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addBullet}
        disabled={displayBullets.length >= maxBullets}
        className="gap-1"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t('addBullet')}
      </Button>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
