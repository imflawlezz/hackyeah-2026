# Design System Gov.pl alignment (#48)

Captured on 4 October 2026 with Chrome headless against production builds in demo mode, so that every module, including `/admin` and `/messages`, opens without an account. Before images use `main`; after images use `chore/govpl-design`. Full-page captures at 1280 px and 360 px, in the default and high-contrast themes, plus the home page at A++.

`before-audit.json` and `after-audit.json` contain the measurements for all 20 routes at both widths and in both themes: root and body font size, loaded font families, primary buttons, icons inside controls, "(opcjonalnie)" markers, required stars and the "\* Pola obowiązkowe" note, skip link text, footer links and address, breadcrumb label, new-window wording, largest radius, horizontal overflow, HTTP status and serious or critical axe findings.

## Before and after

| Screen                       | Before                                              | After                                              |
| ---------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| Home, 1280                   | ![](before-home-1280-default.png)                   | ![](after-home-1280-default.png)                   |
| Home, 360                    | ![](before-home-360-default.png)                    | ![](after-home-360-default.png)                    |
| Home, high contrast, 1280    | ![](before-home-1280-high-contrast.png)             | ![](after-home-1280-high-contrast.png)             |
| Home, high contrast, 360     | ![](before-home-360-high-contrast.png)              | ![](after-home-360-high-contrast.png)              |
| Home at A++, 1280            | ![](before-home-1280-a-plus-plus.png)               | ![](after-home-1280-a-plus-plus.png)               |
| Match, 1280                  | ![](before-match-1280-default.png)                  | ![](after-match-1280-default.png)                  |
| Match, 360                   | ![](before-match-360-default.png)                   | ![](after-match-360-default.png)                   |
| Match, high contrast, 1280   | ![](before-match-1280-high-contrast.png)            | ![](after-match-1280-high-contrast.png)            |
| Match, high contrast, 360    | ![](before-match-360-high-contrast.png)             | ![](after-match-360-high-contrast.png)             |
| New idea, 1280               | ![](before-ideas-new-1280-default.png)              | ![](after-ideas-new-1280-default.png)              |
| New idea, 360                | ![](before-ideas-new-360-default.png)               | ![](after-ideas-new-360-default.png)               |
| New idea, high contrast      | ![](before-ideas-new-1280-high-contrast.png)        | ![](after-ideas-new-1280-high-contrast.png)        |
| New idea, high contrast, 360 | ![](before-ideas-new-360-high-contrast.png)         | ![](after-ideas-new-360-high-contrast.png)         |
| Test detail, 1280            | ![](before-test-detail-1280-default.png)            | ![](after-test-detail-1280-default.png)            |
| Test detail, 360             | ![](before-test-detail-360-default.png)             | ![](after-test-detail-360-default.png)             |
| Test detail, high contrast   | ![](before-test-detail-1280-high-contrast.png)      | ![](after-test-detail-1280-high-contrast.png)      |
| Test detail, HC, 360         | ![](before-test-detail-360-high-contrast.png)       | ![](after-test-detail-360-high-contrast.png)       |
| Moderation, 1280             | ![](before-admin-moderation-1280-default.png)       | ![](after-admin-moderation-1280-default.png)       |
| Moderation, 360              | ![](before-admin-moderation-360-default.png)        | ![](after-admin-moderation-360-default.png)        |
| Moderation, high contrast    | ![](before-admin-moderation-1280-high-contrast.png) | ![](after-admin-moderation-1280-high-contrast.png) |
| Moderation, HC, 360          | ![](before-admin-moderation-360-high-contrast.png)  | ![](after-admin-moderation-360-high-contrast.png)  |

Images are palette-compressed PNGs. Tools: puppeteer-core with installed Chrome, axe-core and Lighthouse, installed temporarily outside the committed dependencies.

## Lighthouse, 320 px, A++ and 200% zoom

`lighthouse-zoom-audit.json` holds a second run on the final build: 23 routes (the 20 above plus `/ideas/[id]`, `/messages/new` and `/admin/innovations/new`) in both themes, 46 rows.

| Check                                                    | Result on all 46 rows |
| -------------------------------------------------------- | --------------------- |
| axe, WCAG 2.1 A and AA rules                             | 0 violations          |
| Lighthouse accessibility                                 | 100                   |
| Horizontal scroll at 320 px                              | none                  |
| Horizontal scroll at 320 px with A++                     | none                  |
| Horizontal scroll at 1280 px with A++                    | none                  |
| Horizontal scroll at 200% zoom (640 CSS px, 2x pixels)   | none                  |
| Text cut off by `overflow: hidden` or outside the window | none found            |

The 200% zoom row emulates a 1280 px window zoomed to 200%. The clipped-text check is a script heuristic, not a visual review. Signed-in views with a real Supabase session were not measured; the demo build opens every route without an account.
