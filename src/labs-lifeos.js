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

   Scattered evidence drifts. On a toggle, fragments migrate to their concepts,
   trails draw from fragment to concept, and the concepts connect into one
   labelled structure.

   Two resting states, one tween. The first build scrubbed assembly with scroll
   position, which parked visitors on half-connected intermediates and finished
   assembling just as the stage scrolled out of view with its head cut off. On
   a phone it was worse: assembly rode a scroll-and-pinch negotiation. Discrete
   states fix all of it. The graph rests as either scattered fragments or one
   model, the animation between them is watched rather than steered, and on a
   phone it is a tap. The stage assembles itself once, unprompted, the first
   time it is seen; after that the toggle owns the state.
   ------------------------------------------------------------------------- */

const stage = document.getElementById('stage');
const canvas = document.getElementById('fragments');
const stateEl = document.getElementById('stage-state');

if (stage && canvas && !reduced) {
  const ctx = canvas.getContext('2d', { alpha: true });

  /* Nine concepts, in normalized stage coordinates. Fully synthetic labels:
     abstract entity names that match the visual language and carry no risk.
     `big` marks the two people, who carry slightly more weight than the things
     arranged around them. */
  const CONCEPTS = [
    { x: 0.26, y: 0.46, label: 'Person 01', big: true },
    { x: 0.17, y: 0.76, label: 'Person 02', big: true },
    { x: 0.15, y: 0.18, label: 'Employer' },
    { x: 0.35, y: 0.13, label: 'Home A' },
    { x: 0.53, y: 0.42, label: 'Home B' },
    { x: 0.73, y: 0.17, label: 'Trip 2019' },
    { x: 0.45, y: 0.78, label: 'Tax Year' },
    { x: 0.75, y: 0.55, label: 'Policy' },
    { x: 0.64, y: 0.86, label: 'Claim', hollow: true },
  ];

  /* The structure the fragments resolve into. It is not decoration: two people
     joined and sharing a tax year and a trip is a household; two homes joined
     to each other is a move; a policy on the second home is property, insured.
     `soft: true` edges are inferred or unresolved and draw dashed, which is the
     page's trust model expressed in line weight. */
  const EDGES = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    [1, 4], [1, 6],
    [3, 4],
    [4, 5], [4, 7],
    [7, 8, true],
    [1, 2, true],
  ];

  const GLYPHS = ['doc', 'photo', 'pin', 'mail', 'date', 'person'];
  const COUNT = 36;

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
    /* Fragments tuck around their concept everywhere EXCEPT the arc where the
       label sits, which is due right. Without this they land on top of the
       text and "Home B" becomes unreadable at the exact moment the model
       resolves, which is the one frame that has to be legible. */
    const angle = 0.55 + rand() * (Math.PI * 2 - 1.1);
    const radius = 0.04 + rand() * 0.055;
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
  let lh = 0; /* layout height: the stage minus the caption overlay */
  let tp = 0; /* top inset: the toggle's strip, reserved on narrow screens */
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = stage.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const caption = stage.querySelector('.stage-caption');
    const toggle = stage.querySelector('.stage-toggle');
    lh = Math.max(140, h - ((caption && caption.offsetHeight) || 0) - 8);
    tp = w < 760 && toggle ? toggle.offsetHeight + 16 : 0;
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

  let tAcc = 0;
  let last = 0;
  let visible = true;
  let raf = 0;

  /* Which view the stage is heading toward: 0 scattered, 1 one model. */
  let prog = 0;
  let target = 0;
  let userChose = false;
  let autoTimer = 0;

  const tFrag = document.getElementById('t-frag');
  const tModel = document.getElementById('t-model');

  function setView(v, fromUser) {
    target = v;
    if (fromUser) {
      userChose = true;
      window.clearTimeout(autoTimer);
    }
    if (tFrag) tFrag.setAttribute('aria-pressed', String(v === 0));
    if (tModel) tModel.setAttribute('aria-pressed', String(v === 1));
  }

  if (tFrag) tFrag.addEventListener('click', () => setView(0, true));
  if (tModel) tModel.addEventListener('click', () => setView(1, true));

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    /* accumulated, not absolute: rAF pauses in background tabs, and an
       absolute clock would snap every drift phase forward on return */
    tAcc += dt;
    const t = tAcc;

    /* Time-based damping toward the chosen view, so the tween runs at the
       same speed on a 60Hz laptop and a 120Hz phone. */
    prog += (target - prog) * Math.min(1, dt * 3.4);
    if (Math.abs(target - prog) < 0.0015) prog = target;
    const p = prog;
    const ep = easeOut(clamp01(p));

    ctx.clearRect(0, 0, w, h);

    /* Concept positions for this frame. After assembly the structure keeps a
       slow sway, scaled by ep so it fades in with the model, because a resolved
       graph that freezes reads as a diagram and this one is meant to read as a
       living thing. */
    const pos = CONCEPTS.map((c, i) => [
      c.x * w + Math.sin(t * 0.4 + i * 1.9) * 2.6 * ep,
      tp + c.y * (lh - tp) + Math.cos(t * 0.33 + i * 1.3) * 1.9 * ep,
    ]);

    /* trails: fragment to its concept */
    const trailAlpha = clamp01((p - 0.3) / 0.35) * 0.24;
    if (trailAlpha > 0.002) {
      ctx.strokeStyle = `rgba(124,197,188,${trailAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const f of frags) {
        const fp = easeOut(clamp01((p - f.lag) / (1 - f.lag)));
        const dxp = f.dx + Math.sin(t * f.speed + f.phase) * f.amp;
        const dyp = f.dy + Math.cos(t * f.speed * 0.8 + f.phase) * f.amp;
        const x = (dxp + (f.ax - dxp) * fp) * w;
        const y = tp + (dyp + (f.ay - dyp) * fp) * (lh - tp);
        ctx.moveTo(x, y);
        ctx.lineTo(pos[f.concept][0], pos[f.concept][1]);
      }
      ctx.stroke();
    }

    /* structure: concept to concept, the last thing to appear. Corroborated
       edges draw solid; inferred or unresolved ones draw dashed and dimmer. */
    const edgeAlpha = clamp01((p - 0.66) / 0.3) * 0.8;
    if (edgeAlpha > 0.002) {
      for (const soft of [false, true]) {
        ctx.strokeStyle = `rgba(124,197,188,${edgeAlpha * (soft ? 0.6 : 1)})`;
        ctx.lineWidth = soft ? 1 : 1.2;
        ctx.setLineDash(soft ? [4, 5] : []);
        ctx.beginPath();
        for (const [a, b, isSoft] of EDGES) {
          if (Boolean(isSoft) !== soft) continue;
          ctx.moveTo(pos[a][0], pos[a][1]);
          ctx.lineTo(pos[b][0], pos[b][1]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    /* fragments */
    for (const f of frags) {
      const fp = easeOut(clamp01((p - f.lag) / (1 - f.lag)));
      const dxp = f.dx + Math.sin(t * f.speed + f.phase) * f.amp;
      const dyp = f.dy + Math.cos(t * f.speed * 0.8 + f.phase) * f.amp;
      const x = (dxp + (f.ax - dxp) * fp) * w;
      const y = tp + (dyp + (f.ay - dyp) * fp) * (lh - tp);
      drawGlyph(f.glyph, x, y, 0.13 + 0.37 * (1 - fp * 0.72));
    }

    /* concept nodes and their labels */
    const nodeAlpha = clamp01((p - 0.5) / 0.3);
    const labelAlpha = clamp01((p - 0.62) / 0.28);
    CONCEPTS.forEach((c, i) => {
      const cx = pos[i][0];
      const cy = pos[i][1];
      if (nodeAlpha > 0.002) {
        const r = c.big ? 5.2 : 4;
        /* A halo, because the resolved structure was getting lost against the
           ground on phones. Nine nodes; the shadow costs nothing. */
        ctx.save();
        ctx.shadowColor = 'rgba(124,197,188,0.9)';
        ctx.shadowBlur = 14 * nodeAlpha;
        /* The unresolved node stays hollow. It is the one entity on the stage
           the model has not been able to close, and it should look like it. */
        if (c.hollow) {
          ctx.strokeStyle = `rgba(124,197,188,${nodeAlpha * 0.9})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          /* the one unresolved entity breathes instead of sitting still */
          ctx.arc(cx, cy, r + Math.sin(t * 2.1) * 0.7 * ep, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        } else {
          ctx.fillStyle = `rgba(124,197,188,${nodeAlpha})`;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.strokeStyle = `rgba(124,197,188,${nodeAlpha * 0.25})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 9 + (1 - ep) * 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (labelAlpha > 0.002) {
        ctx.font = '12px "Geist Mono", ui-monospace, monospace';
        ctx.textBaseline = 'middle';
        /* A knockout behind the text. Edges and stray fragments still pass
           behind labels even with the placement bias, and a hairline crossing
           a 11px glyph is the difference between reading a word and guessing
           it. Tinted to the stage ground so it never reads as a chip. */
        const tw = ctx.measureText(c.label).width;
        ctx.fillStyle = `rgba(23,29,44,${labelAlpha * 0.78})`;
        ctx.fillRect(cx + 10, cy - 8, tw + 7, 16);
        ctx.fillStyle = `rgba(230,238,244,${labelAlpha})`;
        ctx.fillText(c.label, cx + 13, cy + 1);
      }
    });

    if (stateEl) {
      const label =
        p < 0.25 ? 'drifting' : p < 0.6 ? 'connecting' : p < 0.85 ? 'resolving' : 'one model';
      if (stateEl.textContent !== label) stateEl.textContent = label;
    }
  }

  resize();

  window.addEventListener('resize', resize, { passive: true });

  /* Assemble once, unprompted, the first time the stage is on screen: the
     scattered state gets two seconds to register as chaos, then becomes one
     model while fully in view. A visitor who taps first wins the race. */
  let autoPlayed = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        /* newest record, not entries[0]: a fast exit-and-reenter arrives as
           one batched callback and the first entry is the stale one */
        visible = entries[entries.length - 1].isIntersecting;
        if (visible && !autoPlayed) {
          autoPlayed = true;
          autoTimer = window.setTimeout(() => {
            if (userChose) return;
            if (visible) {
              setView(1, false);
            } else {
              /* scrolled away before the scattered beat finished; let the
                 next appearance re-arm, so assembly is always watched */
              autoPlayed = false;
            }
          }, 2000);
        }
      },
      { rootMargin: '120px' }
    ).observe(stage);
  } else {
    autoTimer = window.setTimeout(() => {
      if (!userChose) setView(1, false);
    }, 2000);
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

      if (s.state === 'expected') {
        /* Zero here, not only inside the reset timeout: scrolling away during
           the reset window cancels that timer, and the next cycle must still
           start from zero. */
        rows.forEach((r) => {
          r.querySelector('.count').textContent = '0';
        });
        if (meter) meter.style.width = '0%';
        if (readiness) readiness.textContent = '0%';
      }

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
        const seen = entries[entries.length - 1].isIntersecting;
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

/* ---------------------------------------------------------------------------
   Reveal rescue for tall containers.

   main.js reveals a .reveal element when 20% of it is visible. On a phone, a
   grid of stacked cards can run five screens tall, and 20% of five screens
   never fits in one viewport, so the grid sat at opacity zero forever and the
   page showed a screen-sized hole where the Missions were. Desktop never saw
   it: two columns, taller viewport, the threshold fired.

   Anything still unrevealed and taller than 60% of the viewport gets
   re-observed here at threshold zero, so a single visible pixel reveals it.
   The small elements keep main.js's nicer 20% timing.
   ------------------------------------------------------------------------- */
{
  const tall = [...document.querySelectorAll('.reveal:not(.is-visible)')].filter(
    (el) => el.offsetHeight > window.innerHeight * 0.6
  );
  if (tall.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      tall.forEach((el) => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              io.unobserve(e.target);
            }
          }
        },
        { rootMargin: '0px 0px -40px 0px' }
      );
      tall.forEach((el) => io.observe(el));
    }
  }
}
