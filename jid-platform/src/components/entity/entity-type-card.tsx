import { Building2, GraduationCap, User } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import { Card } from '@/components/ui/card'

type ActorType = 'individual' | 'company' | 'university'

type EntityTypeCardProps = {
  href: '/signup' | '/signup/company' | '/signup/university'
  title: string
  description: string
  type: ActorType
}

const ICONS = {
  individual: User,
  company: Building2,
  university: GraduationCap,
} as const

export function EntityTypeCard({ href, title, description, type }: EntityTypeCardProps) {
  const Icon = ICONS[type]

  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col gap-4 border-border p-6 transition-shadow hover:shadow-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-foreground/70">{description}</p>
        </div>
      </Card>
    </Link>
  )
}
