# Meme Is Mine: improvement plan

Repository: https://github.com/RAJ-SUHANDANI/MemeIsMine
Live baseline: https://memeismine.vercel.app/
Review date: 8 November 2026

## Findings and priorities

| Priority | Current evidence | Change and acceptance condition |
|---|---|---|
| P0 | Image export catches failed base/overlay loads and continues to a success notification | Stop incomplete exports; announce an actionable recovery message. Verify successful PNG/JPG export and failure behavior. |
| P0 | Studio parses stored values without checking their shape; deletes drafts immediately | Validate local data, report storage failures and provide undo for deletion. Verify save/reopen/delete/undo. |
| P1 | Home repeats find/tweak/send in two sections; floating gallery does not demonstrate editing | Replace with interactive caption artifact, distinct format collections and an editor capability walkthrough. |
| P1 | Home starterReviews contains invented enthusiast endorsements with five-star presentation | Remove starter endorsements. Label locally saved feedback honestly. |
| P1 | Header has seven desktop links plus Studio and creation CTA; mobile lacks expanded state | Reduce primary navigation; add current-page state, Escape dismissal, focus return and skip link. |
| P1 | Tiny controls, very tight heading tracking and scattered hover/reveal motion across pages | Shared typography, focus, control, spacing and reduced-motion pass; inspect mobile and desktop. |
| P1 | FAQ says exports are fixed square PNG despite configurable canvas and JPG/video support | Correct product explanations from actual implementation. |
| P2 | No committed dependency lockfile or ignore file | Add reproducible dependency lock and build exclusions; run lint, type check and production build. |
| P2 | Remote template sources are dependencies | Test representative APIs and media; expose actionable failures. Do not claim unavailable upstream media is fixed without evidence. |

## Landing narrative

1. **Make the group chat a little less boring.** Immediate image/video explanation, browse/upload actions and working caption preview.
2. **A format for that exact feeling.** Recognizable real templates with clear edit and bookmark actions.
3. **The punchline is yours. So are the details.** A practical explanation of text layers, stickers, effects, aspect ratios and exports.
4. **Some jokes need a moving picture.** Real video/GIF templates, explicit video editor path and honest export compatibility.
5. **Good ideas deserve a second draft.** Local studio and bookmark workflow; explain device-local storage.
6. **Questions before the punchline.** Free use, supported outputs, uploads and local privacy using accessible disclosures.
7. Concise creator credit and final creation action. Local feedback is clearly identified, never presented as public proof.

## Every other surface

- Explore and template index: searchable, readable cards; clear categories, selected filters and usable empty/retry states.
- Video collection: stable poster framing, on-demand playback, errors with recovery; no unnecessary simultaneous autoplay.
- Image/video editors: canvas remains the focus, panels readable, export errors truthful, keyboard controls usable, all controls reachable on narrow screens.
- Studio: clear on-device model, safe storage reads, recoverable deletion and working continuation links.
- About/how-it-works: same typography/materials with content-specific layouts.
- FAQ/privacy/contact: accurate facts, comfortable reading width, accessible disclosures and links.
- Review form: say Save on this device, explain the local-only destination, show storage errors.

## Skill selection

Use installed sources progressively, only when their domain is needed:

| Source | Exact skills | Role |
|---|---|---|
| Tastemaker | tastemaker | Reference board, direction contract, project style lock and originality checks. |
| Jakub Krehel | better-typography, better-layout, better-ui, better-accessibility, better-writing, better-colors | Type, spacing, focus, controls, wording and measured contrast. Verified Skills CLI search found jakubkrehel/skills. |
| MengTo | animation-performance, landing-page, build-awwwards-quality-sites | Product narrative, artifact-led composition and restrained motion. Verified CLI source mengto/skills; apply only relevant guidance. |
| ConardLi Garden | web-design-engineer | Existing-brand redesign and browser acceptance. Installed manifest names ConardLi/garden-skills. |
| Emil Kowalski | emil-design-eng | Purposeful motion, direct feedback, interruptible transitions. |
| Impeccable | impeccable, new-work, craft-floor | Persuade versus Operate distinction and rendered review. Engine launcher unavailable; written references remain usable. |
| Token Optimizer | token-optimizer, token-coach, resume-checkpoint | Read-only assessment and phase checkpoints. No model downgrade or global configuration mutation. |

Discovery: https://skills.sh/ ; https://skills.sh/jakubkrehel/skills/better-ui ; https://skills.sh/mengto/skills/landing-page . CLI install counts are discovery signals, not proof of quality. No new third-party skill is recommended solely on popularity. Existing instructions inspected locally are the operative evidence.

## Token discipline without reducing reasoning

Keep the same model and effort. Search paths before reading; bound outputs; avoid dumping data archives or minified CSS. Read skill references once and only when needed. Store product truth, design decisions and test evidence in repository files. Batch independent checks; fix the root cause in shared components. Run verification at meaningful phase boundaries. No unsupported percent or cost-saving promise. Do not change global hooks, model routing, caching or skill availability as a side effect.

## Verification and release

Run lint, TypeScript and production build. Visit rendered pages at 1440, 390 and 320px; check overflow, nav, focus, search, filters, bookmarks, captions, layers, image exports, drafts and video playback/export. Record browser console and upstream failures. Inspect both full-page narrative and first viewport. Publish only the tested revision; then revisit the public Vercel URL and repeat primary flows. Local preview success is not evidence of production deployment.
