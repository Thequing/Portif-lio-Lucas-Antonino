# Stage interactions — design spec

Date: 2026-09-28. Builds on `2026-09-17-arcade-redesign-design.md`. The colour
tokens, the `--coin`-means-pressable rule, the no-build-step constraint, the
i18n contract and both payload budgets carry over unchanged.

## Goal

One interaction per stage, each demonstrating the system that stage claims
rather than asserting it.

The operating context is specific and it decides most of what follows. At
Brasil Game Show 2026 there is **no machine running a playable build** — Lucas
attends, and can offer a digital copy. The portfolio is therefore the only
thing a recruiter or another developer can put their hands on. It will be
opened on a phone, held in one hand, standing up, in a loud hall, over venue
wifi that should be assumed unusable, by someone whose attention lasts under a
minute and who may be standing next to Lucas while he talks over it.

Every decision below is downstream of that paragraph.

Success: a visitor presses one thing, and within ten seconds has watched a
system Lucas wrote do the thing the bullet point next to it claims. Nothing
requires typing on a phone, reading instructions, or a working network.

## Non-goals

- Not games. Each interaction is a demonstrator with one mechanic and an end.
- No score, no leaderboard, no account, nothing sent anywhere.
- No audio. The hall is loud and the phone may be muted.
- No new claims. Copy introduced here describes what the code does and nothing
  about booths, exhibitions or playable demos at BGS.

## Architecture

### The cabinet

Stages are pinned on desktop with `scrub` (`js/scroll.js`), so the visitor
scrolls *through* a held frame. Embedding a widget there fights the pin: you
must stop scrolling to touch it and the pin releases when you resume. At 390px
there is also no room beside the copy for a tower grid or a script pane.

So each interaction opens in a shared modal dialog — **the cabinet** — launched
by a `▸ TRY IT ◂` button in the stage copy:

```
#cabinet (dialog)
  ├─ header: stage number, title, close
  └─ mount point, owned by the stage module
```

This is the pattern the bonus stage already uses (`#lightbox`, `showModal()`,
backdrop click to dismiss, focus returned to the opener). It gives every
interaction the full viewport on a phone, leaves stages reading as stages,
and makes click-gating structural rather than a thing to remember.

The launch button is injected by JS, like the language toggle, so it never
appears in a no-JS page that could not honour it. It is a child of `.copy`,
so the existing cut-in animation covers it for free.

### Modules

```
js/arcade.js              the cabinet: open, close, focus, lazy import, unmount
js/progress.js            six booleans over localStorage; emits 'progresschange'
js/stages/steam-veins.js  01  the dummy
js/stages/midnight.js     02  the visor
js/stages/drift.js        03  the balance suite
js/stages/hells-kitchen.js 04 the damage table
js/stages/kuroneko.js     05  the parser
js/stages/dino.js         06  the block
js/stages/data/*.js       balance numbers and scripts, no logic
js/stages/*.test.mjs      unit tests for the pure cores
```

Each stage module exports `{ id, mount(root, ctx), unmount() }` and imports
nothing from its siblings. `arcade.js` lazy-imports a module on the first press
of its button (`await import()` — native ESM, no build step) and calls
`unmount()` on close, so a Worker or a RAF loop dies with the dialog rather
than running behind a closed cabinet on a phone with 8% battery.

A module that throws on import takes out its own button and leaves the other
five working; `arcade.js` catches, logs, and disables that launcher.

### Data is not logic

`js/stages/data/` holds the real numbers as plain modules — `drift-scorer.js`,
`hk-damage.js`, `kn-script.js` — separated from the interaction code that
displays them. Two consequences that matter:

1. When the real C# and the real script language arrive, three data files are
   rewritten and no interaction code is touched.
2. Each data module exports `ready: boolean`. **A module whose numbers are not
   yet the real ones ships `ready: false`, and `arcade.js` does not render its
   launch button.** Invented balance numbers on a portfolio are worse than a
   missing feature, so the build cannot accidentally ship them.

### Progress

`js/progress.js` stores six booleans under one localStorage key and emits
`progresschange`. A HUD segment gains a filled pip when its interaction is
**completed**, not merely opened — the completion condition is defined per
interaction below. Completing all six marks the `#continue` heading `6/6`.

The HUD already re-renders on `langchange` (`js/hud.js`); this rides the same
event bus rather than inventing a second one.

### Offline at the venue

The interactions are the only playable thing at BGS and venue wifi cannot be
relied on. A service worker (`sw.js`, registered after boot, scope `/`)
precaches the shell: `index.html`, the three CSS files, every `js/` module,
the fonts, the sprites, and the interaction assets — everything except the
video clips and the bonus-stage art, which stay network-only and degrade to
their posters.

Budget for the precache: **under 400 KB**. Lucas opens the site once on hotel
wifi; at the hall the page and all six interactions work with the radio off.
Clips will not play on a dead network, which is the correct thing to sacrifice:
a recruiter who cannot watch a video but can run the balance suite has still
seen the thing worth seeing.

Cache name carries a version string; `activate` deletes older caches. The
worker never caches a response that is not `ok`, and never serves a stale
`index.html` when the network answers.

## The six

Each entry: what it shows, the interaction, completion, assets, and what is
still needed from Lucas.

### 01 Steam Veins — the damage dummy

`--stage: #e8452f`. Claim: *enemy damage response — i-frames, knockback,
collision handling; phase transitions on health thresholds.*

A training dummy stands in the cabinet. Tap it and the response Lucas wrote
plays out: the invulnerability gate rejects hits inside the window, knockback
displaces it, a damage number rises, the health bar falls, and crossing a
threshold flips it to phase 2 — visibly angrier, and now resistant. Keep
hitting and it dies into the execution state.

A live readout beside the dummy names what just happened — `i-frame · hit
ignored`, `phase 2 · threshold 60%` — so the mechanic is legible without
knowing the game. A tap during i-frames does nothing on purpose, and the
readout says why. That refusal is the whole point of the feature.

- **Completion:** the dummy reaches the execution state.
- **Assets:** `Dummy.aseprite` (32×32, single frame) → `media/minigames/dummy.png`.
  No hit or flinch frames exist, so flinch, knockback and phase tint are CSS
  transforms and filters over the one frame. If Lucas authors extra frames
  later they drop in without a code change.
- **Needs:** nothing. Thresholds and i-frame duration come from the
  `EnemyBase.cs` excerpt already on the page.

### 02 MidNight Memories — the visor

`--stage: #9fb4c4`. Claim: *Investigation Mode — objects, clocks and the
distant tower become readable only through the visor, and the clock puzzle is
solved with it, at range.*

A scene fills the cabinet. Drag the lens across it and what is under the glass
is the Investigation Mode read: the clock face resolves to a time, the distant
tower gains its detail, an object gains a label. Outside the lens the scene
stays as the naked eye has it.

The clock puzzle is the payload: three clocks are readable only through the
lens, and the cabinet asks for the odd one out. Getting it right is the same
deduction the demo asks for, in fifteen seconds.

- **Completion:** the odd clock is identified.
- **Assets:** `Lens.aseprite` → `media/minigames/lens.png`, as the drag handle
  with `touch-action: none` so dragging never scrolls the dialog. Plus the
  scene, twice — plain and investigated.
- **Needs:** a still *through* Investigation Mode. Failing that, the lens view
  is derived from the existing poster with a filter and a hand-placed label
  layer, which is weaker and should be replaced when a real capture exists.

### 03 Framed Drift — the balance suite

`--stage: #b46cff`. Claim: *pure C# simulation, no engine references — 10,000
races in 0.06 s, 135 automated tests as the GDD's exit criteria.*

One button: **RUN 10,000 RACES**. A Web Worker runs the JS port of the scorer,
the counter climbs, and the suite's own criteria fill in as they resolve — win
rate, uplift, failure rate — each against the target band from the GDD, each
marked pass or fail the way the test suite marks them.

The timing line reads both numbers and says which is which:

```
0.31 s   in your browser (JS port)
0.06 s   in the C# assembly
```

Presenting the browser's time as the C# figure would be a lie, and the
comparison is more interesting than either number alone: the reason the same
code can run in a Worker at all is that the simulation has no engine
references, which is the actual claim.

**Port fidelity is a testable property, not a promise.** Lucas runs the C#
balance suite once and commits `js/stages/data/drift-golden.json` — inputs and
the scores C# produced. `drift.test.mjs` runs the JS port against every golden
vector and fails on any divergence. The cabinet states that the port is
verified against recorded C# output, because by then it will be.

- **Completion:** a run finishes.
- **Assets:** none.
- **Needs:** `SegmentScore` and `Context` from `DriftScorer.cs` (the page shows
  only `Score()`), the balance-suite inputs, and one recorded run for the
  golden file. `ready: false` until they land.

### 04 Hell's Kitchen — the damage table

`--stage: #ff7a1a`. Claim: *damage types — physical, magic, true, area —
against per-enemy armour and resistance.*

Two rows of chips: damage type across the top, enemy type down the side. Tap
one of each. The readout shows the mitigation formula with the real values
substituted, and the damage that survives it.

The interesting cells are the bad ones. Physical into heavy armour is a wall of
mitigation and a small number; true damage ignores the wall entirely; a ground
tower against a flier reads `no valid target`. Three taps and the visitor has
understood a damage model, including why the choices matter — which is more
than the bullet point can do.

A 4×4 grid of chips is a comfortable one-handed phone target at 44px.

- **Completion:** a mismatched pairing is tried — the wall, not the win.
- **Assets:** none.
- **Needs:** the real mitigation formula and the armour/resistance values per
  enemy type. `ready: false` until they land. This one must not ship invented
  numbers under any schedule pressure: it is a claim about balance Lucas did.

### 05 KuroNeko — the parser

`--stage: #17c3b2`. Claim: *a ten-command script language, and a diagnostic
pass that validates the whole script at load — unknown commands, duplicate
labels, dead jumps, empty menus.*

The KuroNeko dialogue box sits in the cabinet, rendering a scene. Below it, the
script that produced it.

**No free typing on a phone.** The script is built by tapping command chips —
the ten commands, each inserting a line — and the box re-renders on every
change. A hardware keyboard edits the script directly; a touch device never has
to raise one.

Two chips are wrong on purpose: one jumps to a label that does not exist, one
opens an empty menu. Tapping either replaces the rendered scene with the
diagnostic the parser actually prints. The validator is the part worth showing,
so the interaction is built to be broken.

- **Completion:** a diagnostic is triggered. Breaking it is the lesson.
- **Assets:** `ParserBox.aseprite` (640×360, layers `NameTag`, `Base`, `Uper`,
  `patinhas`) → exported flattened as the box frame; `NameTag` exported
  separately so the speaker name can be driven by the script.
- **Needs:** the parser source, or the ten commands plus a real script and the
  exact diagnostic strings. Invented error messages would misrepresent the
  tool. `ready: false` until they land.

### 06 Dino Girls — the block

`--stage: #4ade80`. Claim: none yet — it is unreleased, and the stage is a
locked tile.

The lock becomes a `?`-block. Each tap makes it bounce and dispense one line of
what can be said publicly, until it is empty and reads *Come back at BGS*. It
is the only stage that rewards tapping twice, and it turns the page's one dead
panel into the thing people press last.

Drawn as inline SVG in the chest's idiom — no new asset, no payload.

- **Completion:** the block is emptied.
- **Assets:** none.
- **Needs:** Lucas's confirmation of the lines. Default is to dispense only
  what the stage copy already says publicly — idle resort-builder, gameplay
  team, Kimu Studios, Steam — and nothing further. It is someone else's
  unreleased game.

## Degradation

| Condition | Behaviour |
|---|---|
| No JS | No launch buttons. Stages read exactly as they do today. |
| GSAP CDN fails | Cabinets work; they never touch ScrollTrigger. |
| `prefers-reduced-motion` | Knockback, block bounce, counter ticking and lens easing resolve instantly to their end state. Every readout still updates. The information is the point; the motion is not. |
| No network | Everything except the video clips, via the service worker. |
| Keyboard only | Every interaction operable. The lens moves on arrow keys; chips are buttons; the dummy is a button. |
| `data.ready === false` | That stage's button is not rendered. |

## Testing

The three interactions worth building are pure functions wearing a UI, so they
are tested as pure functions — `node --test` over `js/stages/*.test.mjs`,
alongside the existing checker tests. The README's command becomes
`node --test "{js,scripts}/**/*.test.mjs"`.

- **drift**: every golden vector from the recorded C# run, exactly.
- **hells-kitchen**: mitigation for each type × enemy pair, including the
  invalid ones.
- **kuroneko**: each of the four diagnostic classes fires on a script that
  should trigger it, and does not fire on one that should not.
- **progress**: six booleans round-trip; a corrupt or absent localStorage value
  yields six falses rather than throwing.

Headless QA extends the existing script: each cabinet opens, completes, awards
its pip, survives a reload, closes with focus returned to its opener, and is
operable at 390px and 320px in both languages. Plus the assertion that matters
most for BGS — **with the network disabled after one load, all six
interactions still open and complete**.

## Payload

Unchanged on a cold scroll: every module and asset is imported or fetched only
when a button is pressed. New precached weight is the service worker's shell,
budgeted under 400 KB, dominated by fonts that were already being fetched.

The `.aseprite` sources move to `media/minigames/` (lowercase, as `media/me/`
went) and are tracked but never served; the exported PNGs sit beside them and
are. Export is one Aseprite CLI call per file, recorded in the README the way
`build-media.sh` records the clip pipeline. The three sources total under 10 KB
exported; the MidNight lens view is the only meaningful new asset at roughly
40 KB.

The test command in the README becomes `node --test "{js,scripts}/**/*.test.mjs"`
— verified working on Node 24 for Windows, unlike the bare directory argument
the README already warns about.

## Build order

1. `arcade.js`, `progress.js`, HUD pips, the cabinet's shell and its tests.
2. **01 dummy** and **06 block** — no external dependencies, both shippable
   immediately, and together they prove the cabinet on both a motion-heavy and
   a motion-free interaction.
3. **02 visor** — derived lens view, replaced if a real capture arrives.
4. **04 damage table**, **05 parser**, **03 balance suite** — in the order their
   data lands.
5. `sw.js` last, so it never caches a moving target during development.

Stages 3, 4 and 5 ship dark (`ready: false`) until their real numbers exist.
The site is releasable at the end of every step.
