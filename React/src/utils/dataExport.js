const csvValue = (value) => {
  const raw = String(value ?? "");
  const text =
    typeof value === "string" && /^[\t\r ]*[=+\-@]/.test(raw)
      ? `'${raw}`
      : raw;
  return `"${text.replaceAll('"', '""')}"`;
};

export function downloadCsv(filename, headers, rows) {
  const content = [headers, ...rows]
    .map((row) => row.map(csvValue).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export function printReport(title, headers, rows) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Allow pop-ups to open the printable report.");
  }

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`,
    )
    .join("");
  const tableHeaders = headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("");

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <style>
          body { color: #1e293b; font: 12px Arial, sans-serif; margin: 28px; }
          h1 { font-size: 20px; margin: 0 0 8px; }
          p { color: #64748b; margin: 0 0 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #f1f5f9; font-size: 10px; }
          tr { break-inside: avoid; }
          @media print {
            body { margin: 12mm; }
            th { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>Generated ${escapeHtml(new Date().toLocaleString())}</p>
        <table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
        <script>window.addEventListener("load", () => window.print());</script>
      </body>
    </html>`);
  printWindow.document.close();
}
