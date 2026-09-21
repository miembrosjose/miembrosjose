"use client"

// SOSTENER UNA FUNCIÓN — la invitación que aparece al completar el Camino.
//
// Vive dentro de Los Objetivos de los 144.000 porque es su continuación
// natural: el Objetivo 1 termina diciendo «aquí comienzan los nodos de la
// Red», y las funciones son el cómo de eso. Terminar las cuatro temporadas
// deja de ser un final y pasa a ser una puerta.
//
// SOLO APARECE AL COMPLETAR LAS CUATRO TEMPORADAS. Antes, la Red se recorre;
// después, se sostiene.
//
// NO ES UNA JERARQUÍA. Sostener una función no pone a nadie por encima de
// nadie: es una tarea con herramientas. Los textos de abajo evitan a propósito
// cualquier lenguaje de rango, ascenso o mérito.

import { useCallback, useEffect, useState } from "react"
import { Loader2, Check, Clock, X } from "lucide-react"
import styles from "./solicitar-funcion.module.css"

const CAMINO_COMPLETO = "season_4_complete"

type RolCode = "organizador" | "cartografo" | "colaborador" | "instructor"

const FUNCIONES: Array<{
  code: RolCode
  nombre: string
  llamado: string
  que_hace: string
  disponible: boolean
}> = [
  {
    code: "organizador",
    nombre: "Organizador de Encuentros",
    llamado: "Reúne a la Red donde vives.",
    que_hace: "Convocas encuentros presenciales en tu ciudad, eliges el lugar y la fecha, y acompañas a quienes asisten. Es el primer paso de una comunidad de base.",
    disponible: true,
  },
  {
    code: "cartografo",
    nombre: "Cartógrafo",
    llamado: "Documenta los lugares de la Tierra que guardan memoria.",
    que_hace: "Propones y documentas puntos para el Mapa Cósmico, con lo que has investigado o visitado.",
    disponible: true,
  },
  {
    code: "colaborador",
    nombre: "Colaborador",
    llamado: "Aporta al Archivo lo que sabes.",
    que_hace: "Investigación, material, traducciones, revisión. Lo que sostiene el Archivo por dentro.",
    disponible: true,
  },
  {
    code: "instructor",
    nombre: "Instructor de Los 144.000",
    llamado: "Conduce la formación de un grupo de contacto.",
    que_hace: "Acompañas a un grupo durante los dieciséis encuentros del Umbral: preparas cada sesión, sostienes las prácticas y cierras el ciclo. Es la función que más pide y la que más entrega.",
    disponible: true,
  },
]

type Solicitud = {
  role_code: string
  estado: string
  respuesta: string | null
}

export function SolicitarFuncion({ desbloqueadas }: { desbloqueadas: string[] }) {
  // La puerta: solo quien terminó las cuatro temporadas.
  const caminoCompleto = desbloqueadas.includes(CAMINO_COMPLETO)

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [misRoles, setMisRoles] = useState<string[]>([])
  const [abierta, setAbierta] = useState<RolCode | null>(null)
  const [mensaje, setMensaje] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/red/solicitudes", { credentials: "include" })
      if (!r.ok) return
      const d = await r.json()
      setSolicitudes(d.solicitudes || [])
      setMisRoles(d.mis_roles || [])
    } catch { /* la sección se muestra igual, sin estado previo */ }
  }, [])

  useEffect(() => { if (caminoCompleto) cargar() }, [caminoCompleto, cargar])

  const enviar = useCallback(async (code: RolCode) => {
    setEnviando(true)
    setError(null)
    try {
      const r = await fetch("/api/red/solicitudes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: code, mensaje }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || "No se pudo enviar")
      setAbierta(null)
      setMensaje("")
      cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setEnviando(false)
    }
  }, [mensaje, cargar])

  const retirar = useCallback(async (code: RolCode) => {
    setEnviando(true)
    try {
      await fetch("/api/red/solicitudes", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: code }),
      })
      cargar()
    } finally {
      setEnviando(false)
    }
  }, [cargar])

  if (!caminoCompleto) return null

  return (
    <section className={styles.wrap}>
      <p className={styles.kicker}>Sostener la Red</p>
      <h3 className={styles.titulo}>Has recorrido el Camino entero</h3>
      <p className={styles.intro}>
        Los objetivos de arriba no se cumplen solos. Hay tareas concretas que alguien tiene que
        sostener, y ahora puedes pedir una. No son rangos ni reconocimientos: son trabajo, con
        las herramientas para hacerlo.
      </p>

      {error && (
        <p className={styles.error} role="status">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Cerrar">
            <X size={12} />
          </button>
        </p>
      )}

      <div className={styles.lista}>
        {FUNCIONES.map((f) => {
          const sol = solicitudes.find((s) => s.role_code === f.code)
          const yaLaTengo = misRoles.includes(f.code)
          const pendiente = sol?.estado === "pendiente"
          const rechazada = sol?.estado === "rechazada"

          return (
            <article key={f.code} className={styles.card}>
              <h4 className={styles.nombre}>{f.nombre}</h4>
              <p className={styles.llamado}>{f.llamado}</p>
              <p className={styles.texto}>{f.que_hace}</p>

              {yaLaTengo ? (
                <p className={styles.estadoOk}>
                  <Check size={13} aria-hidden /> La sostienes
                </p>
              ) : pendiente ? (
                <div className={styles.estadoFila}>
                  <p className={styles.estadoEspera}>
                    <Clock size={13} aria-hidden /> Solicitud enviada
                  </p>
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => retirar(f.code)}
                    className={styles.retirar}
                  >
                    Retirar
                  </button>
                </div>
              ) : !f.disponible ? (
                <p className={styles.pronto}>Todavía no está abierta</p>
              ) : abierta === f.code ? (
                <div className={styles.form}>
                  <label className={styles.label} htmlFor={`msg-${f.code}`}>
                    ¿Qué te propones hacer?
                  </label>
                  <textarea
                    id={`msg-${f.code}`}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Cuéntanos en dos líneas. No hace falta más."
                    className={styles.textarea}
                  />
                  <div className={styles.acciones}>
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => enviar(f.code)}
                      className={styles.enviar}
                    >
                      {enviando && <Loader2 size={12} className={styles.spin} />}
                      Enviar solicitud
                    </button>
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => { setAbierta(null); setMensaje("") }}
                      className={styles.cancelar}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {rechazada && sol?.respuesta && (
                    <p className={styles.respuesta}>{sol.respuesta}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => { setAbierta(f.code); setMensaje("") }}
                    className={styles.pedir}
                  >
                    {rechazada ? "Volver a pedirla" : "Solicitar"}
                  </button>
                </>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

