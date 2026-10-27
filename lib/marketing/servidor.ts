// CENTRO DE ORGANIZACIÓN — la puerta y el vocabulario.
//
// ── DOS PERMISOS, NO UNO ───────────────────────────────────────────────────
// Entrar aquí lo puede hacer cualquier administrador: Regi organiza, crea,
// edita, marca y registra. Eso es casi todo.
//
// Lo que NO puede hacer es aprobar guiones ni cambiar las frecuencias
// acordadas. Para eso está `es_propietario`, que es de una sola persona.
//
// ── POR QUÉ SE COMPRUEBA EN EL SERVIDOR Y NO EN EL BOTÓN ──────────────────
// Un botón escondido se salta con una petición a mano. La pantalla puede
// apagar un botón para que sea cómodo hacerlo bien; quien decide si se puede
// es esto.

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import type { User } from "@supabase/supabase-js"

export type Permiso = { user: User; esPropietario: boolean }

/**
 * Deja pasar a administración, y dice si además es el dueño.
 *
 * Devuelve una respuesta ya hecha cuando no se puede pasar, para que quien
 * llama no tenga que recordar qué código devolver en cada caso.
 */
export async function exigirMarketing(): Promise<Permiso | { respuesta: NextResponse }> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { respuesta: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  }
  if (!isAdmin(user)) {
    return { respuesta: NextResponse.json({ error: "Prohibido" }, { status: 403 }) }
  }

  // ── POR QUÉ ESTO SE LEE DE `profiles` Y NO DEL TOKEN ────────────────────
  // `is_admin` vive en el token y por eso no hace falta consultarlo. Esto no:
  // vive en una tabla, y se lee en cada petición. Es un viaje más, pero
  // significa que quitarle el permiso a alguien tiene efecto inmediato en vez
  // de esperar a que caduque su sesión.
  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("es_propietario")
    .eq("id", user.id)
    .maybeSingle()

  return { user, esPropietario: data?.es_propietario === true }
}

// Lo de siempre, desde su sitio: las rutas siguen importando de aquí.
export * from "./reglas"
