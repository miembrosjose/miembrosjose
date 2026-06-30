// Config OpenNext pra Cloudflare Workers.
// Default adapter — funciona pra Next.js App Router 16.
// Cache via R2 (incremental cache) é opcional; pulamos por enquanto pra
// manter o deploy simples.

import { defineCloudflareConfig } from "@opennextjs/cloudflare"

export default defineCloudflareConfig({})
