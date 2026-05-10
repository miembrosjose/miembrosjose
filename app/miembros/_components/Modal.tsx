"use client"

// Modal base reutilizável pra área de membros.
//
// Substitui o padrão repetido no código original onde cada modal era
// um <div> com display:none/block + onclick handler manual.
//
// Uso:
//   const [open, setOpen] = useState(false)
//   <Modal open={open} onClose={() => setOpen(false)} title="Detalle">
//     conteúdo
//     <ModalFooter>
//       <button onClick={...}>Cancelar</button>
//       <button onClick={...}>Confirmar</button>
//     </ModalFooter>
//   </Modal>
//
// Comportamento:
//  - Click no overlay fecha (toleráncia: só se clique foi NO overlay, não no container)
//  - Esc fecha
//  - Travamento de scroll do body enquanto aberto
//  - Animação fade-in/translate

import { useEffect } from "react"
import { X } from "lucide-react"
import styles from "./modal.module.css"

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: number // px, override do default 560
  closeOnOverlay?: boolean // default true
  closeOnEsc?: boolean // default true
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth,
  closeOnOverlay = true,
  closeOnEsc = true,
}: ModalProps) {
  // Esc handler
  useEffect(() => {
    if (!open || !closeOnEsc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, closeOnEsc, onClose])

  // Trava scroll do body quando aberto (paridade com original)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div
      className={`${styles.overlay} ${open ? styles.open : ""}`}
      onClick={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose()
      }}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={styles.container}
        style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
      >
        {title && (
          <header className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </header>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>
  )
}
