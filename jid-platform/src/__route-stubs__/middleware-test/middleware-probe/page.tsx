import { headers } from 'next/headers'

export default function MiddlewareProbePage() {
  const headerStore = headers()

  return (
    <main className="container-jid py-12 font-mono text-sm">
      <h1 className="text-xl font-semibold">Middleware probe</h1>
      <pre className="mt-4 rounded bg-background p-4 text-foreground">
        {JSON.stringify(
          {
            userId: headerStore.get('x-user-id'),
            userRole: headerStore.get('x-user-role'),
          },
          null,
          2,
        )}
      </pre>
    </main>
  )
}
