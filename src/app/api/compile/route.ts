import { NextResponse } from "next/server";

type Body = {
  language?: string;
  code?: string;
  stdin?: string;
};

const RUNTIMES_URL = "https://emkc.org/api/v2/piston/runtimes";
const EXEC_URL = "https://emkc.org/api/v2/piston/execute";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const language = (body.language || "python").toLowerCase();
    const code = body.code ?? "print('Hello, World!')\n";
    const stdin = body.stdin ?? "";

    // Fetch runtimes and choose latest for the requested language
    const rtRes = await fetch(RUNTIMES_URL, { cache: "no-store" });
    if (!rtRes.ok) throw new Error(`Failed to fetch runtimes: ${rtRes.status}`);
    const runtimes: { language: string; version: string; aliases?: string[] }[] = await rtRes.json();
    const match = runtimes.find((r) => r.language.toLowerCase() === language || (r.aliases || []).some((a) => a.toLowerCase() === language));
    if (!match) return NextResponse.json({ error: `Language '${language}' not supported` }, { status: 400 });

    const extMap: Record<string, string> = { python: "py", javascript: "js", node: "js", typescript: "ts", cpp: "cpp", c: "c" };
    const langKey = match.language.toLowerCase();
    const ext = extMap[language] || extMap[langKey] || "txt";

    const payload = {
      language: match.language,
      version: match.version,
      files: [{ name: `Main.${ext}`, content: code }],
      stdin,
    };

    const exRes = await fetch(EXEC_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const exJson = await exRes.json().catch(() => ({}));
    if (!exRes.ok) throw new Error(`Execute failed: ${exRes.status} ${JSON.stringify(exJson)}`);

    const stdout: string = exJson?.run?.stdout ?? exJson?.stdout ?? "";
    const stderr: string = exJson?.run?.stderr ?? exJson?.stderr ?? "";
    const codeExit: number = exJson?.run?.code ?? exJson?.code ?? 0;

    return NextResponse.json({ ok: true, language: match.language, version: match.version, stdout, stderr, code: codeExit });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to compile" }, { status: 500 });
  }
}

