// Pointer parallax on the plant: desktop, motion-safe only
const fine = matchMedia('(pointer:fine)');
const calm = matchMedia('(prefers-reduced-motion:reduce)');
const target = document.querySelector('[data-parallax]');

if (target && fine.matches && !calm.matches) {
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;

  const tick = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    target.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    raf = Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(tick) : 0;
  };

  addEventListener('pointermove', (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 26;
    ty = (e.clientY / innerHeight - 0.5) * 20;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  addEventListener('pointerleave', () => {
    tx = ty = 0;
    if (!raf) raf = requestAnimationFrame(tick);
  });
}

// Reveal geometry. The circle starts concentric with the hero's ring and opens until it
// clears the furthest corner; the photograph starts parked so the canopy fills that circle
// and settles into a plain full-bleed cover. CSS cannot divide a length by a length, so the
// numbers are measured here and handed over as custom properties.
const frame = document.querySelector('.visual__inner');
const shellEl = document.querySelector('.shell');

if (frame && shellEl) {
  const CANVAS_W = 4469, CANVAS_H = 2352;   // the wide canvas
  const PHOTO_W = 1760;                     // the photograph inside it, at camera resolution
  const CANOPY_X = 890 / PHOTO_W;           // canopy, as a fraction of the photograph
  const CANOPY_Y = 830 / 2352;              // and down it; the canvas spans the photo's height
  const CIRCLE_SHARE = 980 / PHOTO_W;       // slice of the photograph the resting circle holds

  const measure = () => {
    const box = frame.getBoundingClientRect();
    if (!box.width) return;
    // measure inside the shell, not the viewport: the shell is what gets pinned, so these
    // hold whatever the scroll position was when the page loaded
    const shellBox = shellEl.getBoundingClientRect();
    const doc = document.documentElement;
    const W = doc.clientWidth, H = doc.clientHeight;   // the CSS viewport, matching vw/dvh

    // the circle: concentric with the hero's ring, opening past the furthest corner
    const cx = box.left - shellBox.left + box.width / 2;
    const cy = box.top - shellBox.top + box.height / 2;
    const r0 = box.width * 0.8 / 2;
    const r1 = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));

    // the canvas, sized as a cover of the viewport. The layer itself is 3x the viewport
    // and its own origin sits one viewport up and left, so everything is offset by (W, H).
    const cover = Math.max(W / CANVAS_W, H / CANVAS_H);
    const canvasW = CANVAS_W * cover, canvasH = CANVAS_H * cover;
    const bgx = W + (W - canvasW) / 2;
    const bgy = H + (H - canvasH) / 2;

    const photoLeftFrac = (CANVAS_W - PHOTO_W) / 2 / CANVAS_W;
    const ox = bgx + (photoLeftFrac + CANOPY_X * PHOTO_W / CANVAS_W) * canvasW;
    const oy = bgy + CANOPY_Y * canvasH;

    // park the canopy in the circle, at the scale that makes it fill the circle exactly
    const sc = (2 * r0 / CIRCLE_SHARE) / (PHOTO_W * cover);

    const set = (k, v) => shellEl.style.setProperty(k, v);
    set('--layerX', (-W) + 'px');       // the photo layer: three viewports, centred on this one
    set('--layerY', (-H) + 'px');
    set('--layerW', (3 * W) + 'px');
    set('--layerH', (3 * H) + 'px');
    set('--cx', cx.toFixed(1) + 'px');
    set('--cy', cy.toFixed(1) + 'px');
    set('--r0', r0.toFixed(1) + 'px');
    set('--r1', Math.ceil(r1) + 'px');
    set('--bgw', canvasW.toFixed(1) + 'px');
    set('--bgh', canvasH.toFixed(1) + 'px');
    set('--bgx', bgx.toFixed(1) + 'px');
    set('--bgy', bgy.toFixed(1) + 'px');
    set('--ox', ox.toFixed(1) + 'px');
    set('--oy', oy.toFixed(1) + 'px');
    set('--tx', (cx - (ox - W)).toFixed(1) + 'px');
    set('--ty', (cy - (oy - H)).toFixed(1) + 'px');
    set('--sc', sc.toFixed(4));
    set('--coverx', ((W - canvasW) / 2).toFixed(1) + 'px');   // the same cover, in viewport space
    set('--covery', ((H - canvasH) / 2).toFixed(1) + 'px');
    set('--spot-r', Math.round(Math.min(200, Math.max(88, W * 0.078))) + 'px');

    // Draw each leader as a flat S: it leaves the card horizontally, bends once, and
    // arrives horizontally on a real detail of the plant. Targets are fractions of the
    // photograph, so they hold wherever it lands on screen.
    const photoW = PHOTO_W * cover, photoH = CANVAS_H * cover;
    const photoLeft = W / 2 - photoW / 2, photoTop = H / 2 - photoH / 2;
    const TARGETS = {
      air:  [0.205, 0.400],   // mid-blade of the big left leaf, across its splits
      care: [0.374, 0.620],   // the small furled leaf low on the stem
      soil: [0.468, 0.828],   // the speckled body of the pot
    };
    const svg = document.querySelector('.leads');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      for (const [key, [fx, fy]] of Object.entries(TARGETS)) {
        const card = document.querySelector(`.label--${key}`);
        const line = svg.querySelector(`[data-lead="${key}"]`);
        const casing = svg.querySelector(`[data-case="${key}"]`);
        const dot = svg.querySelector(`[data-dot="${key}"]`);
        if (!card || !line || !dot) continue;
        const r = card.getBoundingClientRect();
        if (!r.width) continue;
        const fromRight = !card.classList.contains('label--soil');
        const x0 = fromRight ? r.right : r.left;
        const y0 = r.top + 38;
        const x1 = photoLeft + fx * photoW;
        const y1 = photoTop + fy * photoH;
        const run = (x1 - x0) * 0.42;                       // horizontal tangents at both ends
        const d = `M${x0.toFixed(1)} ${y0.toFixed(1)} C${(x0 + run).toFixed(1)} ${y0.toFixed(1)}, ${(x1 - run).toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
        line.setAttribute('d', d);
        const len = Math.ceil(line.getTotalLength ? line.getTotalLength() : 600);
        line.style.setProperty('--dash', len);
        if (casing) { casing.setAttribute('d', d); casing.style.setProperty('--dash', len); }
        dot.setAttribute('cx', x1.toFixed(1));
        dot.setAttribute('cy', y1.toFixed(1));
      }
    }
  };

  measure();
  new ResizeObserver(measure).observe(frame);
  addEventListener('resize', measure);

  // hold the callouts back until the photograph is open, then stagger them in
  const end = document.querySelector('.stage__end');
  const labels = document.querySelector('.labels');
  const xray = document.querySelector('.xray');
  let spotting = false;

  // the cursor carries the x-ray. Mouse position is eased toward, and only a transform
  // changes per frame, so the browser composites it rather than repainting the photo.
  const mouse = { x: -9999, y: -9999 };
  const smooth = { x: -9999, y: -9999 };
  let raf = 0;

  // scrolling always wins: the lens drops out the instant the page moves, and only
  // comes back when the pointer moves again
  let lastScroll = scrollY;
  const hideLens = () => { xray.style.transition = 'none'; xray.style.opacity = '0'; };
  const showLens = () => { xray.style.transition = ''; xray.style.opacity = ''; };

  const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; showLens(); };
  const tick = () => {
    if (scrollY !== lastScroll) { lastScroll = scrollY; hideLens(); }
    smooth.x += (mouse.x - smooth.x) * 0.1;
    smooth.y += (mouse.y - smooth.y) * 0.1;
    xray.style.setProperty('--spot-x', smooth.x.toFixed(1) + 'px');
    xray.style.setProperty('--spot-y', smooth.y.toFixed(1) + 'px');
    raf = spotting ? requestAnimationFrame(tick) : 0;
  };

  const setSpotting = (on) => {
    if (on === spotting) return;
    spotting = on;
    if (on) {
      addEventListener('mousemove', onMove, { passive: true });
      if (!raf) raf = requestAnimationFrame(tick);
    } else {
      removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      raf = 0;
      hideLens();
    }
  };

  const nextSection = document.querySelector('.grove');
  let nextInView = false;
  let atRest = false;

  const sync = () => {
    const open = atRest && !nextInView;
    labels.classList.toggle('labels-in', open);
    shellEl.classList.toggle('reveal-done', open);
    if (xray && matchMedia('(min-width:1041px) and (pointer:fine)').matches) setSpotting(open);
  };

  if (end && labels) {
    new IntersectionObserver(([entry]) => { atRest = entry.isIntersecting; sync(); },
      { threshold: 0 }).observe(end);
  }
  // the moment the next section appears, the lens and the callouts are done
  if (nextSection) {
    new IntersectionObserver(([entry]) => { nextInView = entry.isIntersecting; sync(); },
      { threshold: 0 }).observe(nextSection);
  }
}

/* ── Reveal on approach ─────────────────────────────────────────────────────
   Anything marked [data-inview] holds still until it is near the viewport,
   then settles in. Each element is released once and then forgotten.        */
{
  const targets = document.querySelectorAll('[data-inview]');
  if (targets.length && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js');   // nothing hides unless this runs
    const io = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    for (const el of targets) io.observe(el);
  }
}

/* ── The nudge sign-up ──────────────────────────────────────────────────────
   No backend yet: the form holds its ground and reports back in place, so the
   page never reloads out from under the reader. Wire the fetch here later.   */
{
  const form = document.querySelector('.foot__form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const field = form.querySelector('.foot__input');
    if (!field.value.trim() || !field.checkValidity()) { field.focus(); return; }
    const done = document.createElement('p');
    done.className = 'foot__done';
    done.textContent = 'You are on the list. First nudge Thursday.';
    form.replaceWith(done);
  });
}
