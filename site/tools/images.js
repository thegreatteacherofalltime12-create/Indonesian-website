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
  'hd-019': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-019.jpeg'), widths: [480, 960] },
  'hd-020': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-020.jpeg'), widths: [480, 960] },
  'hd-021': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-021.jpeg'), widths: [480, 960] },
  // holiday decor (Arga, Sep 2026)
  'hd-004': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-004.jpeg'), widths: [480, 960] },
  'hd-005': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-005.jpeg'), widths: [480, 960] },
  'hd-006': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-006.jpeg'), widths: [480, 960] },
  'hd-007': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-007.jpeg'), widths: [480, 960] },
  'hd-009': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-009.jpeg'), widths: [480, 960] },
  'hd-010': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-010.jpeg'), widths: [480, 960] },
  'hd-011': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-011.jpeg'), widths: [480, 960] },
  'hd-012': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-012.jpeg'), widths: [480, 960] },
  'hd-013': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-013.jpeg'), widths: [480, 960] },
  'hd-014': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-014.jpeg'), widths: [480, 960] },
  'hd-015': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-015.jpeg'), widths: [480, 960] },
  'hd-018': { src: path.join(SRC, 'ideas', 'christmas-2026', 'cropped', 'hd-018.jpeg'), widths: [480, 960] },
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
};
// LD thumbnails from price list 1: images 1-6 -> LD-001..006, 9-18 -> LD-007..016
const ldMap = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
ldMap.forEach((n, i) => { photos[`ld-${String(i + 1).padStart(3, '0')}`] = { src: PDF(1, n), widths: [], thumb: true }; });

// Teak sets (supplier photos, overlay text removed, Sep 2026)
for (let i = 1; i <= 12; i++) {
  const n = `ts-${String(i).padStart(3, '0')}`;
  photos[n] = { src: path.join(SRC, 'ray-jati', 'cropped', `${n}.jpeg`), widths: [480, 960] };
}

// Staged entries live in a git-ignored side file (same shape as `photos`),
// merged only while the draft catalog is flagged to publish.
const draftPhotos = path.join(__dirname, 'images-draft.js');
const draftCat = path.join(__dirname, '..', 'data', 'catalog-draft.json');
if (fs.existsSync(draftPhotos) && fs.existsSync(draftCat)
  && JSON.parse(fs.readFileSync(draftCat, 'utf8')).publish === true) {
  Object.assign(photos, require(draftPhotos)(SRC));
}

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
