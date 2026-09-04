// Widen the shot into a landscape canvas by continuing its own wall and table sideways,
// so the reveal can fill the screen without cropping the callouts.
import fs from 'node:fs';
import { PNG } from 'pngjs';

const src = PNG.sync.read(fs.readFileSync(process.argv[2]));
const OUT = process.argv[3];
const W = Number(process.argv[4] || 3300), H = Number(process.argv[5] || 1500);
const pw = Math.round(H * src.width / src.height);        // photo, scaled to canvas height
const px = Math.round((W - pw) / 2);

const out = new PNG({ width: W, height: H });

// photo, box-filtered down from the original
for (let y = 0; y < H; y++) {
  const sy0 = Math.floor(y * src.height / H), sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * src.height / H));
  for (let x = 0; x < pw; x++) {
    const sx0 = Math.floor(x * src.width / pw), sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * src.width / pw));
    let r = 0, g = 0, b = 0, n = 0;
    for (let sy = sy0; sy < sy1; sy++) for (let sx = sx0; sx < sx1; sx++) {
      const i = (sy * src.width + sx) * 4;
      r += src.data[i]; g += src.data[i + 1]; b += src.data[i + 2]; n++;
    }
    const o = (y * W + px + x) * 4;
    out.data[o] = r / n; out.data[o + 1] = g / n; out.data[o + 2] = b / n; out.data[o + 3] = 255;
  }
}

// carry each row's edge colour outward. Sample a band of columns and smooth it down the
// canvas, otherwise sensor noise in a single column stripes the extension.
const BAND = 14, SMOOTH = 6;
const left = new Float64Array(H * 3), right = new Float64Array(H * 3);
for (let y = 0; y < H; y++) {
  let lr = 0, lg = 0, lb = 0, rr = 0, rg = 0, rb = 0;
  for (let k = 0; k < BAND; k++) {
    const li = (y * W + px + k) * 4, ri = (y * W + px + pw - 1 - k) * 4;
    lr += out.data[li]; lg += out.data[li + 1]; lb += out.data[li + 2];
    rr += out.data[ri]; rg += out.data[ri + 1]; rb += out.data[ri + 2];
  }
  left[y * 3] = lr / BAND; left[y * 3 + 1] = lg / BAND; left[y * 3 + 2] = lb / BAND;
  right[y * 3] = rr / BAND; right[y * 3 + 1] = rg / BAND; right[y * 3 + 2] = rb / BAND;
}
const smooth = (arr) => {
  const copy = Float64Array.from(arr);
  for (let y = 0; y < H; y++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0, n = 0;
      for (let d = -SMOOTH; d <= SMOOTH; d++) {
        const yy = y + d;
        if (yy < 0 || yy >= H) continue;
        sum += copy[yy * 3 + c]; n++;
      }
      arr[y * 3 + c] = sum / n;
    }
  }
};
smooth(left); smooth(right);

for (let y = 0; y < H; y++) {
  for (let x = 0; x < px; x++) {
    const t = x / px;                            // 0 at canvas edge, 1 at the photo
    const k = 0.90 + 0.10 * t;                   // gentle falloff outward
    const oL = (y * W + x) * 4, oR = (y * W + px + pw + (px - 1 - x)) * 4;
    for (let c = 0; c < 3; c++) {
      out.data[oL + c] = Math.round(left[y * 3 + c] * k);
      if (px + pw + (px - 1 - x) < W) out.data[oR + c] = Math.round(right[y * 3 + c] * k);
    }
    out.data[oL + 3] = 255;
    if (px + pw + (px - 1 - x) < W) out.data[oR + 3] = 255;
  }
}

fs.writeFileSync(OUT, PNG.sync.write(out, { deflateLevel: 6 }));
console.log(JSON.stringify({ canvas: `${W}x${H}`, photo: `${pw}x${H} at ${px}` }));
