/**
 * Spec 06-D — claim.* notification rendering (locale, fallback, action links).
 */
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationRow } from '@/components/notifications/notification-row'
import { CategoryIcon } from '@/components/notifications/category-icon'
import type { NotificationListItem } from '@/lib/notifications/types'

const useLocale = vi.fn(() => 'ar')

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => useLocale(),
  NextIntlClientProvider: ({ children }: { children: unknown }) => children,
}))

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className} data-testid="notification-link">
      {children}
    </a>
  ),
}))

function makeItem(
  overrides: Partial<NotificationListItem> = {},
): NotificationListItem {
  return {
    id: 'n-1',
    category: 'verification.approved',
    priority: 'high',
    title_ar: 'تمت الموافقة على طلب التحقق',
    title_en: 'Verification approved',
    body_ar: 'وافقت إدارة جيد على طلب التحقق. يمكنك الآن إنشاء ملفك التعريفي.',
    body_en: 'JID staff approved your verification. You can now create your owned profile.',
    action_url: '/company/create-profile',
    action_label_ar: 'إنشاء الملف التعريفي',
    action_label_en: 'Create profile',
    created_at: new Date().toISOString(),
    read_at: null,
    ...overrides,
  }
}

describe('claim.approved / claim.rejected rendering', () => {
  beforeEach(() => {
    useLocale.mockReturnValue('ar')
  })

  it('renders claim.approved in Arabic', () => {
    useLocale.mockReturnValue('ar')
    render(<NotificationRow notification={makeItem({ category: 'verification.approved' })} />)
    expect(screen.getByText('تمت الموافقة على طلب التحقق')).toBeInTheDocument()
    expect(screen.getByText(/إنشاء ملفك التعريفي/)).toBeInTheDocument()
    expect(screen.getByText('إنشاء الملف التعريفي')).toBeInTheDocument()
    expect(screen.getByTestId('notification-link')).toHaveAttribute(
      'href',
      '/company/create-profile',
    )
  })

  it('renders claim.approved in English', () => {
    useLocale.mockReturnValue('en')
    render(<NotificationRow notification={makeItem({ category: 'verification.approved' })} />)
    expect(screen.getByText('Verification approved')).toBeInTheDocument()
    expect(screen.getByText(/create your owned profile/i)).toBeInTheDocument()
    expect(screen.getByText('Create profile')).toBeInTheDocument()
    expect(screen.queryByText('تمت الموافقة على طلب التحقق')).not.toBeInTheDocument()
  })

  it('renders claim.rejected in Arabic with rejection reason', () => {
    useLocale.mockReturnValue('ar')
    render(
      <NotificationRow
        notification={makeItem({
          category: 'verification.rejected',
          title_ar: 'تم رفض طلب التحقق',
          title_en: 'Verification rejected',
          body_ar: 'لم يُقبل طلب التحقق.\n\nالسبب: مستندات ناقصة',
          body_en: 'Your verification was not approved.\n\nReason: Missing documents',
          action_url: '/company/verification-rejected',
          action_label_ar: 'عرض نتيجة الطلب',
          action_label_en: 'View decision',
        })}
      />,
    )
    expect(screen.getByText('تم رفض طلب التحقق')).toBeInTheDocument()
    expect(screen.getByText(/السبب: مستندات ناقصة/)).toBeInTheDocument()
    expect(screen.getByTestId('notification-link')).toHaveAttribute(
      'href',
      '/company/verification-rejected',
    )
  })

  it('renders claim.rejected in English with rejection reason', () => {
    useLocale.mockReturnValue('en')
    render(
      <NotificationRow
        notification={makeItem({
          category: 'verification.rejected',
          title_ar: 'تم رفض طلب التحقق',
          title_en: 'Verification rejected',
          body_ar: 'لم يُقبل طلب التحقق.\n\nالسبب: مستندات ناقصة',
          body_en: 'Your verification was not approved.\n\nReason: Missing documents',
          action_url: '/university/rejected',
          action_label_ar: 'عرض نتيجة الطلب',
          action_label_en: 'View decision',
        })}
      />,
    )
    expect(screen.getByText('Verification rejected')).toBeInTheDocument()
    expect(screen.getByText(/Reason: Missing documents/)).toBeInTheDocument()
    expect(screen.getByTestId('notification-link')).toHaveAttribute(
      'href',
      '/university/rejected',
    )
  })

  it('approval create-Profile continuation never claims automatic Profile creation', () => {
    useLocale.mockReturnValue('en')
    const { container } = render(
      <NotificationRow notification={makeItem({ category: 'verification.approved' })} />,
    )
    expect(container.textContent?.toLowerCase()).not.toMatch(/automatically created/)
    expect(container.textContent?.toLowerCase()).not.toMatch(/profile was created/)
    expect(container.textContent).toMatch(/create your owned profile/i)
  })
})

describe('NotificationRow fallbacks', () => {
  beforeEach(() => {
    useLocale.mockReturnValue('en')
  })

  it('unknown category does not crash and uses safe fallback copy when titles empty', () => {
    useLocale.mockReturnValue('en')
    render(
      <NotificationRow
        notification={makeItem({
          category: 'totally.unknown.category' as NotificationListItem['category'],
          title_ar: '',
          title_en: '',
          body_ar: '',
          body_en: '',
          action_url: null,
        })}
      />,
    )
    expect(screen.getByText('Notification')).toBeInTheDocument()
    expect(screen.getByText('No additional details.')).toBeInTheDocument()
    expect(screen.queryByTestId('notification-link')).not.toBeInTheDocument()
  })

  it('missing or blank action_url renders no dead link', () => {
    const { rerender } = render(
      <NotificationRow notification={makeItem({ action_url: null })} />,
    )
    expect(screen.queryByTestId('notification-link')).not.toBeInTheDocument()

    rerender(<NotificationRow notification={makeItem({ action_url: '   ' })} />)
    expect(screen.queryByTestId('notification-link')).not.toBeInTheDocument()
  })
})

describe('CategoryIcon', () => {
  it('maps claim.approved and claim.rejected without crashing', () => {
    const { container: a } = render(
      <CategoryIcon category="verification.approved" priority="high" />,
    )
    const { container: r } = render(
      <CategoryIcon category="claim.rejected" priority="high" />,
    )
    expect(a.querySelector('[aria-hidden]')).toBeTruthy()
    expect(r.querySelector('[aria-hidden]')).toBeTruthy()
  })

  it('unknown category falls back to Bell without crashing', () => {
    const { container } = render(
      <CategoryIcon category="not.a.real.category" priority="normal" />,
    )
    expect(container.querySelector('[data-category-fallback="bell"]')).toBeTruthy()
  })
})
