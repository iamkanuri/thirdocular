# ThirdOcular

Sandeep Kanuri's personal website at https://thirdocular.com. First-person work,
independent projects and dated notes. ThirdOcular is one person's independent studio.
The 1 November 2026 owner brief supersedes the earlier company/product-studio direction.

## Develop

Node 22, Vite, vanilla HTML/CSS/JS; fonts are self-hosted. No runtime dependencies.

    npm ci
    npm run dev -- --host 127.0.0.1
    npm run build
    npm run preview -- --host 127.0.0.1

Gate A's local preview uses Python's static server, so slashless directory URLs
redirect as they do on GitHub Pages, without Vite's single-page fallback:

    python -m http.server 4176 --bind 127.0.0.1 --directory dist

The homepage no longer quotes AisleLens shared product copy. Its network-dependent
shared-copy gate is retired in a separate commit. security-meta remains part of the
build and covers the maintained pages, including every note.

## Content

- index.html: first-person introduction, Proofspar in development, work, four
  existing projects, notes and contact.
- accuracy/: Proofspar, an accuracy pen test in development. Label proposed
  capabilities as planned until implemented and validated. No sample section
  appears before the demonstration is reviewed and approved.
- lessons/, retired/ and about/: the common lessons, project index and short
  first-person introduction. All historical URLs remain in place.
- notes/: three 300-500 word historical notes plus an index. Dates distinguish the
  measurement record from the writing date. No experiment was rerun for these notes.
- retired/privi/ and retired/aislelens/: first-person project stories added at the
  owner's request on 3 November. Lead with practical lessons, then evidence and
  limitations. Keep product retirement separate from completion of backend wind-down.
- labs/: paused and retired experiments. The former project detail URL is a minimal
  retirement notice with no archive details or access link.
- /ars and /consulting still resolve as legacy addresses and remain unlinked.
  Consulting does not offer services. Existing research artifacts are historical.
- public/pocketgiggles/dragon.mp4 stays byte-for-byte unchanged until Part B replaces it.
- public/og.png: 1200x630 card, with editable source in scripts/og.html and public/og.svg.

## Design and editing

Keep the iris, navy #1B2131, slate #4F6890, slate-light #7B9BC7 and ice #CBD8E4.
Fonts: Geist, Geist Mono and Instrument Serif. Text uses the high-contrast ice,
dim #A3B1C4 and faint #8A97AB ramp. Slate is for structure, not small text.
Keep content readable without JavaScript and respect reduced motion. No em dashes in
public copy, company “we”, numbered products, invented process or unsupported success
claims. No child details, archive locations, employer names or private-access links.
Only describe the employer as “a large regulated utility”. The owner's 3 November
request authorizes the Proofspar product-page preview and pilot-conversation CTA.
Do not add pricing, purchase flows or unsupported availability claims.

## Release gate

Work starts at origin/main 2185f8c in an isolated worktree. Do not alter the original
dirty main or consolidation worktree. Gate A requires local preview, 1440/768/360
screenshots and owner edits to the three notes. No push or deployment before his yes.
After approval, push to origin main and verify the live copy. GitHub Pages deploys
from .github/workflows/deploy.yml on a push to main. Publishing is not implied by a build.
Keep the concise current handoff in STATUS.md. Local review evidence is ignored.
Proofspar also requires the owner's outside-activity clearance before production,
under section 9.1 of the relaunch brief. See PROOFSPAR.md for scope and name rationale.

