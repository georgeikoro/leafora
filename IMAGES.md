# Images this page needs

All slots are filled with your generated images. The web-ready JPEGs live in `assets/`;
the full-resolution masters you supplied are kept in `assets/source/` and are not served.

To change an image: drop the new master in `assets/source/` under the same name, then
re-run the matching command in "Rebuilding" at the bottom.

## House style

Paste this in front of every prompt so the set looks like one shoot:

> Editorial studio product photograph, single houseplant, soft diffused daylight from the
> left, gentle shadow falling right, matte seamless backdrop, no props, no text, no people,
> shallow depth of field, muted natural colour, shot on 85mm, high resolution, centred
> composition with generous headroom.

Keep the same backdrop tone across a pair (card + hover) so the cross-fade doesn't jump.

## The collection cards

Six images, three pairs. Portrait **3:4**, export at **900px tall or larger**, JPEG.
The first is what you see; the second is what the card cross-fades to on hover.

| Save as | Slot | Prompt |
|---|---|---|
| `card-fig.jpg` | Card 1, resting | Fiddle leaf fig in a terracotta pot on a slim walnut plant stand, pale lavender-grey seamless backdrop, leaves broad and glossy, full plant in frame |
| `card-fig-alt.jpg` | Card 1, hover | The same fiddle leaf fig in a sunlit apartment corner beside a cane chair, white walls, parquet floor, soft window light, lifestyle interior |
| `card-glass.jpg` | Card 2, resting | Monstera cutting growing bare-root in a clear glass vessel, dark soil above, roots and gravel visible through the water, sage green seamless backdrop |
| `card-glass-alt.jpg` | Card 2, hover | Close crop of the same glass vessel, roots and water filling the frame, sage green backdrop, macro detail on the root system |
| `card-monstera.jpg` | Card 3, resting | Monstera deliciosa in a speckled cream ceramic pot, sage green seamless backdrop, five or six fenestrated leaves, full plant in frame |
| `card-monstera-alt.jpg` | Card 3, hover | The same monstera on a low oak console in a bright minimal living room, linen curtain diffusing the light, lifestyle interior |

Adding a fourth card is a copy-paste of one `<li class="plant">` block in `index.html`
plus two more files here.

## The hero (needs a rebuild after swapping)

Portrait **3:4**, **1760 x 2352 or larger**. These two must be the *same plant in the same
position*, because the spotlight cross-references them pixel for pixel.

| Save as | Slot | Prompt |
|---|---|---|
| `source/monstera.png` | Hero photograph | Monstera deliciosa in a speckled cream ceramic pot on a pale sage surface against a sage green wall, soft daylight from the left, whole plant with headroom above the tallest leaf |
| `source/silhouette.png` | Hero x-ray, seen through the cursor lens | The identical monstera, identical camera position and lighting, but planted in a clear glass vessel: soil, root system, water line and gravel all visible through the glass |

## Rebuilding

Cards and avatars are a straight resize:

```bash
# one card, repeat per name
sips -Z 900 assets/source/card-fig.png --out /tmp/c.png && sips -s format jpeg -s formatOptions 80 /tmp/c.png --out assets/card-fig.jpg

# one avatar: centre-cropped square
sips -c 1152 1152 assets/source/avatar-1.png --out /tmp/a.png && sips -Z 320 /tmp/a.png --out /tmp/a2.png && sips -s format jpeg -s formatOptions 82 /tmp/a2.png --out assets/avatar-1.jpg
```

The two hero images also need their wall extended sideways, so they can fill any screen:

```bash
npm i pngjs
node scripts/widen.mjs assets/source/monstera.png /tmp/wide.png 4469 2352 && sips -s format jpeg -s formatOptions 74 /tmp/wide.png --out assets/plant-wide.jpg
node scripts/widen.mjs assets/source/silhouette.png /tmp/xray.png 3300 1737 && sips -s format jpeg -s formatOptions 78 /tmp/xray.png --out assets/plant-xray.jpg
```

If a new hero shot is framed differently, the resting circle's crop is set by `CANOPY_X`,
`CANOPY_Y` and `CIRCLE_SHARE` near the top of `script.js` (currently `890/1760`, `830/2352`
and `980/1760`: the point the circle centres on and how much of the width it holds).

## The care section

One image, portrait **3:4**, export at **900px tall or larger**, JPEG. Filled: the master is
`assets/source/care.png` (1536 x 2048), served as `assets/care.jpg` at 900 x 1200.

| Save as | Slot | Prompt |
|---|---|---|
| `care.jpg` | "Nobody is born with a green thumb" | Editorial studio photograph, a pair of hands misting a monstera deliciosa with a brass mister, plant in a speckled cream ceramic pot, sage green seamless backdrop, soft diffused daylight from the left, water droplets catching the light on the leaves, shallow depth of field, no face in frame, muted natural colour, shot on 85mm, portrait orientation with generous headroom |

Rebuild after swapping the master:

```bash
sips -Z 1200 assets/source/care.png --out /tmp/c.png && sips -s format jpeg -s formatOptions 80 /tmp/c.png --out assets/care.jpg
```

`scripts/placeholder.mjs` still makes an empty studio backdrop in the house palette if a
future slot needs a stand-in: `node scripts/placeholder.mjs /tmp/x.png 900 1200`.

## The shop catalogue

All nine products have their own pair now. Masters live in `assets/source/`, served from
`assets/` at 673 x 900. The pairs are `card-<name>.jpg` (resting) and `card-<name>-alt.jpg`
(what the card cross-fades to on hover): `fig`, `glass`, `monstera`, `shade-fig`,
`desk-cutting`, `corner-monstera`, `window-fig`, `glass-trio`, `studio-monstera`.

To swap one, drop the new master in `assets/source/` under the same name and re-run:

```bash
sips -Z 900 assets/source/card-shade-fig.png --out /tmp/c.png && sips -s format jpeg -s formatOptions 80 /tmp/c.png --out assets/card-shade-fig.jpg
```

Which file a product uses is set by `img` and `alt` in `products.js`; the grid in
`plants/index.html` carries the same two filenames, so change both.

## Pots and tools

Six slots, currently holding the generated stand-in (an empty studio backdrop). Portrait
**3:4**, 900px tall or larger, JPEG, same house style as the plants so the two catalogues
sit together.

| Save as | Prompt |
|---|---|
| `pot-speckled.jpg` | Empty speckled cream stoneware plant pot with matching saucer, sage green seamless backdrop, soft daylight from the left, three-quarter view, no plant |
| `pot-terracotta.jpg` | Empty unglazed terracotta plant pot with saucer, warm clay tone, sage green seamless backdrop, soft daylight from the left, no plant |
| `pot-glass.jpg` | Empty hand-blown clear glass propagation vessel, wide belly and narrow neck, sage green seamless backdrop, light catching the rim |
| `tool-mister.jpg` | Solid brass plant mister with a fine nozzle, standing upright, sage green seamless backdrop, soft daylight from the left |
| `tool-meter.jpg` | Simple analogue soil moisture meter with a needle dial and a metal probe, laid flat, sage green seamless backdrop |
| `tool-snips.jpg` | Short-bladed carbon steel garden snips with dark handles, laid at an angle, sage green seamless backdrop |

Rebuild each one with:

```bash
sips -Z 1200 assets/source/pot-speckled.png --out /tmp/c.png && sips -s format jpeg -s formatOptions 80 /tmp/c.png --out assets/pot-speckled.jpg
```

## Avatars

| Save as | Slot | Prompt |
|---|---|---|
| `source/avatar-1.png` … `-3.png` | The "20K+ happy plant parents" row | Friendly portrait, natural light, plain background, shoulders up, relaxed expression |
