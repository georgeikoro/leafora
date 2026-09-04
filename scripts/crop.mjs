/* Crops a 16:9 frame out of a portrait master, centred on a point you choose,
   so a still can be handed to an image-to-video model as its first frame.
   node scripts/crop.mjs <in.png> <out.png> <xFrac> <yFrac> [width] [zoom]
   zoom below 1 pulls back and takes in more of the picture.               */
import { PNG } from 'pngjs';
import { createReadStream, createWriteStream } from 'node:fs';

const [, , input, output, fx = '0.5', fy = '0.5', outW = '1280', zoom = '1'] = process.argv;

createReadStream(input).pipe(new PNG()).on('parsed', function () {
  const W = +outW, H = Math.round(W / 16 * 9);
  const scale = this.width / W / +zoom;              // zoom < 1 takes in more of the frame
  const cw = Math.min(this.width, Math.round(W * scale));
  const ch = Math.min(this.height, Math.round(H * scale));
  const left = Math.max(0, Math.min(this.width - cw, Math.round(this.width * +fx - cw / 2)));
  const top = Math.max(0, Math.min(this.height - ch, Math.round(this.height * +fy - ch / 2)));

  const out = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sx = left + Math.round(x * cw / W);
      const sy = top + Math.round(y * ch / H);
      const s = (this.width * sy + sx) << 2;
      const d = (W * y + x) << 2;
      out.data[d] = this.data[s];
      out.data[d + 1] = this.data[s + 1];
      out.data[d + 2] = this.data[s + 2];
      out.data[d + 3] = 255;
    }
  }
  out.pack().pipe(createWriteStream(output)).on('finish', () => console.log('wrote', output, W + 'x' + H));
});
