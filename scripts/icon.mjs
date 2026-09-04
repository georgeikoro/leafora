/* Draws the app icon at any size: a lime tile with the mark, so it reads on
   a dark tab strip and a light one. Mirrors favicon.svg — change both together. */
import { PNG } from 'pngjs';
import { createWriteStream } from 'node:fs';

const [, , out = '/tmp/icon.png', sizeArg = '180'] = process.argv;
const S = +sizeArg;
const png = new PNG({ width: S, height: S });

const LIME = [207, 239, 164];
const INK = [20, 58, 40];

/* favicon.svg draws the mark inside a 40-unit group set with
   transform="translate(10,10) scale(1.1)" on the 64-unit grid; this maps a
   point or a length the same way, then down to the S×S canvas. */
const point = (x, y) => [(10 + x * 1.1) / 64 * S, (10 + y * 1.1) / 64 * S];
const length = (v) => v * 1.1 / 64 * S;
const R = 14 / 64 * S;

const inRounded = (x, y) => {
  const cx = Math.min(Math.max(x, R), S - R);
  const cy = Math.min(Math.max(y, R), S - R);
  return Math.hypot(x - cx, y - cy) <= R;
};

/* sample a cubic bezier (control points in the mark's own 0–40 space) into a
   polyline of points already mapped onto the canvas */
const cubic = (p0, p1, p2, p3, steps = 24) => {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, it = 1 - t;
    const x = it ** 3 * p0[0] + 3 * it * it * t * p1[0] + 3 * it * t * t * p2[0] + t ** 3 * p3[0];
    const y = it ** 3 * p0[1] + 3 * it * it * t * p1[1] + 3 * it * t * t * p2[1] + t ** 3 * p3[1];
    pts.push(point(x, y));
  }
  return pts;
};

/* the ring */
const [ccx, ccy] = point(20, 20);
const ring = { cx: ccx, cy: ccy, r: length(18), w: length(1.8) };

/* the sprout: a stem plus two leaf halves, each half a pair of cubic curves
   meeting at a tip — the same numbers as the nav's own SVG mark */
const STROKES = [
  { pts: [point(20, 32), point(20, 26)], w: length(1.7) },
  { pts: [...cubic([20, 29], [20, 22.4], [23.4, 18.4], [29.4, 17.6]),
          ...cubic([29.4, 17.6], [29, 24.4], [25.6, 28.2], [20, 29])], w: length(1.7) },
  { pts: [...cubic([19, 24], [14.4, 24], [11.4, 21], [11, 15.6]),
          ...cubic([11, 15.6], [16, 16.2], [19, 19], [19, 24])], w: length(1.7) },
];

const onStroke = (x, y) => {
  if (Math.abs(Math.hypot(x - ring.cx, y - ring.cy) - ring.r) <= ring.w / 2) return true;
  return STROKES.some(({ pts, w }) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const dx = x2 - x1, dy = y2 - y1;
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
      if (Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) <= w / 2) return true;
    }
    return false;
  });
};

for (let py = 0; py < S; py++) {
  for (let px = 0; px < S; px++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (const [ox, oy] of [[.25, .25], [.75, .25], [.25, .75], [.75, .75]]) {   // 4x supersample
      const x = px + ox, y = py + oy;
      if (!inRounded(x, y)) continue;
      const c = onStroke(x, y) ? INK : LIME;
      r += c[0]; g += c[1]; b += c[2]; a += 255;
    }
    const i = (S * py + px) << 2;
    const n = 4;
    png.data[i] = r / n; png.data[i + 1] = g / n; png.data[i + 2] = b / n; png.data[i + 3] = a / n;
  }
}
png.pack().pipe(createWriteStream(out)).on('finish', () => console.log('wrote', out, S + 'px'));
