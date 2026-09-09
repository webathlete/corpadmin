/**
 * Minimal ZIP writer — framework-free, no dependencies.
 *
 * Entries are DEFLATE-compressed through the browser/Node-native
 * `CompressionStream` when available, and stored uncompressed otherwise, so
 * there is no third-party compressor and no license baggage. 32-bit sizes
 * only (files < 4 GB), which is ample for spreadsheet exports.
 */

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([data as BlobPart]).stream()
    .pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** DOS date/time fields for the entry headers. */
function dosDateTime(d: Date): { date: number; time: number } {
  return {
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  };
}

/** Builds a complete ZIP archive from the given entries. */
export async function buildZip(entries: ZipEntry[]): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const now = dosDateTime(new Date());
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);

    // Skip compression for tiny entries where it cannot pay for itself.
    let method = 0;
    let payload = entry.data;
    if (entry.data.length > 256) {
      const deflated = await deflateRaw(entry.data);
      if (deflated && deflated.length < entry.data.length) {
        method = 8;
        payload = deflated;
      }
    }

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);              // version needed
    local.setUint16(8, method, true);
    local.setUint16(10, now.time, true);
    local.setUint16(12, now.date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, payload.length, true); // compressed size
    local.setUint32(22, entry.data.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, payload);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true);                // version made by
    dir.setUint16(6, 20, true);                // version needed
    dir.setUint16(10, method, true);
    dir.setUint16(12, now.time, true);
    dir.setUint16(14, now.date, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, payload.length, true);
    dir.setUint32(24, entry.data.length, true);
    dir.setUint16(28, nameBytes.length, true);
    dir.setUint32(42, offset, true);           // local header offset
    central.push(new Uint8Array(dir.buffer), nameBytes);

    offset += 30 + nameBytes.length + payload.length;
  }

  const dirSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, dirSize, true);
  end.setUint32(16, offset, true);

  const total = offset + dirSize + 22;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of [...parts, ...central, new Uint8Array(end.buffer)]) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}
