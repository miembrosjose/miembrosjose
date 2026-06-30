// Webhook Stripe — escuta eventos de pagamento e salva vendas no Supabase.
//
// Eventos tratados:
//  - checkout.session.completed → venda do produto principal (front + bumps) [Hosted antigo]
//  - payment_intent.succeeded → venda de upsell (off-session 1-click) ou front 1x via PaymentIntent
//  - charge.refunded → marca venda como refunded
//  - payment_intent.payment_failed → marca venda como refused na Utmify (cartão recusado)
//  - charge.dispute.created → marca venda como chargedback (cliente abriu disputa) + remove acesso
//  - invoice.payment_succeeded → parcela de subscription paga (1ª, 2ª ou 3ª)
//  - invoice.payment_failed → parcela falhou; Stripe retenta via Smart Retries
//  - customer.subscription.updated → mudança de status (active → past_due → unpaid)
//  - customer.subscription.deleted → fim do ciclo (cancel_at atingido ou manual)
//
// Setup: criar webhook em https://dashboard.stripe.com/test/webhooks
// URL: https://SEU_DOMINIO.com/api/stripe-webhook
// Events: checkout.session.completed, payment_intent.succeeded,
//         payment_intent.payment_failed, charge.refunded, charge.dispute.created,
//         invoice.payment_succeeded, invoice.payment_failed,
//         customer.subscription.updated, customer.subscription.deleted
// Salvar o "Signing secret" (whsec_xxx) em STRIPE_WEBHOOK_SECRET


import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { revokeAccessByTransaction, restoreAccessByTransaction } from "@/lib/access-revocation"
import { createOrRefreshInvite } from "@/lib/account-invites"
import { sendAccountInviteEmail, sendAccountExistsEmail } from "@/lib/email/account-invite"

// Stubs no-op — integrações Utmify/WhatsApp removidas.
// Cliente plugar tracking/messaging próprio aqui se quiser.
async function cancelPendingMessages(_args: unknown): Promise<void> {}
function buildUtmifyOrder(_args: unknown): null { return null }
async function sendOrderToUtmify(_order: unknown): Promise<void> {}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  const body = await req.text() // raw body necessário pra verificar signature
  const stripe = getStripe()
  const secret = getStripeWebhookSecret()

  let event: Stripe.Event
  try {
    // constructEventAsync é necessário em edge runtime (crypto.subtle é async)
    event = await stripe.webhooks.constructEventAsync(body, sig, secret)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid signature"
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 })
  }

  // ── Idempotency check ──────────────────────────────────────────────────────
  // Stripe re-entrega webhooks em ~0.1-1% dos casos (timeout do servidor).
  // Sem isso, mesmo evento processado 2x pode duplicar venda/refund/email.
  //
  // Estratégia: insert com PRIMARY KEY no event.id ANTES de processar.
  //  - Se já existe (conflict 23505) → ignora silenciosamente, retorna 200.
  //  - Se inseriu → processa normalmente.
  //  - Se processamento falhar → DELETE o event.id (libera Stripe retry).
  const supabaseIdem = getSupabaseAdmin()
  const { error: claimErr } = await supabaseIdem
    .from("stripe_processed_events")
    .insert({ event_id: event.id, event_type: event.type })

  if (claimErr) {
    // Postgres unique violation → já processado, skip
    if (claimErr.code === "23505") {
      console.log(`[webhook] skipping duplicate event ${event.id} (${event.type})`)
      return NextResponse.json({ received: true, duplicate: true })
    }
    // Outro erro (ex: tabela não existe) → loga mas NÃO bloqueia processamento.
    // Fail-open: melhor processar 2x do que ignorar venda real.
    console.warn(`[webhook] idempotency claim failed: ${claimErr.message}`)
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(stripe, event.data.object)
        break
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(stripe, event.data.object)
        break
      case "charge.refunded":
        await handleChargeRefunded(stripe, event.data.object)
        break
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(stripe, event.data.object)
        break
      case "charge.dispute.created":
        await handleChargeDisputeCreated(stripe, event.data.object)
        break
      case "charge.dispute.closed":
        await handleChargeDisputeClosed(event.data.object)
        break
      case "charge.refund.updated":
        await handleChargeRefundUpdated(event.data.object)
        break
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(stripe, event.data.object)
        break
      case "invoice_payment.paid":
        // Evento novo da Stripe API (basil/dahlia) que substitui invoice.payment_succeeded.
        // Stripe pode disparar APENAS esse em vez do antigo dependendo da API version.
        // Carrega o Invoice completo via API e reusa o handler antigo.
        await handleInvoicePaymentPaidNew(stripe, event.data.object)
        break
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object)
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object)
        break
      default:
        // Ignora outros eventos
        break
    }
  } catch (e) {
    // Erro ao processar — Stripe vai retentar (devolver 500).
    // Libera o event.id pra próxima retry conseguir processar (senão skiparia
    // como duplicado e a venda nunca seria gravada).
    const msg = e instanceof Error ? e.message : "Handler error"
    console.error(`Webhook handler error for ${event.type}:`, msg)
    try {
      await supabaseIdem.from("stripe_processed_events").delete().eq("event_id", event.id)
    } catch {
      // Silent — pior caso: Stripe retenta, vê duplicate, skipa. Venda fica perdida
      // mas isso é EXTREMAMENTE raro (Supabase + Stripe ambos com problema simultâneo).
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// Produto "Créditos V0" — venda manual via Payment Link, NÃO faz parte do funil.
// Tem fluxo isolado: só envia evento Utmify, não grava em stripe_sales,
// não dispara account invite, não cancela mensagens pendentes.
const CREDITOS_V0_PRODUCT_ID = "prod_UQGYVH3FZ13spy"

type CreditosV0Info = { tier: string; priceUsd: number; productName: string }

/**
 * Heurística rápida: PIs de Payment Link não têm a metadata estruturada
 * que nosso checkout grava (sale_type, items, total_usd_cents).
 * Evita chamada extra à API Stripe pra cada venda do funil normal.
 */
function isLikelyPaymentLinkPi(pi: Stripe.PaymentIntent): boolean {
  return !pi.metadata?.sale_type && !pi.metadata?.items && !pi.metadata?.total_usd_cents
}

/**
 * Confirma via Checkout Session se um PI é de Créditos V0 e extrai tier ($39/$59/etc).
 * Retorna null se não for desse produto.
 */
async function detectCreditosV0FromPi(
  stripe: Stripe,
  pi: Stripe.PaymentIntent
): Promise<CreditosV0Info | null> {
  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: pi.id,
      limit: 1,
      expand: ["data.line_items.data.price.product"],
    })
    const session = sessions.data[0]
    if (!session) return null
    return detectCreditosV0FromSession(session)
  } catch {
    return null
  }
}

function detectCreditosV0FromSession(session: Stripe.Checkout.Session): CreditosV0Info | null {
  const lineItem = session.line_items?.data?.[0]
  const product = lineItem?.price?.product
  const productId = typeof product === "string" ? product : product?.id
  if (productId !== CREDITOS_V0_PRODUCT_ID) return null

  const productName =
    product && typeof product !== "string" && !product.deleted ? product.name : "Créditos V0"
  const amountCents = lineItem?.amount_total ?? session.amount_total ?? 0
  const priceUsd = amountCents / 100
  const tier = String(Math.round(priceUsd))
  return { tier, priceUsd, productName }
}

/**
 * Fluxo isolado pra Créditos V0: extrai customer do billing_details e envia paid pra Utmify.
 * NÃO grava em stripe_sales, NÃO dispara invite/recovery — venda fora do funil.
 */
async function handleCreditosV0Paid(
  stripe: Stripe,
  pi: Stripe.PaymentIntent,
  info: CreditosV0Info
) {
  let customerEmail: string | null = null
  let customerName: string | null = null
  let customerPhone: string | null = null
  let customerCountry: string | null = null

  if (pi.latest_charge) {
    try {
      const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge.id
      const charge = await stripe.charges.retrieve(chargeId)
      customerEmail = charge.billing_details?.email || null
      customerName = charge.billing_details?.name || null
      customerPhone = charge.billing_details?.phone || null
      customerCountry = charge.billing_details?.address?.country || null
    } catch {
      // ignora — se faltar email, retorna abaixo
    }
  }

  if (!customerEmail) {
    console.warn(`[creditos-v0] PI ${pi.id} sem email — Utmify NÃO enviado`)
    return
  }

  const utmifyOrder = buildUtmifyOrder({
    paymentIntentId: pi.id,
    amountInCents: Math.round(info.priceUsd * 100),
    currency: "usd",
    createdAt: pi.created,
    approvedDate: pi.created,
    refundedAt: null,
    status: "paid",
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      country: customerCountry,
    },
    items: [{
      key: `creditos_v0_${info.tier}`,
      name: `${info.productName} — $${info.tier}`,
      price: info.priceUsd,
      qty: 1,
    }],
    utm: null,
  })

  if (utmifyOrder) await sendOrderToUtmify(utmifyOrder)
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  // Só venda completa
  if (session.payment_status !== "paid") return
  // Só pagamentos one-time (não subscriptions)
  if (session.mode !== "payment") return

  // Expandir line_items pra ter detalhes
  const expanded = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price.product", "payment_intent"],
  })

  // Créditos V0 é Payment Link manual, não passa pelo funil — sai do fluxo normal.
  // (handlePaymentIntentSucceeded também detecta e envia o paid pra Utmify.)
  if (detectCreditosV0FromSession(expanded)) return

  const piId =
    typeof expanded.payment_intent === "string"
      ? expanded.payment_intent
      : expanded.payment_intent?.id
  if (!piId) return

  const customerId =
    typeof expanded.customer === "string" ? expanded.customer : expanded.customer?.id ?? null

  const items = (expanded.line_items?.data || []).map((li) => {
    const product =
      li.price && typeof li.price.product === "object" ? (li.price.product as Stripe.Product) : null
    return {
      key: product?.metadata?.key || product?.metadata?.role || "unknown",
      name: product?.name || li.description || "item",
      price: (li.amount_total ?? 0) / 100,
      qty: li.quantity ?? 1,
    }
  })

  // plan: 'lifetime' (padrão) ou 'annual'. Vem do metadata.product_variant
  // setado no momento do checkout em finalize/route.ts. Se não tiver
  // product_variant (vendas pré-feature), assume 'lifetime' por compatibilidade.
  const plan: "lifetime" | "annual" =
    session.metadata?.product_variant === "annual" ? "annual" : "lifetime"

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from("stripe_sales").upsert(
    {
      stripe_session_id: session.id,
      stripe_payment_intent_id: piId,
      stripe_customer_id: customerId,
      sale_type: "front",
      plan,
      region: session.metadata?.region || "DEFAULT",
      items,
      amount_total: session.amount_total ?? 0,
      currency: (session.currency || "usd").toLowerCase(),
      customer_email: session.customer_details?.email || session.customer_email || null,
      customer_name: session.customer_details?.name || null,
      customer_phone: session.customer_details?.phone || null,
      customer_country: session.customer_details?.address?.country || null,
      utm: extractUtm(session.metadata),
      status: "paid",
    },
    { onConflict: "stripe_payment_intent_id" }
  )

  if (error) throw new Error(`supabase upsert front: ${error.message}`)

  // Cancela QUALQUER mensagem pendente desse cliente (carrinho abandonado,
  // card failure recovery, etc) — pagamento foi confirmado, não dispara
  // mais recovery. Idempotente: se nada estiver pending, não faz nada.
  const customerEmail = session.customer_details?.email || session.customer_email
  await cancelPendingMessages({
    email: customerEmail || null,
    pi_id: piId,
    reason: "purchase_approved_front",
  })
}

/**
 * Upgrade Anual → Vitalicio (1-click off-session).
 * PI criado em /api/upgrade-to-lifetime com metadata.upgrade_to_lifetime=true
 * + metadata.upgrade_user_id=<auth.users.id>.
 *
 * Ação: UPDATE TODOS sales front desse user → plan='lifetime', expires_at=NULL.
 * Resultado: cliente vira vitalício, widget de prazo some, requireFrontAccess libera.
 *
 * NÃO cria sale novo (não é uma nova compra de produto). É upgrade puro.
 */
async function handleUpgradeToLifetime(pi: Stripe.PaymentIntent) {
  const userId = pi.metadata?.upgrade_user_id
  const customerEmail = (pi.metadata?.customer_email || "").toLowerCase().trim()

  if (!userId && !customerEmail) {
    console.error("[upgrade-to-lifetime] PI sem upgrade_user_id NEM customer_email:", pi.id)
    return
  }

  const supabase = getSupabaseAdmin()

  // PRIMEIRA TENTATIVA: filter por user_id (caso normal — sale do front linkada ao user)
  let salesUpdated = 0
  if (userId) {
    const { data, error } = await supabase
      .from("stripe_sales")
      .update({ plan: "lifetime", expires_at: null })
      .eq("user_id", userId)
      .eq("status", "paid")
      .filter("items", "@>", '[{"key": "front"}]')
      .select("id")

    if (error) {
      console.error("[upgrade-to-lifetime] update by user_id failed:", error.message)
    } else {
      salesUpdated = data?.length || 0
    }
  }

  // FALLBACK: se UPDATE por user_id retornou 0 linhas, tenta via customer_email.
  // Cobre caso onde a sale do front foi criada antes da conta existir e nunca
  // ficou linkada (user reusing email em testes, account invite "account_exists" path, etc).
  if (salesUpdated === 0 && customerEmail) {
    // Acha sales front desse email com user_id NULL ou sem match acima
    const { data: candidateSales } = await supabase
      .from("stripe_sales")
      .select("id, user_id, items")
      .eq("customer_email", customerEmail)
      .eq("status", "paid")

    const frontSaleIds = (candidateSales || [])
      .filter((s) => {
        const items = (s.items as Array<{ key?: string }> | null) || []
        return items.some((it) => (it?.key || "").replace(/__downsell$/, "") === "front")
      })
      .map((s) => s.id)

    if (frontSaleIds.length > 0) {
      // Update incluindo backfill do user_id se tinha
      const updatePayload: { plan: "lifetime"; expires_at: null; user_id?: string } = {
        plan: "lifetime",
        expires_at: null,
      }
      if (userId) updatePayload.user_id = userId

      const { data, error } = await supabase
        .from("stripe_sales")
        .update(updatePayload)
        .in("id", frontSaleIds)
        .select("id")

      if (error) {
        console.error("[upgrade-to-lifetime] email-fallback update failed:", error.message)
        throw new Error(`upgrade_to_lifetime email fallback failed: ${error.message}`)
      }

      salesUpdated = data?.length || 0
      console.log("[upgrade-to-lifetime] applied via email fallback:", {
        email: customerEmail,
        sales_updated: salesUpdated,
      })
    }
  }

  console.log("[upgrade-to-lifetime] result", {
    user_id: userId,
    customer_email: customerEmail,
    pi_id: pi.id,
    sales_updated: salesUpdated,
    amount_paid: pi.amount,
    currency: pi.currency,
  })

  if (salesUpdated === 0) {
    console.error(`[upgrade-to-lifetime] NENHUMA sale front atualizada — user_id=${userId} email=${customerEmail}`)
  }
}

async function handlePaymentIntentSucceeded(stripe: Stripe, pi: Stripe.PaymentIntent) {
  // PIs de subscription (parcelas) são tratados pelo invoice.payment_succeeded.
  // Aqui processa só PIs avulsos: front 1x, upsell off-session OU downsell (oferta única).
  //
  // Créditos V0 (Payment Link manual): só envia pra Utmify, skip todo o fluxo de funil.
  // Heurística evita API call extra pra vendas normais (que sempre têm metadata.sale_type).
  if (isLikelyPaymentLinkPi(pi)) {
    const creditosV0 = await detectCreditosV0FromPi(stripe, pi)
    if (creditosV0) {
      await handleCreditosV0Paid(stripe, pi, creditosV0)
      return
    }
  }

  // Upgrade Anual → Vitalicio (1-click off-session via /api/upgrade-to-lifetime)
  // Detecta antes do flow normal pq tem lógica própria (UPDATE plan, não cria sale novo).
  if (pi.metadata?.upgrade_to_lifetime === "true") {
    await handleUpgradeToLifetime(pi)
    return
  }

  // sale_type pode ser: "front" | "standalone" | "upsell" | "downsell"
  // (downsell salva como "upsell" com flag em items; standalone preserva pra
  // diferenciar mini-checkouts dos /checkout principal)
  //
  // Stripe API basil/dahlia removeu PaymentIntent.invoice — não dá mais pra detectar
  // subscription PIs via pi.invoice. Nossa app SEMPRE seta sale_type nos PIs que criamos;
  // subscription PIs criados internamente pelo Stripe não têm sale_type. Se não tem sale_type
  // e não é Payment Link (já tratado acima), é PI de subscription → skip.
  const metadataSaleType = pi.metadata?.sale_type
  if (!metadataSaleType) return
  const saleType: "front" | "standalone" | "upsell" =
    metadataSaleType === "upsell" || metadataSaleType === "downsell"
      ? "upsell"
      : metadataSaleType === "standalone"
        ? "standalone"
        : "front"
  const isDownsell = metadataSaleType === "downsell"

  // Customer info — ordem de fontes (mais → menos confiável):
  //  1. charge.billing_details: preenchido no confirmPayment (sempre tem o nome digitado)
  //  2. pi.metadata: setado na criação do PI (pode ter nome vazio se cliente digitou email antes do nome)
  //  3. customer object: backup final (pode ou não ter os dados)
  //
  // Fix do bug "customer_name=NULL" (2026-04-29): metadata é vazio quando o PI
  // é criado antes do cliente preencher o nome (debounce 600ms no email).
  // billing_details vem do confirmPayment.payment_method_data e SEMPRE está completo.
  let billingName: string | null = null
  let billingEmail: string | null = null
  let billingPhone: string | null = null
  if (pi.latest_charge) {
    try {
      const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge.id
      const charge = await stripe.charges.retrieve(chargeId)
      billingName = charge.billing_details?.name || null
      billingEmail = charge.billing_details?.email || null
      billingPhone = charge.billing_details?.phone || null
    } catch {
      // ignora — fallback pra metadata abaixo
    }
  }

  let customerEmail: string | null = billingEmail || pi.metadata?.customer_email || null
  let customerName: string | null = billingName || pi.metadata?.customer_name || null
  let customerPhone: string | null = billingPhone || pi.metadata?.customer_phone || null
  let customerCountry: string | null = null

  if (pi.customer) {
    try {
      const customerId = typeof pi.customer === "string" ? pi.customer : pi.customer.id
      const customer = await stripe.customers.retrieve(customerId)
      if (!customer.deleted) {
        customerEmail = customerEmail || customer.email || null
        customerName = customerName || customer.name || null
        customerPhone = customerPhone || customer.phone || null
        customerCountry = customer.address?.country ?? null
      }
    } catch {
      // ignora — não é crítico
    }
  }

  // Items: pra upsell vem em metadata.upsells (csv); pra front vem em metadata.items (json)
  type Item = { key: string; name: string; price: number; qty: number }
  let items: Item[] = []

  if (saleType === "upsell") {
    const upsellKeys = (pi.metadata?.upsells || "").split(",").filter(Boolean)
    items = upsellKeys.map((key) => ({
      key: isDownsell ? `${key}__downsell` : key, // marca downsell pra reports
      name:
        (key === "revisao" ? "Servicio Premium" : key === "minivsl" ? "Upsell 1" : key) +
        (isDownsell ? " (downsell)" : ""),
      // Preço em moeda local rateado por produto (Supabase salva como histórico em moeda da cobrança).
      // OBS: pro Utmify, vamos enviar 1 produto único representando o combo (ver utmifyItems abaixo).
      price: pi.amount / 100 / Math.max(upsellKeys.length, 1),
      qty: 1,
    }))
  } else {
    try {
      const parsed = JSON.parse(pi.metadata?.items || "[]") as Array<{ key: string; price: number }>
      items = parsed.map((p) => ({
        key: p.key,
        name: p.key === "front" ? "Los 144000" : p.key,
        price: p.price,
        qty: 1,
      }))
    } catch {
      items = [{ key: "front", name: "Los 144000", price: pi.amount / 100, qty: 1 }]
    }
  }

  // plan só faz sentido pra sale_type='front' (front_one_time, etc).
  // Standalone/upsell/downsell mantêm plan=NULL.
  const plan: "lifetime" | "annual" | null =
    saleType === "front"
      ? (pi.metadata?.product_variant === "annual" ? "annual" : "lifetime")
      : null

  const supabase = getSupabaseAdmin()

  // user_id pra bumps/upsells via /api/buy-product (off-session 1-click).
  // CRÍTICO: sem user_id setado aqui, owned-products query (`WHERE user_id = $`)
  // não encontra a sale → produto comprado mas nunca aparece como liberado.
  // Front sales recebem user_id depois via /cuenta/crear?token=XXX (account invite),
  // mas off-session 1-click roda quando user JÁ TEM CONTA → setamos direto.
  //
  // Belt & suspenders: tenta 3 fontes, na ordem
  //  1. metadata.upsell_user_id (setado em /api/buy-product e /api/buy-product/create-pi)
  //  2. metadata.upgrade_user_id (caso de upgrade que cair aqui — não deveria)
  //  3. lookup auth.users via customer_email (fallback final, garantia anti-bug)
  let upsellUserId: string | null =
    pi.metadata?.upsell_user_id ||
    pi.metadata?.upgrade_user_id ||
    null

  // Fallback: se metadata não tinha user_id mas tem email, busca em auth.users.
  // Cobre casos onde a metadata foi trocada/sobrescrita ou criada por flow legado.
  if (!upsellUserId && customerEmail && (saleType === "upsell" || saleType === "standalone")) {
    try {
      const { data: authUsersList } = await supabase.auth.admin.listUsers()
      const matched = authUsersList?.users?.find(
        (u) => (u.email || "").toLowerCase().trim() === customerEmail.toLowerCase().trim(),
      )
      if (matched) {
        upsellUserId = matched.id
        console.log(`[webhook] user_id resolvido via email fallback: ${customerEmail} → ${matched.id}`)
      }
    } catch (e) {
      console.warn(`[webhook] email fallback failed:`, e instanceof Error ? e.message : e)
    }
  }
  console.log(`[webhook] sale_type=${saleType} pi=${pi.id} user_id=${upsellUserId} email=${customerEmail}`)
  const { error } = await supabase.from("stripe_sales").upsert(
    {
      stripe_session_id: null,
      stripe_payment_intent_id: pi.id,
      stripe_customer_id: typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null,
      sale_type: saleType,
      plan,
      region: pi.metadata?.region || "DEFAULT",
      items,
      amount_total: pi.amount,
      currency: pi.currency.toLowerCase(),
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_country: customerCountry,
      utm: extractUtm(pi.metadata),
      status: "paid",
      // user_id direto pra upsell off-session (cliente já logado quando comprou).
      // Front sales: user_id fica NULL aqui e é populado depois via account invite.
      ...(upsellUserId ? { user_id: upsellUserId } : {}),
    },
    { onConflict: "stripe_payment_intent_id" }
  )

  if (error) throw new Error(`supabase upsert ${saleType}: ${error.message}`)

  // Auto-clear revocations: cliente que recompra produto previamente revogado
  // (ex: comprou → refund → comprou de novo) deve voltar a ter acesso. Sem isso,
  // sale nova fica "presa" pelo revoked_products antigo.
  if (customerEmail && items.length > 0) {
    const productKeys = items
      .map((i) => (i.key || "").replace(/__downsell$/, ""))
      .filter(Boolean)
    if (productKeys.length > 0) {
      const { data: cleared } = await supabase
        .from("revoked_products")
        .delete()
        .ilike("customer_email", customerEmail)
        .in("product_key", productKeys)
        .select("product_key")
      if (cleared && cleared.length > 0) {
        console.log(`[webhook] auto-cleared revocations on new sale:`, {
          email: customerEmail,
          cleared: cleared.map((c) => c.product_key),
        })
      }
    }
  }

  // Cancela mensagens pendentes (carrinho abandonado, card failure recovery)
  // — pagamento aprovado, não dispara mais sequências de recuperação.
  await cancelPendingMessages({
    email: customerEmail || null,
    pi_id: pi.id,
    reason: `purchase_approved_${saleType}`,
  })

  // ── Account invite (Resend) ─────────────────────────────────────────────
  // Front sale = primeira compra do cliente. Cria token único + envia email
  // pra criação de conta no /cuenta/crear?token=XXX. Falha aqui NÃO bloqueia
  // webhook (idempotência via Stripe e fail-open: melhor venda salva sem email
  // do que webhook 500 que faz Stripe retry e duplica processamento).
  if (saleType === "front" && customerEmail) {
    // Email crítico: se Resend cair ou Supabase der timeout, RETHROW pra
    // o try/catch do POST handler deletar stripe_processed_events e devolver
    // 500 → Stripe retenta automaticamente (até 3 dias). Antes esse bloco
    // engolia exceção em silêncio e cliente nunca recebia email.
    const result = await createOrRefreshInvite({
      email: customerEmail,
      stripePaymentIntentId: pi.id,
      stripeCustomerId: typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null,
      customerName,
      customerPhone,
    })
    if (!result.skipped) {
      const sent = await sendAccountInviteEmail(result.invite, {
        source: "stripe_front",
        sourceRef: pi.id,
      })
      if (!sent.ok) {
        throw new Error(`account invite email failed for ${customerEmail}: ${sent.error}`)
      }
    } else if (result.reason === "account_exists") {
      console.log(`[webhook] account_exists — enviando email de login pra ${customerEmail}`)
      const sent = await sendAccountExistsEmail({
        email: customerEmail,
        customerName: result.customerName,
        source: "stripe_front",
        sourceRef: pi.id,
      })
      if (!sent.ok) {
        throw new Error(`account_exists email failed for ${customerEmail}: ${sent.error}`)
      }
    } else {
      // already_sent — evento duplicado, email já enviado anteriormente. Skip.
      console.log(`[webhook] front: email ja enviado anteriormente pra ${customerEmail} — skip duplicado`)
    }
  }

  // Utmify: envia evento de venda paga (tracking de conversões).
  // Sempre em USD: nossa moeda base é USD; Stripe Adaptive Pricing converte USD→moeda local
  // na hora da cobrança. Utmify só aceita BRL/USD/EUR/GBP/ARS/CAD — converte USD→BRL no painel.
  // Fallback pro pi.amount se metadata não tiver total_usd_cents (vendas antigas).
  const usdCents = parseInt(pi.metadata?.total_usd_cents || "", 10) || pi.amount
  const utmifyCurrency = pi.metadata?.total_usd_cents ? "usd" : pi.currency

  const utmifyItems = buildUtmifyItemsForReport(items, saleType, usdCents)

  const utmifyOrder = buildUtmifyOrder({
    paymentIntentId: pi.id,
    amountInCents: usdCents,
    currency: utmifyCurrency,
    createdAt: pi.created,
    approvedDate: pi.created,
    refundedAt: null,
    status: "paid",
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      country: customerCountry,
    },
    items: utmifyItems,
    utm: extractUtm(pi.metadata),
  })
  if (utmifyOrder) await sendOrderToUtmify(utmifyOrder)

  // Webhook externo Purchase (server-side). Cobre front, upsell, downsell e standalone.
  // Mesmo payload do purchase-relay client-side; event_id=pi.id deduplica caso o relay
  // client-side dispare também (gracias page). Garante conversão mesmo se cliente
  // fechar página, ad blocker bloquear, ou erro de JS quebrar o relay.
  await sendPurchaseWebhook({
    piId: pi.id,
    saleType: metadataSaleType, // "front" | "upsell" | "downsell" | "standalone"
    customerEmail,
    customerName,
    customerPhone,
    customerCountry,
    itemKeys: items.map((i) => i.key),
    totalUsdCents: parseInt(pi.metadata?.total_usd_cents || "0", 10),
    fallbackAmountCents: pi.amount,
    fallbackCurrency: pi.currency,
    metadata: pi.metadata || {},
  })
}

async function handleChargeRefunded(stripe: Stripe, charge: Stripe.Charge) {
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id
  if (!piId) return

  // Créditos V0 reembolsado: envia refunded pra Utmify e sai (não tem registro em stripe_sales).
  try {
    const pi = await stripe.paymentIntents.retrieve(piId)
    if (isLikelyPaymentLinkPi(pi)) {
      const creditosV0 = await detectCreditosV0FromPi(stripe, pi)
      if (creditosV0) {
        const utmifyOrder = buildUtmifyOrder({
          paymentIntentId: piId,
          amountInCents: Math.round(creditosV0.priceUsd * 100),
          currency: "usd",
          createdAt: charge.created,
          approvedDate: charge.created,
          refundedAt: Date.now() / 1000,
          status: "refunded",
          customer: {
            name: charge.billing_details?.name || null,
            email: charge.billing_details?.email || null,
            phone: charge.billing_details?.phone || null,
            country: charge.billing_details?.address?.country || null,
          },
          items: [{
            key: `creditos_v0_${creditosV0.tier}`,
            name: `${creditosV0.productName} — $${creditosV0.tier}`,
            price: creditosV0.priceUsd,
            qty: 1,
          }],
          utm: null,
        })
        if (utmifyOrder) await sendOrderToUtmify(utmifyOrder)
        return
      }
    }
  } catch {
    // Falha na detecção → cai pro fluxo normal (vendas do funil)
  }

  const supabase = getSupabaseAdmin()

  // Busca a venda pra ter os dados do cliente + items pra revogar acesso
  const { data: sale } = await supabase
    .from("stripe_sales")
    .select("customer_email, customer_name, customer_phone, sale_type, items")
    .eq("stripe_payment_intent_id", piId)
    .limit(1)
    .single()

  type Item = { key: string; name: string; price: number; qty: number }
  const saleData = sale as {
    customer_email?: string
    customer_name?: string
    customer_phone?: string
    sale_type?: string
    items?: Item[]
  } | null

  // Refund total vs parcial. Stripe permite refund parcial (cliente reembolsa
  // só parte do valor — ex: só os bumps). Em parcial mantemos a venda como 'paid'
  // (cliente continua com direito ao front) e revogamos APENAS os bumps/upsells
  // não-front. Decisão: caso comum é "cliente arrependido só dos extras". Admin
  // pode reverter via DELETE /api/admin/revoke-product caso o refund tenha sido
  // só de 1 bump específico.
  const isFullRefund = charge.amount_refunded >= charge.amount
  const isPartialRefund = charge.amount_refunded > 0 && charge.amount_refunded < charge.amount

  // Marca status na tabela: full → 'refunded', parcial → mantém 'paid' (com flag).
  // Sem essa distinção, owned-products perde a venda inteira em parcial — cliente
  // ficaria sem front mesmo só tendo reembolsado bumps.
  const newStatus = isFullRefund ? "refunded" : "paid"
  const { error } = await supabase
    .from("stripe_sales")
    .update({ status: newStatus })
    .eq("stripe_payment_intent_id", piId)

  if (error) throw new Error(`supabase update refund: ${error.message}`)

  if (isPartialRefund && saleData?.items && saleData.items.length > 0) {
    // Revoga TODOS os items não-front (bumps/upsells). Front permanece com acesso.
    const bumpKeys = saleData.items
      .map((it) => it.key.replace(/__downsell$/, ""))
      .filter((k) => k && k !== "front")

    console.warn(`[stripe-webhook] REFUND PARCIAL — revogando bumps/upsells, mantendo front`, {
      pi: piId,
      amount_paid: charge.amount,
      amount_refunded: charge.amount_refunded,
      currency: charge.currency,
      customer_email: saleData?.customer_email,
      revoking: bumpKeys,
    })

    if (bumpKeys.length > 0 && saleData.customer_email) {
      await revokeAccessByTransaction({
        email: saleData.customer_email,
        productKeys: bumpKeys,
        reason: "refund",
        source: "stripe",
        sourceRef: piId,
        isFrontSale: false, // nunca revoga acesso completo em refund parcial
      })
    }
  }

  if (isFullRefund && saleData?.items && saleData.items.length > 0) {
    const productKeys = saleData.items.map((it) => it.key)

    // Helper centralizado: insere em revoked_products + access_revoked se front
    if (saleData.customer_email) {
      await revokeAccessByTransaction({
        email: saleData.customer_email,
        productKeys,
        reason: "refund",
        source: "stripe",
        sourceRef: piId,
        isFrontSale: saleData.sale_type === "front",
      })
    }

    // Utmify: marca venda como refunded (atualiza dashboard de tracking).
    // Busca total_usd_cents do PI original pra mandar em USD (mesma lógica da venda paga).
    let refundUsdCents = charge.amount
    let refundCurrency: string = charge.currency
    try {
      const originalPi = await stripe.paymentIntents.retrieve(piId)
      const usdMeta = parseInt(originalPi.metadata?.total_usd_cents || "", 10)
      if (usdMeta > 0) {
        refundUsdCents = usdMeta
        refundCurrency = "usd"
      }
    } catch {
      // mantém charge.amount/charge.currency como fallback
    }

    // Combo upsell vira 1 produto único pra evitar duplicação no painel "Vendas por Produto" da Utmify.
    const refundItems = buildUtmifyItemsForReport(saleData.items, saleData.sale_type, refundUsdCents)

    const utmifyOrder = buildUtmifyOrder({
      paymentIntentId: piId,
      amountInCents: refundUsdCents,
      currency: refundCurrency,
      createdAt: charge.created,
      approvedDate: charge.created,
      refundedAt: Date.now() / 1000,
      status: "refunded",
      customer: {
        name: saleData.customer_name || null,
        email: saleData.customer_email || null,
        phone: saleData.customer_phone || null,
        country: null,
      },
      items: refundItems,
      utm: {}, // Refund não tem UTM (já foi enviado na venda original)
    })
    if (utmifyOrder) await sendOrderToUtmify(utmifyOrder)
  }
}

/**
 * Helper: ajusta items pra payload Utmify.
 * - Combo upsell/downsell (>1 item): vira 1 produto único pra não duplicar valor no painel
 * - Outros casos: mantém items originais
 *
 * Razão: a Utmify, em "Vendas por Produto", atribui o valor total da order pra cada item
 * individual. Combo de 2 produtos com R$ 50 total mostra R$ 50 + R$ 50 = R$ 100 no relatório.
 * Solução: enviar 1 produto único representando o combo.
 */
type UtmifyItem = { key: string; name: string; price: number; qty: number }
function buildUtmifyItemsForReport(
  items: UtmifyItem[] | undefined,
  saleType: string | null | undefined,
  totalUsdCents: number
): UtmifyItem[] {
  if (!items || items.length === 0) return []
  if ((saleType === "upsell" || saleType === "downsell") && items.length > 1) {
    return [{
      key: items.map((it) => it.key).join("+"),
      name: items.map((it) => it.name).join(" + "),
      price: totalUsdCents / 100,
      qty: 1,
    }]
  }
  return items
}

/**
 * Handler do evento NOVO invoice_payment.paid (Stripe API basil/dahlia+).
 * Stripe pode disparar APENAS esse em vez do invoice.payment_succeeded antigo
 * dependendo da API version. Carregamos o Invoice completo e reusamos o handler.
 */
async function handleInvoicePaymentPaidNew(
  stripe: Stripe,
  payload: Stripe.InvoicePayment,
) {
  const invoiceRef = payload.invoice
  const invoiceId = typeof invoiceRef === "string" ? invoiceRef : invoiceRef?.id
  if (!invoiceId) {
    console.warn(`[webhook] invoice_payment.paid sem invoice id — payload:`, JSON.stringify(payload).slice(0, 300))
    return
  }
  // Carrega invoice expandido pra reaproveitar o handler antigo
  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ["parent.subscription_details.subscription"],
  })
  await handleInvoicePaymentSucceeded(stripe, invoice)
}

/**
 * Parcela de subscription paga (1ª, 2ª ou 3ª).
 * Cada invoice paga vira uma linha em stripe_sales com installment_number.
 *
 * IMPORTANTE: NUNCA fazer early return silencioso. Cada early return precisa logar
 * o motivo pra que possamos diagnosticar futuros problemas em produção.
 */
async function handleInvoicePaymentSucceeded(stripe: Stripe, invoice: Stripe.Invoice) {
  console.log(`[webhook][invoice] start — invoice=${invoice.id} billing_reason=${invoice.billing_reason} status=${invoice.status}`)

  // Stripe API basil/dahlia removeu Invoice.subscription e Invoice.payment_intent.
  // Tenta múltiplos caminhos pra achar subscription ID (cobre API versions diferentes).
  let subId: string | null = null

  // Caminho 1: invoice.parent.subscription_details.subscription (basil+)
  const rawSubFromParent = invoice.parent?.subscription_details?.subscription || null
  if (rawSubFromParent) {
    subId = typeof rawSubFromParent === "string" ? rawSubFromParent : rawSubFromParent.id
  }

  // Caminho 2: invoice.subscription (legacy, ainda funciona em algumas API versions)
  if (!subId) {
    const legacy = (invoice as unknown as { subscription?: string | { id: string } }).subscription
    if (legacy) {
      subId = typeof legacy === "string" ? legacy : legacy.id
    }
  }

  // Caminho 3: lookup via invoice line items (fallback final)
  if (!subId && invoice.lines?.data?.length) {
    for (const line of invoice.lines.data) {
      const lineSub = (line as unknown as { subscription?: string | { id: string } }).subscription
      if (lineSub) {
        subId = typeof lineSub === "string" ? lineSub : lineSub.id
        break
      }
    }
  }

  if (!subId) {
    console.warn(`[webhook][invoice] sem subscription id — invoice=${invoice.id} — provavelmente invoice avulsa, skip`)
    return
  }

  // Busca subscription PRIMEIRO + valida que é nosso fluxo (antes de tentar piId).
  // Bug histórico: early return em !piId fazia cliente perder invite/email quando
  // invoicePayments.list tinha lag de propagação. Agora subscription/invite/etc rodam
  // independente de conseguir extrair piId; piId é "best-effort" pra Supabase + tracking.
  const subscription = await stripe.subscriptions.retrieve(subId)
  if (subscription.metadata?.sale_type !== "front_installment") {
    console.log(`[webhook][invoice] sub=${subId} sale_type=${subscription.metadata?.sale_type || "(none)"} — não é front_installment, skip`)
    return
  }

  const totalInstallments = parseInt(subscription.metadata.total_installments || "3", 10)

  // Detecta 1ª invoice via billing_reason — único caminho determinístico.
  //
  // Bug histórico (2026-05-07): contar paidInvoices via stripe.invoices.list dava
  // race com eventual consistency da Stripe. Quando invoice.payment_succeeded
  // disparava, a list ainda retornava a invoice atual como "open" por alguns ms,
  // resultando em paidInvoices.length=0 → installmentNumber=0 → bloco
  // `if (installmentNumber === 1)` nunca executava → cliente parcelado NUNCA
  // recebia email de criação de conta (account invite).
  //
  // billing_reason é setado pela Stripe na criação da invoice e nunca muda:
  //  - "subscription_create" → 1ª invoice (criação da subscription)
  //  - "subscription_cycle"  → invoices 2/3 (parcelas mensais)
  const isFirstInvoice = invoice.billing_reason === "subscription_create"
  const allInvoices = await stripe.invoices.list({ subscription: subId, limit: 12 })
  // Conta paid EXCLUINDO a atual e soma 1 (a atual está sendo paga agora,
  // independente do status que a list retorne neste momento).
  const paidExcludingCurrent = allInvoices.data.filter(
    (i) => i.status === "paid" && i.id !== invoice.id
  )
  const installmentNumber = paidExcludingCurrent.length + 1

  // Items: 1ª invoice tem front + bumps; 2ª e 3ª só têm front
  type Item = { key: string; name: string; price: number; qty: number }
  let items: Item[] = []
  try {
    const parsed = JSON.parse(subscription.metadata.items || "[]") as Array<{
      key: string
      price: number
    }>
    if (installmentNumber === 1) {
      items = parsed.map((p) => ({
        key: p.key,
        name: p.key === "front" ? "Los 144000 (parcela 1)" : p.key,
        price: p.price,
        qty: 1,
      }))
    } else {
      const front = parsed.find((p) => p.key === "front")
      items = front
        ? [{ key: "front", name: `Los 144000 (parcela ${installmentNumber})`, price: front.price, qty: 1 }]
        : []
    }
  } catch {
    items = [
      {
        key: "front",
        name: `Los 144000 (parcela ${installmentNumber})`,
        price: invoice.amount_paid / 100,
        qty: 1,
      },
    ]
  }

  // piId via confirmation_secret OU InvoicePayments API. Best-effort — se falhar,
  // segue com null (usamos invoice.id como fallback identifier nos lugares que precisam).
  let piId: string | null =
    invoice.confirmation_secret?.client_secret?.match(/^(pi_[^_]+)_/)?.[1] || null
  if (!piId) {
    try {
      const payments = await stripe.invoicePayments.list({ invoice: invoice.id, limit: 1, status: "paid" as "paid" })
      const payment = payments.data[0]
      if (payment?.payment?.type === "payment_intent") {
        const piRef = payment.payment.payment_intent
        piId = typeof piRef === "string" ? piRef : (piRef?.id || null)
      }
    } catch (e) {
      console.warn(`[webhook] invoicePayments.list falhou pra invoice ${invoice.id}:`, e instanceof Error ? e.message : e)
    }
  }
  if (!piId) {
    console.warn(`[webhook] piId não recuperado pra invoice ${invoice.id} sub ${subId} — segue com fallback invoice.id pra invite/upsert`)
  }

  // Identifier que vai pro stripe_sales.stripe_payment_intent_id (NOT NULL UNIQUE).
  // Usa pi.id quando disponível; cai pra invoice.id (formato in_xxx, não colide com pi_xxx).
  const piIdOrFallback = piId || invoice.id

  // Customer info — ordem de fontes (mais → menos confiável):
  //  1. charge.billing_details: preenchido no confirmPayment (sempre tem o nome digitado)
  //  2. subscription.metadata: setado na criação (pode ter nome vazio se cliente digitou email antes)
  //  3. customer object: backup final
  // Se piId é null, billing_details fica null — fallback pra metadata + customer cobre.
  let billingName: string | null = null
  let billingEmail: string | null = null
  let billingPhone: string | null = null
  if (piId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId)
      if (pi.latest_charge) {
        const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge.id
        const charge = await stripe.charges.retrieve(chargeId)
        billingName = charge.billing_details?.name || null
        billingEmail = charge.billing_details?.email || null
        billingPhone = charge.billing_details?.phone || null
      }
    } catch {
      // ignora — fallback pra metadata abaixo
    }
  }

  let customerEmail = billingEmail || subscription.metadata.customer_email || null
  let customerName = billingName || subscription.metadata.customer_name || null
  let customerPhone = billingPhone || subscription.metadata.customer_phone || null
  let customerCountry: string | null = null

  if (subscription.customer) {
    try {
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id
      const customer = await stripe.customers.retrieve(customerId)
      if (!customer.deleted) {
        customerEmail = customerEmail || customer.email || null
        customerName = customerName || customer.name || null
        customerPhone = customerPhone || customer.phone || null
        customerCountry = customer.address?.country ?? null
      }
    } catch {
      // ignora
    }
  }

  // Parcelado segue o mesmo plan que foi escolhido no checkout
  // (annual ou lifetime). Default lifetime se metadata ausente.
  const plan: "lifetime" | "annual" =
    subscription.metadata.product_variant === "annual" ? "annual" : "lifetime"

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from("stripe_sales").upsert(
    {
      stripe_session_id: null,
      stripe_payment_intent_id: piIdOrFallback,
      stripe_subscription_id: subId,
      stripe_invoice_id: invoice.id,
      stripe_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id ?? null,
      sale_type: "front_installment",
      plan,
      installment_number: installmentNumber,
      total_installments: totalInstallments,
      region: subscription.metadata.region || "DEFAULT",
      items,
      amount_total: invoice.amount_paid,
      currency: invoice.currency.toLowerCase(),
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_country: customerCountry,
      utm: extractUtm(subscription.metadata),
      status: "paid",
    },
    { onConflict: "stripe_payment_intent_id" }
  )

  if (error) throw new Error(`supabase upsert installment ${installmentNumber}: ${error.message}`)

  // 1ª parcela paga = primeira venda do cliente. Dispara Utmify, invite/email
  // e cancela mensagens pendentes (carrinho/card_failure_recovery).
  // 2ª e 3ª parcelas: subscription cobra automaticamente, sem novo evento.
  if (isFirstInvoice) {
    // Cancela mensagens pendentes (carrinho abandonado, card_failure_recovery)
    // — pagamento aprovado, não dispara mais sequências de recuperação.
    await cancelPendingMessages({
      email: customerEmail,
      pi_id: piId, // pode ser null — cancelPendingMessages aceita
      reason: "purchase_approved_front_installment",
    })

    // Account invite (Resend) — primeira compra do cliente. Cria token único
    // + envia email pra criação de conta no /cuenta/crear?token=XXX.
    // Falha aqui NÃO bloqueia webhook (idempotência via Stripe e fail-open).
    // Mesma lógica do handlePaymentIntentSucceeded pra front à vista.
    // IMPORTANTE: roda mesmo se piId é null — cliente NÃO pode perder acesso só
    // porque invoicePayments.list teve lag. Usa piIdOrFallback (invoice.id) como ref.
    if (customerEmail) {
      // Mesma logica de rethrow do front a vista: email critico nao pode
      // ser engolido em silencio. Se falhar, throw → 500 → Stripe retenta.
      const result = await createOrRefreshInvite({
        email: customerEmail,
        stripePaymentIntentId: piIdOrFallback,
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id ?? null,
        customerName,
        customerPhone,
      })
      if (!result.skipped) {
        const sent = await sendAccountInviteEmail(result.invite, {
          source: "stripe_installment",
          sourceRef: piIdOrFallback,
        })
        if (!sent.ok) {
          throw new Error(`account invite email failed for ${customerEmail}: ${sent.error}`)
        }
        console.log(`[webhook][invoice] invite enviado pra ${customerEmail}`)
      } else if (result.reason === "account_exists") {
        console.log(`[webhook] account_exists — enviando email de login pra ${customerEmail}`)
        const sent = await sendAccountExistsEmail({
          email: customerEmail,
          customerName: result.customerName,
          source: "stripe_installment",
          sourceRef: piIdOrFallback,
        })
        if (!sent.ok) {
          throw new Error(`account_exists email failed for ${customerEmail}: ${sent.error}`)
        }
      } else {
        // already_sent — evento duplicado (invoice.payment_succeeded + invoice_payment.paid),
        // email já foi enviado pelo primeiro evento. Skip.
        console.log(`[webhook][invoice] email ja enviado anteriormente pra ${customerEmail} — skip duplicado`)
      }
    } else {
      // CRÍTICO: sem customerEmail nao tem como mandar invite. Throw pra Stripe
      // retentar — eventual consistency pode preencher metadata em retry posterior.
      console.error(`[webhook][invoice] SEM customerEmail pra parcelado sub=${subId} invoice=${invoice.id} — THROWING pra Stripe retry`)
      throw new Error(`subscription ${subId} invoice ${invoice.id} sem customerEmail extraível — verifica metadata + customer object`)
    }

    // Utmify: envia evento de venda paga APENAS na 1ª parcela.
    // Sempre em USD (Utmify converte USD→BRL); fallback pro amount_paid da invoice se metadata vazio.
    const totalUsdCents = parseInt(subscription.metadata.total_usd_cents || "", 10) || invoice.amount_paid
    const utmifyCurrency = subscription.metadata.total_usd_cents ? "usd" : invoice.currency
    const utmifyOrder = buildUtmifyOrder({
      paymentIntentId: piIdOrFallback,
      amountInCents: totalUsdCents,
      currency: utmifyCurrency,
      createdAt: subscription.created,
      approvedDate: subscription.created,
      refundedAt: null,
      status: "paid",
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        country: customerCountry,
      },
      items,
      utm: extractUtm(subscription.metadata),
    })
    if (utmifyOrder) await sendOrderToUtmify(utmifyOrder)

    // Webhook externo Purchase (server-side, 1ª parcela apenas).
    // CRÍTICO: Meta deve receber valor REAL pago (1ª parcela + bumps cobrados upfront),
    // NÃO o total das 3 parcelas. first_invoice_usd_cents foi setado em /api/stripe/finalize
    // pra esse fim. Fallback pra total_usd_cents pra subscriptions antigas (pré-fix).
    const firstInvoiceUsdCents = parseInt(subscription.metadata.first_invoice_usd_cents || "0", 10)
    const totalUsdCentsLegacy = parseInt(subscription.metadata.total_usd_cents || "0", 10)
    const valueForMeta = firstInvoiceUsdCents || totalUsdCentsLegacy
    await sendPurchaseWebhook({
      piId: piIdOrFallback,
      saleType: "front_installment",
      customerEmail,
      customerName,
      customerPhone,
      customerCountry,
      itemKeys: items.map((i) => i.key),
      totalUsdCents: valueForMeta,
      fallbackAmountCents: invoice.amount_paid,
      fallbackCurrency: invoice.currency,
      metadata: subscription.metadata,
    })
  }
}

/**
 * Parcela falhou. Stripe vai retentar via Smart Retries (até 4x por padrão).
 * Apenas incrementa contador; revogação acontece em customer.subscription.updated quando status vira 'unpaid'.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Stripe API basil/dahlia: Invoice.subscription removido — usar parent.subscription_details
  const rawSub = invoice.parent?.subscription_details?.subscription || null
  const subscriptionId = typeof rawSub === "string" ? rawSub : rawSub?.id || null
  if (!subscriptionId) return

  const supabase = getSupabaseAdmin()

  // Incrementa contador na linha da 1ª parcela (a "linha mãe" da subscription)
  const { data: rows } = await supabase
    .from("stripe_sales")
    .select("id, payment_failed_count")
    .eq("stripe_subscription_id", subscriptionId)
    .eq("installment_number", 1)
    .limit(1)

  if (!rows || rows.length === 0) {
    console.warn(`invoice.payment_failed: linha mãe não achada pra sub ${subscriptionId}`)
    return
  }

  const row = rows[0] as { id: string; payment_failed_count: number }
  const newCount = (row.payment_failed_count || 0) + 1

  await supabase
    .from("stripe_sales")
    .update({ payment_failed_count: newCount })
    .eq("id", row.id)

  console.warn(
    `invoice.payment_failed: sub=${subscriptionId} attempt=${newCount} attempt_count=${invoice.attempt_count}`
  )
}

/**
 * Subscription mudou de status. Quando vira 'unpaid' = Smart Retries esgotaram → revoga acesso.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (subscription.status !== "unpaid") return

  const subscriptionId = subscription.id
  const supabase = getSupabaseAdmin()

  const { data: rows, error: fetchErr } = await supabase
    .from("stripe_sales")
    .select("id, customer_email, customer_name, customer_phone, items")
    .eq("stripe_subscription_id", subscriptionId)

  if (fetchErr) throw new Error(`supabase fetch sales pra revogar: ${fetchErr.message}`)
  if (!rows || rows.length === 0) return

  const { error } = await supabase
    .from("stripe_sales")
    .update({
      access_revoked: true,
      access_revoked_at: new Date().toISOString(),
      status: "unpaid",
    })
    .eq("stripe_subscription_id", subscriptionId)

  if (error) throw new Error(`supabase revoke access: ${error.message}`)

  // Smart Retries esgotaram = revoga acesso. 1ª parcela tem todos os items;
  // 2ª/3ª só front. Pegamos da 1ª pra ter lista completa.
  type Item = { key: string; name: string; price: number; qty: number }
  type SaleRow = {
    id: string
    customer_email?: string
    customer_name?: string
    customer_phone?: string
    items?: Item[]
  }
  const sales = rows as SaleRow[]
  const firstInstallment = sales.find((r) => r.items && r.items.length > 0) || sales[0]
  const productKeys = firstInstallment.items?.map((it) => it.key) || ["front"]

  if (firstInstallment.customer_email) {
    await revokeAccessByTransaction({
      email: firstInstallment.customer_email,
      productKeys,
      reason: "cancel",
      source: "stripe",
      sourceRef: subscriptionId,
      isFrontSale: productKeys.includes("front"),
    })
  }

  // Utmify: marca venda como refunded (Smart Retries esgotaram = considerar reembolso).
  // Sempre em USD (mesma lógica da venda paga).
  if (firstInstallment.items && firstInstallment.items.length > 0) {
    const totalUsdCents =
      parseInt(subscription.metadata?.total_usd_cents || "", 10) ||
      firstInstallment.items.reduce((sum: number, it: Item) => sum + Math.round(it.price * 100), 0)
    const utmifyCurrency = subscription.metadata?.total_usd_cents ? "usd" : (subscription.currency || "usd")

    const utmifyOrder = buildUtmifyOrder({
      paymentIntentId: subscriptionId,
      amountInCents: totalUsdCents,
      currency: utmifyCurrency,
      createdAt: subscription.created,
      approvedDate: subscription.created,
      refundedAt: Date.now() / 1000,
      status: "refunded",
      customer: {
        name: firstInstallment.customer_name || null,
        email: firstInstallment.customer_email || null,
        phone: firstInstallment.customer_phone || null,
        country: null,
      },
      items: firstInstallment.items,
      utm: extractUtm(subscription.metadata),
    })
    if (utmifyOrder) await sendOrderToUtmify(utmifyOrder)
  }

  console.warn(
    `⚠️ ACESSO REVOGADO — Smart Retries esgotaram pra subscription ${subscriptionId}. ` +
      `Cliente: ${firstInstallment.customer_name || "?"} <${firstInstallment.customer_email || "?"}>. ` +
      `${sales.length} linha(s) atualizadas. Produtos revogados: ${productKeys.join(", ")}`
  )
}

/**
 * Subscription cancelada. Pode ser:
 *  - cancel_at atingido (90 dias = fim natural após 3 parcelas pagas) → ok, fim do ciclo
 *  - cancelada manualmente / por inadimplência → já foi tratado em subscription.updated 'unpaid'
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(
    `subscription deleted: ${subscription.id} status=${subscription.status} ended=${subscription.ended_at}`
  )
  // Sem ação no Supabase — registros das parcelas pagas continuam intactos.
}

/**
 * Pagamento recusado pelo cartão. Envia "refused" pra Utmify pra dashboard rastrear
 * tentativas mal-sucedidas (não gravamos em stripe_sales — só registramos vendas confirmadas).
 */
async function handlePaymentIntentFailed(stripe: Stripe, pi: Stripe.PaymentIntent) {
  console.warn("payment_intent.payment_failed", pi.id, pi.last_payment_error?.message)

  // Recupera dados do customer pra payload Utmify (email obrigatório)
  let customerEmail: string | null = pi.metadata?.customer_email || null
  let customerName: string | null = pi.metadata?.customer_name || null
  let customerPhone: string | null = pi.metadata?.customer_phone || null
  let customerCountry: string | null = null

  if (pi.customer) {
    try {
      const customerId = typeof pi.customer === "string" ? pi.customer : pi.customer.id
      const customer = await stripe.customers.retrieve(customerId)
      if (!customer.deleted) {
        customerEmail = customerEmail || customer.email || null
        customerName = customerName || customer.name || null
        customerPhone = customerPhone || customer.phone || null
        customerCountry = customer.address?.country ?? null
      }
    } catch {
      // ignora
    }
  }

  if (!customerEmail) return // Utmify exige email — sem isso o webhook é descartado

  // Reconstitui items do metadata (mesmo formato usado em handlePaymentIntentSucceeded)
  type Item = { key: string; name: string; price: number; qty: number }
  let items: Item[] = []
  try {
    const parsed = JSON.parse(pi.metadata?.items || "[]") as Array<{ key: string; price: number }>
    items = parsed.map((p) => ({
      key: p.key,
      name: p.key === "front" ? "Los 144000" : p.key,
      price: p.price,
      qty: 1,
    }))
  } catch {
    items = [{ key: "front", name: "Los 144000", price: pi.amount / 100, qty: 1 }]
  }

  // Sempre em USD (Utmify converte USD→BRL no painel)
  const usdCents = parseInt(pi.metadata?.total_usd_cents || "", 10) || pi.amount
  const utmifyCurrency = pi.metadata?.total_usd_cents ? "usd" : pi.currency

  const utmifyOrder = buildUtmifyOrder({
    paymentIntentId: pi.id,
    amountInCents: usdCents,
    currency: utmifyCurrency,
    createdAt: pi.created,
    approvedDate: null,
    refundedAt: null,
    status: "refused",
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      country: customerCountry,
    },
    items,
    utm: extractUtm(pi.metadata),
  })
  if (utmifyOrder) await sendOrderToUtmify(utmifyOrder)
}

/**
 * Cliente abriu disputa (chargeback). Marca venda como chargedback no Utmify e
 * revoga acesso via revoked_products (cliente perdeu direito ao produto).
 */
async function handleChargeDisputeCreated(stripe: Stripe, dispute: Stripe.Dispute) {
  const piId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id
  if (!piId) return

  const supabase = getSupabaseAdmin()

  // Busca a venda original pra ter dados do cliente + items
  const { data: sale } = await supabase
    .from("stripe_sales")
    .select("customer_email, customer_name, customer_phone, sale_type, items, amount_total, currency, utm")
    .eq("stripe_payment_intent_id", piId)
    .limit(1)
    .single()

  // Atualiza status no Supabase (informativo — não bloqueia processamento Utmify)
  await supabase
    .from("stripe_sales")
    .update({ status: "chargedback" })
    .eq("stripe_payment_intent_id", piId)

  type Item = { key: string; name: string; price: number; qty: number }
  const saleData = sale as {
    customer_email?: string
    customer_name?: string
    customer_phone?: string
    sale_type?: string
    items?: Item[]
    amount_total?: number
    currency?: string
    utm?: Record<string, string> | null
  } | null

  if (!saleData?.items || saleData.items.length === 0) return

  // Chargeback = cliente perdeu o produto. Revoga acesso via revoked_products.
  const productKeys = saleData.items.map((it) => it.key)

  if (saleData.customer_email) {
    await revokeAccessByTransaction({
      email: saleData.customer_email,
      productKeys,
      reason: "dispute",
      source: "stripe",
      sourceRef: piId,
      isFrontSale: saleData.sale_type === "front",
    })
  }

  // Utmify: marca venda como chargedback. Busca total_usd_cents do PI original pra mandar em USD.
  let cbUsdCents = saleData.amount_total || dispute.amount
  let cbCurrency = saleData.currency || dispute.currency
  try {
    const originalPi = await stripe.paymentIntents.retrieve(piId)
    const usdMeta = parseInt(originalPi.metadata?.total_usd_cents || "", 10)
    if (usdMeta > 0) {
      cbUsdCents = usdMeta
      cbCurrency = "usd"
    }
  } catch {
    // mantém fallback
  }

  const cbItems = buildUtmifyItemsForReport(saleData.items, saleData.sale_type, cbUsdCents)

  const utmifyOrder = buildUtmifyOrder({
    paymentIntentId: piId,
    amountInCents: cbUsdCents,
    currency: cbCurrency,
    createdAt: dispute.created,
    approvedDate: dispute.created,
    refundedAt: Date.now() / 1000,
    status: "chargedback",
    customer: {
      name: saleData.customer_name || null,
      email: saleData.customer_email || null,
      phone: saleData.customer_phone || null,
      country: null,
    },
    items: cbItems,
    utm: saleData.utm || null,
  })
  if (utmifyOrder) await sendOrderToUtmify(utmifyOrder)
}

// Map de key → nome de produto pro content_name do Meta CAPI.
// Mantém em sync com /api/webhook/purchase-relay (nameForKey).
function nameForProductKey(key: string): string {
  const clean = key.replace(/__downsell$/, "")
  if (clean === "front") return "Los 144000"
  if (clean === "creativos") return "Producto 1"
  if (clean === "andromeda") return "Producto 2"
  if (clean === "analytics") return "Producto 3"
  if (clean === "revisao") return "Servicio Premium"
  if (clean === "minivsl") return "Upsell 1"
  return clean
}

// Envia Purchase event server-side pro webhook externo de tracking.
// Mesmo payload do /api/webhook/purchase-relay (client-side) — redundância pra
// garantir conversão no destino mesmo se cliente fechar página, ad blocker bloquear,
// ou erro de JS quebrar o relay client-side. event_id usa piId pra deduplicar.
//
// Cada chamada grava resultado em purchase_webhook_log (sucesso, falha ou erro)
// pra auditoria histórica e replay manual de falhas.
async function sendPurchaseWebhook(params: {
  piId: string
  saleType: string
  customerEmail: string | null
  customerName: string | null
  customerPhone: string | null
  customerCountry: string | null
  itemKeys: string[]
  totalUsdCents: number
  fallbackAmountCents: number
  fallbackCurrency: string
  metadata: Stripe.Metadata
}): Promise<void> {
  // Monta payload (sempre, fora do try/fetch — pra logar mesmo em caso de exception)
  const nameParts = (params.customerName || "").trim().split(/\s+/)
  const fn = (nameParts[0] || "").toLowerCase()
  const ln = (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "").toLowerCase()
  const cleanKeys = params.itemKeys.length > 0 ? params.itemKeys : ["front"]
  const itemNames = cleanKeys.map(nameForProductKey)
  const usdValue = params.totalUsdCents > 0 ? params.totalUsdCents / 100 : params.fallbackAmountCents / 100
  const currency = params.totalUsdCents > 0 ? "USD" : params.fallbackCurrency.toUpperCase()
  const now = new Date()
  const payload = {
    fn,
    ln,
    em: (params.customerEmail || "").toLowerCase().trim(),
    ph: (params.customerPhone || "").replace(/\D/g, ""),
    ct: "",
    st: "",
    zp: "",
    country: (params.customerCountry || "").toUpperCase(),
    external_id: (params.customerEmail || "").toLowerCase().trim(),
    event_name: "Purchase",
    event_id: params.piId,
    event_source_url: `https://SEU_DOMINIO.com/checkout/gracias?payment_intent=${params.piId}`,
    event_date: now.toISOString().slice(0, 10),
    event_time: now.toISOString().slice(11, 19),
    action_source: "website",
    currency,
    value: usdValue,
    content_name: itemNames.join(" + ") || "Los 144000",
    content_type: "product",
    num_items: cleanKeys.length || 1,
    payment_method: "credit_card",
    sale_type: params.saleType,
    client_ip_address: "",
    client_user_agent: "",
    fbp: params.metadata.fbp || "",
    fbc: params.metadata.fbc || "",
    utm_source: params.metadata.utm_source || "",
    utm_medium: params.metadata.utm_medium || "",
    utm_campaign: params.metadata.utm_campaign || "",
    utm_content: params.metadata.utm_content || "",
    utm_term: params.metadata.utm_term || "",
  }

  let status: "success" | "failed" | "error" = "error"
  let statusCode: number | null = null
  let responseBody: string | null = null
  let errorMessage: string | null = null

  try {
    const res = await fetch("https://SEU_TRACKING_WEBHOOK.com/webhook/purchaseinsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    statusCode = res.status
    if (!res.ok) {
      const errBody = await res.text().catch(() => "")
      responseBody = errBody.slice(0, 500)
      status = "failed"
      console.error(`[webhook] Purchase webhook falhou ${res.status} sale_type=${params.saleType} pi=${params.piId}: ${errBody.slice(0, 200)}`)
    } else {
      status = "success"
      console.log(`[webhook] Purchase webhook enviado OK sale_type=${params.saleType} pi=${params.piId} value=${usdValue} ${currency}`)
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "unknown"
    console.error(`[webhook] Purchase webhook error sale_type=${params.saleType} pi=${params.piId}: ${errorMessage}`)
  }

  // Grava log no Supabase pra auditoria histórica + replay (fail-open: erro aqui não bloqueia webhook do Stripe)
  try {
    const supabase = getSupabaseAdmin()
    await supabase.from("purchase_webhook_log").insert({
      payment_intent_id: params.piId,
      sale_type: params.saleType,
      status,
      status_code: statusCode,
      response_body: responseBody,
      error_message: errorMessage,
      payload,
    })
  } catch (e) {
    console.warn("[webhook] purchase_webhook_log insert falhou:", e instanceof Error ? e.message : e)
  }
}

function extractUtm(metadata: Stripe.Metadata | null | undefined): Record<string, string> | null {
  if (!metadata) return null
  const utm: Record<string, string> = {}
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"]
  for (const k of keys) {
    if (metadata[k]) utm[k] = metadata[k]
  }
  return Object.keys(utm).length > 0 ? utm : null
}

// charge.dispute.closed → cliente ganhou (won) ou perdeu (lost) a disputa.
// Se status='won' OU 'warning_closed' = cliente desistiu/perdeu → restaura acesso
// (a venda volta a ser válida — cliente cancelou o protesto).
async function handleChargeDisputeClosed(dispute: Stripe.Dispute) {
  const piId = typeof dispute.payment_intent === "string"
    ? dispute.payment_intent
    : dispute.payment_intent?.id
  if (!piId) return

  // status: won (cliente ganhou) | lost (cliente perdeu) | warning_closed | charge_refunded
  // "won" pra Stripe = produtor ganhou a disputa = cliente perdeu o protesto.
  // Restauramos acesso quando "won" (produtor manteve o dinheiro, cliente continua dono).
  if (dispute.status !== "won" && dispute.status !== "warning_closed") {
    return
  }

  const supabase = getSupabaseAdmin()
  const { data: sale } = await supabase
    .from("stripe_sales")
    .select("customer_email")
    .eq("stripe_payment_intent_id", piId)
    .limit(1)
    .single()

  const email = (sale as { customer_email?: string } | null)?.customer_email
  if (!email) return

  const result = await restoreAccessByTransaction({
    email,
    sourceRef: piId,
    source: "stripe",
  })
  console.log(`[stripe-webhook] dispute.closed status=${dispute.status} — restaurado:`, result)
}

// charge.refund.updated → status do refund mudou. Se foi "canceled" (refund
// cancelado pelo produtor antes de ser processado), restaura acesso.
async function handleChargeRefundUpdated(refund: Stripe.Refund) {
  const piId = typeof refund.payment_intent === "string"
    ? refund.payment_intent
    : refund.payment_intent?.id
  if (!piId) return
  if (refund.status !== "canceled") return

  const supabase = getSupabaseAdmin()
  const { data: sale } = await supabase
    .from("stripe_sales")
    .select("customer_email")
    .eq("stripe_payment_intent_id", piId)
    .limit(1)
    .single()

  const email = (sale as { customer_email?: string } | null)?.customer_email
  if (!email) return

  const result = await restoreAccessByTransaction({
    email,
    sourceRef: piId,
    source: "stripe",
  })
  console.log(`[stripe-webhook] refund.canceled — restaurado:`, result)
}
