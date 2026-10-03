# Visual pass verification (#40)

Captured on 3 October 2026 with Chrome headless against production builds in demo mode, so that every module, including `/admin` and `/messages`, opens without an account. Before images use `main` at `857eaed`; after images use `chore/visual-pass`. Full-page captures at 1280 px and 360 px.

`before-audit.json` and `after-audit.json` contain the automated measurements for all 17 routes at both widths and in both themes: font families and weights, sizes off the STYLE.md scale, radii above 8 px, content shadows, gradients and blur, running animations, all-caps text and letter-spacing, centred body text, paragraphs longer than about 80 characters, highlight count, horizontal overflow, and serious or critical axe findings.

## Before and after

| Screen               | Before                                    | After                                    |
| -------------------- | ----------------------------------------- | ---------------------------------------- |
| Home, 1280           | ![](before-home-1280-default.png)         | ![](after-home-1280-default.png)         |
| Ideas, 1280          | ![](before-ideas-1280-default.png)        | ![](after-ideas-1280-default.png)        |
| Ideas, 360           | ![](before-ideas-360-default.png)         | ![](after-ideas-360-default.png)         |
| Messages, 360        | ![](before-messages-360-default.png)      | ![](after-messages-360-default.png)      |
| Knowledge, 1280      | ![](before-knowledge-1280-default.png)    | ![](after-knowledge-1280-default.png)    |
| Test detail, 1280    | ![](before-test-detail-1280-default.png)  | ![](after-test-detail-1280-default.png)  |
| Admin overview, 1280 | ![](before-admin-1280-default.png)        | ![](after-admin-1280-default.png)        |
| Accessibility, 360   | ![](before-accessibility-360-default.png) | ![](after-accessibility-360-default.png) |

## After: high contrast, A++ and the admin table

| Screen                                | Image                                              |
| ------------------------------------- | -------------------------------------------------- |
| Home, high contrast, 1280             | ![](after-home-1280-high-contrast.png)             |
| Institutions, high contrast, 1280     | ![](after-institutions-1280-high-contrast.png)     |
| Admin innovations, high contrast, 360 | ![](after-admin-innovations-360-high-contrast.png) |
| Admin innovations, 1280               | ![](after-admin-innovations-1280-default.png)      |
| Home at A++ (23.4 px root), 1280      | ![](after-home-1280-a-plus-plus.png)               |

Tools: puppeteer-core with installed Chrome, axe-core and Lighthouse, installed temporarily outside the committed dependencies.
