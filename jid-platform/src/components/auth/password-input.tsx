'use client'

import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PasswordInputProps = React.ComponentProps<typeof Input>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoComplete={props.autoComplete ?? 'new-password'}
          className={cn('pe-10', className)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute end-0 top-0 h-full px-3 text-jid-ink/60 hover:bg-transparent"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
