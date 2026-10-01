// Remove a rectangular watermark label (e.g. a white box with a shop name and
// phone number) by filling it from the surrounding pixels.
// Usage: node tools/clean-box.js <src> <out> x0,y0,x1,y1 [x0,y0,x1,y1 ...]
// Boxes are pixel coordinates in the source image. Each box is padded by 4 px,
// filled onion-peel style from its border inward, then softened with a blur
// and a little grain so it doesn't read as a flat patch.
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'site', 'node_modules', 'sharp'));

const [, , src, out, ...boxArgs] = process.argv;
if (!src || !out || !boxArgs.length) { console.error('usage: clean-box <src> <out> x0,y0,x1,y1 [...]'); process.exit(1); }

(async () => {
  const { data, info } = await sharp(src).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const mask = new Uint8Array(W * H);
  for (const b of boxArgs) {
    const [x0, y0, x1, y1] = b.split(',').map(Number);
    for (let y = Math.max(0, y0 - 4); y < Math.min(H, y1 + 4); y++)
      for (let x = Math.max(0, x0 - 4); x < Math.min(W, x1 + 4); x++) mask[y * W + x] = 1;
  }
  const filled = Buffer.from(data);
  const todo = new Uint8Array(mask);
  let remaining = todo.reduce((s, v) => s + v, 0);
  const total = remaining;
  while (remaining > 0) {
    const ring = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!todo[i]) continue;
      let r = 0, g = 0, bl = 0, n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (!todo[j]) { const p = j * C; r += filled[p]; g += filled[p + 1]; bl += filled[p + 2]; n++; }
      }
      if (n) ring.push([i, r / n, g / n, bl / n]);
    }
    if (!ring.length) break;
    for (const [i, r, g, bl] of ring) { const p = i * C; filled[p] = r; filled[p + 1] = g; filled[p + 2] = bl; todo[i] = 0; remaining--; }
  }
  const blurred = await sharp(filled, { raw: { width: W, height: H, channels: C } }).blur(3).raw().toBuffer();
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5) * 10;
  for (let i = 0; i < W * H; i++) if (mask[i]) {
    const p = i * C; const g = rnd();
    for (let c = 0; c < 3; c++) filled[p + c] = Math.max(0, Math.min(255, blurred[p + c] + g));
  }
  await sharp(filled, { raw: { width: W, height: H, channels: C } }).jpeg({ quality: 92, mozjpeg: true }).toFile(out);
  console.log(`ok ${W}x${H}, filled ${total}px in ${boxArgs.length} box(es)`);
})();
