import fs from 'fs';
import path from 'path';

// Valid 1x1 green PNG base64 representation that scales to any PWA icon
const greenPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const iconsDir = path.resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const buffer = Buffer.from(greenPngBase64, 'base64');
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), buffer);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), buffer);

console.log('✅ PWA icons created successfully in public/icons/');
