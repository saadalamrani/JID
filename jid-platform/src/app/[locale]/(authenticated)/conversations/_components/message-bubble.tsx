'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { DecryptedMessage } from '@/types/conversation'
import { cn } from '@/lib/utils'

type MessageBubbleProps = {
  message: DecryptedMessage
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const t = useTranslations('conversations.chat')

  if (message.isSystem) {
    return (
      <div className="flex justify-center py-2">
        <p className="max-w-md rounded-full bg-background/60 px-4 py-2 text-center font-arabic text-xs text-foreground/60">
          {message.plaintext}
        </p>
      </div>
    )
  }

  const showDecrypting = message.decryptState === 'pending'
  const showError = message.decryptState === 'error'
  const body = message.plaintext

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2 font-arabic text-sm shadow-sm',
          isOwn ? 'bg-primary text-white' : 'border border-border bg-white text-foreground',
        )}
      >
        {showDecrypting ? (
          <span className="inline-flex items-center gap-2 opacity-80">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            {t('decrypting')}
          </span>
        ) : showError ? (
          <span className="opacity-80">{t('decryptError')}</span>
        ) : (
          <p className="whitespace-pre-wrap break-words">{body}</p>
        )}
        <time
          className={cn('mt-1 block text-[10px]', isOwn ? 'text-white/70' : 'text-foreground/45')}
          dateTime={message.created_at}
        >
          {new Date(message.created_at).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>
    </div>
  )
}
