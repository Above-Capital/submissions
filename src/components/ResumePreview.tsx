"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { PaperSize, ResumeTheme } from "../lib/types";
import { classNames } from "../lib/utils";

function pagePx(paper: PaperSize) {
  // screen preview size (not print). We'll use CSS @page for print.
  return paper === "a4" ? { w: 794, h: 1123 } : { w: 816, h: 1056 }; // approx @96dpi
}

export default function ResumePreview({
  markdown,
  theme,
  paper,
  showGuides,
}: {
  markdown: string;
  theme: ResumeTheme;
  paper: PaperSize;
  showGuides: boolean;
}) {
  const { w, h } = pagePx(paper);
  const font = theme.font === "serif" ? "font-serif" : "font-sans";
  const density = theme.density === "compact" ? "leading-5" : "leading-6";

  return (
    <div className="flex items-start justify-center">
      <div
        className={classNames(
          "relative rounded-2xl border border-black/10 bg-white shadow-[0_30px_120px_-55px_rgba(0,0,0,0.45)]",
          "dark:border-white/10 dark:bg-zinc-950"
        )}
        style={{ width: w, minHeight: h }}
      >
        {showGuides ? (
          <div className="pointer-events-none absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-indigo-500/10" />
          </div>
        ) : null}

        <div className={classNames("px-12 py-12", font, density)} style={{ color: "#0f172a" }}>
          <style jsx>{`
            .accent {
              color: ${theme.accent};
            }
          `}</style>

          <article className={classNames(
            "prose prose-zinc max-w-none",
            "prose-headings:tracking-tight prose-h1:text-3xl prose-h1:mb-2",
            "prose-h2:text-base prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-zinc-500 prose-h2:mb-2",
            "prose-h3:text-sm prose-h3:mb-1",
            "prose-hr:my-4 prose-hr:border-zinc-200",
            "prose-ul:my-2 prose-li:my-0",
            "prose-strong:text-zinc-900",
            "prose-a:text-inherit prose-a:no-underline hover:prose-a:underline",
            "dark:prose-invert"
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {markdown}
            </ReactMarkdown>
          </article>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-10 py-4 text-[10px] text-zinc-400">
          <div>Print: Ctrl/⌘+P</div>
          <div className="font-medium">{paper.toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
}
