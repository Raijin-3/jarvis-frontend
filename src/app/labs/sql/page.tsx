import Link from 'next/link';

export const metadata = { title: "SQL Lab | Jarvis" }

export default function SqlLabPage() {
  return (
    <div className="mx-auto max-w-screen-md p-4 md:p-6">
      <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
        <h1 className="text-xl font-semibold">SQL Lab</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Interactive SQL practice environment with SQLite WASM. Practice SQL queries with real datasets in your browser.
        </p>
        
        <div className="mt-6 space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h3 className="font-semibold text-gray-900 mb-2">SQL Practice Exercise</h3>
            <p className="text-sm text-gray-600 mb-3">
              Learn SQL fundamentals with interactive exercises and sample datasets.
            </p>
            <Link 
              href="/labs/sql/practice"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Practice
            </Link>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-muted-foreground">
          Tip: The practice environment runs entirely in your browser using SQLite WASM - no server connection required!
        </div>
      </div>
    </div>
  )
}
