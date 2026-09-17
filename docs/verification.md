# M1 verification

Verified locally on 2026-09-17, Node.js 24.13.1, Google Chrome (headless), 1512×982 viewport.

- `npm run build`: passed TypeScript and Vite production build.
- `npm test`: 22 passed; schema/sample validity, JSON roundtrip, invalid documents, content-preserving variant switch, required protection, optional reflow, all 18 variant geometry, gutter constraints and spread crossing, asset cloning, CJK overflow, crop/focal math, effect override order.
- `npm run test:browser`: passed text editing, required-field protection, variant preservation, optional add/remove, metadata isolation, fit/crop/focal, blur/tint/shadow, reload persistence, add unit, undo/redo, JSON download/import. No page errors.
- Visually inspected `screenshots/editor-cover.png` and `screenshots/editor-spread.png`; local generated product image renders, inspector stays separate from the SVG canvas, gallery image frames cross the LR gutter.

Browser checks require an already running dev server on port 5173 and a locally installed Google Chrome. They use a fresh isolated browser profile and do not change the user's browsing data.

## Pagination and individual portraits update

- `tests/projects.test.ts`: 5 additional passing tests for arbitrary/repeated page sequences, distinct content/assets, insert/duplicate, two individual portrait frames, and non-destructive legacy placeholder migration.
- `scripts/workflow-check.mjs`: passed fresh-visit composer, custom title, repeated page templates, reorder/remove, individual portrait upload/focal isolation, variant preservation, duplicate page, new project, reload, and switching back to the saved prior project.
- Reviewed `screenshots/page-composer.png` and `screenshots/team-independent-portraits.png` in addition to existing editor captures.

## Filesystem, Alpha and static demo update

- Five further unit/integration tests passed: connected color removal, feathering, input bounds, actual uploaded bytes and document/assets on disk, invalid upload/ID/origin rejection.
- Re-ran existing editor and pagination browser tests after filesystem integration.
- `scripts/alpha-storage-check.mjs` verified separate original/derivative file URLs, actual saved PNG bytes, background alpha=0 and retained foreground alpha=255, document.json on disk, and restoration of the original.
- `scripts/static-check.mjs` verified a subdirectory-hosted static build, image paths, local replacement, Alpha, browser-only status and zero API requests.
- Reviewed `screenshots/instant-alpha.png`.

## Theme catalog update

27 automated tests pass, including all 62 catalog layout variants, requested aspect ratios, in-bounds rendering, no default text overflow, pristine sample isolation, content-preserving pagination revision and restoring sample images. Production TypeScript/Vite build passes. Browser UI verified all three theme choices, architectural single/spread groups and mixed selection counting (2 units = 3 pages).
