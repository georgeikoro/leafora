/* Shop behaviour: the nav drawer, saving, the index filters, and the product page.
   Everything here is progressive: the pages read and navigate without it.     */

import { products, bySlug } from './products.js';

const money = (n) => '£' + n;
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── Nav drawer ─────────────────────────────────────────────────────────── */
{
  const toggle = document.querySelector('.nav__toggle');
  const drawer = document.getElementById('mobileNav');
  const header = document.querySelector('.nav, .topbar');
  const setHeaderHeight = () => {
    if (header) document.documentElement.style.setProperty('--nav-h', header.offsetHeight + 'px');
  };
  setHeaderHeight();
  addEventListener('resize', setHeaderHeight);
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    drawer.hidden = open;
    document.body.classList.toggle('nav-open', !open);
  });
}

/* ── The language switch ──────────────────────────────────────────────────────
   Swedish by default, everywhere: every page carries the same SV/EN pill in its
   header, and the choice follows you from page to page (it is a plain multi-page
   site, so that means a stored preference rather than app state). Anything
   translated carries its own data-sv and data-en fragment rather than a lookup
   table, so a translation always sits next to the copy it replaces. A page
   that has not been translated yet simply has nothing for the switch to do
   there, and stays as it is.                                                */
const LANG_KEY = 'leafora:lang';
const currentLang = () => { try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'sv'; } catch { return 'sv'; } };
{
  const getLang = () => { try { return localStorage.getItem(LANG_KEY); } catch { return null; } };
  const lang = getLang() === 'en' ? 'en' : 'sv';   // Swedish unless English was chosen before

  const targets = document.querySelectorAll('[data-sv][data-en]');
  for (const el of targets) el.innerHTML = el.dataset[lang];
  if (targets.length) document.documentElement.lang = lang;

  const buttons = document.querySelectorAll('.lang__btn');
  for (const btn of buttons) btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));

  for (const toggle of document.querySelectorAll('.lang')) {
    toggle.addEventListener('click', (event) => {
      const btn = event.target.closest('.lang__btn');
      if (!btn) return;
      const next = btn.dataset.lang;
      try { localStorage.setItem(LANG_KEY, next); } catch { /* private mode */ }
      for (const el of document.querySelectorAll('[data-sv][data-en]')) el.innerHTML = el.dataset[next];
      document.documentElement.lang = next;
      for (const b of document.querySelectorAll('.lang__btn')) b.setAttribute('aria-pressed', String(b.dataset.lang === next));
      document.dispatchEvent(new CustomEvent('leafora:langchange', { detail: { lang: next } }));
    });
  }
}

/* ── Saving ─────────────────────────────────────────────────────────────────
   A shortlist, kept in this browser. No account, nothing sent anywhere, so it
   survives a reload and nothing else. /saved reads the same key back.        */
const SAVED_KEY = 'leafora:saved';

const readSaved = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; }
  catch { return []; }
};
const writeSaved = (list) => {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* private mode */ }
  paintCount();
};
/* A save is silent otherwise: the heart fills in and nothing tells you where the
   list lives. This says so, once, and gets out of the way.                   */
let toastTimer;
const toast = (message, link, href = '/saved/', label = 'See your list') => {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.innerHTML = `<span>${message}</span>` +
    (link === false && href === '/saved/' ? '' : ` <a href="${href}">${label}</a>`);
  el.classList.add('toast--in');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('toast--in'), 4200);
};

const paintCount = () => {
  const n = readSaved().length;
  for (const badge of document.querySelectorAll('.js-saved-count')) {
    badge.textContent = String(n);
    badge.hidden = n === 0;
  }
};

const wireSave = (root = document) => {
  const saved = readSaved();
  for (const button of root.querySelectorAll('.plant__save, .save')) {
    const slug = button.dataset.slug || button.closest('[data-slug]')?.dataset.slug;
    if (slug && saved.includes(slug)) {
      button.setAttribute('aria-pressed', 'true');
      const label = button.querySelector('#saveLabel');
      if (label) label.textContent = 'Saved';
    }
    button.addEventListener('click', () => {
      const on = button.getAttribute('aria-pressed') === 'true';
      button.setAttribute('aria-pressed', String(!on));
      const label = button.querySelector('#saveLabel');
      if (label) label.textContent = on ? 'Save' : 'Saved';
      if (!slug) return;
      const list = readSaved().filter((s) => s !== slug);
      if (!on) list.push(slug);
      writeSaved(list);
      if (!location.pathname.startsWith('/saved')) {
        toast(on ? 'Removed from your list' : 'Saved', !on);
      }
      button.closest('.saved-card')?.remove();       /* on /saved, unhearting removes it */
      renderSavedEmptyState?.();
    });
  }
};
wireSave();
paintCount();

/* ── The index: filters, sorting, and the count ─────────────────────────── */
const grid = document.getElementById('grid');
if (grid) {
  const cards = [...grid.children];
  const countEl = document.getElementById('count');
  const emptyEl = document.getElementById('empty');
  const sortEl = document.getElementById('sort');
  const chips = [...document.querySelectorAll('.chip')];
  const searchField = document.getElementById('plantSearch');
  const picked = { light: 'any', water: 'any', size: 'any' };

  /* so a link can arrive pre-filtered: /plants/?light=low */
  const asked = new URLSearchParams(location.search);
  for (const key of Object.keys(picked)) {
    const value = asked.get(key);
    if (!value) continue;
    const chip = document.querySelector(`.chip[data-filter="${key}"][data-value="${value}"]`);
    if (!chip) continue;
    picked[key] = value;
    for (const other of document.querySelectorAll(`.chip[data-filter="${key}"]`)) {
      other.setAttribute('aria-pressed', String(other === chip));
    }
  }
  const featured = new Map(cards.map((card, i) => [card, i]));

  const apply = () => {
    const q = (searchField?.value || '').trim().toLowerCase();
    let shown = 0;
    for (const card of cards) {
      const haystack = `${card.dataset.name} ${card.querySelector('.plant__kicker')?.textContent || ''}`.toLowerCase();
      const ok = Object.entries(picked).every(([key, value]) => value === 'any' || card.dataset[key] === value)
        && (!q || haystack.includes(q));
      card.hidden = !ok;
      if (ok) shown++;
    }
    countEl.textContent = String(shown);
    countEl.parentElement.childNodes[1].nodeValue = currentLang() === 'sv'
      ? (shown === 1 ? ' växt' : ' växter')
      : (shown === 1 ? ' plant' : ' plants');
    emptyEl.hidden = shown !== 0;

    const mode = sortEl.value;
    const ordered = [...cards].sort((a, b) => {
      if (mode === 'low')  return a.dataset.price - b.dataset.price;
      if (mode === 'high') return b.dataset.price - a.dataset.price;
      if (mode === 'name') return a.dataset.name.localeCompare(b.dataset.name);
      return featured.get(a) - featured.get(b);
    });
    for (const card of ordered) grid.append(card);
  };

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const { filter, value } = chip.dataset;
      picked[filter] = value;
      for (const other of chips) {
        if (other.dataset.filter === filter) other.setAttribute('aria-pressed', String(other === chip));
      }
      apply();
    });
  }
  sortEl.addEventListener('change', apply);
  searchField?.addEventListener('input', apply);
  document.getElementById('reset')?.addEventListener('click', () => {
    for (const key of Object.keys(picked)) picked[key] = 'any';
    for (const chip of chips) chip.setAttribute('aria-pressed', String(chip.dataset.value === 'any'));
    if (searchField) searchField.value = '';
    apply();
  });

  document.addEventListener('leafora:langchange', apply);
  apply();                                  /* in case we arrived pre-filtered */
}

/* ── The product page ───────────────────────────────────────────────────── */
const buyBox = document.querySelector('.buy');
if (buyBox) {
  const slug = location.pathname.replace(/^\/plants\/|\/$/g, '') ||
               new URLSearchParams(location.search).get('p') || 'the-monstera-pot';
  const product = bySlug(slug) || products[0];
  const priceEl = document.getElementById('price');
  const mainEl = document.getElementById('galleryMain');
  const thumbsEl = document.getElementById('thumbs');
  const sizesEl = document.getElementById('sizes');

  /* the gallery */
  thumbsEl.addEventListener('click', (event) => {
    const button = event.target.closest('.thumb');
    if (!button) return;
    mainEl.src = button.querySelector('img').src;
    for (const other of thumbsEl.children) other.setAttribute('aria-current', String(other === button));
  });

  /* the size sets the price */
  sizesEl.addEventListener('change', (event) => {
    if (event.target.name === 'size') priceEl.textContent = money(Number(event.target.dataset.price));
  });

  /* into the basket */
  const buy = document.getElementById('buy');
  buy.addEventListener('click', () => {
    const size = sizesEl.querySelector('input[name="size"]:checked');
    addToCart(product.slug, size ? size.value : product.sizes[0].id, Number(size ? size.dataset.price : product.sizes[0].price));
    toast('In your basket', false, '/cart/', 'Go to basket');
  });

}

/* ── The care guide's symptom picker ────────────────────────────────────────
   A vertical tablist: click or arrow-key through the symptoms, one panel at a
   time. Without JS every panel but the first is hidden, so the page still
   reads, and the markup order puts the most common problem first.          */
{
  const tablist = document.querySelector('.dx__tabs');
  if (tablist) {
    const tabs = [...tablist.querySelectorAll('.dx__tab')];

    const show = (tab, moveFocus = true) => {
      for (const other of tabs) {
        const on = other === tab;
        other.setAttribute('aria-selected', String(on));
        other.tabIndex = on ? 0 : -1;
        document.getElementById(other.getAttribute('aria-controls')).hidden = !on;
      }
      if (moveFocus) tab.focus();
    };

    tablist.addEventListener('click', (event) => {
      const tab = event.target.closest('.dx__tab');
      if (tab) show(tab, false);
    });

    tablist.addEventListener('keydown', (event) => {
      const at = tabs.indexOf(document.activeElement);
      if (at < 0) return;
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (step) { event.preventDefault(); show(tabs[(at + step + tabs.length) % tabs.length]); }
      if (event.key === 'Home') { event.preventDefault(); show(tabs[0]); }
      if (event.key === 'End') { event.preventDefault(); show(tabs.at(-1)); }
    });
  }
}

/* ── The contact form ───────────────────────────────────────────────────────
   Same deal as the footer sign-up: nothing to post to yet, so it answers in
   place instead of reloading the page onto a dead endpoint.                 */
{
  const form = document.getElementById('contactForm');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const missing = [...form.querySelectorAll('[required]')].find((field) => !field.value.trim() || !field.checkValidity());
    if (missing) { missing.focus(); return; }
    const done = document.createElement('div');
    done.className = 'cform__done';
    done.innerHTML = currentLang() === 'sv'
      ? '<h2>Meddelande noterat</h2><p>En odlare läser dessa på morgonen och svarar samma dag. ' +
        'Inget skickas faktiskt ännu. Det här formuläret väntar på sin inkorg.</p>'
      : '<h2>Message noted</h2><p>A grower reads these in the morning and answers the same day. ' +
        'Nothing is actually sent yet. This form is waiting on its inbox.</p>';
    form.replaceWith(done);
    done.setAttribute('tabindex', '-1');
    done.focus();
  });
}


/* ── The saved list ─────────────────────────────────────────────────────────
   Reads the same browser key the hearts write, and draws the shortlist from
   the catalogue. Nothing here is stored on a server, so an empty list on a new
   device is the correct answer rather than a bug.                           */
let renderSavedEmptyState;
{
  const grid = document.getElementById('savedGrid');
  if (grid) {
    const countEl = document.getElementById('savedCount');
    const emptyEl = document.getElementById('savedEmpty');

    renderSavedEmptyState = () => {
      const n = grid.children.length;
      countEl.hidden = n === 0;
      countEl.textContent = currentLang() === 'sv'
        ? (n === 1 ? '1 växt' : `${n} växter`)
        : (n === 1 ? '1 plant' : `${n} plants`);
      emptyEl.hidden = n !== 0;
    };

    const chosen = readSaved().map(bySlug).filter(Boolean);
    grid.replaceChildren(...chosen.map((p) => {
      const li = document.createElement('li');
      li.className = 'plant saved-card';
      li.dataset.slug = p.slug;
      li.innerHTML = `
        <a class="plant__link" href="/plants/${p.slug}/">
          <span class="sr-only">${p.name}, £${p.price}</span>
          <img class="plant__img" src="/assets/${p.img}" width="673" height="900" loading="lazy" decoding="async" alt="${p.name}, ${p.species}" />
          <img class="plant__img plant__img--alt" src="/assets/${p.alt}" width="673" height="900" loading="lazy" decoding="async" alt="" aria-hidden="true" />
        </a>
        <span class="plant__chip">${p.chip}</span>
        <button class="plant__save" type="button" aria-pressed="true" data-slug="${p.slug}" aria-label="Remove ${p.name} from saved">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 20.4s-7.6-4.6-7.6-9.6A4.4 4.4 0 0 1 12 8.4a4.4 4.4 0 0 1 7.6 2.4c0 5-7.6 9.6-7.6 9.6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
        </button>
        <div class="plant__meta">
          <span class="plant__kicker">${p.species}</span>
          <h2 class="plant__name">${p.name}</h2>
          <span class="plant__price">£${p.price}</span>
        </div>`;
      return li;
    }));
    wireSave(grid);
    renderSavedEmptyState();
  }
}


/* ── The gift card ──────────────────────────────────────────────────────────
   The preview is the product, so it updates as the form is filled in.       */
{
  const form = document.getElementById('giftForm');
  if (form) {
    const value = document.getElementById('giftValue');
    const to = document.getElementById('giftTo');
    const nameField = document.getElementById('giftName');

    form.addEventListener('input', () => {
      const amount = form.querySelector('input[name="amount"]:checked');
      if (amount) value.textContent = '£' + amount.value;
      const who = nameField.value.trim();
      const sv = currentLang() === 'sv';
      to.textContent = who ? (sv ? `Till ${who}` : `For ${who}`) : (sv ? 'Till någon som dödar allt' : 'For someone who kills things');
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const missing = [...form.querySelectorAll('[required]')].find((f) => !f.value.trim() || !f.checkValidity());
      if (missing) { missing.focus(); return; }
      const done = document.createElement('div');
      done.className = 'cform__done';
      done.innerHTML = currentLang() === 'sv'
        ? '<h2>Kortet är klart</h2><p>Det skulle skickas ut på det datum du valde. ' +
          'Inget debiteras än. Kassan är nästa sak vi bygger.</p>'
        : '<h2>Card ready</h2><p>It would go out on the date you picked. ' +
          'Nothing is charged yet. Checkout is the next thing we build.</p>';
      form.replaceWith(done);
      done.setAttribute('tabindex', '-1');
      done.focus();
    });
  }
}


/* ── The basket ─────────────────────────────────────────────────────────────
   Lines of {slug, size, price, qty} in this browser. No server, no account, so
   it is exactly as durable as the saved list and says so on the page.       */
const CART_KEY = 'leafora:cart';
const ORDERS_KEY = 'leafora:orders';
const DELIVERY = 6.5;
const FREE_OVER = 120;

const readCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } };
const writeCart = (lines) => {
  try { localStorage.setItem(CART_KEY, JSON.stringify(lines)); } catch { /* private mode */ }
  paintCart();
};
const cartCount = () => readCart().reduce((n, l) => n + l.qty, 0);
const cartSubtotal = () => readCart().reduce((n, l) => n + l.price * l.qty, 0);
const money2 = (n) => '£' + (Number.isInteger(n) ? n : n.toFixed(2));

function paintCart() {
  const n = cartCount();
  for (const badge of document.querySelectorAll('.js-cart-count')) {
    badge.textContent = String(n);
    badge.hidden = n === 0;
  }
}
paintCart();

function addToCart(slug, size, price) {
  const lines = readCart();
  const found = lines.find((l) => l.slug === slug && l.size === size);
  if (found) found.qty += 1; else lines.push({ slug, size, price, qty: 1 });
  writeCart(lines);
}

const lineRow = (l, slim) => {
  const p = bySlug(l.slug);
  if (!p) return '';
  const sv = currentLang() === 'sv';
  const size = p.sizes.find((s) => s.id === l.size) || p.sizes[0];
  return `<li class="line" data-slug="${l.slug}" data-size="${l.size}">
    ${slim ? '' : `<a class="line__img" href="/plants/${p.slug}/"><img src="/assets/${p.img}" width="673" height="900" loading="lazy" decoding="async" alt="${p.name}" /></a>`}
    <div class="line__meta">
      <a class="line__name" href="/plants/${p.slug}/">${p.name}</a>
      <span class="line__spec">${size.label}, ${size.note}</span>
      ${slim ? `<span class="line__spec">${sv ? 'Antal' : 'Quantity'} ${l.qty}</span>` : `<div class="line__qty">
        <button type="button" data-step="-1" aria-label="${sv ? `En mindre ${p.name}` : `One fewer ${p.name}`}">&minus;</button>
        <span aria-live="polite">${l.qty}</span>
        <button type="button" data-step="1" aria-label="${sv ? `En till ${p.name}` : `One more ${p.name}`}">+</button>
        <button class="line__remove" type="button" data-remove aria-label="${sv ? `Ta bort ${p.name}` : `Remove ${p.name}`}">${sv ? 'Ta bort' : 'Remove'}</button>
      </div>`}
    </div>
    <span class="line__price">${money2(l.price * l.qty)}</span>
  </li>`;
};

const paintTotals = () => {
  const sv = currentLang() === 'sv';
  const sub = cartSubtotal();
  const delivery = sub === 0 || sub >= FREE_OVER ? 0 : DELIVERY;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('cartSubtotal', money2(sub));
  set('cartDelivery', delivery === 0 ? (sv ? 'Gratis' : 'Free') : money2(delivery));
  set('cartTotal', money2(sub + delivery));
  set('checkoutTotal', money2(sub + delivery));
  const note = document.getElementById('cartFreeNote');
  if (note) note.textContent = sub >= FREE_OVER
    ? (sv ? 'Leveransen bjuder vi på vid den här beställningsstorleken.' : 'Delivery is on us at this size of order.')
    : (sv ? `Leverans är gratis över ${money2(FREE_OVER)}. Du har ${money2(FREE_OVER - sub)} kvar.`
           : `Delivery is free over ${money2(FREE_OVER)}. You are ${money2(FREE_OVER - sub)} away.`);
};

/* the basket page */
{
  const list = document.getElementById('cartLines');
  if (list) {
    const wrap = document.getElementById('basket');
    const empty = document.getElementById('cartEmpty');
    const draw = () => {
      const lines = readCart();
      list.innerHTML = lines.map((l) => lineRow(l, false)).join('');
      wrap.hidden = lines.length === 0;
      empty.hidden = lines.length !== 0;
      paintTotals();
    };
    list.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const row = button.closest('.line');
      const lines = readCart();
      const at = lines.findIndex((l) => l.slug === row.dataset.slug && l.size === row.dataset.size);
      if (at < 0) return;
      if (button.dataset.remove !== undefined) lines.splice(at, 1);
      else {
        lines[at].qty += Number(button.dataset.step);
        if (lines[at].qty < 1) lines.splice(at, 1);
      }
      writeCart(lines);
      draw();
    });
    draw();
  }
}

/* checkout, and the order it writes */
{
  const form = document.getElementById('checkoutForm');
  if (form) {
    const list = document.getElementById('checkoutLines');
    list.innerHTML = readCart().map((l) => lineRow(l, true)).join('');
    paintTotals();
    if (readCart().length === 0) {
      form.innerHTML = currentLang() === 'sv'
        ? '<div class="empty--block"><h2 class="shop-note__title">Inget att checka ut</h2>' +
          '<p>Varukorgen är tom i den här webbläsaren.</p><a class="btn btn--forest" href="/plants/">Se växterna</a></div>'
        : '<div class="empty--block"><h2 class="shop-note__title">Nothing to check out</h2>' +
          '<p>The basket is empty in this browser.</p><a class="btn btn--forest" href="/plants/">See the plants</a></div>';
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const missing = [...form.querySelectorAll('[required]')].find((f) => !f.value.trim() || !f.checkValidity());
      if (missing) { missing.focus(); return; }
      const ref = 'LEA-' + String(Math.floor(1000 + Math.random() * 8999));
      const order = { ref, placed: new Date().toISOString(), lines: readCart(), total: cartSubtotal() };
      try {
        const all = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
        all.unshift(order);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
      } catch { /* private mode */ }
      writeCart([]);
      location.href = '/order/?ref=' + ref;
    });
  }
}

/* the confirmation */
{
  const confirm = document.getElementById('confirm');
  if (confirm) {
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { /* ignore */ }
    const ref = new URLSearchParams(location.search).get('ref');
    const order = orders.find((o) => o.ref === ref) || orders[0];
    if (order) {
      document.getElementById('orderRef').textContent = order.ref;
      document.getElementById('orderLines').innerHTML = order.lines.map((l) => lineRow(l, true)).join('');
      confirm.hidden = false;
    } else {
      document.getElementById('orderEmpty').hidden = false;
    }
  }
}

/* the account */
{
  const ordersList = document.getElementById('acctOrders');
  if (ordersList) {
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { /* ignore */ }
    ordersList.innerHTML = orders.map((o) => {
      const sv = currentLang() === 'sv';
      const n = o.lines.reduce((n, l) => n + l.qty, 0);
      const date = new Date(o.placed).toLocaleDateString(sv ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const count = sv ? `${n} ${n === 1 ? 'växt' : 'växter'}` : `${n} plant${n === 1 ? '' : 's'}`;
      return `<li class="line line--order">
      <div class="line__meta">
        <a class="line__name" href="/order/?ref=${o.ref}">${o.ref}</a>
        <span class="line__spec">${date} &middot; ${count}</span>
      </div>
      <span class="line__price">${money2(o.total)}</span>
    </li>`;
    }).join('');
    document.getElementById('acctNoOrders').hidden = orders.length !== 0;

    const grid = document.getElementById('acctPlants');
    const saved = readSaved().map(bySlug).filter(Boolean);
    grid.innerHTML = saved.map((p) => `<li class="plant" data-slug="${p.slug}">
      <a class="plant__link" href="/plants/${p.slug}/"><span class="sr-only">${p.name}</span>
        <img class="plant__img" src="/assets/${p.img}" width="673" height="900" loading="lazy" decoding="async" alt="${p.name}" /></a>
      <span class="plant__chip">${p.chip}</span>
      <div class="plant__meta"><span class="plant__kicker">${p.species}</span><h3 class="plant__name">${p.name}</h3></div>
    </li>`).join('');
    document.getElementById('acctNoPlants').hidden = saved.length !== 0;

    /* reminder settings, kept in the same browser as everything else */
    const PREFS = 'leafora:prefs';
    const boxes = { water: document.getElementById('prefWater'), season: document.getElementById('prefSeason'), news: document.getElementById('prefNews') };
    const saveNote = document.getElementById('prefsSaved');
    let prefs = { water: true, season: true, news: false };
    try { prefs = { ...prefs, ...(JSON.parse(localStorage.getItem(PREFS)) || {}) }; } catch { /* ignore */ }
    for (const [key, box] of Object.entries(boxes)) box.checked = prefs[key];
    const store = () => {
      for (const [key, box] of Object.entries(boxes)) prefs[key] = box.checked;
      try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch { /* ignore */ }
      saveNote.hidden = false;
      clearTimeout(store.timer);
      store.timer = setTimeout(() => { saveNote.hidden = true; }, 2600);
    };
    for (const box of Object.values(boxes)) box.addEventListener('change', store);
    document.getElementById('unsubAll').addEventListener('click', () => {
      for (const box of Object.values(boxes)) box.checked = false;
      store();
    });
  }
}

/* search across the plants, the guide and the journal */
{
  const form = document.getElementById('searchForm');
  if (form) {
    const field = document.getElementById('q');
    const results = document.getElementById('results');
    const count = document.getElementById('searchCount');
    const empty = document.getElementById('searchEmpty');

    const INDEX = [
      ...products.map((p) => ({ title: p.name, kind: 'Plant', url: `/plants/${p.slug}/`,
        text: `${p.name} ${p.species} ${p.chip} ${p.blurb} ${p.care} ${p.light} light ${p.water} water ${p.size}` })),
      { title: 'Every plant we grow', kind: 'Shop', url: '/plants/', text: 'all plants shop catalogue filter light water size' },
      { title: 'Pots and tools', kind: 'Shop', url: '/pots-and-tools/', text: 'pot terracotta stoneware glass vessel mister moisture meter snips drainage' },
      { title: 'Gift cards', kind: 'Shop', url: '/gift-cards/', text: 'gift card voucher present amount' },
      { title: 'Care guide', kind: 'Care', url: '/care/', text: 'care guide light water humidity feeding first fortnight' },
      { title: 'Diagnose a plant', kind: 'Care', url: '/care/diagnose/', text: 'yellow leaves brown crisp tips drooping wet soil leggy white fuzz mealybug no growth symptom problem sick dying' },
      { title: 'Repotting', kind: 'Care', url: '/care/repotting/', text: 'repot pot up root bound soil mix one size spring' },
      { title: 'The watering nudge', kind: 'Care', url: '/care/watering-nudge/', text: 'reminder nudge watering message stop unsubscribe' },
      { title: 'Monstera deliciosa care', kind: 'Care', url: '/care/monstera/', text: 'monstera deliciosa fenestration splits aerial roots care' },
      { title: 'Ficus lyrata care', kind: 'Care', url: '/care/ficus-lyrata/', text: 'fiddle leaf fig ficus lyrata dropping leaves dusting care' },
      { title: 'Cuttings in water care', kind: 'Care', url: '/care/cuttings-in-water/', text: 'cutting water propagation glass roots algae care' },
      { title: 'What a plant actually does to a room', kind: 'Journal', url: '/journal/what-a-plant-does-to-a-room/', text: 'air purifying nasa study attention restoration humidity evidence' },
      { title: 'A year and a half under glass', kind: 'Journal', url: '/journal/a-year-under-glass/', text: 'greenhouse growing eighteen months cutting acclimatising' },
      { title: 'How you post a living thing', kind: 'Journal', url: '/journal/how-we-pack-a-plant/', text: 'packing box courier delivery pulp collar cold weather' },
      { title: 'Delivery and returns', kind: 'Help', url: '/delivery-returns/', text: 'delivery shipping returns guarantee thirty days cold hold postage refund' },
      { title: 'Pet safe plants', kind: 'Help', url: '/plants/pet-safe/', text: 'pet safe cat dog toxic calcium oxalate chewing' },
      { title: 'Ask a grower', kind: 'Help', url: '/contact/', text: 'contact message photograph grower help question' },
      { title: 'About Leafora', kind: 'About', url: '/about/', text: 'about greenhouse kent hackney growers peat free' },
    ];

    const run = () => {
      const q = field.value.trim().toLowerCase();
      if (!q) { results.innerHTML = ''; count.hidden = true; empty.hidden = true; return; }
      const terms = q.split(/\s+/);
      const hits = INDEX
        .map((item) => {
          const hay = (item.title + ' ' + item.text).toLowerCase();
          const score = terms.reduce((n, t) => n + (hay.includes(t) ? (item.title.toLowerCase().includes(t) ? 3 : 1) : 0), 0);
          return { item, score };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
      results.innerHTML = hits.map(({ item }) => `<li class="result">
        <a href="${item.url}"><span class="result__kind">${item.kind}</span>
        <span class="result__title">${item.title}</span></a></li>`).join('');
      count.hidden = false;
      count.textContent = currentLang() === 'sv'
        ? (hits.length === 1 ? '1 resultat' : `${hits.length} resultat`)
        : (hits.length === 1 ? '1 result' : `${hits.length} results`);
      empty.hidden = hits.length !== 0;
    };

    field.addEventListener('input', run);
    form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
    const asked = new URLSearchParams(location.search).get('q');
    if (asked) { field.value = asked; run(); }
    field.focus();
  }
}


/* ── The film card: grows into the screen on scroll ──────────────────────────
   Same mechanism as the hero's reveal: a tall stage, a sticky shell, and a
   scroll-linked animation between two sizes. The hero can use a fixed 0dvh to
   70dvh range because it starts at the top of the page; this section sits
   further down, so the range has to be measured — the stage's own document
   offset, plus one viewport of scroll to grow through. A ResizeObserver on
   the stage would retrigger itself the moment it changed the stage's own
   height, so this uses the resize listener alone, exactly as the hero's own
   script also does alongside its ResizeObserver.                            */
{
  const stage = document.getElementById('filmStage');
  const frame = document.getElementById('filmFrame');
  if (stage && frame) {
    const desktop = matchMedia('(min-width:1041px)');
    const measure = () => {
      if (!desktop.matches) return;
      const doc = document.documentElement;
      const vw = doc.clientWidth, vh = doc.clientHeight;
      const w0 = Math.min(1100, vw * 0.92);
      const h0 = w0 * 9 / 16;
      const grow = vh;                      // reaches full screen after one more viewport of scroll
      const dwell = vh * 0.6;                // then holds there before the next section can take over
      const top = stage.getBoundingClientRect().top + window.scrollY;   // the stage itself never moves

      stage.style.setProperty('--film-stage-h', (vh + grow + dwell) + 'px');
      frame.style.setProperty('--film-w0', w0 + 'px');
      frame.style.setProperty('--film-h0', h0 + 'px');
      frame.style.setProperty('--film-w1', vw + 'px');
      frame.style.setProperty('--film-h1', vh + 'px');
      frame.style.setProperty('--film-range-start', top + 'px');
      frame.style.setProperty('--film-range-end', (top + grow) + 'px');
    };
    measure();
    addEventListener('resize', measure);
  }
}

/* ── The film's playback ───────────────────────────────────────────────────
   No button, no controls: it plays itself, muted, the moment the stage is
   close to view, and pauses when it leaves so it is never running unseen.
   One observer only — two observers independently calling play()/pause() on
   the same element raced each other and could leave it stalled mid-load.
   The poster carries the card before playback starts, and stands in
   permanently if the file is missing, if this browser respects reduced
   motion, or if playback is ever blocked for a reason not anticipated here. */
{
  const video = document.getElementById('filmVideo');
  const section = document.getElementById('filmStage');
  if (video && section) {
    const calm = matchMedia('(prefers-reduced-motion:reduce)');
    let attached = false;
    let missing = false;
    let wantPlaying = false;

    const startPlayback = () => {
      wantPlaying = true;
      video.play().catch(() => {});
    };

    const attach = () => {
      attached = true;
      fetch(video.dataset.src, { method: 'HEAD' })
        .then((r) => {
          if (!r.ok) { missing = true; return; }
          const source = document.createElement('source');
          source.src = video.dataset.src;
          source.type = 'video/mp4';
          video.append(source);
          video.load();
          startPlayback();
        })
        .catch(() => {});
    };

    /* Chrome will pause a silent, video-only element on its own now and then
       — a power-saving heuristic that can fire even while the section is
       genuinely on screen. If that happens while we still want it playing
       and the tab is visible, ask again rather than leaving a frozen frame. */
    video.addEventListener('pause', () => {
      if (wantPlaying && document.visibilityState === 'visible') video.play().catch(() => {});
    });

    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        wantPlaying = false;
        if (attached) video.pause();
        return;
      }
      if (calm.matches || missing) return;
      if (!attached) { attach(); return; }
      startPlayback();   // re-entering: resume the loop
    }, { rootMargin: '400px 0px', threshold: 0 }).observe(section);
  }
}

/* ── The community board ─────────────────────────────────────────────────────
   Posting and commenting, kept entirely in this browser. There is no server
   behind it, so a post made here never reaches anyone else's copy of the
   page. Three posts ship as examples, sorted in alongside whatever a visitor
   adds, oldest rule first: newest of either kind rises to the top.          */
{
  const feed = document.getElementById('communityFeed');
  if (feed) {
    const POSTS_KEY = 'leafora:community:posts';
    const COMMENTS_KEY = 'leafora:community:comments';

    const SEED_POSTS = [
      { id: 'seed-1', name: 'Priya', ts: '2026-08-29T10:00:00Z',
        topic: { en: 'The Window Fig', sv: 'The Window Fig' },
        message: { en: 'Mine dropped four leaves in its first week here, and none since. It was the move, not the room.',
                   sv: 'Min tappade fyra blad under sin första vecka här, och inga sedan dess. Det var flytten, inte rummet.' } },
      { id: 'seed-2', name: 'Tomás', ts: '2026-08-31T15:30:00Z',
        topic: { en: 'Propagation', sv: 'Förökning' },
        message: { en: 'Moved my glass cuttings under a grow lamp once the evenings got darker. Roots came in about twice as fast.',
                   sv: 'Flyttade mina glassticklingar under en växtlampa när kvällarna blev mörkare. Rötterna kom igång ungefär dubbelt så snabbt.' } },
      { id: 'seed-3', name: 'Elena', ts: '2026-09-02T09:15:00Z',
        topic: { en: 'The Monstera Pot', sv: 'The Monstera Pot' },
        message: { en: 'Wrote in about brown tips and had an answer the same afternoon. It was the tap water, not anything I was doing wrong.',
                   sv: 'Skrev in om bruna spetsar och fick svar samma eftermiddag. Det var kranvattnet, inte något jag gjorde fel.' } },
    ];

    const UI = {
      en: { noComments: 'No comments yet. Add the first one.', name: 'Your name', comment: 'Add a comment', reply: 'Reply',
            justNow: 'just now', min: (n) => `${n} min ago`, hr: (n) => `${n}h ago`, day: (n) => `${n}d ago`, week: (n) => `${n}w ago` },
      sv: { noComments: 'Inga kommentarer än. Lägg till den första.', name: 'Ditt namn', comment: 'Lägg till en kommentar', reply: 'Svara',
            justNow: 'just nu', min: (n) => `${n} min sedan`, hr: (n) => `${n} tim sedan`, day: (n) => `${n} d sedan`, week: (n) => `${n} v sedan` },
    };

    const readPosts = () => { try { return JSON.parse(localStorage.getItem(POSTS_KEY)) || []; } catch { return []; } };
    const writePosts = (list) => { try { localStorage.setItem(POSTS_KEY, JSON.stringify(list)); } catch { /* private mode */ } };
    const readComments = () => { try { return JSON.parse(localStorage.getItem(COMMENTS_KEY)) || {}; } catch { return {}; } };
    const writeComments = (map) => { try { localStorage.setItem(COMMENTS_KEY, JSON.stringify(map)); } catch { /* private mode */ } };

    const timeAgo = (iso, t) => {
      const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
      if (min < 1) return t.justNow;
      if (min < 60) return t.min(min);
      const hr = Math.round(min / 60);
      if (hr < 24) return t.hr(hr);
      const day = Math.round(hr / 24);
      if (day < 7) return t.day(day);
      return t.week(Math.round(day / 7));
    };

    const render = () => {
      const lang = currentLang();
      const t = UI[lang];
      const posts = [
        ...SEED_POSTS.map((p) => ({ id: p.id, name: p.name, ts: p.ts, topic: p.topic[lang], message: p.message[lang] })),
        ...readPosts(),
      ].sort((a, b) => new Date(b.ts) - new Date(a.ts));
      const comments = readComments();

      feed.innerHTML = posts.map((post) => {
        const list = comments[post.id] || [];
        return `
        <li class="cpost">
          <div class="cpost__head">
            <span class="cpost__name">${escapeHtml(post.name)}</span>
            ${post.topic ? `<span class="cpost__topic">${escapeHtml(post.topic)}</span>` : ''}
            <span class="cpost__time">${timeAgo(post.ts, t)}</span>
          </div>
          <p class="cpost__message">${escapeHtml(post.message)}</p>
          <ul class="ccomments">
            ${list.length ? list.map((c) => `
            <li class="ccomment">
              <span class="ccomment__name">${escapeHtml(c.name)}</span>
              <span class="ccomment__message">${escapeHtml(c.message)}</span>
            </li>`).join('') : `<li class="ccomment ccomment--empty">${t.noComments}</li>`}
          </ul>
          <form class="creply" data-post="${post.id}">
            <input class="creply__name" type="text" placeholder="${t.name}" maxlength="40" required />
            <input class="creply__text" type="text" placeholder="${t.comment}" maxlength="280" required />
            <button class="btn btn--outline" type="submit">${t.reply}</button>
          </form>
        </li>`;
      }).join('');
    };

    document.getElementById('postForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const name = document.getElementById('postName').value.trim();
      const topic = document.getElementById('postTopic').value.trim();
      const message = document.getElementById('postMessage').value.trim();
      if (!name || !message) return;
      const posts = readPosts();
      posts.unshift({ id: `p${Date.now()}`, name, topic, message, ts: new Date().toISOString() });
      writePosts(posts);
      event.target.reset();
      render();
    });

    feed.addEventListener('submit', (event) => {
      const form = event.target.closest('.creply');
      if (!form) return;
      event.preventDefault();
      const postId = form.dataset.post;
      const name = form.querySelector('.creply__name').value.trim();
      const message = form.querySelector('.creply__text').value.trim();
      if (!name || !message) return;
      const comments = readComments();
      comments[postId] = [...(comments[postId] || []), { name, message, ts: new Date().toISOString() }];
      writeComments(comments);
      render();
    });

    document.addEventListener('leafora:langchange', render);
    render();
  }
}

/* ── Find your plant: a three-question match ──────────────────────────────────
   Three species, three questions, a simple score. Pets never change the score:
   the site's position is that none of the three are pet safe, so a "yes" adds
   an honest note rather than a false match.                                */
{
  const form = document.getElementById('quizForm');
  const result = document.getElementById('quizResult');
  if (form && result) {
    const SPECIES = {
      monstera: {
        care: '/care/monstera/',
        en: { name: 'Monstera deliciosa', why: 'For a spot with plenty of bright, indirect light and a fortnightly kind of attention. It tells you what it needs, and forgives you when you are a few days late.' },
        sv: { name: 'Monstera deliciosa', why: 'För en plats med gott om ljust, indirekt ljus och uppmärksamhet varannan vecka. Den visar vad den behöver, och förlåter dig om du är några dagar sen.' },
      },
      ficus: {
        care: '/care/ficus-lyrata/',
        en: { name: 'Ficus lyrata', why: 'For the brightest room you have, where an hour or two of direct sun would not be unusual, and a steady weekly watering habit suits you.' },
        sv: { name: 'Ficus lyrata', why: 'För det ljusaste rummet du har, där en till två timmars direkt sol inte vore ovanligt, och en stadig vecko-vattning passar dig.' },
      },
      cuttings: {
        care: '/care/cuttings-in-water/',
        en: { name: 'Cuttings in water', why: 'For almost any room, including one with no real window, and the least fuss of anything we grow. Change the water every fortnight and that is the whole job.' },
        sv: { name: 'Sticklingar i vatten', why: 'För nästan vilket rum som helst, även ett utan ett riktigt fönster, och minst krångel av allt vi odlar. Byt vattnet varannan vecka, och det är hela jobbet.' },
      },
    };

    const UI = {
      en: { heading: (n) => `Your match: ${n}`, seeThe: 'See the ones we grow',
            petNote: 'None of the three are pet safe. If chewing is a real risk in your home, a glass of cuttings kept on a high shelf is the easiest to keep out of reach.',
            petLink: 'See what we recommend instead' },
      sv: { heading: (n) => `Din matchning: ${n}`, seeThe: 'Se de vi odlar',
            petNote: 'Ingen av de tre är husdjurssäker. Om tuggande är en verklig risk i ditt hem är ett glas sticklingar på en hög hylla det enklaste att hålla utom räckhåll.',
            petLink: 'Se vad vi rekommenderar istället' },
    };

    let last = null;

    const paint = () => {
      if (!last) return;
      const lang = currentLang();
      const t = UI[lang];
      const species = SPECIES[last.winner];
      const sp = species[lang];
      result.innerHTML = `
        <h2>${t.heading(sp.name)}</h2>
        <p>${sp.why}</p>
        <p><a href="${species.care}">${t.seeThe}</a></p>
        ${last.pets === 'yes' ? `<p class="cform__small">${t.petNote} <a href="/plants/pet-safe/">${t.petLink}</a>.</p>` : ''}
      `;
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const light = form.light.value;
      const effort = form.effort.value;
      const pets = form.pets.value;

      const score = { monstera: 0, ficus: 0, cuttings: 0 };
      if (light === 'direct') score.ficus += 2;
      else if (light === 'bright') score.monstera += 2;
      else score.cuttings += 2;
      if (effort === 'low') score.cuttings += 2;
      else { score.monstera += 1; score.ficus += 1; }

      const winner = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
      last = { winner, pets };
      paint();
      result.hidden = false;
      result.focus();
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    document.addEventListener('leafora:langchange', paint);
  }
}
