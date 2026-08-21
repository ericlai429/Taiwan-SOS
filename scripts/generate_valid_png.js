import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA (color type 6)
  ihdr.writeUInt8(0, 10); // Compression 0
  ihdr.writeUInt8(0, 11); // Filter 0
  ihdr.writeUInt8(0, 12); // Interlace 0

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw Image Data (Scanlines)
  const scanlines = [];
  for (let y = 0; y < height; y++) {
    scanlines.push(0); // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      // Draw green shield circle in center
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < width * 0.45) {
        scanlines.push(r, g, b, 255); // Green center
      } else {
        scanlines.push(2, 6, 23, 255); // Dark slate background #020617
      }
    }
  }

  const rawBuffer = Buffer.from(scanlines);
  const compressed = zlib.deflateSync(rawBuffer);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);

  const crcData = chunk.subarray(4, 8 + len);
  const crc = crc32(crcData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Simple CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate Emerald Green (#16a34a -> 22, 163, 74) 192x192 and 512x512 icons
const icon192 = createPng(192, 192, 22, 163, 74);
const icon512 = createPng(512, 512, 22, 163, 74);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);

// Also write directly to dist/icons if dist exists
const distIconsDir = path.resolve('dist', 'icons');
if (fs.existsSync('dist')) {
  if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir, { recursive: true });
  fs.writeFileSync(path.join(distIconsDir, 'icon-192.png'), icon192);
  fs.writeFileSync(path.join(distIconsDir, 'icon-512.png'), icon512);
}

console.log('✅ Generated 100% valid PWA PNG icons (192x192 & 512x512)!');
