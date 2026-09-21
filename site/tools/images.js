// Build web images from the client photo set (kept out of git) into public/images.
// Run: node tools/images.js   (from site/)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../../client-docs');
const OUT = path.resolve(__dirname, '../public/images');
const WA = n => path.join(SRC, 'photos', `WhatsApp Image 2026-09-17 at ${n}.jpeg`);
const PDF = (list, n) => path.join(SRC, 'pdf-images', String(list), `p${list}-${String(n).padStart(3, '0')}.jpg`);

// name -> { src, widths, crop? }
const photos = {
  // hero + workshops (large)
  'hero': { src: WA('07.49.34'), widths: [640, 1200, 1600] },
  'ws-weaving': { src: WA('07.49'), widths: [480, 960, 1200] },
  'ws-teak-tops': { src: WA('07.49.3'), widths: [480, 960, 1200] },
  'ws-qc-papasan': { src: WA('07.49.35'), widths: [480, 960, 1200] },
  'ws-assembly': { src: WA('07.49.36'), widths: [480, 960, 1200] },
  'ws-wrapping': { src: WA('07.49.334'), widths: [480, 960, 1200] },
  'ws-packed': { src: WA('07.49.37'), widths: [480, 960, 1200] },
  'ws-packed-2': { src: WA('07.49.32'), widths: [480, 960] },
  'ws-lamp-frames': { src: WA('07.49.321'), widths: [480, 960] },
  // own product photos
  'wall-plates-sunburst': { src: path.join(SRC, 'photos', '5.jpeg'), widths: [480, 960, 1200] },
  'wall-plates-ray': { src: WA('07.49.29855'), widths: [480, 720] },
  'wall-plates-ray-2': { src: WA('07.49.27'), widths: [480, 720] },
  'wall-plates-star': { src: WA('07.49.285555'), widths: [480, 720] },
  'lamp-onion': { src: WA('07.49.2365565'), widths: [480, 720] },
  'lamp-cone': { src: WA('07.49.24656565'), widths: [480, 960] },
  'teak-stool': { src: WA('07.49.273333'), widths: [480, 720] },
  'papasan': { src: WA('07.49.272'), widths: [480] },
  // credentials (cropped from the price-list header image)
  'v-legal': { src: PDF(1, 8), widths: [240, 480] },
  'bsci': { src: PDF(1, 7), widths: [320, 640], crop: { left: 0, top: 0, width: 640, height: 411 } },
  'lemongrass-logo': { src: PDF(1, 7), widths: [320, 640], crop: { left: 640, top: 0, width: 423, height: 411 } },
};
// LD thumbnails from price list 1: images 1-6 -> LD-001..006, 9-18 -> LD-007..016
const ldMap = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
ldMap.forEach((n, i) => { photos[`ld-${String(i + 1).padStart(3, '0')}`] = { src: PDF(1, n), widths: [], thumb: true }; });

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = {};
  for (const [name, spec] of Object.entries(photos)) {
    if (!fs.existsSync(spec.src)) { console.warn('missing', name, spec.src); continue; }
    let img = sharp(spec.src).rotate();
    if (spec.crop) img = img.extract(spec.crop);
    const meta = await img.metadata();
    const entry = { widths: [], w: meta.width, h: meta.height };
    if (spec.thumb) {
      // tiny price-list thumbnails: keep native size, just re-encode
      await img.clone().jpeg({ quality: 86 }).toFile(path.join(OUT, `${name}.jpg`));
      await img.clone().webp({ quality: 84 }).toFile(path.join(OUT, `${name}.webp`));
      entry.widths = [meta.width];
    } else {
      for (const w of spec.widths) {
        if (w > meta.width * 1.05) continue;
        await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 72, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.webp`));
        entry.widths.push(w);
      }
      const fallbackW = entry.widths.includes(960) ? 960 : entry.widths[entry.widths.length - 1] || meta.width;
      await img.clone().resize({ width: fallbackW, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(OUT, `${name}.jpg`));
      entry.fallbackW = fallbackW;
    }
    manifest[name] = entry;
    console.log(name, entry.widths.join('/'));
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
}
run().catch(e => { console.error(e); process.exit(1); });
