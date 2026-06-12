# ThirdOcular — thirdocular.com

The umbrella site for ThirdOcular, an independent lab for applied machine perception.
One page. Near-black. Quiet.

## Stack

- [Vite](https://vitejs.dev) + vanilla HTML/CSS/JS — no framework, nothing to hydrate.
- Fonts: Geist, Geist Mono, Instrument Serif via Google Fonts.
- Ships ~6 KB gzipped (HTML + CSS + JS) plus fonts. No runtime dependencies.

## Develop

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Deploy

The build output in `dist/` is fully static — any static host works.

### Vercel

```sh
npx vercel --prod
```

Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.

### Netlify

Build command `npm run build`, publish directory `dist`.

### Cloudflare Pages

Build command `npm run build`, output directory `dist`.

### DNS

- Point `thirdocular.com` (apex) and `www` at the host per its instructions
  (Vercel: A `76.76.21.21` for apex, CNAME `cname.vercel-dns.com` for www).
- `lens.thirdocular.com` is the AisleLens app — a separate deployment with its own
  CNAME. Nothing in this repo touches it.

## Assets

- `public/favicon.svg` — the iris mark.
- `public/og.png` — 1200×630 Open Graph card, rendered from `scripts/og.html`.
  Regenerate after a copy change:

  ```sh
  chrome --headless=new --window-size=1200,630 --hide-scrollbars \
         --virtual-time-budget=8000 --screenshot=public/og.png scripts/og.html
  ```

## Notes for editing

- All copy lives in `index.html`. The voice is a research lab, not a marketer:
  short declaratives, no hype words, no exclamation points.
- New products go in the Signals section as numbered nodes (`002`, `003`…).
  Keep one line of description. Resist adding more.
- Motion is atmosphere, not decoration: the rotating arcs, the orbiting point of
  light, and the scroll reveals are the entire animation budget. `prefers-reduced-motion`
  disables all of it.
