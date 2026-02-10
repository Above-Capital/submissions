"use client";

import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { useMemo } from "react";

marked.setOptions({
  gfm: true,
  breaks: true,
});

export default function PreviewPane({ markdown }: { markdown: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(markdown || "", { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [markdown]);

  return (
    <div className="h-full overflow-auto px-5 py-5">
      <article
        className="prose prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-indigo-300 prose-code:text-emerald-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
