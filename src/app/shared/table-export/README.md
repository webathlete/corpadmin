# table-export

Dependency-free CSV / XLSX export for Angular Material tables (or any rows +
columns). The `.xlsx` writer is original code against the open ECMA-376
SpreadsheetML spec — no SheetJS, no license obligations. Compression uses the
platform-native `CompressionStream` (falls back to uncompressed entries).

**Use in any Angular project:** copy this folder; it imports nothing from the
host app. `buildCsv`/`buildXlsx` are framework-free and also run under Node.

```ts
private readonly exporter = inject(TableExportService);

const req: ExportRequest<Transaction> = {
  fileName: 'transactions',
  columns: [
    { key: 'id', header: 'Txn ID' },
    { key: 'amount', header: 'Amount', type: 'number', format: 'currency' },
    { key: 'date', header: 'Date', type: 'date' },              // real Excel date
    { key: 'growth', header: 'Growth', format: '0.0%' },        // custom format
    { key: 'name', header: 'Customer', width: 30,
      value: r => r.firstName + ' ' + r.lastName },             // computed
  ],
  rows: this.rows(),
};

this.exporter.exportCsv(req, { delimiter: ';' });
await this.exporter.exportXlsx(req, {
  sheetName: 'Q3',
  freezeHeader: true,                    // default
  autoFilter: true,                      // default
  headerStyle: { bold: true, background: '#1565C0', color: '#FFFFFF' },
});
```

Named formats: `integer`, `decimal`, `currency`, `percent`, `date`,
`datetime` — or pass any Excel format string. Columns auto-size from a data
sample unless `width` is set. Large datasets are fine: inline strings keep
memory proportional to output (100k rows benchmarked in a couple of seconds).
