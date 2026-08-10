import type { ConsoleMessage, Page } from '@playwright/test'

const FATAL_CONSOLE_PATTERNS = [
  /hydration failed/i,
  /minified react error/i,
  /application error/i,
  /uncaught (error|exception)/i,
  /chunkloadoerror/i,
]

const IGNORED_CONSOLE_PATTERNS = [
  /download the react devtools/i,
  /third-party cookie/i,
  /favicon\.ico/i,
  /net::err_failed/i,
  /failed to load resource/i,
]

export type RuntimeErrorCollector = {
  messages: string[]
  attach: () => void
  detach: () => void
  fatalMessages: () => string[]
}

export function createRuntimeErrorCollector(page: Page): RuntimeErrorCollector {
  const messages: string[] = []

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) return
    messages.push(`[console.error] ${text}`)
  }

  const onPageError = (error: Error) => {
    messages.push(`[pageerror] ${error.message}`)
  }

  return {
    messages,
    attach() {
      page.on('console', onConsole)
      page.on('pageerror', onPageError)
    },
    detach() {
      page.off('console', onConsole)
      page.off('pageerror', onPageError)
    },
    fatalMessages() {
      return messages.filter((entry) => FATAL_CONSOLE_PATTERNS.some((pattern) => pattern.test(entry)))
    },
  }
}

export function assertNoFatalRuntimeErrors(collector: RuntimeErrorCollector, label: string) {
  const fatal = collector.fatalMessages()
  if (fatal.length > 0) {
    throw new Error(`P1 severe runtime regression on ${label}:\n${fatal.join('\n')}`)
  }
}
