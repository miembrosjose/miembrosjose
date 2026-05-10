"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"

const VIBRAD_URL = "https://cdn.SEU_DOMINIO.com/notification-sound.mp3"

// Variável de módulo — persiste enquanto a aba estiver aberta, independente de remontagem
let sharedAudio: HTMLAudioElement | null = null

interface GlobalAudioContextType {
  playVibradAudio: () => Promise<void> | undefined // <-- Ajuste no TypeScript para aceitar o return
  stopVibradAudio: () => void
}

const GlobalAudioContext = createContext<GlobalAudioContextType | null>(null)

const NOOP_CONTEXT: GlobalAudioContextType = {
  playVibradAudio: () => undefined,
  stopVibradAudio: () => {},
}

export function useGlobalAudio() {
  return useContext(GlobalAudioContext) ?? NOOP_CONTEXT
}

export function GlobalAudioProvider({ children }: { children: ReactNode }) {
  const playVibradAudio = useCallback(() => {
    if (!sharedAudio) {
      sharedAudio = new Audio(VIBRAD_URL)
      sharedAudio.loop = true
      sharedAudio.volume = 1
    }
    sharedAudio.currentTime = 0
    
    // A MÁGICA PRO IPHONE ESTÁ AQUI: o return antes do play() e sem o .catch engolindo a promessa
    return sharedAudio.play() 
  }, [])

  const stopVibradAudio = useCallback(() => {
    if (sharedAudio) {
      sharedAudio.pause()
      sharedAudio.currentTime = 0
    }
  }, [])

  return (
    <GlobalAudioContext.Provider value={{ playVibradAudio, stopVibradAudio }}>
      {children}
    </GlobalAudioContext.Provider>
  )
}
