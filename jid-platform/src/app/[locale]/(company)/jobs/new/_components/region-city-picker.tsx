'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useCatalogRegions } from '@/hooks/use-catalog-metadata'
import { cn } from '@/lib/utils'

type RegionCityPickerProps = {
  regionSlug: string
  city: string
  onRegionChange: (slug: string) => void
  onCityChange: (city: string) => void
  regionError?: string
  cityError?: string
  className?: string
}

/** Section 6.2 — single region select + city text (catalog metadata). */
export function RegionCityPicker({
  regionSlug,
  city,
  onRegionChange,
  onCityChange,
  regionError,
  cityError,
  className,
}: RegionCityPickerProps) {
  const { data: regions = [], isLoading } = useCatalogRegions()

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <div className="space-y-2">
        <Label htmlFor="job-region" className="font-arabic text-foreground">
          المنطقة
        </Label>
        <select
          id="job-region"
          value={regionSlug}
          onChange={(event) => onRegionChange(event.target.value)}
          disabled={isLoading}
          aria-invalid={Boolean(regionError)}
          className={cn(
            'flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 font-arabic text-sm text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            regionError && 'border-red-500',
          )}
        >
          <option value="">اختر المنطقة</option>
          {regions.map((region) => (
            <option key={region.slug} value={region.slug}>
              {region.name_ar ?? region.name_en}
            </option>
          ))}
        </select>
        {regionError ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {regionError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-city" className="font-arabic text-foreground">
          المدينة
        </Label>
        <Input
          id="job-city"
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          placeholder="مثال: الرياض"
          aria-invalid={Boolean(cityError)}
          className={cn('font-arabic border-border', cityError && 'border-red-500')}
        />
        {cityError ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {cityError}
          </p>
        ) : null}
      </div>
    </div>
  )
}
