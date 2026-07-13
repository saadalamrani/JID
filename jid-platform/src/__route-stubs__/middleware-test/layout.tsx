export default function MiddlewareTestPage({
  params,
}: {
  params: { locale: string }
}) {
  return (
    <main className="container-jid py-12">
      <p className="font-mono text-sm text-foreground/70">middleware-test: {params.locale}</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">Portal stub</h1>
      <p className="mt-2 text-foreground/80">If you see this page, the route guard allowed access.</p>
    </main>
  )
}
