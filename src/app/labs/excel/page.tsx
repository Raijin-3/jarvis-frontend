export const metadata = { title: "Excel Lab | Jarvis" }

export default function ExcelLabPage() {
  return (
    <div className="mx-auto max-w-screen-md p-4 md:p-6">
      <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
        <h1 className="text-xl font-semibold">Excel Lab</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hands-on exercises for Excel/Sheets will be embedded soon. For now, download the sample files from the curriculum or use your own datasets to follow along.</p>
        <div className="mt-3 text-xs text-muted-foreground">Tip: Practice PivotTables, TRIM/CLEAN, XLOOKUP, and SUMIFS on realistic data.</div>
      </div>
    </div>
  )
}

