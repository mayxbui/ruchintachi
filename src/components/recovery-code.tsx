"use client";

import { useState } from "react";

/** Shows a freshly issued recovery code once, with a copy button. */
export function RecoveryCodeNotice({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3 rounded-blob bg-sunny/30 p-5">
      <p className="font-bold">Your recovery code</p>
      <p className="text-ink/70">
        This is the only way back into your account if you forget your
        password. Write it down or save it somewhere safe. We can&apos;t
        show it again.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded-2xl bg-white px-4 py-3 font-mono text-lg font-bold tracking-wider shadow-pop">
          {code}
        </code>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard
              ?.writeText(code)
              .then(() => setCopied(true))
              .catch(() => setCopied(false))
          }
          className="bg-white px-4 py-2 font-bold"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
