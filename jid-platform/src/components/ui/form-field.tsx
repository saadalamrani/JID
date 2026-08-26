import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type FormFieldProps = {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

type ControlA11yProps = {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

function enhanceControl(
  id: string,
  describedBy: string | undefined,
  invalid: boolean,
  children: ReactNode,
): ReactNode {
  if (!isValidElement(children)) {
    return children
  }

  const control = children as ReactElement<ControlA11yProps>
  return cloneElement(control, {
    id: control.props.id ?? id,
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy,
  })
}

/**
 * Shared label / control / hint / error grammar.
 * Copy is passed in by the caller (i18n stays at the feature boundary).
 */
export function FormField({ id, label, error, hint, children, className }: FormFieldProps) {
  const hintId = hint && !error ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = errorId ?? hintId

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="text-foreground">
        {label}
      </Label>
      {enhanceControl(id, describedBy, Boolean(error), children)}
      {hintId ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {errorId ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
