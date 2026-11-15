"use client"

// ═══════════════════════════════════════════════════════════════════════════
//  POR QUÉ NO SALE LA VENTANA DE INSTALACIÓN
// ═══════════════════════════════════════════════════════════════════════════
//
// ── EL PROBLEMA QUE RESUELVE ───────────────────────────────────────────────
// La invitación a instalar tiene seis condiciones y tres plazos, y cuando no
// aparece no dice por qué. Averiguarlo exigía abrir la consola del navegador,
// conocer el formato de las claves de almacenamiento y traducir marcas de
// tiempo a mano. En un teléfono, directamente no se podía.
//
// Esto lo enseña: cada condición, su valor ahora mismo, y cuál es la que está
// frenando.
//
// ── NO ESCRIBE NADA ────────────────────────────────────────────────────────
// Ni cuenta la visita, ni aplaza, ni marca nada. Un diagnóstico que cambia lo
// que mide no es un diagnóstico: abrir esta pantalla para ver por qué no sale
// la ventana acabaría siendo el motivo de que salga.
//
// La simulación tampoco. Abre la ventana de verdad —la misma, no una copia—
// pero cerrarla NO cuenta como «ahora no»: no escribe los 21 días. Así se
// puede mirar diez veces seguidas sin gastar el plazo ni perder el estado que
// se está diagnosticando.
//
// ── POR QUÉ MIDE ESTE DISPOSITIVO Y NO OTRO ────────────────────────────────
// Porque no hay otra forma. Todo esto vive en el almacenamiento local del
// navegador, así que lo que se ve aquí es lo de ESTE aparato con ESTA cuenta.
// No hay manera de consultar el estado del teléfono de otra persona, y es
// deliberado: nada de esto viaja al servidor.

import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle, Bell, Check, Eye, Loader2, Monitor, RefreshCw, Search,
  Smartphone, X,
} from "lucide-react"
import { useAuth } from "../../_lib/auth-context"
import { usePwa } from "../../_lib/pwa-contexto"
import { queNavegador, type Navegador } from "../../_lib/navegador"
import { HojaInstalacion } from "../../_components/HojaInstalacion"
import {
  PLAZOS, clavesDe, instalacionSilenciada, inviteQueToca, leerEstadoGuardado,
  tarjetaSilenciada, visitasSuficientes, type EstadoGuardado,
} from "@/lib/pwa/reglas"

const NOMBRE_NAVEGADOR: Record<Navegador, string> = {
  safari: "Safari",
  "chrome-ios": "Chrome para iOS",
  "otro-ios": "Otro navegador de iOS",
  chrome: "Chrome",
  samsung: "Samsung Internet",
  firefox: "Firefox",
  edge: "Edge",
  otro: "No identificado",
}

function fecha(ms: number): string {
  if (!ms) return "—"
  const d = new Date(ms)
  if (!Number.isFinite(d.getTime())) return "—"
  return d.toLocaleString("es-419", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function enCuantoTiempo(ms: number): string {
  const faltan = ms - Date.now()
  if (faltan <= 0) return "ya pasó"
  const dias = Math.floor(faltan / (24 * 60 * 60 * 1000))
  if (dias >= 1) return `faltan ${dias} día${dias === 1 ? "" : "s"}`
  const horas = Math.ceil(faltan / (60 * 60 * 1000))
  return `faltan ${horas} hora${horas === 1 ? "" : "s"}`
}

/** Una condición, con su veredicto. */
function Condicion({ pasa, titulo, detalle, bloquea }: {
  pasa: boolean
  titulo: string
  detalle: string
  /** `true` si no pasarla impide que salga la ventana de instalación. */
  bloquea: boolean
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#14141e] py-3 last:border-0">
      <span className={`mt-0.5 shrink-0 ${pasa ? "text-emerald-400" : bloquea ? "text-[#c9a86b]" : "text-[#5a5a6a]"}`}>
        {pasa ? <Check size={14} /> : <X size={14} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-[#F3F6FA]">{titulo}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[#8a8fa8]">{detalle}</p>
      </div>
    </div>
  )
}

export function DiagnosticoPwa() {
  const { user } = useAuth()
  const { aparato, instalada, puedeInstalarSola, listo } = usePwa()
  const [navegador, setNavegador] = useState<Navegador>("otro")
  const [guardado, setGuardado] = useState<EstadoGuardado | null>(null)
  const [simulando, setSimulando] = useState(false)

  const mirar = useCallback(() => {
    if (!user?.id) return
    setNavegador(queNavegador())
    setGuardado(leerEstadoGuardado(user.id))
  }, [user?.id])

  useEffect(() => { mirar() }, [mirar])

  if (!user?.id || !guardado || !listo) {
    return <p className="text-sm text-[#7a7a8a]">Leyendo el estado de este dispositivo…</p>
  }

  const bastantesVisitas = visitasSuficientes(user.id)
  const callada = instalacionSilenciada(user.id)
  const esEscritorio = aparato === "escritorio"

  const toca = inviteQueToca({
    userId: user.id,
    puedeInstalar: !instalada && !esEscritorio,
    // Para el veredicto se asume que los avisos se podrían ofrecer: aquí se
    // está diagnosticando la ventana de instalación, no la tarjeta.
    puedeActivarAvisos: true,
  })

  // El primer motivo que frena, en el mismo orden en que los comprueba
  // `InvitarAInstalar`. Decir solo el primero y no los cuatro es lo que
  // convierte una lista en una respuesta.
  const frena =
    instalada ? "Ya está instalada en este dispositivo."
    : esEscritorio ? "Es un ordenador: la ventana no se ofrece aquí."
    : !bastantesVisitas ? `Van ${guardado.visitas} visita${guardado.visitas === 1 ? "" : "s"} y hacen falta ${PLAZOS.visitasAntesDeInvitar}.`
    : callada ? `Se aplazó: ${enCuantoTiempo(guardado.instalarHasta)}.`
    : null

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-[#F3F6FA] [font-family:var(--font-cinzel,serif)]">
          Ventana de instalación
        </h2>
        <p className="mt-1 max-w-xl text-sm text-[#8a8fa8]">
          Por qué sale o no sale en <strong className="text-[#c3b2e0]">este</strong> dispositivo,
          con esta cuenta. No se puede consultar el de otra persona: todo esto vive en el
          almacenamiento del navegador y nada viaja al servidor.
        </p>
      </header>

      {/* ── EL VEREDICTO, LO PRIMERO ───────────────────────────────────── */}
      <section className={`border p-4 ${frena ? "border-[#3a2a1a] bg-[#1a1208]/50" : "border-emerald-900 bg-emerald-950/20"}`}>
        <div className="flex items-start gap-3">
          {frena
            ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#e6cf95]" />
            : <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />}
          <div>
            <p className="text-sm font-medium text-[#F3F6FA]">
              {frena ? "No va a salir sola" : "Saldría sola"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#a8a8c0]">
              {frena ?? `Se abriría ${PLAZOS.esperaDentroMs / 1000} segundos después de entrar en el área de miembros.`}
            </p>
            {!frena && toca !== "instalar" && (
              <p className="mt-2 text-xs leading-relaxed text-[#c9a86b]">
                Pero la prioridad dice «{toca}»: si toca otra invitación, esta espera.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── QUÉ APARATO Y QUÉ NAVEGADOR ───────────────────────────────── */}
      <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
          Lo que ve la plataforma
        </h3>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">Aparato</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-[#F3F6FA]">
              {esEscritorio ? <Monitor size={13} /> : <Smartphone size={13} />}
              {aparato}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">Navegador</dt>
            <dd className="mt-1 text-[#F3F6FA]">{NOMBRE_NAVEGADOR[navegador]}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">Instalada</dt>
            <dd className="mt-1 text-[#F3F6FA]">{instalada ? "Sí" : "No"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.15em] text-[#6a6a7a]">Instala sola</dt>
            <dd className="mt-1 text-[#F3F6FA]">{puedeInstalarSola ? "Sí" : "No"}</dd>
          </div>
        </dl>
        <p className="mt-4 border-l-2 border-[#2f2f42] pl-3 text-[11px] leading-relaxed text-[#8a8fa8]">
          <strong className="text-[#c3b2e0]">«Instala sola»</strong> es si el navegador ofreció
          hacerlo él —solo lo hacen los de la familia de Chrome, incluido Samsung Internet—. Si
          dice que no, la ventana enseña los pasos a mano en vez de un botón que no instalaría
          nada.
        </p>
      </section>

      {/* ── LAS CONDICIONES, UNA A UNA ────────────────────────────────── */}
      <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
            Las condiciones
          </h3>
          <button
            type="button"
            onClick={mirar}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#7a7a8a] transition-colors hover:text-[#F3F6FA]"
          >
            <RefreshCw size={12} /> Volver a leer
          </button>
        </div>

        <div className="mt-3">
          <Condicion
            pasa={!instalada}
            bloquea
            titulo="No está instalada"
            detalle={instalada
              ? "Se está usando desde el icono. No hay nada que ofrecer."
              : "Se está usando desde el navegador."}
          />
          <Condicion
            pasa={!esEscritorio}
            bloquea
            titulo="Es un móvil o una tableta"
            detalle={esEscritorio
              ? "En un ordenador no se ofrece: la plataforma ya está en una pestaña."
              : `Detectado como «${aparato}».`}
          />
          <Condicion
            pasa={bastantesVisitas}
            bloquea
            titulo={`Al menos ${PLAZOS.visitasAntesDeInvitar} visitas`}
            detalle={`Van ${guardado.visitas}. Se cuenta una por carga del área de miembros, no por sección.`}
          />
          <Condicion
            pasa={!callada}
            bloquea
            titulo="No está aplazada"
            detalle={callada
              ? `Callada hasta el ${fecha(guardado.instalarHasta)} (${enCuantoTiempo(guardado.instalarHasta)}).`
              : guardado.negativas > 0
                ? `Se aplazó ${guardado.negativas} vez/veces, pero el plazo ya pasó.`
                : "Nunca se ha dicho «ahora no» en este dispositivo."}
          />
          <Condicion
            pasa
            bloquea={false}
            titulo={`Espera de ${PLAZOS.esperaDentroMs / 1000} segundos`}
            detalle="Se cuenta desde que carga el área de miembros. No bloquea: solo retrasa."
          />
        </div>
      </section>

      {/* ── LOS PLAZOS Y LO GUARDADO ──────────────────────────────────── */}
      <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
          Lo guardado en este navegador
        </h3>
        <dl className="mt-4 space-y-2 text-xs">
          {[
            ["Visitas contadas", String(guardado.visitas)],
            ["Veces que se dijo «ahora no»", String(guardado.negativas)],
            ["Instalación callada hasta", fecha(guardado.instalarHasta)],
            ["Tarjeta de avisos callada hasta", fecha(guardado.tarjetaHasta)],
            ["Avisos apagados a propósito", guardado.pushApagado ? fecha(guardado.pushApagado) : "No"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-b border-[#14141e] pb-2 last:border-0">
              <dt className="text-[#8a8fa8]">{k}</dt>
              <dd className="text-right text-[#F3F6FA]">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-[11px] leading-relaxed text-[#6a6a7a]">
          Plazos vigentes: {PLAZOS.instalacionPrimeraNegativaMs / 86400000} días tras el primer
          «ahora no», {PLAZOS.instalacionSegundaNegativaMs / 86400000} a partir del segundo,{" "}
          {PLAZOS.tarjetaCerradaMs / 86400000} al cerrar la tarjeta de avisos. Si se instala, no
          vuelve a ofrecerse nunca.
        </p>

        <details className="mt-4">
          <summary className="cursor-pointer text-[11px] text-[#7a7a8a] transition-colors hover:text-[#F3F6FA]">
            Las claves exactas, para borrarlas desde la consola
          </summary>
          <pre className="mt-2 overflow-x-auto border border-[#14141e] bg-[#07070f] p-3 text-[10px] leading-relaxed text-[#8a8fa8]">
{clavesDe(user.id).join("\n")}
          </pre>
          <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a7a]">
            Llevan el identificador de la cuenta dentro, así que borrarlas no toca a nadie más.
            Nunca uses <code className="text-[#c3b2e0]">localStorage.clear()</code>: eso se lleva
            también otras preferencias de este navegador.
          </p>
        </details>
      </section>

      {/* ── LA SIMULACIÓN ─────────────────────────────────────────────── */}
      <section className="border border-[#1a1a24] bg-[#0d0d16]/40 p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bca]">
          Verla ahora
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[#8a8fa8]">
          Abre la ventana de verdad —la misma que ve un miembro, con las instrucciones de este
          navegador— saltándose las visitas, la espera y el aplazamiento.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#8a8fa8]">
          Cerrarla <strong className="text-[#c3b2e0]">no</strong> cuenta como «ahora no»: no
          escribe el aplazamiento, así que se puede mirar las veces que haga falta sin gastar el
          plazo ni estropear lo que se está diagnosticando.
        </p>
        <button
          type="button"
          onClick={() => setSimulando(true)}
          className="mt-4 inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30"
        >
          <Eye size={13} /> Simular la aparición
        </button>
      </section>

      <PruebaDeAviso />

      <PorQueNoLeLlegan />

      {simulando && (
        <HojaInstalacion
          onCerrar={() => { setSimulando(false); mirar() }}
          // Sin `onInstalada`: si se instala de verdad, el contexto ya anota lo
          // suyo. Aquí no hay nada que añadir.
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  MANDARME UNA NOTIFICACIÓN A MÍ MISMO
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ HACE FALTA ESTO ───────────────────────────────────────────────
// El 12 de noviembre de 2026 salieron 82 notificaciones, el servicio de Apple
// y de Google las aceptó todas —201— y no apareció ninguna en ningún
// teléfono. Desde el servidor todo se veía perfecto: la firma, el cifrado, el
// plazo de entrega. El tramo que faltaba por mirar es el único que no deja
// rastro en la base: lo que el móvil hace con el aviso cuando le llega.
//
// Para mirar ese tramo hay que poder probar DESDE el móvil, una vez tras
// otra, cambiando cosas del teléfono entre intento e intento. Con un envío a
// toda la plataforma eso no se puede hacer.
//
// La ruta ya existía desde la fase de push y nunca tuvo botón. Manda solo a
// los dispositivos de quien pulsa, y solo si es administración.
function PruebaDeAviso() {
  const [estado, setEstado] = useState<"quieto" | "enviando">("quieto")
  const [resultado, setResultado] = useState<string | null>(null)
  const [bien, setBien] = useState(false)

  async function mandar() {
    setEstado("enviando")
    setResultado(null)
    try {
      const r = await fetch("/api/admin/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "Prueba de aviso",
          // La hora va dentro a propósito: si llegan dos, se distingue cuál
          // es cuál, y si llega una vieja se nota que es vieja.
          body: `Mandada a las ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}.`,
        }),
      })
      const j = (await r.json()) as {
        ok?: boolean
        mensaje?: string
        dispositivos?: number
        entregados?: number
        fallidos?: number
        retiradas?: number
        error?: string
      }

      if (j.error) { setBien(false); setResultado(j.error); return }
      if (j.mensaje) { setBien(false); setResultado(j.mensaje); return }

      setBien(Boolean(j.ok))
      setResultado(
        `Dispositivos con esta cuenta: ${j.dispositivos ?? 0}. ` +
        `Aceptados por el servicio: ${j.entregados ?? 0}. ` +
        `Fallidos: ${j.fallidos ?? 0}. ` +
        `Retirados por muertos: ${j.retiradas ?? 0}.`,
      )
    } catch {
      setBien(false)
      setResultado("No se pudo llamar al servidor.")
    } finally {
      setEstado("quieto")
    }
  }

  return (
    <section className="border border-[#1a1a24] bg-[#0b0b12] p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
        <Bell size={14} className="text-[#a78bca]" /> Mandarme un aviso de prueba
      </h3>
      <p className="mt-2 text-[12px] leading-relaxed text-[#8a8fa8] [font-family:var(--font-geist-sans)]">
        Va solo a tus dispositivos. Nadie más lo recibe.
      </p>

      <button
        type="button"
        onClick={() => void mandar()}
        disabled={estado === "enviando"}
        className="mt-4 inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30 disabled:opacity-50"
      >
        <Bell size={13} /> {estado === "enviando" ? "Mandando…" : "Mandarme uno ahora"}
      </button>

      {resultado && (
        <div
          role="status"
          className={`mt-4 border-l-2 pl-3 text-[12px] leading-relaxed ${
            bien ? "border-[#6D4A9B] text-[#c3b2e0]" : "border-[#8a5a5a] text-[#d0a0a0]"
          } [font-family:var(--font-geist-sans)]`}
        >
          {resultado}
          {bien && (
            <p className="mt-2 text-[#8a8fa8]">
              El servicio lo aceptó. Si no aparece en el móvil en un minuto, el
              problema está en el teléfono: permisos del sistema para la
              aplicación, modo concentración, o la app abierta en primer plano.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  POR QUÉ A ESTA PERSONA NO LE LLEGAN
// ═══════════════════════════════════════════════════════════════════════════
//
// ── POR QUÉ ESTÁ AQUÍ ─────────────────────────────────────────────────────
// Todo lo de arriba mide ESTE dispositivo con ESTA cuenta, que es lo único
// que se puede medir desde el navegador. Y eso deja fuera el caso que más
// duele: alguien dice que no le llegan, y desde aquí no hay nada que mirar.
//
// Pasó con una administradora. Tenía la aplicación instalada, los avisos
// activados y su teléfono en silencio durante días. Los envíos salían bien,
// el servicio los aceptaba, y nadie podía ver que sus suscripciones estaban
// muertas: ella seguía leyendo «activados» en su pantalla.
//
// Las suscripciones SÍ viven en el servidor —son la dirección a la que se
// manda— y cada envío deja su resultado escrito. Estaba todo guardado y no se
// enseñaba en ninguna parte.
//
// ── LO QUE SE PUEDE Y LO QUE NO ───────────────────────────────────────────
// Se puede ver: cuántos dispositivos tiene, cuáles están apagados y por qué,
// qué ha apagado en sus preferencias, y cómo acabaron sus últimos avisos.
//
// No se puede ver: si tiene el teléfono en modo concentración, o si le quitó
// el permiso a la aplicación en los ajustes del sistema. Eso no sale del
// aparato. Cuando el servidor dice que todo está bien, lo que queda es eso, y
// el veredicto lo dice con esas palabras en vez de dejarlo en el aire.
function PorQueNoLeLlegan() {
  const [correo, setCorreo] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dato, setDato] = useState<Diagnostico | null>(null)

  type Diagnostico = {
    encontrada: boolean
    persona?: { nombre: string; correo: string }
    apagados?: string[]
    dispositivos?: Array<{
      aparato: string
      activa: boolean
      motivo: string | null
      creado: string | null
      ultimoUso: string | null
    }>
    envios?: Array<{
      cuando: string
      categoria: string | null
      titulo: string | null
      resultado: string | null
      http: number | null
    }>
    veredicto: string
  }

  async function mirar() {
    const c = correo.trim()
    if (!c) return
    setCargando(true); setError(null); setDato(null)
    try {
      const r = await fetch(`/api/admin/push/persona?correo=${encodeURIComponent(c)}`, {
        credentials: "include",
      })
      const j = (await r.json()) as Diagnostico & { error?: string }
      if (!r.ok) { setError(j.error || "No se pudo consultar."); return }
      setDato(j)
    } catch {
      setError("No se pudo llamar al servidor.")
    } finally {
      setCargando(false)
    }
  }

  function cuando(iso: string | null): string {
    if (!iso) return "—"
    const d = new Date(iso)
    if (!Number.isFinite(d.getTime())) return "—"
    return d.toLocaleString("es-419", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    })
  }

  const MOTIVOS: Record<string, string> = {
    gone: "el servicio dijo que ya no existe",
    rotada: "el navegador la cambió por otra",
    revocada: "los apagó a propósito",
  }

  return (
    <section className="border border-[#1a1a24] bg-[#0b0b12] p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#F3F6FA] [font-family:var(--font-geist-sans)]">
        <Search size={14} className="text-[#a78bca]" /> Por qué a alguien no le llegan
      </h3>
      <p className="mt-2 text-[12px] leading-relaxed text-[#8a8fa8] [font-family:var(--font-geist-sans)]">
        Escribe su correo. Dice cuántos dispositivos tiene, cuáles están
        apagados y por qué, y cómo acabaron sus últimos avisos. Solo lee: no le
        manda nada ni cambia nada suyo.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void mirar() }}
          placeholder="alguien@ejemplo.com"
          className="min-w-0 flex-1 border border-[#2f2f42] bg-[#0d0d16] px-3 py-2.5 text-[13px] text-[#F3F6FA] placeholder:text-[#4a4a5a] focus:border-[#6D4A9B] focus:outline-none [font-family:var(--font-geist-sans)]"
        />
        <button
          type="button"
          onClick={() => void mirar()}
          disabled={cargando || !correo.trim()}
          className="inline-flex items-center gap-2 border border-[#6D4A9B] bg-[#6D4A9B]/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c3b2e0] transition-colors hover:bg-[#6D4A9B]/30 disabled:opacity-40"
        >
          {cargando ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          {cargando ? "Mirando…" : "Mirar"}
        </button>
      </div>

      {error && (
        <p className="mt-3 border-l-2 border-[#8a5a5a] pl-3 text-[12px] text-[#d0a0a0] [font-family:var(--font-geist-sans)]">
          {error}
        </p>
      )}

      {dato && (
        <div className="mt-5 space-y-4 [font-family:var(--font-geist-sans)]">
          {/* El veredicto va PRIMERO y en grande. Los datos están debajo para
              quien quiera comprobarlo, pero la respuesta no se esconde entre
              ellos: quien abre esto no sabe qué columna mirar. */}
          <div className="border-l-2 border-[#6D4A9B] bg-[#6D4A9B]/5 py-2 pl-3 text-[13px] leading-relaxed text-[#c3b2e0]">
            {dato.veredicto}
          </div>

          {dato.encontrada && dato.persona && (
            <p className="text-[12px] text-[#8a8fa8]">
              {dato.persona.nombre} · {dato.persona.correo}
            </p>
          )}

          {dato.dispositivos && dato.dispositivos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6a6a7a]">
                Sus dispositivos
              </p>
              <ul className="mt-2 space-y-1.5">
                {dato.dispositivos.map((d, i) => (
                  <li
                    key={i}
                    className={`flex flex-wrap items-baseline gap-x-2 border-l-2 pl-3 text-[12px] ${
                      d.activa ? "border-emerald-800 text-[#a0a0b0]" : "border-[#2f2f42] text-[#6a6a7a]"
                    }`}
                  >
                    <span className={d.activa ? "text-[#F3F6FA]" : undefined}>{d.aparato}</span>
                    <span>
                      {d.activa
                        ? "· activo"
                        : `· apagado (${d.motivo ? MOTIVOS[d.motivo] ?? d.motivo : "sin motivo apuntado"})`}
                    </span>
                    <span className="text-[11px]">· último uso {cuando(d.ultimoUso)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dato.envios && dato.envios.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6a6a7a]">
                Sus últimos avisos
              </p>
              <ul className="mt-2 space-y-1">
                {dato.envios.map((e, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-[12px] text-[#8a8fa8]">
                    <span className="text-[#a0a0b0]">{cuando(e.cuando)}</span>
                    <span
                      className={
                        e.resultado === "ok"
                          ? "text-emerald-400"
                          : e.resultado === "gone"
                            ? "text-[#d0a0a0]"
                            : "text-[#e0864a]"
                      }
                    >
                      {e.resultado === "ok"
                        ? "aceptado"
                        : e.resultado === "gone"
                          ? "dispositivo muerto"
                          : `falló${e.http ? ` (${e.http})` : ""}`}
                    </span>
                    <span className="min-w-0 truncate">{e.titulo || e.categoria || "—"}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] leading-relaxed text-[#6a6a7a]">
                «Aceptado» es el servicio de Apple o de Google diciendo que se lo
                queda. No es que haya aparecido en la pantalla: eso ocurre en el
                teléfono y no deja rastro en ninguna parte.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
