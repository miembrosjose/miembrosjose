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
  AlertTriangle, Check, Eye, Monitor, RefreshCw, Smartphone, X,
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
