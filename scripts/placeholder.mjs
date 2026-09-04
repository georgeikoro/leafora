// Makes a stand-in image in the house palette: an empty studio backdrop with a
// light pool from the left and a table edge, so an unfilled slot still reads as
// part of the page. Replace the JPEG it produces with the real photograph.
import { PNG } from 'pngjs';
import { createWriteStream } from 'node:fs';

const [, , out = '/tmp/placeholder.png', wArg = '900', hArg = '1200'] = process.argv;
const W = +wArg, H = +hArg;
const png = new PNG({ width: W, height: H });

const wall = [173, 190, 160];      // sage backdrop
const wallLow = [150, 170, 140];
const table = [206, 210, 188];     // the surface it stands on
const HORIZON = 0.74;

for (let y = 0; y < H; y++) {
  const fy = y / H;
  for (let x = 0; x < W; x++) {
    const fx = x / W;
    const onTable = fy > HORIZON;
    const base = onTable ? table : wall.map((c, i) => c + (wallLow[i] - c) * (fy / HORIZON));
    // daylight from the left, falling away to the right
    const pool = Math.max(0, 1 - Math.hypot(fx - 0.24, fy - 0.3) * 1.35) ** 2 * 26;
    const edge = onTable && fy < HORIZON + 0.006 ? -18 : 0;   // the table's front edge
    const vig = -Math.max(0, Math.hypot(fx - .5, fy - .5) - .42) * 90;
    const i = (W * y + x) << 2;
    for (let c = 0; c < 3; c++) {
      png.data[i + c] = Math.max(0, Math.min(255, base[c] + pool + edge + vig));
    }
    png.data[i + 3] = 255;
  }
}
png.pack().pipe(createWriteStream(out)).on('finish', () => console.log('wrote', out, W + 'x' + H));
