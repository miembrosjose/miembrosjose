"use client"

// Bloque del perfil que representa el lugar de una persona dentro de La Red:
// su ciudad (si la comparte) y sus funciones.
//
// Los roles son FUNCIONES, no jerarquía. Por eso se muestran como etiquetas
// sobrias en una fila, sin medallas ni niveles, y separados de los emblemas de
// progreso, que conservan su propia sección y su propia lógica.
//
// Si no hay nada que mostrar, el componente no dibuja nada: el perfil no debe
// llenarse de huecos vacíos.

import { MapPin } from "lucide-react"

const ROL_NOMBRE: Record<string, string> = {
  organizador: "Organizador de Encuentros",
  facilitador: "Facilitador de Círculo",
  embajador: "Embajador de 144 mil",
  colaborador: "Colaborador",
  cartografo: "Cartógrafo",
  guardian: "Guardián de Nodo",
}

export type Ubicacion = {
  city: string
  admin1: string | null
  country: string
  country_code: string
  label: string
} | null

export function LugarEnLaRed({
  ubicacion,
  roles,
  soloLectura,
}: {
  ubicacion: Ubicacion
  roles: string[]
  /** true en el perfil de otro miembro; false en el propio (permite matices). */
  soloLectura?: boolean
}) {
  const rolesValidos = (roles || []).filter((r) => ROL_NOMBRE[r])
  if (!ubicacion && rolesValidos.length === 0) return null

  return (
    <div className="ler-wrap">
      {ubicacion && (
        <p className="ler-loc">
          <MapPin size={14} aria-hidden />
          <span>{ubicacion.label}</span>
        </p>
      )}

      {rolesValidos.length > 0 && (
        <div className="ler-roles" aria-label="Funciones dentro de la Red">
          {rolesValidos.map((r) => (
            <span key={r} className="ler-rol">
              {ROL_NOMBRE[r]}
            </span>
          ))}
        </div>
      )}

      {!soloLectura && !ubicacion && (
        <p className="ler-hint">
          Añade tu ciudad para aparecer en la Red.
        </p>
      )}

      <style jsx>{`
        .ler-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin: 0.75rem 0 0;
        }
        .ler-loc {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin: 0;
          font-size: 0.9rem;
          color: #d9b866;
        }
        .ler-roles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .ler-rol {
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #e6cf95;
          border: 1px solid rgba(217, 184, 102, 0.42);
          background: rgba(217, 184, 102, 0.08);
          padding: 0.3rem 0.62rem;
          border-radius: 999px;
          white-space: nowrap;
        }
        .ler-hint {
          margin: 0;
          font-size: 0.78rem;
          color: #6a6a85;
        }
        @media (max-width: 560px) {
          .ler-rol {
            font-size: 0.6rem;
            letter-spacing: 0.1em;
            padding: 0.26rem 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}
