/**
 * Export utilities — CSV and Markdown download helpers.
 * All exports are frontend-only using data already loaded from APIs.
 */

function datestamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filenamePrefix: string,
) {
  if (rows.length === 0) return;
  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","));
  const csv = [headerLine, ...dataLines].join("\n");
  triggerDownload(csv, `${filenamePrefix}_${datestamp()}.csv`, "text/csv;charset=utf-8");
}

export function downloadMarkdown(content: string, filenamePrefix: string) {
  if (!content.trim()) return;
  triggerDownload(content, `${filenamePrefix}_${datestamp()}.md`, "text/markdown;charset=utf-8");
}
