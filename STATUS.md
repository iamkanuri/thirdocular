# Proofspar preview ready

Updated 3 November 2026. Branch: `proofspar-launch-20261103`, based on published main at `2631b6f`. The owner asked for the new accuracy pen test to be named and advanced. The chosen name is **Proofspar by ThirdOcular**, with the line **Put your AI's answers under pressure.** See `PROOFSPAR.md` for the reasoning and scope.

## Completed

- Built `/accuracy/`, `/lessons/`, `/retired/` and `/about/` in the existing Vite site. Kept the approved first-person homepage and added a prominent Proofspar section, hero link and navigation entry.
- Explained the intended test, concrete question types, planned evidence report, buyer fit and limits. All unbuilt functionality is marked planned. No sample report, customer claim, pricing or purchase flow was added.
- Connected the two published retirement stories to Proofspar. Revised display wording on seven legacy research pages under the owner's earlier instruction, added archive disclosures, retained all numeric sequences and structured data, and preserved original JSON URLs alongside two identical aliases.
- Added unique metadata, sitemap entries and a 1200 by 630 sharing image. Existing robots rules already allow the pages and reference the updated sitemap.

## Verification

- Production build and `git diff --check` pass. The preview contains 22 HTML pages, with zero long dashes or prohibited terms outside the product page's explicit scope section.
- All 465 local link and asset references resolve. All 12 sitemap pages return 200 locally. The four new slashless paths each return a single 301 to their slash form, then 200; no existing URL was removed or redirected to an unrelated page.
- All 465 previously captured AisleLens and Privi URLs returned HTTP 200 on 3 November, including all three URLs from `OUTREACH-LINKS.md`. One batch encountered rate limiting; a later paced recheck passed. Status checks do not establish recovery of the twelve previously missing legacy originals.
- All 22 pages have phone screenshots at 375 CSS pixels and no horizontal overflow. Proofspar also passed tablet and desktop checks. The homepage feature opens the correct product page; the planned-process anchor scrolls to its section. No browser console errors were observed.
- Lighthouse 13.6.0 on a compatible temporary Node 22.19 runtime: Home 100 performance / 100 accessibility / 100 SEO; Proofspar 100 / 100 / 100; Lessons 100 / 100 / 100. Font preloads resolved the initial layout shift. These are local mobile lab results, not production field measurements. Project dependencies were not changed.
- Review evidence is under ignored `.review/`. The full self-contained review starts at `.review/accuracy-preview.html`, with home and lessons links. Images and private historical-link records are excluded from the production build. The temporary HTTP preview was served at `http://127.0.0.1:4178/` during this task and is stopped at teardown.

## Remaining gate

No production push or deployment has occurred. The owner has not yet answered the clearance clarification. Section 9.1 of the owner brief requires outside-activity clearance before the product page goes live; section 3.9 requires approval of this completed preview. Prior approval covered only the already-published project stories.

The accuracy engine and demonstration remain unbuilt. After the Phase 2 stop point, Phase 3 requires frozen probes before model runs and blind owner labels before measuring the checker. Phase 4 remains locked behind the owner's buyer-conversation decision file. No paid model calls, third-party probes, backend shutdown or new infrastructure occurred here.
