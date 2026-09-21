// Extract embedded JPEG images from the price-list PDFs (no dependencies).
// Usage: node tools/extract-pdf-images.js <pdf> <outDir> <prefix>
const fs = require('fs');
const path = require('path');
const [, , pdfPath, outDir, prefix = 'img'] = process.argv;
if (!pdfPath || !outDir) { console.error('usage: node extract-pdf-images.js <pdf> <outDir> <prefix>'); process.exit(1); }
const buf = fs.readFileSync(pdfPath);
fs.mkdirSync(outDir, { recursive: true });
let count = 0, pos = 0;
const latin = buf.toString('latin1');
while (true) {
  const objStart = latin.indexOf('/DCTDecode', pos);
  if (objStart < 0) break;
  const streamKw = latin.indexOf('stream', objStart);
  if (streamKw < 0) break;
  let dataStart = streamKw + 6;
  if (latin[dataStart] === '\r') dataStart++;
  if (latin[dataStart] === '\n') dataStart++;
  const end = latin.indexOf('endstream', dataStart);
  if (end < 0) break;
  let dataEnd = end;
  while (dataEnd > dataStart && (latin[dataEnd - 1] === '\n' || latin[dataEnd - 1] === '\r')) dataEnd--;
  const img = buf.subarray(dataStart, dataEnd);
  if (img[0] === 0xff && img[1] === 0xd8) {
    count++;
    fs.writeFileSync(path.join(outDir, `${prefix}-${String(count).padStart(3, '0')}.jpg`), img);
  }
  pos = end + 9;
}
console.log(`${count} images -> ${outDir}`);
