/**
 * XLSX (Office Open XML / ECMA-376 SpreadsheetML) writer — framework-free,
 * no dependencies, entirely original code. Produces a real .xlsx: a ZIP of
 * XML parts. Uses inline strings, so memory stays proportional to output
 * size even on very large datasets (no shared-string table to accumulate).
 */
import { buildZip } from './zip';
import { ExportColumn, ExportRequest, XlsxOptions } from './table-export.types';

const NAMED_FORMATS: Record<string, string> = {
  integer: '#,##0',
  decimal: '#,##0.00',
  currency: '#,##0.00',
  percent: '0.00%',
  date: 'yyyy-mm-dd',
  datetime: 'yyyy-mm-dd hh:mm',
};

// Control chars are invalid in XML 1.0 and would corrupt the workbook.
const XML_INVALID = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(XML_INVALID, '');
}

/** Column index (0-based) -> Excel letters: 0 -> A, 26 -> AA. */
export function colLetter(index: number): string {
  let s = '';
  for (let i = index; i >= 0; i = Math.floor(i / 26) - 1) {
    s = String.fromCharCode(65 + (i % 26)) + s;
  }
  return s;
}

/** Excel serial date (1900 system; epoch 1899-12-30 absorbs the leap-year quirk). */
function dateSerial(d: Date): number {
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(),
    d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  return (utc - Date.UTC(1899, 11, 30)) / 86_400_000;
}

function stylesXml(headerBold: boolean, headerBg: string | undefined,
                   headerColor: string | undefined, numFmts: string[]): string {
  const hex = (c: string) => 'FF' + c.replace('#', '').toUpperCase();
  const fmts = numFmts
    .map((code, i) => `<numFmt numFmtId="${164 + i}" formatCode="${esc(code)}"/>`)
    .join('');
  const headerFont = `<font><sz val="11"/>${headerBold ? '<b/>' : ''}` +
    (headerColor ? `<color rgb="${hex(headerColor)}"/>` : '') +
    `<name val="Calibri"/></font>`;
  const headerFill = headerBg
    ? `<fill><patternFill patternType="solid"><fgColor rgb="${hex(headerBg)}"/></patternFill></fill>`
    : '<fill><patternFill patternType="none"/></fill>';
  // cellXfs: 0 = default, 1 = header, 2.. = one per numFmt.
  const fmtXfs = numFmts
    .map((_, i) => `<xf numFmtId="${164 + i}" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="${numFmts.length}">${fmts}</numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>${headerFont}</fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${headerFill}</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${2 + numFmts.length}">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/>
${fmtXfs}
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function cellValue<T>(row: T, col: ExportColumn<T>): unknown {
  return col.value ? col.value(row) : (row as Record<string, unknown>)[col.key];
}

function autoWidths<T>(columns: ExportColumn<T>[], rows: readonly T[]): number[] {
  const sample = rows.slice(0, 200);
  return columns.map(col => {
    if (col.width) return col.width;
    let max = col.header.length;
    for (const row of sample) {
      const v = cellValue(row, col);
      const len = v instanceof Date ? 16 : String(v ?? '').length;
      if (len > max) max = len;
    }
    return Math.min(60, Math.max(8, max + 2));
  });
}

/** Builds the complete .xlsx file. */
export async function buildXlsx<T>(req: ExportRequest<T>, options: XlsxOptions = {}): Promise<Uint8Array> {
  const { columns, rows } = req;
  const sheetName = esc((options.sheetName ?? 'Data').slice(0, 31));
  const freeze = options.freezeHeader ?? true;
  const filter = options.autoFilter ?? true;
  const header = options.headerStyle ?? { bold: true, background: '#1565C0', color: '#FFFFFF' };

  // One style per distinct format string, resolved once per column. Dates
  // without an explicit format still need one (a bare serial displays as a
  // number), so the date format participates unconditionally at index 0.
  const fmtCodes: string[] = [NAMED_FORMATS['date']];
  const colStyle = columns.map(col => {
    const code = col.format
      ? (NAMED_FORMATS[col.format] ?? col.format)
      : (col.type === 'date' ? NAMED_FORMATS['date'] : null);
    if (!code) return 0;
    let i = fmtCodes.indexOf(code);
    if (i < 0) { i = fmtCodes.length; fmtCodes.push(code); }
    return 2 + i;
  });
  const dateStyle = 2; // cellXfs index of the default date format

  const lastCol = colLetter(columns.length - 1);
  const parts: string[] = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${lastCol}${rows.length + 1}"/>`);

  if (freeze) {
    parts.push(`<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`);
  }

  const widths = autoWidths(columns, options.autoWidth === false ? [] : rows);
  parts.push('<cols>');
  widths.forEach((w, i) => parts.push(`<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`));
  parts.push('</cols>');

  parts.push('<sheetData>');
  parts.push(`<row r="1">`);
  columns.forEach((col, c) => {
    parts.push(`<c r="${colLetter(c)}1" s="1" t="inlineStr"><is><t>${esc(col.header)}</t></is></c>`);
  });
  parts.push('</row>');

  for (let r = 0; r < rows.length; r++) {
    const rowRef = r + 2;
    parts.push(`<row r="${rowRef}">`);
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const raw = cellValue(rows[r], col);
      if (raw === null || raw === undefined || raw === '') continue;
      const ref = `${colLetter(c)}${rowRef}`;
      const s = colStyle[c];

      if (raw instanceof Date || col.type === 'date') {
        const d = raw instanceof Date ? raw : new Date(raw as string);
        if (!isNaN(+d)) {
          parts.push(`<c r="${ref}" s="${s || dateStyle}"><v>${dateSerial(d)}</v></c>`);
          continue;
        }
      }
      if (typeof raw === 'number' || col.type === 'number') {
        const n = Number(raw);
        if (isFinite(n)) {
          parts.push(`<c r="${ref}"${s ? ` s="${s}"` : ''}><v>${n}</v></c>`);
          continue;
        }
      }
      if (typeof raw === 'boolean') {
        parts.push(`<c r="${ref}" t="b"><v>${raw ? 1 : 0}</v></c>`);
        continue;
      }
      parts.push(`<c r="${ref}" t="inlineStr"><is><t>${esc(String(raw))}</t></is></c>`);
    }
    parts.push('</row>');
  }
  parts.push('</sheetData>');
  if (filter) parts.push(`<autoFilter ref="A1:${lastCol}${rows.length + 1}"/>`);
  parts.push('</worksheet>');

  const enc = new TextEncoder();
  return buildZip([
    { name: '[Content_Types].xml', data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`) },
    { name: '_rels/.rels', data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`) },
    { name: 'xl/workbook.xml', data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`) },
    { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`) },
    { name: 'xl/styles.xml', data: enc.encode(stylesXml(header.bold ?? true, header.background, header.color, fmtCodes)) },
    { name: 'xl/worksheets/sheet1.xml', data: enc.encode(parts.join('')) },
  ]);
}
