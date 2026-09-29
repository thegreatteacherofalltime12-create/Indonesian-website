// Remove white overlay text from a photo by inpainting from surrounding texture.
// Usage: node tools/clean-overlay.js <src> <out> --y0 0.55 --y1 0.75
//        [--x0 0] [--x1 1] [--thr 205] [--dilate 4] [--maxcomp 0.02]
// Mask = near-white pixels (min channel > thr) inside the given band, keeping only
// text-sized connected components (area <= maxcomp of the image, so white walls,
// plastic wrap and sky survive). Fill = onion-peel average, then local blur.
const sharp = require(require('path').join(__dirname, '..', 'site', 'node_modules', 'sharp'));

const [, , src, out, ...rest] = process.argv;
const opt = { y0: 0, y1: 1, x0: 0, x1: 1, thr: 205, dilate: 4, maxcomp: 0.02 };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace('--', '')] = parseFloat(rest[i + 1]);
if (!src || !out) { console.error('usage: clean-overlay <src> <out> --y0 F --y1 F [...]'); process.exit(1); }

(async () => {
  const img = sharp(src).rotate();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const N = W * H;
  const y0 = Math.floor(opt.y0 * H), y1 = Math.ceil(opt.y1 * H);
  const x0 = Math.floor(opt.x0 * W), x1 = Math.ceil(opt.x1 * W);

  // 1) raw whiteness mask inside the band
  const mask = new Uint8Array(N);
  let raw = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = (y * W + x) * C;
    if (Math.min(data[p], data[p + 1], data[p + 2]) > opt.thr) { mask[y * W + x] = 1; raw++; }
  }

  // 2) connected components (4-conn); drop oversized ones (real white objects)
  const label = new Int32Array(N).fill(-1);
  const maxArea = opt.maxcomp * N;
  let dropped = 0, kept = 0;
  const stack = [];
  for (let i = 0; i < N; i++) {
    if (!mask[i] || label[i] !== -1) continue;
    stack.length = 0; stack.push(i); label[i] = 1;
    const comp = [i];
    while (stack.length) {
      const q = stack.pop();
      const qy = (q / W) | 0, qx = q % W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = qx + dx, ny = qy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (mask[n] && label[n] === -1) { label[n] = 1; stack.push(n); comp.push(n); }
      }
    }
    if (comp.length > maxArea) { for (const q of comp) mask[q] = 0; dropped++; }
    else kept++;
  }

  // 3) dilate
  for (let d = 0; d < opt.dilate; d++) {
    const grow = [];
    for (let y = Math.max(0, y0 - opt.dilate); y < Math.min(H, y1 + opt.dilate); y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (mask[i]) continue;
        const up = y > 0 && mask[i - W], dn = y < H - 1 && mask[i + W];
        const lf = x > 0 && mask[i - 1], rt = x < W - 1 && mask[i + 1];
        if (up || dn || lf || rt) grow.push(i);
      }
    for (const i of grow) mask[i] = 1;
  }
  const masked = mask.reduce((s, v) => s + v, 0);

  // 4) onion-peel fill
  const filled = Buffer.from(data);
  const todo = new Uint8Array(mask);
  let remaining = masked;
  while (remaining > 0) {
    const ring = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!todo[i]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (!todo[j]) { const p = j * C; r += filled[p]; g += filled[p + 1]; b += filled[p + 2]; n++; }
      }
      if (n) ring.push([i, r / n, g / n, b / n]);
    }
    if (!ring.length) break;
    for (const [i, r, g, b] of ring) {
      const p = i * C;
      filled[p] = r; filled[p + 1] = g; filled[p + 2] = b;
      todo[i] = 0; remaining--;
    }
  }

  // 5) blur the filled area only (hide onion-peel streaks)
  const blurred = await sharp(filled, { raw: { width: W, height: H, channels: C } }).blur(2.2).raw().toBuffer();
  for (let i = 0; i < N; i++) if (mask[i]) {
    const p = i * C;
    filled[p] = blurred[p]; filled[p + 1] = blurred[p + 1]; filled[p + 2] = blurred[p + 2];
  }

  await sharp(filled, { raw: { width: W, height: H, channels: C } }).jpeg({ quality: 92, mozjpeg: true }).toFile(out);
  console.log(`ok ${W}x${H} band y ${y0}-${y1} x ${x0}-${x1} | raw ${raw}px, comps kept ${kept} dropped ${dropped}, inpainted ${masked}px`);
})();
