import { z } from "zod";

// Runs in the browser before the app code. Zod probes `new Function("")` to
// decide whether it may compile fast object parsers. The content security
// policy (src/lib/security/headers.ts) forbids eval, so the probe would fail
// harmlessly but report a CSP violation on every page. Jitless mode skips it.
z.config({ jitless: true });
