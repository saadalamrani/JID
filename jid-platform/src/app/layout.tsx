import { fontVariables } from '@/styles/fonts'
import type { ReactNode } from 'react'

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html suppressHydrationWarning>
      <body className={`min-h-screen bg-background font-arabic antialiased ${fontVariables}`}>
        {children}
      </body>
    </html>
  )
}
