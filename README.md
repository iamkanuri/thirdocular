# ThirdOcular — thirdocular.com

The umbrella site for ThirdOcular, an independent lab for applied machine perception.
One page. Near-black. Quiet.

## Stack

- [Vite](https://vitejs.dev) + vanilla HTML/CSS/JS — no framework, nothing to hydrate.
- Fonts: Geist, Geist Mono, Instrument Serif — self-hosted woff2 subsets in
  `public/fonts` (no third-party requests). The latin faces are `<link rel="preload">`ed
  and declared in an inline `@font-face` block in [index.html](index.html).
- Ships ~6 KB gzipped (HTML + CSS + JS); the three above-the-fold latin fonts add ~75 KB.
  No runtime dependencies.

## Develop

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Deploy

Live path: **GitHub Pages**. Every push to `main` builds and deploys via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml) — no manual steps.
The site serves at <https://iamkanuri.github.io/thirdocular/> until the custom
domain is attached.

> GitHub Pages requires the repo to be public on the Free plan.

### Attaching thirdocular.com

1. Repo → Settings → Pages → Custom domain → `thirdocular.com`, save,
   and tick **Enforce HTTPS** once the certificate is issued.
2. At your DNS provider:
   - Apex `thirdocular.com`: four A records →
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www`: CNAME → `iamkanuri.github.io`
3. `lens.thirdocular.com` is the AisleLens app — a separate deployment with its
   own CNAME. Nothing in this repo touches it.

The build output in `dist/` is fully static, so Vercel, Netlify, or Cloudflare
Pages also work (build `npm run build`, output `dist`) if hosting ever moves.

## Assets

- `public/favicon.svg` — the iris mark.
- `public/icon-512.png`, `icon-192.png`, `apple-touch-icon.png` — app/touch icons,
  rendered from `scripts/icon.html` (512 via headless Chrome, smaller sizes downscaled
  from it). Referenced by `public/site.webmanifest`.
- `public/og.png` — 1200×630 Open Graph card, rendered from `scripts/og.html`.
  Regenerate after a copy change:

  ```sh
  chrome --headless=new --window-size=1200,630 --hide-scrollbars \
         --virtual-time-budget=8000 --screenshot=public/og.png scripts/og.html
  ```
- `public/404.html` — standalone branded not-found page (inline styles, no build deps).
- `public/sitemap.xml`, `robots.txt`, `site.webmanifest` — SEO and PWA metadata.

## Notes for editing

- All copy lives in `index.html`. The voice is a research lab, not a marketer:
  short declaratives, no hype words, no exclamation points.
- New products go in the Signals section as numbered nodes (`002`, `003`…).
  Keep one line of description. Resist adding more.
- Motion is atmosphere, not decoration: the rotating arcs, the orbiting point of
  light, and the scroll reveals are the entire animation budget. `prefers-reduced-motion`
  disables all of it.
