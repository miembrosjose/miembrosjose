// Sons procedurais via Web Audio API (não usa arquivos de áudio).
// Todos os sons são gerados em runtime — sem assets, latência zero.
// Mute global controlado por window.NOTIF_PREFS.sound (configurável via
// NotifPrefsModal). Hidratado no boot do SpaHomeShell.
//
// Uso:
//   import { sounds } from "@/app/miembros/_lib/sounds"
//   sounds.click()
//   sounds.like()
//   sounds.top3()  // tocado pelo BroadcastProvider quando popup aparece

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (ctx) return ctx
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
    return ctx
  } catch {
    return null
  }
}

function isMuted(): boolean {
  if (typeof window === "undefined") return true
  // Pref global — Fase 4 vai alimentar esse objeto via NotifPrefsModal
  const prefs = (window as unknown as { NOTIF_PREFS?: { sound?: boolean } }).NOTIF_PREFS
  return prefs?.sound === false
}

/**
 * Toca uma nota individual com envelope ADSR simples.
 * Tipos de wave: 'sine' (suave), 'triangle' (limpo), 'square' (chiptune),
 * 'sawtooth' (agressivo).
 */
function tone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.08) {
  if (isMuted()) return
  const c = getCtx()
  if (!c) return
  if (c.state === "suspended") c.resume?.()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const now = c.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now)
  osc.stop(now + duration + 0.05)
}

function delay(ms: number, fn: () => void) {
  setTimeout(fn, ms)
}

// Cache de <audio> elements pra MP3s — evita re-download a cada play.
// Cada URL fica numa instância singleton, com preload="auto" pra reduzir
// latência da primeira reprodução (pré-carrega no 1º acesso).
const mp3Cache: Record<string, HTMLAudioElement> = {}

// Retorna o <audio> element pra que o caller possa sincronizar UI com
// duração/onended (overlays fullscreen aguardam fim da música pra fechar).
// Retorna null se SSR, muted, ou erro.
function playMp3(url: string, volume = 0.7): HTMLAudioElement | null {
  if (typeof window === "undefined") return null
  if (isMuted()) return null
  let audio = mp3Cache[url]
  if (!audio) {
    audio = new Audio(url)
    audio.preload = "auto"
    audio.volume = Math.max(0, Math.min(1, volume))
    mp3Cache[url] = audio
  }
  try {
    // Reseta posição pra permitir replay sobreposto se já tocou antes
    audio.currentTime = 0
    audio.play().catch(() => {
      // Browser bloqueou autoplay sem user gesture — silent fail
    })
    return audio
  } catch {
    return null
  }
}

// URL antiga — usada agora pelos overlays ETERNO e LEYENDA (top tier
// "comunitárias" — 90 dias / 500 posts). Som "level up shahiera channel".
const URL_TOPO_SOUND =
  "https://cdn.SEU_DOMINIO.com/Level%20up%2CSound%20Effect%20-%20Shahiera%20Channel%20(youtube).mp3"

// URL nova — usada pelos overlays EL TOPO e EL ESTUDIO (top tier "premium"
// — produto creación de embudo / serviço área de membros). Som "trumpet
// victory" mais cinematográfico, marcial.
const URL_TRUMPET_SOUND =
  "https://cdn.SEU_DOMINIO.com/Trumpet%20Sound%20Victory%20-%20Trumpet%20Songs%20(youtube).mp3"

export const sounds = {
  // Interações comuns
  click: () => tone(900, 0.05, "sine", 0.04),
  hoverTick: () => tone(1500, 0.02, "sine", 0.02),
  like: () => {
    tone(880, 0.08, "triangle", 0.08)
    delay(50, () => tone(1320, 0.12, "triangle", 0.06))
  },
  unlike: () => tone(440, 0.08, "sine", 0.05),
  notification: () => {
    tone(1320, 0.1, "triangle", 0.08)
    delay(80, () => tone(1760, 0.15, "triangle", 0.05))
  },
  error: () => tone(220, 0.15, "square", 0.05),
  open: () => tone(1100, 0.06, "sine", 0.05),
  close: () => tone(700, 0.06, "sine", 0.04),
  publish: () => {
    tone(523, 0.1, "triangle", 0.08)
    delay(80, () => tone(659, 0.1, "triangle", 0.08))
    delay(160, () => tone(784, 0.18, "triangle", 0.1))
  },

  // Level up do user atual — acorde C-E-G-C ascending + sub-bass
  levelUp: () => {
    const c = getCtx()
    if (!c || isMuted()) return
    const now = c.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = "triangle"
      osc.frequency.value = freq
      const startTime = now + i * 0.08
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(startTime)
      osc.stop(startTime + 1.3)
    })
    // Sub-bass thump
    const sub = c.createOscillator()
    const subGain = c.createGain()
    sub.type = "sine"
    sub.frequency.value = 65
    subGain.gain.setValueAtTime(0, now)
    subGain.gain.linearRampToValueAtTime(0.3, now + 0.02)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
    sub.connect(subGain)
    subGain.connect(c.destination)
    sub.start(now)
    sub.stop(now + 0.7)
  },

  // Insignia desbloqueada do user atual — 2 ticks ascendentes + chime dourado
  // Equivalente a playUnlock do proyecto base (linha 13186).
  unlock: () => {
    const c = getCtx()
    if (!c || isMuted()) return
    if (c.state === "suspended") c.resume?.()
    const t = c.currentTime
    // Ticks ascendentes
    ;[800, 1200].forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      const start = t + i * 0.08
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.15, start + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(start)
      osc.stop(start + 0.31)
    })
    // Chime dourado (terça maior) com delay
    delay(160, () => {
      const c2 = getCtx()
      if (!c2) return
      const t2 = c2.currentTime
      ;[1320, 1660, 2000].forEach((freq) => {
        const osc = c2.createOscillator()
        const gain = c2.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, t2)
        gain.gain.linearRampToValueAtTime(0.1, t2 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.6)
        osc.connect(gain)
        gain.connect(c2.destination)
        osc.start(t2)
        osc.stop(t2 + 0.62)
      })
    })
  },

  // Sons de broadcast (level up de outros, insignia rara, streak, funnel hot, top3)
  levelUpOther: () => {
    tone(523, 0.08, "sine", 0.06)
    delay(80, () => tone(659, 0.08, "sine", 0.06))
    delay(160, () => tone(880, 0.18, "triangle", 0.08))
  },
  insigniaOther: () => {
    tone(784, 0.08, "triangle", 0.07)
    delay(70, () => tone(988, 0.08, "triangle", 0.07))
    delay(140, () => tone(1175, 0.1, "triangle", 0.08))
    delay(220, () => tone(1568, 0.22, "sine", 0.06))
  },
  streak: () => {
    tone(330, 0.06, "square", 0.06)
    delay(100, () => tone(330, 0.06, "square", 0.06))
    delay(200, () => tone(440, 0.25, "sine", 0.08))
  },
  funnelHot: () => {
    tone(440, 0.05, "sawtooth", 0.04)
    delay(50, () => tone(587, 0.05, "sawtooth", 0.05))
    delay(100, () => tone(784, 0.05, "sawtooth", 0.06))
    delay(150, () => tone(1175, 0.18, "triangle", 0.08))
  },
  top3: () => {
    tone(523, 0.07, "triangle", 0.07)
    delay(80, () => tone(784, 0.07, "triangle", 0.07))
    delay(160, () => tone(1047, 0.07, "triangle", 0.08))
    delay(240, () => tone(1568, 0.28, "sine", 0.09))
  },

  // ETERNO + LEYENDA conquistado — música "level up Shahiera" do CDN.
  // Esse era o som original do EL TOPO mas foi migrado pra essas duas insignias
  // top tier "comunitárias" (90 días únicos + 500 posts).
  topoConquista: () => playMp3(URL_TOPO_SOUND, 0.7),

  // EL TOPO + EL ESTUDIO conquistado — música "trumpet victory" do CDN.
  // Som premium cinematográfico mais marcial, condizente com produto pago.
  trumpetVictory: () => playMp3(URL_TRUMPET_SOUND, 0.7),
} as const

export type SoundKey = keyof typeof sounds

// ──────────────────────────────────────────────────────────────────────────
// SONS PROCEDURAL POR ACHIEVEMENT
// ──────────────────────────────────────────────────────────────────────────
//
// Cada insignia desbloqueada toca um som único determinístico baseado no ID.
// Estratégia: 8 padrões base "musicais" + frequência deslocada por categoria
// pra dar diferenciação. Achievements tier=topo (el_topo, el_estudio,
// time_eterno, rank_leyenda) NÃO usam essas funções — eles são tratados pelo
// fullscreen overlay que toca MP3.

// ── Pattern 1: Bronze suave (welcome, ranks bronze, primeiros achievements) ──
function bronzeUnlock(baseFreq: number) {
  if (isMuted()) return
  tone(baseFreq, 0.1, "sine", 0.08)
  delay(80, () => tone(baseFreq * 1.5, 0.18, "triangle", 0.07))
}

// ── Pattern 2: Tech blip (agentes IA — copywriter, constructor, etc) ──
function agentBlip(baseFreq: number) {
  if (isMuted()) return
  tone(baseFreq, 0.06, "square", 0.05)
  delay(60, () => tone(baseFreq * 1.5, 0.06, "square", 0.06))
  delay(140, () => tone(baseFreq * 2, 0.18, "triangle", 0.07))
}

// ── Pattern 3: Season (acto I-IV) — escala ascendente, cada season +1 nota ──
function seasonChord(seasonIndex: number) {
  if (isMuted()) return
  // C-E-G-C escalado
  const baseFreqs = [261.63, 329.63, 392, 523.25] // C4 E4 G4 C5
  const stretch = 1 + seasonIndex * 0.25 // season 1 = base, season 4 = 1.75x
  baseFreqs.slice(0, seasonIndex + 1).forEach((freq, i) => {
    delay(i * 80, () => tone(freq * stretch, 0.12, "triangle", 0.08))
  })
  delay(seasonIndex * 80 + 200, () =>
    tone(baseFreqs[Math.min(seasonIndex, 3)] * 2 * stretch, 0.25, "sine", 0.09),
  )
}

// ── Pattern 4: Silver chime (rank intermediário, vip, time habitué) ──
function silverChime(baseFreq: number) {
  if (isMuted()) return
  tone(baseFreq, 0.08, "triangle", 0.08)
  delay(80, () => tone(baseFreq * 1.25, 0.08, "triangle", 0.07))
  delay(160, () => tone(baseFreq * 1.5, 0.22, "sine", 0.08))
}

// ── Pattern 5: Gold premium chime (products, ranks gold, training_complete) ──
// Som mais elaborado pra dar sensação de "premium". 4 notas + chime dourado final.
function goldChime(baseFreq: number) {
  if (isMuted()) return
  tone(baseFreq, 0.06, "triangle", 0.07)
  delay(70, () => tone(baseFreq * 1.25, 0.07, "triangle", 0.07))
  delay(140, () => tone(baseFreq * 1.5, 0.07, "triangle", 0.08))
  delay(210, () => tone(baseFreq * 2, 0.1, "triangle", 0.09))
  // Chime dourado final — terça maior
  delay(320, () => {
    const c = getCtx()
    if (!c) return
    const t = c.currentTime
    ;[baseFreq * 2.5, baseFreq * 3, baseFreq * 4].forEach((freq) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.07, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.55)
    })
  })
}

// ── Pattern 6: Time ambient (devoto, habitue, veterano — acumulação de dias) ──
function timeAmbient(baseFreq: number) {
  if (isMuted()) return
  // Pad longo + harmonia (sensação de "tempo passando")
  const c = getCtx()
  if (!c) return
  const t = c.currentTime
  ;[baseFreq, baseFreq * 1.5, baseFreq * 2].forEach((freq) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = "sine"
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.06, t + 0.15)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 1.5)
  })
}

// ── Pattern 7: Royal/Diamond (admin_seal — cinematic) ──
function royalFanfare() {
  if (isMuted()) return
  // Sequência majestosa C5-G5-C6 + chime cristalino
  tone(523.25, 0.12, "triangle", 0.09)
  delay(120, () => tone(784, 0.12, "triangle", 0.09))
  delay(240, () => tone(1046.5, 0.18, "sine", 0.1))
  delay(380, () => {
    const c = getCtx()
    if (!c) return
    const t = c.currentTime
    ;[1568, 2093, 2637].forEach((freq) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.05, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.75)
    })
  })
}

// ── Mapping ID → função de som ──
// Achievement IDs tier=topo NÃO entram aqui — TopoOverlay/EstudioOverlay/
// EternoOverlay/LeyendaOverlay tratam diretamente com MP3.
const ACHIEVEMENT_SOUNDS: Record<string, () => void> = {
  // Bronze progression
  welcome: () => bronzeUnlock(523.25),
  first_lesson: () => bronzeUnlock(587.33),

  // Agents (tech/AI blip — frequências distintas por agente)
  agent_estratega: () => agentBlip(440),
  agent_minivsl: () => agentBlip(523.25),
  agent_copywriter: () => agentBlip(587.33),
  agent_constructor: () => agentBlip(659.25),

  // Seasons (escala ascendente)
  season_1_complete: () => seasonChord(0),
  season_2_complete: () => seasonChord(1),
  season_3_complete: () => seasonChord(2),
  season_4_complete: () => seasonChord(3),

  // Silver
  vip_community: () => silverChime(880),
  rank_recluta: () => bronzeUnlock(440),
  rank_agente: () => bronzeUnlock(493.88),
  rank_operador: () => silverChime(987.77),
  rank_estratega: () => silverChime(1108.73),

  // Gold (mais elaborado — produtos, ranks gold, training)
  rank_capo: () => goldChime(523.25),
  rank_padrino: () => goldChime(587.33),
  product_creativos: () => goldChime(659.25),
  product_andromeda: () => goldChime(698.46),
  product_analytics: () => goldChime(739.99),
  product_minivsl: () => goldChime(783.99),
  product_revisao: () => goldChime(880),
  training_complete: () => goldChime(932.33),

  // Time (ambient pad)
  time_devoto: () => timeAmbient(220),
  time_habitue: () => timeAmbient(246.94),
  time_veterano: () => timeAmbient(293.66),

  // Diamond (royal cinematic)
  admin_seal: () => royalFanfare(),
}

/** Retorna função de som específica do achievement ou fallback genérico. */
export function getSoundForAchievement(id: string): () => void {
  return ACHIEVEMENT_SOUNDS[id] || sounds.unlock
}
