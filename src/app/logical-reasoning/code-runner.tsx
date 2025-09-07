"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Language = "python" | "javascript" | "cpp";

const DEFAULT_SNIPPETS: Record<Language, string> = {
  python: "if __name__ == '__main__':\n    print('Hello, World!')\n",
  javascript: "function main(){\n  console.log('Hello, World!');\n}\nmain();\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  cout << \"Hello, World!\";\n  return 0;\n}\n",
};

export function CodeRunner() {
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState<string>(DEFAULT_SNIPPETS["python"]);
  const [stdin, setStdin] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setOutput("");
    setError("");
    try {
      const res = await fetch("/api/compile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language, code, stdin }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Run failed");
      setOutput(String(json.stdout || ""));
      setError(String(json.stderr || ""));
    } catch (e: any) {
      setError(e?.message || "Failed to run");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground">Language</label>
        <select
          className="rounded-md border border-border bg-white/80 px-2 py-1 text-sm"
          value={language}
          onChange={(e) => {
            const lang = e.target.value as Language;
            setLanguage(lang);
            setCode(DEFAULT_SNIPPETS[lang]);
          }}
        >
          <option value="python">Python 3</option>
          <option value="javascript">JavaScript (Node)</option>
          <option value="cpp">C++ (G++)</option>
        </select>
        <Button size="sm" onClick={run} disabled={running}>{running ? "Running..." : "Run Code"}</Button>
      </div>

      <textarea
        className="min-h-[260px] w-full rounded-md border border-border bg-white/80 p-3 font-mono text-sm outline-none focus:ring-2"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Stdin</div>
          <textarea
            className="h-24 w-full rounded-md border border-border bg-white/80 p-2 font-mono text-sm"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Optional input passed to your program"
          />
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Output</div>
          <pre className="h-24 w-full overflow-auto rounded-md border border-border bg-black/90 p-2 text-xs text-white">{output || (running ? "Running..." : "")}</pre>
          {error && <pre className="mt-2 whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</pre>}
        </div>
      </div>
    </div>
  );
}

