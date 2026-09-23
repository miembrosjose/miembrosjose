"use client"

// CARTOGRAFÍA ESTELAR 144 — mapa tridimensional.
//
// ── QUÉ REPRESENTA ─────────────────────────────────────────────────────────
// La persona en el centro. Cada portal colocado en su DIRECCIÓN real en el
// cielo, calculada desde su ascensión recta y su declinación precesadas a la
// fecha del nacimiento. Ningún portal está puesto al azar ni por estética.
//
// La distancia al centro NO representa distancia física: todos los portales
// caen sobre la misma esfera. Sirio está a 8.6 años luz y M87 a 53 millones.
// La resonancia se codifica en tamaño y brillo, nunca en posición: moverlos
// según su puntuación falsearía el cielo.
//
// ── POR QUÉ ESTE ARCHIVO NO ESTÁ EN EL PAQUETE INICIAL ─────────────────────
// Three.js pesa. Este módulo se carga con import dinámico solo cuando alguien
// pide el mapa 3D, y la lista sigue funcionando entera sin él. Ver
// CartografiaEstelar.tsx.
//
// ── TRES NIVELES ───────────────────────────────────────────────────────────
// El zoom no es decoración: cada nivel muestra algo que el anterior no podía.
//   1  mi cartografía — los portales activos sobre la esfera
//   2  portal         — las anclas que lo componen, separadas
//   3  contacto       — la línea entre un punto natal y un ancla concreta

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Html, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { Minus, Plus, Crosshair, Globe } from "lucide-react"
import {
  RADIO_ESFERA, fondoEstrellas, proyectarPortales, proyectarPuntos,
  type PortalProyectado,
} from "../../_lib/cartografia-estelar/proyeccion/esfera"
import { PUNTOS } from "../../_lib/cartografia-estelar/content/puntos.content"
import { AVISO_POSICIONES_3D, AVISO_SIN_CONTACTO } from "../../_lib/cartografia-estelar/content/avisos"
import type { Cartografia } from "../../_lib/cartografia-estelar/domain/types"
import s from "./cartografia.module.css"

const COLOR_TIPO: Record<string, string> = {
  STAR_SYSTEM: "#e6cf95",
  STAR_FAMILY: "#d9c08a",
  CONSTELLATION: "#c3b2e0",
  CLUSTER: "#8fc4d6",
  GALAXY: "#d98ba8",
  NEBULA: "#e0a45a",
  COSMIC_REFERENCE: "#a8ce86",
}

type Props = {
  carto: Cartografia
  seleccionado: string | null
  onSeleccionar: (id: string | null) => void
  /** Solo estos brillan. null = todos los activos. */
  destacados: string[] | null
  /** Nivel de detalle. Ver cabecera. */
  nivel: 1 | 2 | 3
  puntoResaltado: string | null
}

function usaMovimientoReducido(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

// ── Fondo de estrellas ──────────────────────────────────────────────────────
// Un solo objeto con miles de vértices. Nunca miles de objetos de React: eso
// haría el mapa inmanejable en cualquier móvil.
function Fondo() {
  const posiciones = useMemo(() => fondoEstrellas(1400), [])
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(posiciones, 3))
    return g
  }, [posiciones])

  useEffect(() => () => geom.dispose(), [geom])

  return (
    <points geometry={geom} frustumCulled={false}>
      <pointsMaterial size={0.16} color="#8f8fb0" sizeAttenuation transparent opacity={0.55} />
    </points>
  )
}

// ── El centro: la persona ───────────────────────────────────────────────────
function Centro() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshBasicMaterial color="#f3e7c6" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.62, 20, 20]} />
        <meshBasicMaterial color="#a78bca" transparent opacity={0.16} />
      </mesh>
    </group>
  )
}

// ── Un portal ───────────────────────────────────────────────────────────────
function NodoPortal({
  p, activo, atenuado, seleccionado, mostrarEtiqueta, nivel, onClick,
}: {
  p: PortalProyectado
  activo: boolean
  atenuado: boolean
  seleccionado: boolean
  mostrarEtiqueta: boolean
  nivel: 1 | 2 | 3
  onClick: () => void
}) {
  const color = COLOR_TIPO[p.tipo] ?? "#c3b2e0"
  const [hover, setHover] = useState(false)

  // El tamaño refuerza la resonancia sin depender del color, que no todo el
  // mundo distingue igual.
  const radio = activo ? 0.16 + (p.resonancia / 100) * 0.34 : 0.075
  const opacidad = atenuado ? 0.22 : activo ? 1 : 0.4

  // A partir del nivel 2, un portal seleccionado con varias anclas las muestra
  // por separado: es lo que ese nivel de zoom viene a enseñar.
  const verAnclas = seleccionado && nivel >= 2 && p.anclas.length > 1

  return (
    <group>
      <mesh
        position={[p.pos.x, p.pos.y, p.pos.z]}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true) }}
        onPointerOut={() => setHover(false)}
      >
        {/* Objetivo táctil holgado e invisible: en un móvil, una esfera de
            0.16 es imposible de acertar con el dedo. */}
        <sphereGeometry args={[Math.max(radio * 2.6, 0.5), 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh position={[p.pos.x, p.pos.y, p.pos.z]}>
        <sphereGeometry args={[radio, 18, 18]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacidad}
          wireframe={!activo}
        />
      </mesh>

      {activo && !atenuado && (
        <>
          <mesh position={[p.pos.x, p.pos.y, p.pos.z]}>
            <sphereGeometry args={[radio * 2.1, 14, 14]} />
            <meshBasicMaterial color={color} transparent opacity={seleccionado ? 0.3 : 0.13} />
          </mesh>
          <Linea
            desde={[0, 0, 0]}
            hasta={[p.pos.x, p.pos.y, p.pos.z]}
            color={color}
            opacidad={0.1 + (p.resonancia / 100) * 0.35}
          />
        </>
      )}

      {verAnclas && p.anclas.map((a) => (
        <mesh key={a.id} position={[a.pos.x, a.pos.y, a.pos.z]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial color="#F3F6FA" transparent opacity={0.85} />
        </mesh>
      ))}

      {(mostrarEtiqueta || hover || seleccionado) && (
        <Html
          position={[p.pos.x, p.pos.y + radio + 0.35, p.pos.z]}
          center
          distanceFactor={18}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span className={seleccionado ? s.etiqueta3dActiva : s.etiqueta3d}>
            {p.nombre}
            {!activo && <em> · {AVISO_SIN_CONTACTO}</em>}
          </span>
        </Html>
      )}
    </group>
  )
}

/** Una línea entre dos puntos. Geometría propia para poder liberarla. */
function Linea({
  desde, hasta, color, opacidad, grosor = 1,
}: {
  desde: [number, number, number]
  hasta: [number, number, number]
  color: string
  opacidad: number
  grosor?: number
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([...desde, ...hasta], 3),
    )
    return g
  }, [desde, hasta])

  useEffect(() => () => geom.dispose(), [geom])

  return (
    <line>
      <primitive object={geom} attach="geometry" />
      <lineBasicMaterial color={color} transparent opacity={opacidad} linewidth={grosor} />
    </line>
  )
}

// ── Los puntos natales, en el nivel 3 ───────────────────────────────────────
function PuntosNatales({ carto, portalSeleccionado, puntoResaltado }: {
  carto: Cartografia
  portalSeleccionado: string | null
  puntoResaltado: string | null
}) {
  const puntos = useMemo(() => proyectarPuntos(carto), [carto])
  const r = carto.resonancias.find((x) => x.portalId === portalSeleccionado)
  if (!r) return null

  const implicados = new Set(r.contactos.map((c) => c.punto))
  const proyectados = proyectarPortales(carto)
  const portal = proyectados.find((p) => p.id === portalSeleccionado)

  return (
    <group>
      {puntos.filter((p) => implicados.has(p.id)).map((p) => {
        const resaltado = puntoResaltado === p.id
        const ancla = portal?.anclas.find(
          (a) => a.id === r.contactos.find((c) => c.punto === p.id)?.ancla.id,
        )
        return (
          <group key={p.id}>
            <mesh position={[p.pos.x, p.pos.y, p.pos.z]}>
              <sphereGeometry args={[resaltado ? 0.2 : 0.13, 12, 12]} />
              <meshBasicMaterial color={resaltado ? "#f3e7c6" : "#9ecbe0"} />
            </mesh>
            {/* La línea del contacto: punto natal → ancla. Es lo que el tercer
                nivel de zoom viene a mostrar. */}
            {ancla && (
              <Linea
                desde={[p.pos.x, p.pos.y, p.pos.z]}
                hasta={[ancla.pos.x, ancla.pos.y, ancla.pos.z]}
                color={resaltado ? "#f3e7c6" : "#9ecbe0"}
                opacidad={resaltado ? 0.8 : 0.3}
              />
            )}
            <Html
              position={[p.pos.x, p.pos.y + 0.3, p.pos.z]}
              center
              distanceFactor={18}
              style={{ pointerEvents: "none" }}
            >
              <span className={s.etiqueta3dPunto}>{PUNTOS[p.id].nombre}</span>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// ── Cámara ──────────────────────────────────────────────────────────────────
//
// Cuando se selecciona un portal la cámara viaja hasta él. Con
// prefers-reduced-motion el salto es inmediato: la animación es exactamente
// lo que molesta a quien pide movimiento reducido.
function Camara({
  objetivo, nivel, orden,
}: {
  objetivo: [number, number, number] | null
  nivel: 1 | 2 | 3
  orden: number
}) {
  const { camera } = useThree()
  const destino = useRef(new THREE.Vector3())
  const animando = useRef(false)
  const reducido = useMemo(usaMovimientoReducido, [])

  useEffect(() => {
    if (!objetivo) {
      // Vuelta a la vista general.
      destino.current.set(0, RADIO_ESFERA * 0.55, RADIO_ESFERA * 2.1)
    } else {
      // Un poco más allá del portal, mirando hacia el centro. Cuanto mayor es
      // el nivel, más cerca.
      const v = new THREE.Vector3(...objetivo).normalize()
      const dist = nivel >= 3 ? RADIO_ESFERA * 1.18 : nivel === 2 ? RADIO_ESFERA * 1.45 : RADIO_ESFERA * 1.9
      destino.current.copy(v.multiplyScalar(dist))
    }

    if (reducido) {
      camera.position.copy(destino.current)
      camera.lookAt(0, 0, 0)
      animando.current = false
    } else {
      animando.current = true
    }
  }, [objetivo, nivel, orden, camera, reducido])

  useFrame((_, delta) => {
    if (!animando.current) return
    // Interpolación con paso independiente de la tasa de refresco: a 120 Hz
    // el viaje debe durar lo mismo que a 60.
    const k = 1 - Math.pow(0.0035, delta)
    camera.position.lerp(destino.current, k)
    camera.lookAt(0, 0, 0)
    if (camera.position.distanceTo(destino.current) < 0.05) {
      camera.position.copy(destino.current)
      animando.current = false
    }
  })

  return null
}

// ── Escena ──────────────────────────────────────────────────────────────────
function Escena({
  carto, seleccionado, onSeleccionar, destacados, nivel, puntoResaltado, orden,
}: Props & { orden: number }) {
  const portales = useMemo(() => proyectarPortales(carto), [carto])

  const objetivo = useMemo<[number, number, number] | null>(() => {
    if (!seleccionado) return null
    const p = portales.find((x) => x.id === seleccionado)
    return p ? [p.pos.x, p.pos.y, p.pos.z] : null
  }, [seleccionado, portales])

  // Etiquetas siempre visibles: las más marcadas. El resto aparece al pasar
  // por encima o al seleccionar. Más de esto y el mapa es ilegible.
  const conEtiqueta = useMemo(() => {
    const activos = portales.filter((p) => p.activo)
    activos.sort((a, b) => b.resonancia - a.resonancia)
    return new Set(activos.slice(0, 8).map((p) => p.id))
  }, [portales])

  return (
    <>
      <Fondo />
      <Centro />
      <Camara objetivo={objetivo} nivel={nivel} orden={orden} />

      {portales.map((p) => (
        <NodoPortal
          key={p.id}
          p={p}
          activo={p.activo}
          atenuado={destacados !== null && !destacados.includes(p.id)}
          seleccionado={seleccionado === p.id}
          mostrarEtiqueta={conEtiqueta.has(p.id) && (destacados === null || destacados.includes(p.id))}
          nivel={nivel}
          // Un portal sin contacto no se abre. Aparece como contexto y nada más.
          onClick={() => { if (p.activo) onSeleccionar(p.id) }}
        />
      ))}

      {nivel >= 3 && (
        <PuntosNatales
          carto={carto}
          portalSeleccionado={seleccionado}
          puntoResaltado={puntoResaltado}
        />
      )}

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={RADIO_ESFERA * 0.35}
        maxDistance={RADIO_ESFERA * 3.4}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        makeDefault
      />
    </>
  )
}

// ── Componente público ──────────────────────────────────────────────────────
export default function Mapa3D(props: Props) {
  // `orden` sube en cada petición de recentrado para que la cámara vuelva a
  // animarse aunque el portal seleccionado no haya cambiado.
  const [orden, setOrden] = useState(0)
  const [zoom, setZoom] = useState(0)

  return (
    <div className={s.contenedor3d}>
      <Canvas
        camera={{ position: [0, RADIO_ESFERA * 0.55, RADIO_ESFERA * 2.1], fov: 52, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => props.onSeleccionar(null)}
      >
        <Suspense fallback={null}>
          <Escena {...props} orden={orden + zoom} />
        </Suspense>
      </Canvas>

      {/* Controles visibles. En móvil también funcionan el pellizco y el
          arrastre, pero un botón es un objetivo seguro de 44 píxeles. */}
      <div className={s.controles3d}>
        <button type="button" onClick={() => setZoom((z) => z + 1)} aria-label="Acercar" className={s.boton3d}>
          <Plus size={16} />
        </button>
        <button type="button" onClick={() => setZoom((z) => z - 1)} aria-label="Alejar" className={s.boton3d}>
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={() => setOrden((o) => o + 1)}
          aria-label="Centrar"
          className={s.boton3d}
        >
          <Crosshair size={16} />
        </button>
        <button
          type="button"
          onClick={() => { props.onSeleccionar(null); setOrden((o) => o + 1) }}
          aria-label="Ver mi mapa completo"
          className={s.boton3d}
        >
          <Globe size={16} />
        </button>
      </div>

      <p className={s.aviso3d}>{AVISO_POSICIONES_3D}</p>
    </div>
  )
}
