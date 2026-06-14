import "server-only";

function esc(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function chunks<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out.length > 0 ? out : [[]];
}

export function simpleTextPdf(title: string, lines: string[]) {
  const pages = chunks(lines, 38);
  const fontId = 3 + pages.length * 2;
  const objects: string[] = [];

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pages
    .map((_, i) => `[${3 + i * 2} 0 R]`)
    .map((kid) => kid.slice(1, -1))
    .join(" ")}] /Count ${pages.length} >>`;

  pages.forEach((pageLines, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const text = [
      "BT",
      "/F1 16 Tf",
      "54 760 Td",
      `(${esc(title)}${pages.length > 1 ? `, page ${index + 1}` : ""}) Tj`,
      "/F1 10 Tf",
      "0 -26 Td",
      ...pageLines.flatMap((line) => [
        `(${esc(line.slice(0, 105))}) Tj`,
        "0 -15 Td",
      ]),
      "ET",
    ].join("\n");
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> /MediaBox [0 0 612 792] /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] = `<< /Length ${Buffer.byteLength(text, "ascii")} >>\nstream\n${text}\nendstream`;
  });

  objects[fontId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}
