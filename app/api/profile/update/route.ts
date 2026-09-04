// API — atualiza dados de perfil do user.
//
// PATCH /api/profile/update
//   Body opcional (qualquer combinação dos campos abaixo):
//     full_name, username, bio, niche, instagram, instagram_url
//   Salva em user.user_metadata.
//   Valida username uniqueness (case-insensitive) via auth.admin.listUsers.
//
//   instagram      → handle visual (@tucuenta) — só pra display
//   instagram_url  → link real pra abrir no clique (pode ser instagram.com/X
//                    ou qualquer URL que o user queira)

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Limites de campos
const NAME_MIN = 2, NAME_MAX = 60
const USERNAME_MIN = 3, USERNAME_MAX = 30
const BIO_MAX = 500
const NICHE_MAX = 80
const IG_MAX = 30
const URL_MAX = 500

// @username: a-z, 0-9, _, . (sem @ — armazenado puro)
const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/
const INSTAGRAM_REGEX = /^[a-zA-Z0-9_.]{1,30}$/

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: {
    full_name?: string
    username?: string
    bio?: string
    niche?: string
    instagram?: string
    instagram_url?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const update: Record<string, string | null> = {}

  // ── full_name ────────────────────────────────────────────────────────────
  if (typeof body.full_name === "string") {
    const v = body.full_name.trim()
    if (v.length < NAME_MIN || v.length > NAME_MAX) {
      return NextResponse.json({ error: `Nombre debe tener ${NAME_MIN}-${NAME_MAX} caracteres` }, { status: 400 })
    }
    update.full_name = v
  }

  // ── username (handle único) ─────────────────────────────────────────────
  if (typeof body.username === "string") {
    const v = body.username.trim().toLowerCase().replace(/^@/, "") // remove @ se vier
    if (v.length === 0) {
      // String vazia = limpar username
      update.username = null
    } else {
      if (v.length < USERNAME_MIN || v.length > USERNAME_MAX) {
        return NextResponse.json({ error: `@username debe tener ${USERNAME_MIN}-${USERNAME_MAX} caracteres` }, { status: 400 })
      }
      if (!USERNAME_REGEX.test(v)) {
        return NextResponse.json({ error: "@username solo puede tener letras minúsculas, números, _ y ." }, { status: 400 })
      }

      // Uniqueness check via auth.admin.listUsers (oficial; .schema("auth")
      // falha silenciosamente em prod — mesma causa do bug 404 /u/[id])
      const currentMeta = (user.user_metadata || {}) as { username?: string }
      if (v !== (currentMeta.username || "").toLowerCase()) {
        const admin = getSupabaseAdmin()
        try {
          const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
          const collision = (listed?.users || []).find((u) => {
            if (u.id === user.id) return false
            const otherMeta = (u.user_metadata || {}) as { username?: string }
            return (otherMeta.username || "").toLowerCase() === v
          })
          if (collision) {
            return NextResponse.json({ error: "@username ya está en uso" }, { status: 409 })
          }
        } catch (e) {
          console.error("[/api/profile/update] uniqueness query error:", e)
          // Não bloqueia salvamento se a verificação falhou (preferimos
          // permitir update e ter colisão rara que falhar todo o save)
        }
      }
      update.username = v
    }
  }

  // ── bio ──────────────────────────────────────────────────────────────────
  if (typeof body.bio === "string") {
    const v = body.bio.trim()
    if (v.length > BIO_MAX) {
      return NextResponse.json({ error: `Bio debe tener máximo ${BIO_MAX} caracteres` }, { status: 400 })
    }
    update.bio = v.length === 0 ? null : v
  }

  // ── niche (nicho profissional) ───────────────────────────────────────────
  if (typeof body.niche === "string") {
    const v = body.niche.trim()
    if (v.length > NICHE_MAX) {
      return NextResponse.json({ error: `Nicho debe tener máximo ${NICHE_MAX} caracteres` }, { status: 400 })
    }
    update.niche = v.length === 0 ? null : v
  }

  // ── instagram (handle visual @, só pra display) ─────────────────────────
  if (typeof body.instagram === "string") {
    const v = body.instagram.trim().replace(/^@/, "")
    if (v.length === 0) {
      update.instagram = null
    } else {
      if (v.length > IG_MAX) {
        return NextResponse.json({ error: `Instagram debe tener máximo ${IG_MAX} caracteres` }, { status: 400 })
      }
      if (!INSTAGRAM_REGEX.test(v)) {
        return NextResponse.json({ error: "Instagram solo puede tener letras, números, _ y ." }, { status: 400 })
      }
      update.instagram = v
    }
  }

  // ── instagram_url (link real do perfil — pode ser instagram.com ou outro) ─
  if (typeof body.instagram_url === "string") {
    const v = body.instagram_url.trim()
    if (v.length === 0) {
      update.instagram_url = null
    } else {
      if (v.length > URL_MAX) {
        return NextResponse.json({ error: `Link debe tener máximo ${URL_MAX} caracteres` }, { status: 400 })
      }
      // Aceita URLs com ou sem protocolo. Adiciona https:// se faltar.
      let normalized = v
      if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized
      try { new URL(normalized) } catch {
        return NextResponse.json({ error: "Link de Instagram inválido" }, { status: 400 })
      }
      update.instagram_url = normalized
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { error } = await supabase.auth.updateUser({ data: update })
  if (error) {
    console.error("[/api/profile/update] update error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  // Cascada a los snapshots de identidad en el foro (y comentarios), igual que
  // featured-badge. Sin esto, los posts/respuestas viejos siguen mostrando el
  // nombre/username anterior. No bloquea la respuesta si algo falla.
  try {
    const admin = getSupabaseAdmin()
    const cascades: PromiseLike<unknown>[] = []
    if (typeof update.full_name === "string") {
      const n = update.full_name
      cascades.push(admin.from("forum_posts").update({ author_name: n }).eq("user_id", user.id))
      cascades.push(admin.from("forum_replies").update({ author_name: n }).eq("user_id", user.id))
      cascades.push(admin.from("episode_comments").update({ author_name: n }).eq("user_id", user.id))
    }
    if ("username" in update) {
      const u = update.username // string | null
      cascades.push(admin.from("forum_posts").update({ author_username: u }).eq("user_id", user.id))
      cascades.push(admin.from("forum_replies").update({ author_username: u }).eq("user_id", user.id))
    }
    if (cascades.length) await Promise.allSettled(cascades)
  } catch (e) {
    console.warn("[/api/profile/update] cascade snapshot falló:", e instanceof Error ? e.message : e)
  }

  return NextResponse.json({ ok: true, updated: update })
}
