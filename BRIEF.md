# Leafora

A one-line version: **an online plant shop that sells nine plants slowly, and stays
reachable for as long as you own one.**

This file exists so anyone (or anything) generating copy, images or film for the site
knows what it is actually about. The video prompt is at the bottom.

---

## What the business is

Leafora grows houseplants in a greenhouse in Kent and sells them online from a room in
Hackney. Two places, one idea: a plant is not a product you ship, it is a living thing
that has to survive the journey and then survive your flat.

The catalogue is deliberately small. Nine plants, three species: monstera deliciosa,
ficus lyrata, and rooted cuttings in glass. Prices run £28 to £164.

The thing that makes it different is not the plants. It is the eighteen months before
the sale and the years after it:

**Before.** A cutting roots in water where it can be watched. It goes into a peat-free
mix of bark, coir and pumice. It is grown slowly, without the growth regulators that
keep commercial plants compact on a shelf, and then it spends its final month in an
ordinary room with ordinary windows and ordinary heating, so the shock of moving into a
house happens in Hackney rather than in your hallway.

**After.** Every plant arrives with a care card written for that species. A weekly
message tells you the week it needs water, and reply STOP and it stops. Send a
photograph of anything that looks wrong and a grower who has actually grown that plant
answers within a working day. If it dies inside thirty days it is replaced, no return
postage and no argument.

## Who it is for

People who have killed a plant before and assume that means they cannot keep one. The
site's whole argument is that most houseplants indoors are drowned by someone being
careful, and that the fix is information rather than talent. There is no green thumb.

## What the site refuses to do

This matters as much as what it sells, and it shapes every piece of copy:

Nothing is sold that was not grown here. Nothing ships into a cold snap; the order waits
and the customer is told it is waiting. Nothing is dyed, painted, glued or glittered. No
photograph shows a bigger plant than the one in the box. And the air-purifying claim,
which is on half the plant labels in the country, is argued against at length in the
journal because the research does not hold up.

## Voice

Plain, specific, and quietly confident. Short sentences. Real numbers instead of
adjectives: eighteen months, one plant in ninety, two degrees, thirty days.

It is friendly but not chatty, and never cute. It admits things: that a claim is
overstated, that an email is unpopular, that nothing on the pet-safe page is pet safe.
It explains the reason behind an instruction rather than just giving the instruction.

Avoid: "thrive", "elevate", "curated", "wellness", "little green friends", exclamation
marks, and any sentence that would fit on any plant shop's website.

## Look

| | |
|---|---|
| Deep green | `#143A28` and `#0E2C1E`, the main surface |
| Lime | `#CFEFA4`, the accent, and the footer ground |
| Cream / paper | `#F6F8F0` and `#F7F2E6`, the light sections |
| Forest | `#1C4A2E`, text on light grounds |
| Display type | Cabinet Grotesk, 800 |
| Text type | Switzer, 400 to 600 |

Photography is a consistent studio set: a single plant, matte sage backdrop, soft
diffused daylight from the left, a gentle shadow falling right, muted natural colour,
no props and no faces. Where hands appear they are hands doing something, cropped at
the forearm.

The interface is calm: generous space, one accent colour, soft multi-stop gradients,
no hard shadows.

## The site, page by page

The **home page** opens on a dark green screen with a monstera inside a ring of orbiting
icons; scrolling opens that circle into a full-screen photograph with callouts pointing
at real detail on the plant. Then the collection, the care promise, the film section,
three journal pieces, and a closing invitation to start with one plant.

Beyond it: a filterable shop (by light, water and size), a page per plant, a care guide
with a six-symptom diagnosis tool, per-species care pages, a journal, an about page, a
contact page built around sending photographs, plus basket, checkout, account, saved
list, gift cards, pots and tools, and the legal pages.

---

# The film

## Where it goes

The home page, in a section headed **"Eighteen months, in ninety seconds"**, with this
standfirst:

> A cutting goes into water in March. What comes out the other end is a plant with a stem
> thick enough to hold its own leaves up. Most of what happens in between is waiting, so
> we sped it up.

## The finished film

Done. Five clips shot to spec (`assets/source/The cutting.mp4`, `Potting.mp4`,
`Growing.mp4`, `The room.mp4`, `logo outro.mp4`) are cut together with short crossfades
(0.6s between the plant shots, 0.35s into the outro so its draw-on isn't washed out) into
one 31-second reel, no audio, 1280x720, and it is live on the home page.

The poster (`assets/film-poster.jpg`) is the video's own opening frame, not a separate
photograph, so what you see before pressing play now matches what plays.

## Technical

Save a new cut as **`public/assets/film.mp4`**, not `assets/film.mp4`. This is the one
path on the whole site that has to live under `public/`: the film section reads it via
`fetch('/assets/film.mp4')` inside `shop.js` rather than a `src=` attribute, so Vite's
build never sees the reference and won't copy or hash it — a file left in the plain
`assets/` folder plays fine in `npm run dev` and then 404s the moment it's actually
deployed. `public/assets/film.mp4` is copied to `dist/assets/film.mp4` byte-for-byte at
the exact path the fetch expects, in dev and in production alike. Nothing else about the
section needs to change; it detects the file and switches itself on.

- **MP4, H.264**, 1920×1080 or 1280×720, 16:9
- **No audio.** It plays muted and loops
- Keep it under about 8MB so it does not dominate the page weight
- Regenerate the poster from the new cut's first frame rather than reusing an old one:
  `ffmpeg -y -ss 0.6 -i public/assets/film.mp4 -vframes 1 -q:v 2 assets/film-poster.jpg`

## Text to video, or image to video

The prompts below are written as **text to video**, which is the fallback. Prefer
**image to video** wherever you can: it starts from photography that already matches the
rest of the site, so the greens, the sage backdrop and the light direction come out
consistent instead of approximately right.

Ready-cut first frames are in `assets/film-refs/`, all 1280x720 so the model returns 16:9
rather than a portrait crop:

| File | Use it for | What it shows |
|---|---|---|
| `single-shot-misting.jpg` | The one-shot version | Hands, brass mister, droplets mid-air. Same frame as the section poster |
| `shot-1-cutting.jpg` | Shot 1, the cutting | Three glass vessels, white roots lit from behind |
| `shot-3-growing.jpg` | Shot 3, growing | The full plant in its speckled pot against the sage wall |
| `shot-4-room.jpg` | Shot 4, the room | The same plant on an oak console, curtain light |

There is no reference frame for **shot 2, the potting**, because we have never
photographed hands in soil. Either generate that still first in the house style (bark and
pumice mix, terracotta pot, sage backdrop, hands cropped at the forearm, no faces) and
then animate it, or run that shot text to video and grade it to match.

When you use a reference frame, keep the prompt short and describe **only the movement**.
The still already carries the look, and repeating it tends to make the model redraw the
scene rather than move it. For example, with `single-shot-misting.jpg`:

> Static camera. The hands finish misting and withdraw from frame to the right. Water
> droplets run slowly down the leaves. Nothing else moves.

To re-cut a frame, or pull one from a different photograph:

```bash
node scripts/crop.mjs assets/source/card-monstera.png /tmp/f.png 0.5 0.52 1280 0.72 && sips -s format jpeg -s formatOptions 84 /tmp/f.png --out assets/film-refs/shot-3-growing.jpg
```

The arguments are the source, the output, the horizontal and vertical centre as fractions,
the output width, and a zoom below 1 to take in more of the picture.

## Prompt: one continuous shot (text to video)

> A slow, static studio shot of a monstera deliciosa in a speckled cream ceramic pot
> against a matte sage green wall. Soft diffused daylight from the left, a gentle shadow
> falling to the right, muted natural colour, shallow depth of field, shot on 85mm.
> A pair of hands enters frame from the right holding a brass mister and mists the
> leaves; fine water droplets catch the light and run slowly down a fenestrated leaf.
> The hands leave frame. Nothing else moves. Calm, unhurried, no camera movement, no
> music, no text, no people's faces. Editorial plant shop film, natural documentary
> feel, 16:9.

## Prompt: the eighteen months, as four shots (text to video)

Cut these together, roughly four seconds each, in this order.

**1. The cutting.** A single rooted monstera node in a clear glass vessel on a sage
green seamless backdrop, white roots suspended in clean water and lit from behind, soft
daylight from the left, static camera, extremely shallow depth of field, macro detail on
the root tips, muted natural colour, no text, 16:9.

**2. Potting.** Close crop of two hands pressing a peat-free bark and pumice mix around
a young monstera in a terracotta pot, sage green backdrop, soft daylight from the left,
loose soil visible, hands cropped at the forearm, no faces, natural documentary feel,
16:9.

**3. Growing.** A monstera deliciosa in a speckled cream pot against a sage green wall,
static camera, leaves turning almost imperceptibly toward the window light as the shadow
on the wall moves across the frame, time passing, muted natural colour, no camera
movement, 16:9.

**4. The room.** The same monstera now on a low oak console in a bright minimal living
room, linen curtain diffusing the light, a slow push in, soft daylight, lived-in and
undecorated, no people, 16:9.

## What to avoid in the film

No music-video cutting, no drone moves, no colour grade that turns the greens teal, no
smiling models, no text overlays or logos, no timelapse clouds. The plant should look
like a plant in a room, not like a stock library.
