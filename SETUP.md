# Setup — Área de Membros

Esse é um clone limpo da área de membros, sem credenciais. Você precisa
plugar as integrações com **suas próprias contas** em Supabase, Stripe e Resend.

## 1. Pré-requisitos

- Node.js 18+ instalado
- Conta em [Supabase](https://supabase.com) (free tier ok)
- Conta em [Stripe](https://stripe.com) (precisa verificar conta)
- Conta em [Resend](https://resend.com) (free tier ok)
- Domínio registrado (pra emails sairem do seu domínio)

## 2. Configurar Supabase (banco de dados + auth)

1. Crie projeto novo
2. Em **SQL Editor**, rode os arquivos da pasta `scripts/` na ordem alfabética
3. Em **Settings → API**, copia:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Configurar Stripe

1. Cria produtos que vai vender (Front + Bumps + Upsells) no Stripe Dashboard
2. Pega Price IDs e bota no `.env.local`
3. Pega API keys em **Developers → API keys**
4. Configura webhook em **Developers → Webhooks**:
   - URL: `https://seu-dominio.com/api/stripe-webhook`
   - Events: `payment_intent.succeeded`, `invoice.payment_succeeded`,
     `invoice_payment.paid`, `charge.refunded`, `payment_intent.payment_failed`,
     `charge.dispute.created`, `customer.subscription.deleted`, `customer.subscription.updated`
5. Copia `whsec_...` pro `STRIPE_WEBHOOK_SECRET`

## 4. Configurar Resend

1. Cria conta + verifica seu domínio em **Domains**
2. Cria API key em **API Keys** → bota em `RESEND_API_KEY`
3. Configura `EMAIL_FROM_ADDRESS` com email do seu domínio (ex: `acceso@seudominio.com`)

## 5. Configurar `.env.local`

```bash
cp .env.example .env.local
# editar .env.local com seus valores
```

## 6. Customizar branding

- `app/miembros/_styles/tokens.css` — cores da marca
- `public/` — logo, favicon, badges customizados
- Buscar `[BRAND_NAME]` no código pra trocar pelo nome real
- Buscar `SEU_DOMINIO.com` no código pra deixar consistente

## 7. Rodar local

```bash
npm install
npm run dev
```

Acessa em `http://localhost:3000/miembros`.

## 8. Deploy

Recomendado: Cloudflare Pages.

```bash
npx wrangler pages deploy
```

Ou Vercel:

```bash
npx vercel
```

## 9. Como liberar acesso pra cliente que comprou

Existem 2 caminhos:

**Automático:** cliente paga via Stripe Checkout (próprio do Stripe ou seu).
Webhook recebe `invoice.payment_succeeded` e popula `stripe_sales` automaticamente.
Cliente recebe email de invite via Resend.

**Manual (admin):** acessa `/miembros/admin` (só email em `OWNER_EMAIL` consegue).
Tab "Liberar" → preenche email + escolhe produto.

## 10. Pontos que você PROVAVELMENTE vai querer customizar

- `app/miembros/_lib/products.ts` — define os produtos premium (nomes, preços, imagens)
- `app/miembros/_lib/episodes.ts` — episódios da plataforma (vídeos, descrições)
- `app/miembros/_lib/seasons.ts` — estrutura de temporadas
- `lib/achievements.ts` — sistema de gamificação (badges, XP)
- `app/api/stripe-webhook/route.ts` — lógica de processamento de venda

## 11. O que NÃO veio nesse clone

- Salespage / página de venda (`app/checkout`, `app/(salespage)`) — você cria a sua
- Integrações de WhatsApp / mensageria — não acompanham
- Tracking de pixels (GTM, Meta Pixel, Utmify) — você pluga o seu se quiser
- Geolocalização / pricing regional dinâmico — removidos; cobrança em USD/EUR/GBP/CHF fixo

## Suporte

Pra dúvidas estruturais sobre como cada peça funciona, consulte a
documentação interna ou suporte técnico contratado.
