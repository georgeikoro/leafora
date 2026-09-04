import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

/* Every page has to be named, or a build would only carry the home page. */
const page = (path) => fileURLToPath(new URL(path, import.meta.url));

/* Vite's dev server answers an unknown path with its own bare 404. This serves
   ours instead, so a wrong URL looks the same in development as in production. */
const serve404 = () => ({
  name: 'leafora-404',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      const path = req.url.split('?')[0];
      if (path.includes('.') || path === '/') return next();      // a file, or the home page
      if (path.startsWith('/@') || path.startsWith('/node_modules/')) return next();   // vite's own
      try {
        readFileSync(page('.' + (path.endsWith('/') ? path + 'index.html' : path + '/index.html')));
        return next();
      } catch {
        try {
          const html = readFileSync(page('./404.html'), 'utf8');
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html');
          return server.transformIndexHtml(req.url, html).then((out) => res.end(out));
        } catch { return next(); }
      }
    });
  },
});

export default defineConfig({
  appType: 'mpa',                         // many pages, so no falling back to index.html
  plugins: [serve404()],
  server: { host: true, port: 5190 },     // host:true so a phone on the same wifi can open it
  build: {
    rollupOptions: {
      input: {
        home:    page('./index.html'),
        plants:  page('./plants/index.html'),
        product: page('./plants/product.html'),
        care:    page('./care/index.html'),
        about:   page('./about/index.html'),
        contact: page('./contact/index.html'),
        journal:  page('./journal/index.html'),
        community: page('./community/index.html'),
        post1:    page('./journal/what-a-plant-does-to-a-room/index.html'),
        post2:    page('./journal/a-year-under-glass/index.html'),
        post3:    page('./journal/how-we-pack-a-plant/index.html'),
        diagnose: page('./care/diagnose/index.html'),
        saved:    page('./saved/index.html'),
        privacy:  page('./privacy/index.html'),
        terms:    page('./terms/index.html'),
        cookies:  page('./cookies/index.html'),
        pots:     page('./pots-and-tools/index.html'),
        gifts:    page('./gift-cards/index.html'),
        cart:     page('./cart/index.html'),
        checkout: page('./checkout/index.html'),
        order:    page('./order/index.html'),
        account:  page('./account/index.html'),
        search:   page('./search/index.html'),
        delivery: page('./delivery-returns/index.html'),
        growers:  page('./growers/index.html'),
        petsafe:  page('./plants/pet-safe/index.html'),
        repot:    page('./care/repotting/index.html'),
        nudge:    page('./care/watering-nudge/index.html'),
        monstera: page('./care/monstera/index.html'),
        ficus:    page('./care/ficus-lyrata/index.html'),
        cuttings: page('./care/cuttings-in-water/index.html'),
        the_corner_monstera: page('./plants/the-corner-monstera/index.html'),
        the_desk_cutting: page('./plants/the-desk-cutting/index.html'),
        the_fig_bundle: page('./plants/the-fig-bundle/index.html'),
        the_glass_trio: page('./plants/the-glass-trio/index.html'),
        the_monstera_pot: page('./plants/the-monstera-pot/index.html'),
        the_root_vessel: page('./plants/the-root-vessel/index.html'),
        the_shade_fig: page('./plants/the-shade-fig/index.html'),
        the_studio_monstera: page('./plants/the-studio-monstera/index.html'),
        the_window_fig: page('./plants/the-window-fig/index.html'),
        faq: page('./faq/index.html'),
        visit: page('./visit/index.html'),
        wholesale: page('./wholesale/index.html'),
        accessibility: page('./accessibility/index.html'),
        sitemap: page('./sitemap/index.html'),
        findAPlant: page('./find-a-plant/index.html'),
        notFound: page('./404.html'),
      },
    },
  },
});
