Jarvis Brandbook
================

Vision
- Empower learners to build analytics skills with a friendly, focused, and motivating experience.

Core Principles
- Clarity: keep UI clean and legible.
- Momentum: make progress visible and celebrated.
- Trust: use calm colors, predictable interactions, and clear feedback.

Identity
- Name: Jarvis
- Tone: encouraging, pragmatic, and concise.
- Voice: coach-like, never condescending.

Color Palette
- Primary (Indigo): hsl(var(--brand)) → default 242 84% 60%.
- Usage: actions, accents, progress.
- Accent (Emerald): hsl(var(--brand-accent)) → default 160 84% 40%.
- Usage: highlights, success, subtle gradients.
- Neutrals: come from CSS variables in `globals.css` via Tailwind theme mapping (background, foreground, border, muted).

Typography
- Base: system sans (configured by Next/Tailwind). Keep headings 600 weight, body 400.
- Sizes: title 24–28px, section 16–18px, captions 12–13px.

Radius & Elevation
- Radius: `--radius` = 10px; components use `rounded-xl` by default.
- Elevation: use subtle borders and soft background blur. Avoid heavy shadows.

Components
- Button: rounded-md, border-border by default; primary uses Indigo foreground on white.
- Card: rounded-xl, `border border-border bg-white/70 backdrop-blur p-4`.
- KPI: number-forward first; optional brand badge.
- Progress: horizontal bar using `hsl(var(--brand))`.

Patterns
- Hero: soft conic/radial gradient blending primary/accent.
- Dashboard: KPIs → Quick Actions → Recommendations → Progress/Path.

Do/Don’t
- Do: celebrate wins (streaks, XP), keep actions obvious, and maintain accessible contrast.
- Don’t: overload with dense charts; prefer summaries and next actions.

Implementation Notes
- Brand tokens live in `src/app/globals.css` as CSS variables (`--brand`, `--brand-accent`).
- Tailwind maps semantic tokens via the inline `@theme` block.
- Dashboard components live in `src/app/dashboard` and align to these patterns.

