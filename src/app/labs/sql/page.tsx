export const metadata = { title: "SQL Lab | Jarvis" }

export default function SqlLabPage() {
  return (
    <div className="mx-auto max-w-screen-md p-4 md:p-6">
      <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
        <h1 className="text-xl font-semibold">SQL Lab</h1>
        <p className="mt-1 text-sm text-muted-foreground">Interactive SQL practice coming soon. For now, use the resources linked in the curriculum or connect to your own database/playground (e.g., SQLite local, pgAdmin, Mode, or DB Fiddle).</p>
        <div className="mt-3 text-xs text-muted-foreground">Tip: We recommend practicing with real datasets and saving snippets for review.</div>
      </div>
    </div>
  )
}
