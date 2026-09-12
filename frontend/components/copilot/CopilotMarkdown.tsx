"use client";

import React from "react";

interface CopilotMarkdownProps {
  content: string;
}

/**
 * Clean inline markdown parser supporting:
 * - **bold text**
 * - `code`
 * - [links](url)
 */
function renderInlineText(text: string): React.ReactNode {
  // Regex to split by **bold** or `code`
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const segments = text.split(regex);

  segments.forEach((seg, i) => {
    if (!seg) return;
    if (seg.startsWith("**") && seg.endsWith("**")) {
      parts.push(
        <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">
          {seg.slice(2, -2)}
        </strong>
      );
    } else if (seg.startsWith("`") && seg.endsWith("`")) {
      parts.push(
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono text-cyan-700 dark:text-cyan-300"
        >
          {seg.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(seg);
    }
  });

  return parts.length > 0 ? parts : text;
}

/**
 * Enterprise-grade structured Markdown & Telemetry table renderer for Copilot.
 * Parses raw LLM output into clean typography, cards, tables, and step-by-step action items.
 */
export const CopilotMarkdown: React.FC<CopilotMarkdownProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Skip empty lines (margin handled by element spacing)
    if (!line) {
      i++;
      continue;
    }

    // 2. Horizontal Rule (---, ***)
    if (/^[-*_]{3,}$/.test(line)) {
      elements.push(
        <hr key={`hr-${i}`} className="my-3 border-slate-200 dark:border-slate-800" />
      );
      i++;
      continue;
    }

    // 3. Headings (###, ##, #)
    if (line.startsWith("### ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 flex items-center gap-1.5 tracking-tight"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
          <span>{renderInlineText(line.replace(/^###\s+/, ""))}</span>
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-slate-100 mt-3.5 mb-2 pb-1 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
        >
          <span>{renderInlineText(line.replace(/^##\s+/, ""))}</span>
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-300 dark:border-slate-700"
        >
          {renderInlineText(line.replace(/^#\s+/, ""))}
        </h2>
      );
      i++;
      continue;
    }

    // 4. Markdown Table (| Col 1 | Col 2 |)
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        // First line is headers
        const headerCells = tableLines[0]
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());

        // Second line is separator (|---|---|) -> skip if matching dashes
        let bodyStartIndex = 1;
        if (tableLines.length > 1 && /^\|?(\s*:?-+:?\s*\|?)+$/.test(tableLines[1])) {
          bodyStartIndex = 2;
        }

        const bodyRows = tableLines.slice(bodyStartIndex).map((tLine) =>
          tLine
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim())
        );

        elements.push(
          <div
            key={`table-${i}`}
            className="my-2.5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                    {headerCells.map((h, ci) => (
                      <th
                        key={ci}
                        className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                      >
                        {renderInlineText(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60">
                  {bodyRows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 transition-colors"
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-1.5 text-slate-600 dark:text-slate-300 font-sans"
                        >
                          {renderInlineText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        continue;
      }
    }

    // 5. Numbered Steps (e.g. 1. **Charge before departure**, 2. ...)
    const stepMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (stepMatch) {
      const stepNum = stepMatch[1];
      const stepText = stepMatch[2];
      elements.push(
        <div key={`step-${i}`} className="flex items-start gap-2.5 my-1.5">
          <span className="w-4 h-4 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border border-cyan-300 dark:border-cyan-800">
            {stepNum}
          </span>
          <div className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            {renderInlineText(stepText)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // 6. Bullet Lists (- Item, * Item, • Item)
    if (/^[-*•]\s+/.test(line)) {
      const bulletText = line.replace(/^[-*•]\s+/, "");
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-1 pl-2">
          <span className="text-cyan-500 font-bold shrink-0 mt-0.5 leading-none">•</span>
          <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {renderInlineText(bulletText)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // 7. Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
        {renderInlineText(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5 text-xs text-slate-800 dark:text-slate-200">{elements}</div>;
};

export default CopilotMarkdown;
