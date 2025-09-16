export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <a href="/" className="flex items-center gap-2 hover:opacity-80" aria-label="Go to home">
          <span className="font-semibold">Jarvis</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">AI Learning</span>
        </a>
        <nav className="flex items-center gap-2">
          <a href="/login" className="rounded-md border border-border bg-white/70 px-3 py-1.5 text-sm hover:bg-black/5">Sign in</a>
        </nav>
      </div>
    </header>
  )
}
