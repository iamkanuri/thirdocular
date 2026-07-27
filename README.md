# ThirdOcular — thirdocular.com

The umbrella site for ThirdOcular — a product studio building practical software for
decisions shaped by AI. One page. Deep navy. Quiet.

## Palette

Shared with the product sites so the two read as one company. Tokens live in
`:root` at the top of [src/style.css](src/style.css).

| token         | hex       | role                                   |
| ------------- | --------- | -------------------------------------- |
| `navy`        | `#1B2131` | base / ink                             |
| `slate`       | `#4F6890` | structure, borders, accent             |
| `slate-light` | `#7B9BC7` | brightest accent on dark               |
| `ice`         | `#CBD8E4` | body text on dark                      |

Two further company hues — **tan** (requires-store-access) and **crimson**
(not-proven) — are reserved for result states. **Crimson appears only where
something failed**: never a button, link, logo, heading, or hover state. This site
has no result states, so neither hue appears here at all, not even as a literal in
a comment. Do not introduce them.

`slate` is 2.84:1 on `navy` — structure only, never text. The text ramp is `ice`
(11.07:1), `--text-dim` `#A3B1C4` (7.37:1), `--text-faint` `#8A97AB` (5.42:1);
`slate-light` as accent text is 5.62:1. All clear 4.5:1, including over the
lightest point of the body gradient (`#232B3D`), where the ratios fall to 9.76,
6.50, 4.78 and 4.96 respectively.

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
   and tick **Enforce HTTPS** once GitHub has provisioned TLS for the domain.
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

> ⚠️ **The rasterised assets are one palette behind.** `scripts/og.html` and
> `scripts/icon.html` are on the navy palette, but `public/og.png`, `icon-512.png`,
> `icon-192.png` and `apple-touch-icon.png` are still the rendered near-black
> versions — regenerating them needs headless Chrome, and `og.html` additionally
> pulls Geist and Instrument Serif from Google Fonts at render time. Re-run both
> commands above before the next deploy. `favicon.svg` is served as source, so it
> is already correct.

## Notes for editing

- All copy lives in `index.html`. The voice is a focused product studio, not a
  marketer: short declaratives, concrete, no hype words, no exclamation points.
  Write in the present tense about what exists today — no "coming", no "will".
- **Vocabulary that must not appear in any rendered string.** <!-- vocab-rule: this
  bullet is the ONLY place these words may appear in the repo; exclude README.md
  from any automated ban sweep, and scope the sweep to dist/, index.html and
  public/404.html. --> Banned until true:
  certification, certified, standards body, accredited, trusted by, guaranteed,
  any user count, any revenue figure, any claim about what an AI system will do.
  Banned permanently: score, ranking, visibility, share of voice, GEO,
  optimise/optimize, boost — and "recommend" in the sense of predicting an
  assistant's behaviour. AisleLens measured that once; it does not any more.
  (The `Georgia` serif fallback in `--font-serif` contains the substring `geo`.
  It is a font stack, not copy — match `GEO` on a word boundary.)
- New products go in the Products section as numbered nodes (`002`, `003`…).
  Keep the description to a couple of concise lines plus one capability line.
- Motion is atmosphere, not decoration. The full budget: the rotating arcs and
  orbiting point of light in the iris; the wordmark's focus-pull on load; the
  scroll reveals; the "LIVE" pulse on Signal 001; and the perception field — a
  faint clarity (and thinning of the film grain) that follows the cursor on fine
  pointers, defaulting to the iris otherwise. `prefers-reduced-motion` disables
  all of it; the cursor effect also no-ops on touch.
