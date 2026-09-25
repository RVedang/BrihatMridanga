import { dateLabel, monthLabel } from "@/lib/dates";

const PAGE_W = 841.89;
const PAGE_H = 595.28;
const MARGIN = 44;
const USABLE = PAGE_W - MARGIN * 2;
const TOP = 52;
const BOTTOM = 40;
const SIZE = 9;
const HEAD = 7.5;
const LINE = 12;

const INK = "0.286 0.290 0.333";
const ORANGE = "0.922 0.357 0.098";
const PAPER = "0.988 0.984 0.973";
const WASH = "0.961 0.949 0.925";
const LINE_C = "0.910 0.898 0.875";
const MUTED = "0.431 0.435 0.463";
const WHITE = "1 1 1";

function ascii(value: unknown) {
  return String(value ?? "")
    .replaceAll(/[^\u0020-\u007e]/g, "?")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function pdfString(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function widthOf(text: string, size: number, serif = false) {
  return text.length * size * (serif ? 0.48 : 0.52);
}

function isNumeric(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value);
  const n = Number(value);
  return value !== "" && Number.isFinite(n) && String(value).trim() === String(n);
}

function latin1(text: string) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

function pretty(header: string, value: unknown) {
  const label = ascii(header).toLowerCase();
  const text = ascii(value);
  if (!text) return "";
  if ((label === "date" || label === "day") && /^\d{4}-\d{2}-\d{2}$/.test(text))
    return dateLabel(text);
  if (label === "month" && /^\d{4}-\d{2}/.test(text))
    return monthLabel(text.slice(0, 7));
  if (isNumeric(value))
    return Number(value).toLocaleString("en-GB");
  return text;
}

function wrap(text: string, size: number, width: number, serif = false) {
  const source = ascii(text);
  if (!source) return [""];
  if (widthOf(source, size, serif) <= width) return [source];
  const lines: string[] = [];
  let current = "";
  const push = (word: string) => {
    if (widthOf(word, size, serif) <= width) {
      current = word;
      return;
    }
    let chunk = "";
    for (const ch of word) {
      if (widthOf(chunk + ch, size, serif) > width && chunk) {
        lines.push(chunk);
        chunk = ch;
      } else chunk += ch;
    }
    current = chunk;
  };
  for (const word of source.split(" ")) {
    const next = current ? `${current} ${word}` : word;
    if (widthOf(next, size, serif) <= width) current = next;
    else {
      if (current) lines.push(current);
      push(word);
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

const LEFT_HEADERS = new Set([
  "year",
  "date",
  "month",
  "campaign",
  "temple",
  "country",
  "measure",
  "center",
  "team",
  "individual",
  "book type",
  "language",
]);

function columnNumeric(rows: unknown[][]) {
  const cols = Math.max(...rows.map((row) => row.length), 1);
  const header = rows[0] || [];
  const data = rows.slice(1);
  return Array.from({ length: cols }, (_, c) => {
    if (LEFT_HEADERS.has(ascii(header[c]).toLowerCase())) return false;
    return data.length
      ? data.every((row) => row[c] === "" || row[c] == null || isNumeric(row[c]))
      : false;
  });
}

function columnWidths(rows: unknown[][], numeric: boolean[]) {
  const header = rows[0] || [];
  const data = rows.slice(1);
  const pad = 18;
  const widths = header.map((title, c) => {
    const label = ascii(title);
    const labelW = widthOf(label.toUpperCase(), HEAD);
    const valueW = Math.max(
      0,
      ...data.map((row) => widthOf(pretty(label, row[c]), SIZE)),
    );
    const needed = Math.max(labelW, valueW) + pad;
    if (numeric[c]) return Math.max(46, needed);
    return Math.max(58, Math.min(220, needed));
  });
  let total = widths.reduce((sum, w) => sum + w, 0);
  if (total > USABLE) {
    const extra = total - USABLE;
    const textSum = widths
      .filter((_, i) => !numeric[i])
      .reduce((sum, w) => sum + w, 0);
    if (textSum > extra) {
      widths.forEach((w, i) => {
        if (!numeric[i]) widths[i] = Math.max(52, w - (extra * w) / textSum);
      });
    } else {
      widths.forEach((w, i) => {
        widths[i] = (w * USABLE) / total;
      });
    }
    total = widths.reduce((sum, w) => sum + w, 0);
  }
  return { widths, tableWidth: total };
}

type Block =
  | { kind: "masthead"; title: string; range: string }
  | { kind: "stats"; items: { label: string; value: string }[] }
  | { kind: "title"; text: string }
  | { kind: "table"; rows: unknown[][] };

function rangeFromTitle(text: string) {
  const match = /(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/.exec(text);
  if (!match) return text.replace(/^Brihat Mridanga reports\s*/i, "");
  return `${dateLabel(match[1])}  –  ${dateLabel(match[2])}`;
}

function blocksFrom(cells: unknown[][]): Block[] {
  const blocks: Block[] = [];
  let table: unknown[][] = [];
  const flushTable = () => {
    if (!table.length) return;
    const cols = Math.max(...table.map((row) => row.length));
    const rows = table.map((row) => {
      const next = row.slice();
      while (next.length < cols) next.push("");
      return next;
    });
    const header = rows[0].map((cell) => ascii(cell).toLowerCase());
    if (
      header.length === 2 &&
      header[0] === "measure" &&
      header[1] === "value"
    ) {
      blocks.push({
        kind: "stats",
        items: rows.slice(1).map((row) => ({
          label: ascii(row[0]),
          value: pretty("value", row[1]),
        })),
      });
    } else {
      blocks.push({ kind: "table", rows });
    }
    table = [];
  };
  cells.forEach((row, index) => {
    if (!row?.length) {
      flushTable();
      return;
    }
    if (row.length === 1) {
      flushTable();
      const text = ascii(row[0]);
      if (index === 0) {
        blocks.push({
          kind: "masthead",
          title: "Distribution reports",
          range: rangeFromTitle(text),
        });
      } else {
        blocks.push({ kind: "title", text });
      }
      return;
    }
    table.push(row);
  });
  flushTable();
  return blocks;
}

export function cellsToPdf(cells: unknown[][]) {
  const blocks = blocksFrom(cells);
  const pages: string[] = [];
  let ops: string[] = [];
  let y = PAGE_H - TOP;
  const rangeNote =
    blocks.find((b): b is Extract<Block, { kind: "masthead" }> => b.kind === "masthead")
      ?.range || "";

  const flush = () => {
    pages.push(ops.join("\n"));
    ops = [];
    y = PAGE_H - TOP;
  };

  const color = (value: string, fill = true) => {
    ops.push(`${value} ${fill ? "rg" : "RG"}`);
  };

  const rect = (x: number, by: number, w: number, h: number, fill: string) => {
    color(fill);
    ops.push(
      `${x.toFixed(2)} ${by.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`,
    );
  };

  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: string,
    width = 0.6,
  ) => {
    color(stroke, false);
    ops.push(`${width} w`);
    ops.push(
      `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
    );
  };

  const textAt = (
    font: "F1" | "F2" | "F3" | "F4",
    size: number,
    x: number,
    baseline: number,
    value: string,
    maxWidth: number,
    right: boolean,
    fill: string,
    serif = false,
  ) => {
    const drawn = value;
    const xPos = right
      ? x + maxWidth - widthOf(drawn, size, serif)
      : x;
    color(fill);
    ops.push("BT");
    ops.push(`/${font} ${size} Tf`);
    ops.push(`1 0 0 1 ${xPos.toFixed(2)} ${baseline.toFixed(2)} Tm`);
    ops.push(`(${pdfString(drawn)}) Tj`);
    ops.push("ET");
  };

  const tracked = (
    font: "F1" | "F2",
    size: number,
    x: number,
    baseline: number,
    value: string,
    tracking: number,
    fill: string,
  ) => {
    let cx = x;
    for (const ch of value) {
      textAt(font, size, cx, baseline, ch, 40, false, fill);
      cx += widthOf(ch, size) + tracking;
    }
  };

  const ensure = (height: number) => {
    if (y - height < BOTTOM) flush();
  };

  const drawRow = (
    values: unknown[],
    headers: string[],
    widths: number[],
    numeric: boolean[],
    header: boolean,
    stripe: boolean,
    tableWidth: number,
  ) => {
    const size = header ? HEAD : SIZE;
    const lines = values.map((value, i) =>
      wrap(
        header ? ascii(value).toUpperCase() : pretty(headers[i], value),
        size,
        Math.max(16, widths[i] - 16),
      ),
    );
    const height = Math.max(...lines.map((line) => line.length), 1) * LINE + 8;
    ensure(height);
    y -= height;
    if (header) rect(MARGIN, y, tableWidth, height, WASH);
    else if (stripe) rect(MARGIN, y, tableWidth, height, "0.980 0.976 0.965");
    let x = MARGIN;
    lines.forEach((cell, i) => {
      const useFont: "F1" | "F2" = header || numeric[i] ? "F2" : "F1";
      cell.forEach((lineText, lineNo) => {
        textAt(
          useFont,
          size,
          x + 8,
          y + height - 14 - lineNo * LINE,
          lineText,
          widths[i] - 16,
          numeric[i],
          header ? MUTED : INK,
        );
      });
      x += widths[i];
    });
    line(
      MARGIN,
      y,
      MARGIN + tableWidth,
      y,
      header ? LINE_C : "0.945 0.937 0.918",
      header ? 0.8 : 0.4,
    );
  };

  const drawTable = (rows: unknown[][]) => {
    const numeric = columnNumeric(rows);
    const { widths, tableWidth } = columnWidths(rows, numeric);
    const headers = rows[0].map((cell) => ascii(cell));
    const heightOf = (values: unknown[], header: boolean) => {
      const size = header ? HEAD : SIZE;
      const lines = values.map((value, i) =>
        wrap(
          header ? ascii(value).toUpperCase() : pretty(headers[i], value),
          size,
          Math.max(16, widths[i] - 16),
        ),
      );
      return Math.max(...lines.map((line) => line.length), 1) * LINE + 8;
    };
    rows.forEach((row, i) => {
      const header = i === 0;
      if (!header && y - heightOf(row, false) < BOTTOM) {
        flush();
        drawRow(rows[0], headers, widths, numeric, true, false, tableWidth);
      }
      drawRow(
        row,
        headers,
        widths,
        numeric,
        header,
        i > 0 && i % 2 === 0,
        tableWidth,
      );
    });
    y -= 14;
  };

  for (const block of blocks) {
    if (block.kind === "masthead") {
      ensure(70);
      y -= 8;
      tracked("F2", 8, MARGIN, y, "A RECORD OF SERVICE", 1.15, ORANGE);
      y -= 26;
      textAt("F3", 24, MARGIN, y, block.title, USABLE, false, INK, true);
      y -= 16;
      textAt("F1", 10, MARGIN, y, block.range, USABLE, false, MUTED);
      y -= 10;
      line(MARGIN, y, MARGIN + 52, y, ORANGE, 2);
      y -= 18;
      continue;
    }
    if (block.kind === "stats") {
      const gap = 12;
      const cardH = 62;
      const n = Math.max(block.items.length, 1);
      const cardW = (USABLE - gap * (n - 1)) / n;
      ensure(cardH + 16);
      y -= cardH;
      block.items.forEach((item, i) => {
        const x = MARGIN + i * (cardW + gap);
        rect(x, y, cardW, cardH, WHITE);
        rect(x, y + cardH - 2.4, cardW, 2.4, ORANGE);
        line(x, y, x + cardW, y, LINE_C, 0.6);
        line(x, y, x, y + cardH, LINE_C, 0.6);
        line(x + cardW, y, x + cardW, y + cardH, LINE_C, 0.6);
        tracked(
          "F2",
          7,
          x + 12,
          y + cardH - 16,
          item.label.toUpperCase(),
          0.9,
          MUTED,
        );
        textAt(
          "F3",
          22,
          x + 12,
          y + 14,
          item.value,
          cardW - 24,
          false,
          INK,
          true,
        );
      });
      y -= 20;
      continue;
    }
    if (block.kind === "title") {
      ensure(36);
      y -= 20;
      textAt("F3", 13, MARGIN, y, block.text, USABLE, false, INK, true);
      y -= 8;
      line(MARGIN, y, MARGIN + 36, y, ORANGE, 1.6);
      y -= 8;
      continue;
    }
    drawTable(block.rows);
  }
  if (ops.length) flush();
  if (!pages.length) flush();

  const finished = pages.map((body, i) => {
    const n = i + 1;
    const total = pages.length;
    const chrome: string[] = [];
    const add = (s: string) => chrome.push(s);
    add(`${PAPER} rg 0 0 ${PAGE_W} ${PAGE_H} re f`);
    add(`${ORANGE} rg 0 ${PAGE_H - 3.2} ${PAGE_W} 3.2 re f`);
    add(`${INK} rg`);
    add("BT /F2 8 Tf");
    add(`1 0 0 1 ${MARGIN.toFixed(2)} ${(PAGE_H - 22).toFixed(2)} Tm`);
    add("(BRIHAT MRIDANGA) Tj ET");
    add(`${MUTED} rg`);
    add("BT /F1 8 Tf");
    const right = "Distribution reports";
    add(
      `1 0 0 1 ${(MARGIN + USABLE - widthOf(right, 8)).toFixed(2)} ${(PAGE_H - 22).toFixed(2)} Tm`,
    );
    add(`(${right}) Tj ET`);
    add(`${LINE_C} RG 0.6 w`);
    add(
      `${MARGIN.toFixed(2)} ${(PAGE_H - 30).toFixed(2)} m ${(MARGIN + USABLE).toFixed(2)} ${(PAGE_H - 30).toFixed(2)} l S`,
    );
    add(`${LINE_C} RG 0.6 w`);
    add(
      `${MARGIN.toFixed(2)} 26 m ${(MARGIN + USABLE).toFixed(2)} 26 l S`,
    );
    add(`${MUTED} rg`);
    add("BT /F1 8 Tf");
    add(`1 0 0 1 ${MARGIN.toFixed(2)} 14 Tm`);
    add(`(${pdfString(rangeNote || "Public distribution record")}) Tj ET`);
    const pager = `${n}  /  ${total}`;
    add("BT /F1 8 Tf");
    add(
      `1 0 0 1 ${(MARGIN + USABLE - widthOf(pager, 8)).toFixed(2)} 14 Tm`,
    );
    add(`(${pager}) Tj ET`);
    return chrome.join("\n") + "\n" + body;
  });

  const f1 = 3 + finished.length * 2;
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${finished.map((_, i) => `${3 + i * 2} 0 R`).join(" ")}] /Count ${finished.length} >>`,
  ];
  const fonts =
    `/F1 ${f1} 0 R /F2 ${f1 + 1} 0 R /F3 ${f1 + 2} 0 R /F4 ${f1 + 3} 0 R`;
  finished.forEach((stream, i) => {
    const pageId = 3 + i * 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << ${fonts} >> >> /Contents ${pageId + 1} 0 R >>`,
    );
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>");

  const chunks: Uint8Array[] = [latin1("%PDF-1.4\n")];
  const offsets = [0];
  let offset = chunks[0].length;
  objects.forEach((obj, i) => {
    const bytes = latin1(`${i + 1} 0 obj\n${obj}\nendobj\n`);
    offsets.push(offset);
    chunks.push(bytes);
    offset += bytes.length;
  });
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++)
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
  chunks.push(latin1(xref));
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}
