/* Draws the app icon at any size: a lime tile with the leaf mark, so it reads on
   a dark tab strip and a light one. Mirrors favicon.svg — change both together. */
import { PNG } from 'pngjs';
import { createWriteStream } from 'node:fs';

const [, , out = '/tmp/icon.png', sizeArg = '180'] = process.argv;
const S = +sizeArg;
const png = new PNG({ width: S, height: S });

const LIME = [207, 239, 164];
const INK = [20, 58, 40];
const u = (v) => v / 64 * S;                 // the SVG is drawn on a 64 unit grid
const R = u(14);

const inRounded = (x, y) => {
  const cx = Math.min(Math.max(x, R), S - R);
  const cy = Math.min(Math.max(y, R), S - R);
  return Math.hypot(x - cx, y - cy) <= R;
};

/* the blade: a lens, widest at its middle, drawn from tip to tip */
const inLeaf = (x, y) => {
  const top = u(11), bottom = u(53);
  if (y < top || y > bottom) return false;
  const t = (y - top) / (bottom - top);
  const half = u(11.5) * Math.sin(Math.PI * t) ** 0.72;
  return Math.abs(x - S / 2) <= half;
};

/* midrib and two pairs of veins, cut back out of the blade in lime */
const VEINS = [
  [[32, 17.5], [32, 47.5], 1.3],
  [[32, 28.5], [24.5, 23], 1.1], [[32, 37], [24, 31.5], 1.1],
  [[32, 28.5], [39.5, 23], 1.1], [[32, 37], [40, 31.5], 1.1],
].map(([a, b, w]) => [u(a[0]), u(a[1]), u(b[0]), u(b[1]), u(w)]);

const onVein = (x, y) => VEINS.some(([x1, y1, x2, y2, w]) => {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) <= w;
});

for (let py = 0; py < S; py++) {
  for (let px = 0; px < S; px++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (const [ox, oy] of [[.25, .25], [.75, .25], [.25, .75], [.75, .75]]) {   // 4x supersample
      const x = px + ox, y = py + oy;
      if (!inRounded(x, y)) continue;
      const ink = inLeaf(x, y) && !onVein(x, y);
      const c = ink ? INK : LIME;
      r += c[0]; g += c[1]; b += c[2]; a += 255;
    }
    const i = (S * py + px) << 2;
    const n = 4;
    png.data[i] = r / n; png.data[i + 1] = g / n; png.data[i + 2] = b / n; png.data[i + 3] = a / n;
  }
}
png.pack().pipe(createWriteStream(out)).on('finish', () => console.log('wrote', out, S + 'px'));
