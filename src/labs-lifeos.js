/* ===========================================================================
   /labs/lifeos — the two signature interactives.
   Loaded after src/main.js, which already handles .reveal and the lens field.

   Both obey prefers-reduced-motion by rendering their FINISHED state rather
   than an empty one. A visitor who has asked for less motion should still get
   the idea, not a blank rectangle where the idea was.

   No libraries. Canvas 2D and DOM text. Roughly 9KB unminified.
   =========================================================================== */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------------
   INTERACTIVE A — fragments become a model.

   Scattered evidence drifts. As the visitor scrolls, each fragment migrates to
   one of five concepts, trails are drawn from fragment to concept, and the
   concepts connect into a single structure.

   The assembly is driven by scroll position so it reads as the visitor's own
   doing. If nobody scrolls within four seconds, it assembles itself once, so
   that a reader who stops to read the headline still sees the argument. Once a
   scroll has happened the automatic ramp is abandoned for good and the scroll
   is the only driver, which keeps the interaction reversible.
   ------------------------------------------------------------------------- */

const stage = document.getElementById('stage');
const canvas = document.getElementById('fragments');
const stateEl = document.getElementById('stage-state');

if (stage && canvas && !reduced) {
  const ctx = canvas.getContext('2d', { alpha: true });

  /* Five concepts, in normalized stage coordinates. Fully synthetic labels:
     abstract entity names that match the visual language and carry no risk. */
  const CONCEPTS = [
    { x: 0.22, y: 0.36, label: 'Person 01' },
    { x: 0.42, y: 0.24, label: 'Home A' },
    { x: 0.71, y: 0.39, label: 'Trip 2019' },
    { x: 0.81, y: 0.66, label: 'Tax Year' },
    { x: 0.5, y: 0.75, label: 'Policy' },
  ];

  /* Which concepts are joined once the model resolves. */
  const EDGES = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 0],
    [1, 4],
    [0, 2],
  ];

  const GLYPHS = ['doc', 'photo', 'pin', 'mail', 'date', 'person'];
  const COUNT = 34;

  /* A deterministic generator: the composition should be identical on every
     load and on every machine, so it can be judged as a design rather than
     re-rolled until it happens to look good. */
  let seed = 20260813;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const frags = [];
  for (let i = 0; i < COUNT; i++) {
    const concept = i % CONCEPTS.length;
    const angle = rand() * Math.PI * 2;
    const radius = 0.035 + rand() * 0.055;
    frags.push({
      glyph: GLYPHS[Math.floor(rand() * GLYPHS.length)],
      /* where it drifts before it belongs to anything */
      dx: 0.06 + rand() * 0.88,
      dy: 0.1 + rand() * 0.8,
      /* drift motion */
      phase: rand() * Math.PI * 2,
      speed: 0.18 + rand() * 0.34,
      amp: 0.008 + rand() * 0.016,
      /* where it ends up, tucked around its concept */
      concept,
      ax: CONCEPTS[concept].x + Math.cos(angle) * radius,
      ay: CONCEPTS[concept].y + Math.sin(angle) * radius * 0.72,
      /* fragments join the model at slightly different moments */
      lag: rand() * 0.28,
    });
  }

  let w = 0;
  let h = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = stage.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  function drawGlyph(kind, x, y, alpha) {
    ctx.strokeStyle = `rgba(203,216,228,${alpha})`;
    ctx.fillStyle = `rgba(203,216,228,${alpha * 0.5})`;
    ctx.lineWidth = 1;
    const s = 4.5;

    ctx.beginPath();
    switch (kind) {
      case 'doc':
        ctx.rect(x - s * 0.7, y - s, s * 1.4, s * 2);
        ctx.moveTo(x - s * 0.3, y - s * 0.3);
        ctx.lineTo(x + s * 0.3, y - s * 0.3);
        ctx.moveTo(x - s * 0.3, y + s * 0.3);
        ctx.lineTo(x + s * 0.3, y + s * 0.3);
        break;
      case 'photo':
        ctx.rect(x - s, y - s * 0.75, s * 2, s * 1.5);
        ctx.moveTo(x - s * 0.4, y + s * 0.2);
        ctx.lineTo(x, y - s * 0.3);
        ctx.lineTo(x + s * 0.6, y + s * 0.4);
        break;
      case 'pin':
        ctx.arc(x, y - s * 0.3, s * 0.62, 0, Math.PI * 2);
        ctx.moveTo(x, y + s * 0.3);
        ctx.lineTo(x, y + s);
        break;
      case 'mail':
        ctx.rect(x - s, y - s * 0.65, s * 2, s * 1.3);
        ctx.moveTo(x - s, y - s * 0.65);
        ctx.lineTo(x, y + s * 0.15);
        ctx.lineTo(x + s, y - s * 0.65);
        break;
      case 'date':
        ctx.rect(x - s * 0.85, y - s * 0.7, s * 1.7, s * 1.5);
        ctx.moveTo(x - s * 0.85, y - s * 0.2);
        ctx.lineTo(x + s * 0.85, y - s * 0.2);
        break;
      default:
        ctx.arc(x, y - s * 0.35, s * 0.5, 0, Math.PI * 2);
        ctx.moveTo(x - s * 0.75, y + s);
        ctx.quadraticCurveTo(x, y + s * 0.1, x + s * 0.75, y + s);
    }
    ctx.stroke();
  }

  let started = 0;
  let scrolled = false;
  let scrollP = 0;
  let visible = true;
  let raf = 0;

  function readScroll() {
    const r = stage.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    scrollP = clamp01(1 - (r.top + r.height * 0.35) / (vh * 0.9));
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    if (!started) started = now;
    const t = (now - started) / 1000;

    /* The automatic ramp only exists for a visitor who has not scrolled. */
    const autoP = scrolled ? 0 : clamp01((t - 4) / 5);
    const p = Math.max(scrollP, autoP);
    const ep = easeOut(clamp01(p));

    ctx.clearRect(0, 0, w, h);

    /* trails: fragment to its concept */
    const trailAlpha = clamp01((p - 0.3) / 0.35) * 0.32;
    if (trailAlpha > 0.002) {
      ctx.strokeStyle = `rgba(124,197,188,${trailAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const f of frags) {
        const fp = easeOut(clamp01((p - f.lag) / (1 - f.lag)));
        const dxp = f.dx + Math.sin(t * f.speed + f.phase) * f.amp;
        const dyp = f.dy + Math.cos(t * f.speed * 0.8 + f.phase) * f.amp;
        const x = (dxp + (f.ax - dxp) * fp) * w;
        const y = (dyp + (f.ay - dyp) * fp) * h;
        ctx.moveTo(x, y);
        ctx.lineTo(CONCEPTS[f.concept].x * w, CONCEPTS[f.concept].y * h);
      }
      ctx.stroke();
    }

    /* structure: concept to concept, the last thing to appear */
    const edgeAlpha = clamp01((p - 0.66) / 0.3) * 0.55;
    if (edgeAlpha > 0.002) {
      ctx.strokeStyle = `rgba(124,197,188,${edgeAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [a, b] of EDGES) {
        ctx.moveTo(CONCEPTS[a].x * w, CONCEPTS[a].y * h);
        ctx.lineTo(CONCEPTS[b].x * w, CONCEPTS[b].y * h);
      }
      ctx.stroke();
    }

    /* fragments */
    for (const f of frags) {
      const fp = easeOut(clamp01((p - f.lag) / (1 - f.lag)));
      const dxp = f.dx + Math.sin(t * f.speed + f.phase) * f.amp;
      const dyp = f.dy + Math.cos(t * f.speed * 0.8 + f.phase) * f.amp;
      const x = (dxp + (f.ax - dxp) * fp) * w;
      const y = (dyp + (f.ay - dyp) * fp) * h;
      drawGlyph(f.glyph, x, y, 0.16 + 0.4 * (1 - fp * 0.55));
    }

    /* concept nodes and their labels */
    const nodeAlpha = clamp01((p - 0.5) / 0.3);
    const labelAlpha = clamp01((p - 0.72) / 0.24);
    for (const c of CONCEPTS) {
      const cx = c.x * w;
      const cy = c.y * h;
      if (nodeAlpha > 0.002) {
        ctx.fillStyle = `rgba(124,197,188,${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(124,197,188,${nodeAlpha * 0.25})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 9 + (1 - ep) * 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (labelAlpha > 0.002) {
        ctx.fillStyle = `rgba(203,216,228,${labelAlpha})`;
        ctx.font = '11px "Geist Mono", ui-monospace, monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.label, cx + 12, cy + 1);
      }
    }

    if (stateEl) {
      const label =
        p < 0.25 ? 'drifting' : p < 0.6 ? 'connecting' : p < 0.85 ? 'resolving' : 'one model';
      if (stateEl.textContent !== label) stateEl.textContent = label;
    }
  }

  resize();
  readScroll();

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener(
    'scroll',
    () => {
      scrolled = true;
      readScroll();
    },
    { passive: true }
  );

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
      },
      { rootMargin: '120px' }
    ).observe(stage);
  }

  raf = requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------------------
   INTERACTIVE B — the mission state machine.

   A Mission is a continuing responsibility, not a query, and the fastest way
   to show that is to let one run in front of you: evidence is expected, then
   observed, then reconciled, then verified, and what is left over is missing.
   Then new evidence arrives and the whole thing re-evaluates, which is the
   part a search box can never do.

   Every figure here is synthetic and the card says so. They are internally
   consistent on purpose: expected minus observed equals missing, so a reader
   who checks the arithmetic finds it holds.
   ------------------------------------------------------------------------- */

const machine = document.getElementById('machine');

if (machine) {
  const rows = [...machine.querySelectorAll('.ledger-row')];
  const meter = document.getElementById('m-meter');
  const readiness = document.getElementById('m-readiness');
  const narration = document.getElementById('m-narration');

  const EXPECTED = 24;
  const VERIFIED = 14;
  const FINAL_READY = Math.round((VERIFIED / EXPECTED) * 100);

  const SCRIPT = [
    {
      state: 'expected',
      say: 'The graph already knows what this year is supposed to produce. Twenty four pieces of evidence, derived from the pattern of previous years.',
    },
    {
      state: 'observed',
      say: 'Nineteen have actually been seen across the mailboxes, drives and scans.',
    },
    {
      state: 'reconciled',
      say: 'Two of those turned out to be the same record filed twice. Seventeen distinct records remain.',
    },
    {
      state: 'verified',
      say: 'Fourteen are corroborated by a second, independent source. Readiness is evidence completeness, not a checklist somebody ticked.',
    },
    {
      state: 'missing',
      say: 'Five expected records have no evidence at all. The mission does not fail and does not close. It stays open and keeps watching.',
    },
    {
      state: 'reset',
      say: 'New evidence arrives. The mission re-evaluates itself, without being asked again.',
    },
  ];

  const setRow = (row, value) => {
    row.querySelector('.count').textContent = String(value);
  };

  function finalState() {
    rows.forEach((r) => {
      setRow(r, Number(r.querySelector('.count').dataset.n));
      r.classList.remove('active');
    });
    if (meter) meter.style.width = FINAL_READY + '%';
    if (readiness) readiness.textContent = FINAL_READY + '%';
    if (narration) narration.textContent = SCRIPT[4].say;
  }

  if (reduced || !('IntersectionObserver' in window)) {
    finalState();
  } else {
    let step = -1;
    let timer = 0;
    let running = false;

    /* Count up to a target over a fixed duration, so a row of 24 and a row of
       3 finish together and the reader's eye is not dragged to the big one. */
    function countTo(row, target, ms) {
      const el = row.querySelector('.count');
      const from = Number(el.textContent) || 0;
      const t0 = performance.now();
      function tick(now) {
        const k = Math.min(1, (now - t0) / ms);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = String(Math.round(from + (target - from) * eased));
        if (k < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function advance() {
      step = (step + 1) % SCRIPT.length;
      const s = SCRIPT[step];

      if (s.state === 'reset') {
        rows.forEach((r) => r.classList.remove('active'));
        if (narration) narration.textContent = s.say;
        timer = window.setTimeout(() => {
          rows.forEach((r) => {
            r.querySelector('.count').textContent = '0';
          });
          if (meter) meter.style.width = '0%';
          if (readiness) readiness.textContent = '0%';
          advance();
        }, 2600);
        return;
      }

      const row = rows.find((r) => r.dataset.state === s.state);
      rows.forEach((r) => r.classList.toggle('active', r === row));
      if (row) countTo(row, Number(row.querySelector('.count').dataset.n), 700);
      if (narration) narration.textContent = s.say;

      if (s.state === 'verified') {
        if (meter) meter.style.width = FINAL_READY + '%';
        if (readiness) {
          const t0 = performance.now();
          const tick = (now) => {
            const k = Math.min(1, (now - t0) / 900);
            readiness.textContent = Math.round(FINAL_READY * (1 - Math.pow(1 - k, 3))) + '%';
            if (k < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }

      timer = window.setTimeout(advance, 3400);
    }

    new IntersectionObserver(
      (entries) => {
        const seen = entries[0].isIntersecting;
        if (seen && !running) {
          running = true;
          advance();
        } else if (!seen && running) {
          running = false;
          window.clearTimeout(timer);
        }
      },
      { threshold: 0.35 }
    ).observe(machine);
  }
}
