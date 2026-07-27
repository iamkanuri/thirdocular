#!/usr/bin/env node
// ===========================================================================
// check-copy.mjs — the deploy gate that makes thirdocular.com and
// lens.thirdocular.com unable to describe the product differently.
//
// WHY THIS EXISTS, AND WHY IT IS A PRESENCE CHECK
//
// The AisleLens product block on this page drifted from the product's own
// description and stayed wrong for weeks. When it was finally measured on
// 2026-07-27 the two sites differed by ONE WORD: this page said a requirement
// is reported as "pass, not proven, or requires store access"; the product
// says "proven". Both sites had been audited and both had passed, because
// every check that ran was an ABSENCE sweep — no banned vocabulary, no retired
// palette. An absence check cannot see a paragraph that sells the wrong
// product. It can only see words that are gone.
//
// So this is the opposite: an assertion that specific CONTENT is present and
// EQUAL AFTER HTML-ENTITY DECODING AND WHITESPACE COLLAPSING to the single
// source of truth.
//
// ⚠️ NOT "byte-identical" — that was the first wording here and it is false as
// written. index.html carries two U+00A0 (from `&nbsp;`) where the constant has
// plain spaces, and it has to: those are line-break guards in the rendered
// capability line. The comparison deliberately ignores WHITESPACE differences and
// deliberately does NOT ignore character ones, which is why substituting a curly
// apostrophe for an ASCII one still fails it. Overstating a gate's contract is the
// same class of error as overstating a product's, and this file exists because of
// the second one. The source of truth is
//   ShopifyACO viewer/src/copy.ts  ->  PRODUCT_KIND
//                                      PRODUCT_DESCRIPTION
//                                      PRODUCT_CAPABILITIES
// served at GET https://lens.thirdocular.com/api/brand.json.
//
// THREE PROPERTIES THIS SCRIPT REFUSES TO GIVE UP
//
// 1. A CHECK THAT COULD NOT RUN IS NOT A PASSING CHECK. A network failure,
//    a 404, a non-JSON body or a missing field exits 1 with a message that
//    says the check could not be performed — never 0. An instrument that
//    fails open reports "clean" and "did not run" with the same exit code,
//    which is how this project has been fooled before.
//
// 2. TWO-SIDED LIVENESS CANARY. Before comparing anything real, the script
//    runs its own comparator over a pair that MUST match and a pair that MUST
//    differ. If either answer is wrong — most importantly, if the comparator
//    has been normalised into something that can never report a mismatch —
//    the run is INCOMPLETE and exits 1. A comparator that always says "same"
//    passes every deploy while the sites drift apart.
//
// 3. THE ESCAPE HATCH IS LOUD AND NAMED. SKIP_COPY_CHECK=1 bypasses the gate
//    and says so in a banner. It is for an emergency deploy while the API is
//    down, not for a red build.
//
// Usage:
//   node scripts/check-copy.mjs           # the gate (npm run check:copy)
//   SKIP_COPY_CHECK=1 node scripts/...    # documented bypass, prints loudly
//   COPY_CHECK_FIXTURE=path.json node ... # local dev only; refused under CI
// ===========================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const INDEX_HTML = path.join(REPO, 'index.html');

const BRAND_URL = process.env.COPY_CHECK_URL || 'https://lens.thirdocular.com/api/brand.json';
const TIMEOUT_MS = Number(process.env.COPY_CHECK_TIMEOUT_MS || 15000);

/** span class -> field name in /api/brand.json */
const PAIRS = [
  { cls: 'signal-kind', field: 'kind', constant: 'PRODUCT_KIND' },
  { cls: 'signal-desc', field: 'description', constant: 'PRODUCT_DESCRIPTION' },
  { cls: 'signal-capability', field: 'capabilities', constant: 'PRODUCT_CAPABILITIES' },
];

// ---------------------------------------------------------------------------
// Exit codes are the whole contract, so they are named.
//   0 = VERIFIED    every pair compared and matched
//   1 = DEFECT      a pair mismatched
//   1 = INCOMPLETE  the check could not be performed (network, parse, canary)
// DEFECT and INCOMPLETE share an exit code on purpose: both must stop a
// deploy. They are distinguished in the OUTPUT, never by failing open.
// ---------------------------------------------------------------------------
const OUT = [];
const say = (s = '') => {
  OUT.push(s);
  console.log(s);
};

function incomplete(reason, detail) {
  say('');
  say('  INCOMPLETE — the copy check could not be performed.');
  say('  ' + reason);
  if (detail) {
    for (const line of String(detail).split('\n')) say('    ' + line);
  }
  say('');
  say('  This is NOT a pass. A measurement that did not complete is not a');
  say('  passing measurement, so the build stops here.');
  say('  If the API is genuinely down and you must ship, set SKIP_COPY_CHECK=1');
  say('  and say so in the commit message.');
  say('');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTML entity decoding + whitespace collapse.
// The comparison is on DECODED CHARACTERS, so &nbsp; and a literal space are
// the same thing here, and a curly U+2019 apostrophe is NOT the same thing as
// an ASCII U+0027 one. That asymmetry is deliberate: whitespace is a rendering
// detail, a different character is different text.
// ---------------------------------------------------------------------------
const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  middot: '·',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  copy: '©',
  times: '×',
};

function decodeEntities(input) {
  return input.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return whole;
      try {
        return String.fromCodePoint(code);
      } catch {
        return whole;
      }
    }
    const named = NAMED_ENTITIES[body];
    return named === undefined ? whole : named;
  });
}

/** Collapse every run of whitespace (JS \s includes U+00A0) to one space, trim. */
function collapse(input) {
  return input.replace(/\s+/g, ' ').trim();
}

function renderedText(html) {
  // Strip comments and any nested tags, then decode, then collapse. The three
  // spans this gate reads contain no markup today; stripping tags means adding
  // an <em> later changes styling without silently changing the compared text.
  const noComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const noTags = noComments.replace(/<[^>]*>/g, '');
  return collapse(decodeEntities(noTags));
}

/**
 * Pull the inner HTML of <span class="...NAME..."> out of a document.
 * Written as a small depth-aware scan rather than a regex because the source
 * splits the open tag across lines (`<span class="x"\n  >text</span\n>`), and
 * because a regex for "up to the next </span>" is wrong the day someone nests
 * one. Returns null when absent — the caller treats that as INCOMPLETE, not
 * as an empty string that would compare equal to nothing.
 */
function extractSpan(html, className) {
  const attrRe = new RegExp('<span\\b[^>]*class\\s*=\\s*"([^"]*)"', 'g');
  let m;
  while ((m = attrRe.exec(html)) !== null) {
    const classes = m[1].split(/\s+/);
    if (!classes.includes(className)) continue;

    const openEnd = html.indexOf('>', m.index);
    if (openEnd < 0) return null;

    let depth = 1;
    let i = openEnd + 1;
    const start = i;
    while (i < html.length) {
      const nextOpen = html.indexOf('<span', i);
      const nextClose = html.indexOf('</span', i);
      if (nextClose < 0) return null;
      if (nextOpen >= 0 && nextOpen < nextClose) {
        depth += 1;
        i = nextOpen + 5;
        continue;
      }
      depth -= 1;
      if (depth === 0) return html.slice(start, nextClose);
      i = nextClose + 6;
    }
    return null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// The comparator. One function, used for the real pairs AND for the canary,
// so the canary really does exercise the code path the gate depends on.
// Returns { same: boolean, index: number } — index is -1 when same.
// ---------------------------------------------------------------------------
function compare(actual, expected) {
  if (actual === expected) return { same: true, index: -1 };
  const n = Math.min(actual.length, expected.length);
  let i = 0;
  while (i < n && actual[i] === expected[i]) i += 1;
  return { same: false, index: i };
}

function codepoint(str, i) {
  if (i >= str.length) return '(end of string)';
  const c = str.charCodeAt(i);
  const hex = 'U+' + c.toString(16).toUpperCase().padStart(4, '0');
  const printable = c >= 32 && c !== 127 ? '"' + str[i] + '"' : '(non-printing)';
  return hex + ' ' + printable;
}

function reportMismatch(pair, actual, expected, index) {
  const w = 40;
  const from = Math.max(0, index - w);
  say('');
  say('  MISMATCH  span.' + pair.cls + '  vs  brand.json "' + pair.field + '"');
  say('  source of truth: ' + pair.constant + ' in ShopifyACO viewer/src/copy.ts');
  say('');
  say('    index.html  (' + actual.length + ' chars):');
  say('      ' + JSON.stringify(actual));
  say('    ' + BRAND_URL + '  (' + expected.length + ' chars):');
  say('      ' + JSON.stringify(expected));
  say('');
  say('    first difference at character index ' + index);
  say('      index.html : ' + codepoint(actual, index));
  say('      served     : ' + codepoint(expected, index));
  say('    context (index.html) : ' + JSON.stringify(actual.slice(from, index + w)));
  say('    context (served)     : ' + JSON.stringify(expected.slice(from, index + w)));
}

// ---------------------------------------------------------------------------
// TWO-SIDED LIVENESS CANARY.
// A comparator that always answers "same" would pass every deploy forever
// while the two sites drift. One that always answers "different" would block
// every deploy and get deleted. So both answers are proved before any real
// comparison runs, through the SAME function the gate uses.
// ---------------------------------------------------------------------------
function runCanary() {
  const A = 'reporting every requirement as proven, not proven';
  const B = 'reporting every requirement as pass, not proven'; // the real historical drift
  const failures = [];

  const identical = compare(A, A);
  if (!identical.same) failures.push('comparator reported a MISMATCH on two identical strings');

  const different = compare(B, A);
  if (different.same) {
    failures.push('comparator reported a MATCH on two strings that differ');
  } else if (different.index !== 32) {
    // "reporting every requirement as " is 31 characters; "pass" and "proven"
    // share a leading "p", so the first differing index is 32. Asserting the
    // POSITION and not merely "not same" is what proves the reported index is
    // real — a diff report that points at the wrong character is a diff report
    // nobody can act on.
    failures.push(
      'comparator located the first difference at index ' +
        different.index +
        ', expected 32 ("pass" vs "proven" diverge after a shared "p")'
    );
  }

  // The extractor and the text pipeline are on the same critical path, so they
  // get a canary too: one input whose decoded text is known, one that must not
  // silently decode to the same thing.
  const fixture =
    '<span class="canary-a"\n  >full&nbsp;· a store' +
    "'" +
    's page</span\n>' +
    '<span class="canary-b">full · a store’s page</span>';
  const a = extractSpan(fixture, 'canary-a');
  const b = extractSpan(fixture, 'canary-b');
  if (a === null || b === null) {
    failures.push('extractSpan could not find its own canary spans');
  } else {
    const ta = renderedText(a);
    const tb = renderedText(b);
    if (ta !== "full · a store's page") {
      failures.push('entity/whitespace pipeline produced ' + JSON.stringify(ta));
    }
    if (ta === tb) {
      failures.push(
        'pipeline collapsed a curly apostrophe into an ASCII one — it can no longer see real drift'
      );
    }
  }

  if (failures.length) {
    say('');
    say('  CANARY FAILED — the comparator cannot be trusted, so its verdict is worthless:');
    for (const f of failures) say('    - ' + f);
    incomplete('The two-sided liveness canary did not hold.');
  }
  say('  canary        ok  (match, mismatch, and entity pipeline all behave)');
}

// ---------------------------------------------------------------------------
async function fetchBrand() {
  if (process.env.COPY_CHECK_FIXTURE) {
    const fx = process.env.COPY_CHECK_FIXTURE;
    if (process.env.CI) {
      incomplete(
        'COPY_CHECK_FIXTURE is set under CI. A deploy gate must read the LIVE API,',
        'not a file in the repo, or it proves nothing about the deployed site.'
      );
    }
    say('');
    say('  !! COPY_CHECK_FIXTURE=' + fx);
    say('  !! Reading a LOCAL FILE instead of ' + BRAND_URL + '.');
    say('  !! This proves the comparator, NOT the live site. Local dev only.');
    say('');
    let raw;
    try {
      raw = fs.readFileSync(path.resolve(REPO, fx), 'utf8');
    } catch (err) {
      incomplete('Fixture file could not be read: ' + fx, err && err.message);
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      incomplete('Fixture file is not valid JSON: ' + fx, err && err.message);
    }
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(BRAND_URL, {
      signal: ac.signal,
      headers: { accept: 'application/json' },
      redirect: 'follow',
    });
  } catch (err) {
    incomplete(
      'Could not reach ' + BRAND_URL,
      (err && (err.message || String(err))) +
        (err && err.cause && err.cause.message ? '\ncause: ' + err.cause.message : '')
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let body = '';
    try {
      body = (await res.text()).slice(0, 300);
    } catch {
      /* body is best-effort context only */
    }
    incomplete(
      'HTTP ' + res.status + ' ' + res.statusText + ' from ' + BRAND_URL,
      'A 404 here usually means /api/brand.json is not deployed yet.\n' +
        'first 300 bytes of the body:\n' +
        body
    );
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    incomplete(
      'Response from ' + BRAND_URL + ' is not JSON.',
      (err && err.message) + '\nfirst 300 bytes:\n' + text.slice(0, 300)
    );
  }
}

// ---------------------------------------------------------------------------
async function main() {
  say('');
  say('  copy gate  index.html  <->  ' + BRAND_URL);
  say('');

  if (process.env.SKIP_COPY_CHECK === '1') {
    say('  ###############################################################');
    say('  ##  SKIP_COPY_CHECK=1 — THE COPY GATE DID NOT RUN.           ##');
    say('  ##  Nothing has verified that this site describes the        ##');
    say('  ##  product the way the product describes itself. This is    ##');
    say('  ##  an explicit, documented bypass; say so in the commit.    ##');
    say('  ###############################################################');
    say('');
    process.exit(0);
  }

  runCanary();

  let html;
  try {
    html = fs.readFileSync(INDEX_HTML, 'utf8');
  } catch (err) {
    incomplete('Could not read ' + INDEX_HTML, err && err.message);
  }
  say('  index.html    ok  (' + html.length + ' bytes)');

  const local = [];
  for (const pair of PAIRS) {
    const inner = extractSpan(html, pair.cls);
    if (inner === null) {
      incomplete(
        'No <span class="' + pair.cls + '"> found in index.html.',
        'The product block was renamed or removed. This gate compares content;\n' +
          'a missing element is a gate that cannot run, not a gate that passed.'
      );
    }
    local.push(renderedText(inner));
  }

  const brand = await fetchBrand();
  say('  brand.json    ok  (name=' + JSON.stringify(brand && brand.name) + ')');

  const missing = PAIRS.filter((p) => typeof (brand || {})[p.field] !== 'string').map(
    (p) => p.field
  );
  if (missing.length) {
    incomplete(
      'brand.json is missing string field(s): ' + missing.join(', '),
      'keys present: ' + Object.keys(brand || {}).join(', ')
    );
  }

  let defects = 0;
  for (let i = 0; i < PAIRS.length; i++) {
    const pair = PAIRS[i];
    const actual = local[i];
    const expected = collapse(brand[pair.field]);
    const r = compare(actual, expected);
    if (r.same) {
      say('  ' + pair.cls.padEnd(20) + 'match  (' + actual.length + ' chars)');
    } else {
      defects += 1;
      reportMismatch(pair, actual, expected, r.index);
    }
  }

  say('');
  if (defects > 0) {
    say('  DEFECTS FOUND — ' + defects + ' of ' + PAIRS.length + ' spans disagree with the product.');
    say('  The build stops. Copy the served string into index.html verbatim, or');
    say('  change the constant in ShopifyACO viewer/src/copy.ts and redeploy it.');
    say('');
    process.exit(1);
  }

  say('  VERIFIED CLEAN — ' + PAIRS.length + ' of ' + PAIRS.length + ' spans agree with the product (entity-decoded, whitespace-collapsed).');
  say('');
  process.exit(0);
}

main().catch((err) => {
  incomplete('Unhandled error in the copy gate.', (err && (err.stack || err.message)) || String(err));
});
