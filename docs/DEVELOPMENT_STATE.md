# Japan Line homepage refinement

Updated 2026-11-12. Branch: `codex/japan-line-human-refinement`.
Base: latest `main` at `1710725bd4974b55a5c30abe63c163fea998ac1f` (confirmed again before publication).

## Scope and behavior

Only the homepage presentation and its verification changed. Existing project pages, Three.js districts, assets, rail route, sakura, keyboard camera controls, map and train-follow modes remain in place.

- Replace the overlapping headline with an accessible visually hidden H1. Keep the personal introduction and first-stop action in a separate, responsive composition.
- Use Shippori Mincho for editorial/station lettering and Source Sans 3 for navigation and technical text. Single digits identify all five stations in HTML and generated project details. Cream enamel signs, vermilion/green service colors, and the horizontal station board replace circular badges and pill navigation.
- Project each lead carriage's actual roof point through the current camera every rendered frame. Each train has its own native LastRide link. Signs are hidden behind the camera, outside the viewport, or where they cannot fit around controls. Station signs can adjust sideways with their stems remaining attached to the projected anchor. The bottom railway remains available when scenery labels are culled.
- Correct the reverse-running train's orientation/carriage order, initialize both trains before animation (including reduced motion), add touch pinch zoom, and make closed detail/about panels inert with keyboard focus restoration.
- Reframe the homepage to fit the archipelago on mobile. Retain close-up project views; on desktop, place the selected district beside its detail panel. Stronger directional lighting and a fading water edge retain readable model depth.

## Verification

Run the static server from the repository root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

The site has no build dependencies. Browser acceptance uses Playwright as an external test tool; install it separately if unavailable:

```sh
npm install --prefix /tmp/japan-line-tools playwright
/tmp/japan-line-tools/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/japan-line-tools/node_modules/playwright/index.mjs \
  ARTIFACT_DIR=/tmp/japan-line-review node tests/homepage.mjs
```

`BASE_URL` defaults to `http://127.0.0.1:4173`. `VIEWPORT=390` or `VIEWPORT=1440` limits the interactive pass. Screenshots and JSON results are written outside the repository. Browser test inspection is appended by a Playwright route handler, with no inspection API in production code. LastRide destination requests are intercepted after real popup navigation; its separate application is not tested.

Executed locally on macOS, Chromium/Playwright, Node 26:

- Desktop 1440 × 900 and mobile 390 × 844: all five project links navigated successfully; labels, actual train meshes and rails opened the correct LastRide URL; orbit, wheel zoom, mobile two-finger pinch, map view, train follow, lite mode, keyboard activation and panel dismissal passed.
- Both moving labels were compared with their actual 3D carriage projections over successive frames. Above-roof placement, behind-camera/offscreen culling, label/control intersections and page overflow passed.
- Reduced-motion mobile: trains start separately on their route and remain still; project navigation and explicit resume work. Additional responsive checks at 320, 760, 1024 and 1440 px passed.
- No JavaScript exceptions or console errors in the acceptance run. Actual screenshots were inspected at both requested sizes, including project and camera states.
- Existing `.github/workflows/site-check.yml` static reference and inline-script checks passed locally. `node --check app.js`, `node --check japan-world.js`, `node --check tests/homepage.mjs`, and `git diff --check` passed. The existing workflow now syntax-checks the homepage module and acceptance script too; no duplicate workflow was added.

An initial reduced-motion test attempt timed out because the harness waited for the completed loading overlay to be *visible*. The overlay is intentionally hidden immediately with reduced motion. The harness now waits for its completed state; subsequent checks passed.

## Review boundaries

No merge or deployment is authorized. Screenshots are review artifacts and are not committed. Real iOS/Android hardware, Safari/WebKit, Firefox, screen-reader sessions and sustained mobile GPU/battery profiling were not run. Narrow screens intentionally scroll the station board horizontally; the page itself does not overflow. During tight camera views, a sign may hide to avoid another sign or a major control; all projects and LastRide remain reachable through the station board. External fonts retain system fallbacks.
