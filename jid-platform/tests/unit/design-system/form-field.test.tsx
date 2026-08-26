import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FormField } from '@/components/ui/form-field'

describe('FormField', () => {
  it('wires label, hint, and error with accessible names', () => {
    const { rerender } = render(
      <FormField id="name" label="Name" hint="Use your legal name">
        <input />
      </FormField>,
    )

    const input = screen.getByLabelText('Name')
    expect(input).toHaveAttribute('id', 'name')
    expect(input).toHaveAttribute('aria-describedby', 'name-hint')
    expect(screen.getByText('Use your legal name')).toBeInTheDocument()

    rerender(
      <FormField id="name" label="Name" error="Required">
        <input />
      </FormField>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-describedby', 'name-error')
  })

  it('keeps Arabic and English copy as caller-provided slots', () => {
    const { rerender } = render(
      <div dir="rtl">
        <FormField id="city" label="المدينة">
          <input />
        </FormField>
      </div>,
    )
    expect(screen.getByLabelText('المدينة')).toBeInTheDocument()

    rerender(
      <div dir="ltr">
        <FormField id="city" label="City">
          <input />
        </FormField>
      </div>,
    )
    expect(screen.getByLabelText('City')).toBeInTheDocument()
  })
})
