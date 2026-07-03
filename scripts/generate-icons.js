// One-off script that draws a simple "K" monogram and encodes it straight to
// PNG bytes (no image libraries available in this environment). Run with:
//   node scripts/generate-icons.js
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const BG = [15, 17, 21]; // matches --bg
const FG = [79, 209, 165]; // matches --accent

// classic 5x7 bitmap glyph for "K"
const GLYPH = [
  "1  1",
  "1 1 ",
  "11  ",
  "1 1 ",
  "1  1",
];
const GLYPH_W = 4;
const GLYPH_H = 5;

function buildPixels(size) {
  const pixels = new Uint8Array(size * size * 4);
  const glyphScale = Math.floor((size * 0.55) / Math.max(GLYPH_W, GLYPH_H));
  const glyphPixelW = GLYPH_W * glyphScale;
  const glyphPixelH = GLYPH_H * glyphScale;
  const offsetX = Math.floor((size - glyphPixelW) / 2);
  const offsetY = Math.floor((size - glyphPixelH) / 2);
  const radius = size * 0.18; // rounded-square corners

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const inCorner =
        (x < radius && y < radius && dist(x, y, radius, radius) > radius) ||
        (x >= size - radius && y < radius && dist(x, y, size - radius, radius) > radius) ||
        (x < radius && y >= size - radius && dist(x, y, radius, size - radius) > radius) ||
        (x >= size - radius && y >= size - radius && dist(x, y, size - radius, size - radius) > radius);

      let color = FG;
      if (inCorner) {
        color = BG;
      } else {
        const gx = Math.floor((x - offsetX) / glyphScale);
        const gy = Math.floor((y - offsetY) / glyphScale);
        if (gy >= 0 && gy < GLYPH_H && gx >= 0 && gx < GLYPH_W && GLYPH[gy][gx] === "1") {
          color = BG;
        }
      }

      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = 255;
    }
  }
  return pixels;
}

function dist(x, y, cx, cy) {
  return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(size, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk("IHDR", ihdrData);

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idatData = zlib.deflateSync(raw);
  const idat = chunk("IDAT", idatData);

  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function generate(size, filePath) {
  const pixels = buildPixels(size);
  const png = encodePNG(size, Buffer.from(pixels));
  fs.writeFileSync(filePath, png);
  console.log(`Wrote ${filePath} (${size}x${size})`);
}

const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "icons");
fs.mkdirSync(iconsDir, { recursive: true });

generate(192, path.join(iconsDir, "icon-192.png"));
generate(512, path.join(iconsDir, "icon-512.png"));
generate(180, path.join(iconsDir, "apple-touch-icon.png"));
generate(32, path.join(root, "favicon.png"));
