# Verification evidence

Reviewed 8 November 2026. Baseline main: `2cf22387d9b45832939b94c3b1f9bd6a595b5009`.

## Automated checks

- `npm run lint`: pass, no warnings in the final lint run. Native editor/archive media intentionally retain img elements with a documented file-scoped Next image exception; marketing and shared cards use next/image.
- `npm run typecheck`: pass.
- `npm run build`: production compilation, type validation and static generation pass. See release notes for the final rerun result.
- `npm audit`: zero reported vulnerabilities after the lockfile and compatible transitive PostCSS/minimatch updates. This is a package advisory result, not a security audit of the product.
- `npm run qa:smoke`: all 14 route checks, four template API checks, five invalid URL rejection checks and three required asset checks passed against the production server.
- `git diff --check`: no whitespace errors.

## Real browser checks

The original public site was visited before editing. The changed app was visited through the browser at `http://localhost:3001`, running both development and production builds.

| Flow | Observed evidence |
|---|---|
| Landing demo | Edited caption appears immediately; full editor receives it through the linked URL. |
| PNG | Actual downloaded file, PNG, 1080 x 1080, 1,586,052 bytes. |
| JPG and dimensions | Actual downloaded file, JPEG, 1920 x 1080, 337,289 bytes after selecting landscape. |
| Caption layers | Independent top and bottom edits reflected on canvas; duplicate and undo return layer count to two. |
| Image overlays | Built-in Crown and an uploaded test image appear as selectable canvas layers. |
| Drafts | Save appears in Studio; delete removes it; Undo restores it; Continue editing opens the draft. |
| Search | Drake returns matching formats; nonsense query shows empty state; Clear filters restores results. |
| Bookmarks | Save state changes; the chosen Drake template appears in Studio with a working creation link. |
| Video source | Arjun Kapoor clip loads through same-origin media proxy, readyState 4, 1080 x 1064 native source. |
| Video export | Captioned 3-second WebM and MP4 files were downloaded. No console errors during export. |
| Video drafts | Saved draft appears in Studio. |
| Pause | Explicit video preview Pause control leaves the media element paused. |
| Feedback | Synthetic QA note saved and appears only in the same browser, explicitly labeled local. |
| Navigation | Mobile menu opens; Escape closes it and returns focus. |
| Narrow layouts | Home, explore, template index, video collection, Studio, about, how-it-works, FAQ, contact, privacy, feedback and both editors checked at 320px. No page-wide horizontal overflow after fixes. |
| Visual review | Desktop hero and lower sections inspected; mobile hero and editor inspected. Actual editor screenshot included on landing page. |

## Limits

Representative templates and exports were tested, not every asset in the remote archive or every combination of editor settings. Physical iOS/Android devices, Safari, assistive-technology screen-reader walks, browser zoom, simulated storage-quota failures and all network-failure permutations were not independently tested. Reduced-motion behavior has code coverage through MotionConfig, CSS media rules and explicit video controls; a physical motion-sensitivity review was not performed.

The live public Vercel domain is separate from local verification. Do not call production updated until a deployment of this revision is ready and that URL is checked. Deployment/PR status belongs in the final release report.

Tastemaker's Python scanners could not run because this environment exposes a Windows Python alias without a working interpreter. Equivalent token contrast calculations and targeted source checks were performed with Node, and the rendered UI was inspected. No fabricated automated score or token-savings percentage is reported.

Final full-page visual review found inherited light text on paper buttons in dark sections. The shared button-paper foreground was corrected to ink and reverified on the rendered page.
