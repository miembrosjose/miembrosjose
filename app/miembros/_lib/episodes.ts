// Episódios das 4 temporadas — gerado automaticamente por scripts/extract-episodes.mjs
// a partir de public/proyecto base (linhas 7631-8800).
//
// NÃO EDITAR MANUALMENTE. Pra atualizar, edite o proyecto base e
// re-execute: node scripts/extract-episodes.mjs

export const CONVERTEAI_ACCOUNT = "681d0d14-0219-402e-8e87-ba5f85c047b6"

export type Episode = {
  num: number
  videoId: string
  title: string
  desc: string
  duration: string
  thumb?: string
  isNew?: boolean
  intro?: string
  notes?: string
  /** Chave do produto (KEY_TO_PRODUCT_NAME) pra renderizar checkout inline na página */
  inlineCheckoutKey?: string
  /** URL do agente GPT — botão "Abrir Agente" aparece só se user tem agentProductName */
  agentUrl?: string
  /** Nome do produto (igual ao KEY_TO_PRODUCT_NAME value) necessário pra ver o botão */
  agentProductName?: string
}

export const EPISODES_T1: Episode[] = [
  {
    num: 1,
    videoId: "VIDEO_ID_TODO",
    title: "Introducción",
    desc: "Antes de empezar, dos consejos que cambian todo en cómo absorbes este contenido.",
    duration: "—",
    thumb: "/episode-thumbs/s1e1.svg",
    notes: `
      <div class="notes-card">
        <div class="notes-header">
          <span class="warn-icon left">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
          <h3>Necesito dejar 2 consejos importantes antes de empezar</h3>
          <span class="warn-icon right">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
        </div>
        <div class="advice-item">
          <span class="num-badge">1</span>
          <div>
            <h4>Después de completar una clase, no avances inmediatamente a la siguiente.</h4>
            <p>Primero, pon en práctica todo lo que se enseñó y asegúrate de comprender profundamente la estructura.</p>
            <p>Solo después de eso, avanza a la siguiente clase.</p>
            <p>Es la ejecución consciente la que transforma el conocimiento en resultados reales.</p>
          </div>
        </div>
        <div class="advice-divider"></div>
        <div class="advice-item">
          <span class="num-badge">2</span>
          <div>
            <h4>No tercerices tu cerebro a la IA, deja que sea una extensión de tu mente.</h4>
            <p>Ella es una herramienta de tracción, no la dueña de tu estrategia.</p>
            <p>Úsala como un laboratorio de ideas: pon tu concepto ahí, deja que ella lo estructure y, después, evolúcionalo.</p>
            <p>La dirección y el tono emocional son 100% tu responsabilidad.</p>
            <p>Si quieres que tu oferta venda, humaniza el mensaje.</p>
            <p>La gamificación es, sin duda, la mejor forma de retener la atención de tu lead, pero si no creas un buen copy, creyendo que la IA y el formato interactivo harán todo por ti, de nada sirve que vengas después a decir que el curso no funciona.</p>
            <p>¿El texto quedó frío? No tengas pereza.</p>
            <p>Exígele que lo rehaga, inserta tu identidad y tu manera de hablar.</p>
            <p>Recuerda: los algoritmos generan textos, pero es tu empatía y la forma en que conduces el mensaje lo que hace que la persona pase la tarjeta.</p>
          </div>
        </div>
        <div class="notes-closing">
          <p>¡Deseo éxito en tu embudo!</p>
          <p>Buenas clases.</p>
        </div>
      </div>
    `,
  },
  {
    num: 2,
    videoId: "VIDEO_ID_TODO",
    title: "Agente Estratega",
    desc: "El agente Estratega te ayuda a diseñar la arquitectura de tu funnel.",
    duration: "—",
    thumb: "/episode-thumbs/s1e2.svg",
    notes: `
      <a href="https://chatgpt.com/g/SEU_GPT_ESTRATEGA_ID" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Coroa estratega (3 picos com gemas) -->
            <path d="M 18 50 L 30 22 L 42 45 L 50 18 L 58 45 L 70 22 L 82 50 Z" fill="none" stroke="#c9a961" stroke-width="2" stroke-linejoin="round"/>
            <rect x="18" y="50" width="64" height="9" fill="none" stroke="#c9a961" stroke-width="1.5"/>
            <circle cx="30" cy="32" r="2.2" fill="#c9a961"/>
            <circle cx="50" cy="28" r="2.8" fill="#c9a961"/>
            <circle cx="70" cy="32" r="2.2" fill="#c9a961"/>
            <!-- Linhas estratégicas (rede) -->
            <line x1="50" y1="65" x2="50" y2="88" stroke="#c9a961" stroke-width="1.5"/>
            <line x1="35" y1="75" x2="65" y2="75" stroke="#c9a961" stroke-width="1.2" opacity="0.6"/>
            <circle cx="35" cy="75" r="2" fill="#c9a961" opacity="0.7"/>
            <circle cx="65" cy="75" r="2" fill="#c9a961" opacity="0.7"/>
            <circle cx="50" cy="88" r="2" fill="#c9a961" opacity="0.7"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Agente GPT · Estratega</div>
          <h4>El Estratega</h4>
          <p>Tu copiloto para diseñar la arquitectura completa del embudo gamificado. Pregúntale sobre estructura, secuencia narrativa y conversión.</p>
        </div>
        <span class="agent-cta">
          Abrir Agente
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
  {
    num: 3,
    videoId: "VIDEO_ID_TODO",
    title: "Agente Copywriter para Mini VSL's",
    desc: "Producto opcional para insertar Mini VSLs dentro de tu embudo.",
    duration: "—",
    thumb: "/episode-thumbs/s1e3.svg",
    inlineCheckoutKey: "minivsl",
    agentUrl: "https://chatgpt.com/g/SEU_GPT_MINIVSL_ID",
    agentProductName: "Agente Copy Mini VSL's",
    notes: `
      <div class="attention-block">
        <div class="ah">
          <span class="ah-icon">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
          <h4>Atención</h4>
        </div>
        <p><strong>Este agente no es obligatorio para la construcción del embudo.</strong></p>
        <p>Además, no fue ofrecido en la oferta mediante la cual adquiriste el entrenamiento.</p>
        <p>Se trata de un agente complementario, pensado para quienes desean insertar una <strong>Mini VSL</strong> dentro del embudo, creando narrativas más largas, especialmente en productos en los que se necesita más tiempo para convencer al lead o cuando el objetivo es aumentar el valor percibido y el precio de tu producto.</p>
        <p>Sirve para mejorar aún más la copy y agregar más valor estratégico al embudo gamificado.</p>
      </div>
    `,
  },
  {
    num: 4,
    videoId: "VIDEO_ID_TODO",
    title: "Agente Copywriter",
    desc: "El agente que transforma ideas en copy que vende.",
    duration: "—",
    thumb: "/episode-thumbs/s1e4.svg",
    notes: `
      <a href="https://chatgpt.com/g/SEU_GPT_COPYWRITER_ID" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Pena estilizada (quill) -->
            <path d="M 28 78 L 78 28 L 84 22 L 80 30 L 32 82 Z" fill="none" stroke="#c9a961" stroke-width="2" stroke-linejoin="round"/>
            <!-- Detalhes da plumagem -->
            <line x1="38" y1="70" x2="68" y2="40" stroke="#c9a961" stroke-width="0.8" opacity="0.5"/>
            <line x1="44" y1="76" x2="74" y2="46" stroke="#c9a961" stroke-width="0.8" opacity="0.5"/>
            <line x1="50" y1="72" x2="72" y2="50" stroke="#c9a961" stroke-width="0.8" opacity="0.4"/>
            <!-- Tinta caindo -->
            <circle cx="30" cy="82" r="2" fill="#c9a961"/>
            <circle cx="26" cy="86" r="1.2" fill="#c9a961" opacity="0.7"/>
            <!-- Linhas de texto sendo escrito -->
            <line x1="14" y1="90" x2="60" y2="90" stroke="#c9a961" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>
            <line x1="14" y1="94" x2="42" y2="94" stroke="#c9a961" stroke-width="1" stroke-dasharray="3,2" opacity="0.4"/>
            <!-- Estrela/brilho na ponta -->
            <path d="M 80 22 L 82 18 M 84 22 L 86 20 M 80 26 L 76 28" stroke="#c9a961" stroke-width="1" opacity="0.7"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Agente GPT · Copywriter</div>
          <h4>El Copywriter</h4>
          <p>Tu compañero para escribir copy con ritmo cinematográfico. Especialista en hooks, bridges y CTAs que convierten emoción en acción.</p>
        </div>
        <span class="agent-cta">
          Abrir Agente
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
  {
    num: 5,
    videoId: "VIDEO_ID_TODO",
    title: "Agente Constructor",
    desc: "El agente que ensambla tu embudo en un sistema funcional.",
    duration: "—",
    thumb: "/episode-thumbs/s1e5.svg",
    notes: `
      <a href="https://chatgpt.com/g/SEU_GPT_CONSTRUCTOR_ID" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Compasso de arquiteto -->
            <line x1="50" y1="18" x2="28" y2="78" stroke="#c9a961" stroke-width="2" stroke-linecap="round"/>
            <line x1="50" y1="18" x2="72" y2="78" stroke="#c9a961" stroke-width="2" stroke-linecap="round"/>
            <!-- Topo (parafuso central) -->
            <circle cx="50" cy="18" r="3.5" fill="#c9a961"/>
            <circle cx="50" cy="18" r="1.5" fill="#0a0a0f"/>
            <!-- Pernas com pontas -->
            <circle cx="28" cy="78" r="2" fill="#c9a961"/>
            <circle cx="72" cy="78" r="2" fill="#c9a961"/>
            <!-- Articulação central -->
            <circle cx="50" cy="48" r="5" fill="none" stroke="#c9a961" stroke-width="1.5"/>
            <!-- Régua atravessando -->
            <rect x="14" y="62" width="72" height="7" fill="none" stroke="#c9a961" stroke-width="1.3"/>
            <line x1="22" y1="62" x2="22" y2="69" stroke="#c9a961" stroke-width="0.8"/>
            <line x1="32" y1="62" x2="32" y2="69" stroke="#c9a961" stroke-width="0.8"/>
            <line x1="42" y1="62" x2="42" y2="66" stroke="#c9a961" stroke-width="0.7"/>
            <line x1="52" y1="62" x2="52" y2="66" stroke="#c9a961" stroke-width="0.7"/>
            <line x1="62" y1="62" x2="62" y2="69" stroke="#c9a961" stroke-width="0.8"/>
            <line x1="72" y1="62" x2="72" y2="66" stroke="#c9a961" stroke-width="0.7"/>
            <line x1="82" y1="62" x2="82" y2="69" stroke="#c9a961" stroke-width="0.8"/>
            <!-- Grid blueprint sutil de fundo -->
            <line x1="14" y1="40" x2="86" y2="40" stroke="#c9a961" stroke-width="0.4" opacity="0.25"/>
            <line x1="14" y1="86" x2="86" y2="86" stroke="#c9a961" stroke-width="0.4" opacity="0.25"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Agente GPT · Constructor</div>
          <h4>El Constructor</h4>
          <p>El último paso: ensambla todas las piezas de tu embudo en un sistema funcional. Estructura técnica, secuencia y CTA final.</p>
        </div>
        <span class="agent-cta">
          Abrir Agente
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
]

export const EPISODES_T2: Episode[] = [
  {
    num: 1,
    videoId: "VIDEO_ID_TODO",
    title: "Creando el Embudo",
    desc: "Continuación del entrenamiento — Temporada 2.",
    duration: "—",
    thumb: "/episode-thumbs/s2e1.svg",
    intro: `
      <div class="intro-card">
        <div class="intro-header">
          <span class="marker"></span>
          <h4>Nota del creador</h4>
          <span class="marker"></span>
        </div>
        <p>A partir de ahora, te voy a mostrar cómo construir todo esto en la práctica usando <code>v0</code>, que es la herramienta oficial que utilizo aquí en las clases.</p>
        <p>Pero grábate muy bien esto: nuestro juego no se trata de la herramienta... <strong>se trata del método.</strong></p>
        <p>Si ya estás familiarizado con otra plataforma de <em>vibe coding</em>, no te quedes atado a <code>v0</code>, usa la que prefieras. La lógica, la arquitectura y la estructura de lo que enseño son exactamente las mismas en cualquier lado.</p>
        <p>Puedes pegar el prompt del Agente Constructor en <code>v0</code>, en <code>Lovable</code>, en <code>Bolt</code>, <code>Cursor</code>, <code>Claude Code</code> o en cualquier otra plataforma de <em>vibe coding</em> que conozcas o que llegue a salir al mercado mañana.</p>
        <p class="intro-closing">Domina el método. La herramienta es solo un detalle operativo.</p>
      </div>
    `,
    notes: `
      <div class="attention-block">
        <div class="ah">
          <span class="ah-icon">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
          <h4>Observación</h4>
        </div>
        <p>Si le envías el prompt a <code>v0</code> y él integra <strong>todo el embudo en una sola página</strong>, te va a quedar mal para hacer todas las ediciones. Entonces envíale este prompt a <code>v0</code>:</p>
        <div class="prompt-quote">
          <p>"Quiero que cada etapa del embudo esté <em>dividida en páginas diferentes</em>."</p>
        </div>
      </div>
      <a href="https://v0.app/ref/E843B7" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- "V" estilizado -->
            <path d="M 22 28 L 38 70 L 54 28" fill="none" stroke="#c9a961" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- "0" estilizado -->
            <ellipse cx="68" cy="49" rx="11" ry="14" fill="none" stroke="#c9a961" stroke-width="3.5"/>
            <!-- Linha decorativa abaixo -->
            <line x1="22" y1="80" x2="78" y2="80" stroke="#c9a961" stroke-width="1.5" opacity="0.6"/>
            <!-- Pontos técnicos -->
            <circle cx="22" cy="80" r="2" fill="#c9a961"/>
            <circle cx="78" cy="80" r="2" fill="#c9a961"/>
            <!-- Sparkle/brilho -->
            <path d="M 84 22 L 86 18 M 88 22 L 90 20 M 84 26 L 80 28" stroke="#c9a961" stroke-width="1" opacity="0.7" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Vibe Coding</div>
          <h4>v0 by Vercel</h4>
          <p>La herramienta oficial que utilizo en las clases. Pega el prompt del Agente Constructor aquí para construir el embudo gamificado completo.</p>
        </div>
        <span class="agent-cta">
          Acceder a v0
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
  {
    num: 2,
    videoId: "VIDEO_ID_TODO",
    title: "Editando el Embudo",
    desc: "Continuación del entrenamiento — Temporada 2.",
    duration: "—",
    thumb: "/episode-thumbs/s2e2.svg",
    notes: `
      <div class="attention-block">
        <div class="ah">
          <span class="ah-icon">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
          <h4>Atención</h4>
        </div>
        <p><em>Siempre que vayas a agregar un audio en <code>V0</code>, necesitas "anclar" ese audio a una acción del usuario (un clic en un botón), porque los navegadores bloquean el autoplay con sonido para evitar que las páginas reproduzcan audio automáticamente sin permiso. Por eso, el audio no debe sonar solo al cargar la página; tiene que iniciarse mediante un autoplay vinculado a un botón anterior.</em></p>

        <h5>Ejemplo práctico (página de llamada):</h5>
        <p>Si quieres un audio en la página de llamada de voz, pídele a <code>V0</code> que configure el audio para que empiece a reproducirse automáticamente cuando la persona haga clic en el botón <span class="btn-ref">Atender llamada</span>, así el navegador entiende que hubo interacción y no bloquea la reproducción.</p>

        <h5>Ejemplo de prompt para enviarle a V0:</h5>
        <p>Agrega este audio <span class="placeholder">Envía el audio junto con el prompt</span> en la página <span class="placeholder">Nombre de la página</span>, pero haz que se reproduzca solo después de la interacción del usuario: al hacer clic en este botón que te envié en la imagen <span class="btn-ref">Atender llamada</span> <span class="placeholder">Envía captura del botón</span>, iniciar el audio automáticamente (autoplay). Esto es necesario porque los navegadores bloquean el autoplay con sonido sin un clic.</p>
      </div>

      <div class="attention-block">
        <div class="ah">
          <span class="ah-icon">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
          <h4>Observación</h4>
        </div>
        <p>En caso de que agregues un audio/video y <code>v0</code> no lo reproduzca, abre la <strong>consola del navegador</strong>, copia el código o error que aparezca allí y envíalo a <code>v0</code> para que lo analice.</p>

        <div class="step-guide">
          <!-- PASO 1: Inspeccionar -->
          <div class="step-card">
            <span class="step-num">1</span>
            <div class="step-img">
              <svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="bgStep1" x1="0" y1="0" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0a0a0f"/>
                    <stop offset="100%" stop-color="#1a1a24"/>
                  </linearGradient>
                </defs>
                <rect width="320" height="240" fill="url(#bgStep1)"/>
                <!-- Browser context menu -->
                <rect x="50" y="20" width="220" height="200" rx="3" fill="#1a1a24" stroke="#2a2a35" stroke-width="1"/>
                <!-- Items genéricos -->
                <rect x="65" y="35" width="160" height="5" rx="1" fill="#3a3a45"/>
                <rect x="65" y="50" width="120" height="5" rx="1" fill="#3a3a45"/>
                <line x1="55" y1="70" x2="265" y2="70" stroke="#2a2a35"/>
                <rect x="65" y="82" width="140" height="5" rx="1" fill="#3a3a45"/>
                <rect x="65" y="97" width="100" height="5" rx="1" fill="#3a3a45"/>
                <line x1="55" y1="115" x2="265" y2="115" stroke="#2a2a35"/>
                <rect x="65" y="127" width="160" height="5" rx="1" fill="#3a3a45"/>
                <rect x="65" y="142" width="130" height="5" rx="1" fill="#3a3a45"/>
                <rect x="65" y="157" width="150" height="5" rx="1" fill="#3a3a45"/>
                <line x1="55" y1="175" x2="265" y2="175" stroke="#2a2a35"/>
                <!-- Item destacado: INSPECCIONAR -->
                <rect x="48" y="187" width="224" height="22" fill="rgba(127,29,29,0.35)" stroke="#7f1d1d" stroke-width="2"/>
                <text x="68" y="202" font-family="monospace" font-size="10" fill="#fff" font-weight="700" letter-spacing="2">INSPECCIONAR</text>
                <!-- Cursor -->
                <path d="M 235 192 L 235 215 L 241 209 L 247 222 L 252 220 L 246 207 L 254 206 Z" fill="#fff" stroke="#000" stroke-width="0.5"/>
              </svg>
            </div>
            <div class="step-caption">
              <span class="lbl">Paso 1</span>
              <span class="desc">Click derecho → Inspeccionar</span>
            </div>
          </div>

          <!-- PASO 2: Console tab -->
          <div class="step-card">
            <span class="step-num">2</span>
            <div class="step-img">
              <svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="bgStep2" x1="0" y1="0" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0a0a0f"/>
                    <stop offset="100%" stop-color="#1a1a24"/>
                  </linearGradient>
                </defs>
                <rect width="320" height="240" fill="url(#bgStep2)"/>
                <!-- DevTools panel -->
                <rect x="20" y="20" width="280" height="200" rx="3" fill="#0f0f17" stroke="#2a2a35" stroke-width="1"/>
                <!-- Header bar -->
                <rect x="20" y="20" width="280" height="28" fill="#16161e"/>
                <!-- Tabs -->
                <rect x="30" y="28" width="48" height="18" rx="2" fill="#2a2a35"/>
                <text x="36" y="40" font-family="monospace" font-size="8" fill="#a0a0b0">Elements</text>
                <!-- Console tab destacada -->
                <rect x="83" y="25" width="56" height="22" fill="rgba(127,29,29,0.35)" stroke="#7f1d1d" stroke-width="2"/>
                <text x="93" y="40" font-family="monospace" font-size="9" fill="#fff" font-weight="700" letter-spacing="1">Console</text>
                <rect x="143" y="28" width="42" height="18" rx="2" fill="#2a2a35"/>
                <text x="148" y="40" font-family="monospace" font-size="8" fill="#a0a0b0">Sources</text>
                <rect x="190" y="28" width="38" height="18" rx="2" fill="#2a2a35"/>
                <text x="195" y="40" font-family="monospace" font-size="8" fill="#a0a0b0">Network</text>
                <!-- Log entries (simulando errors/info) -->
                <rect x="30" y="62" width="3" height="6" fill="#7f1d1d"/>
                <rect x="40" y="62" width="180" height="4" rx="1" fill="#7f1d1d" opacity="0.7"/>
                <rect x="30" y="78" width="3" height="6" fill="#c9a961"/>
                <rect x="40" y="78" width="220" height="4" rx="1" fill="#c9a961" opacity="0.6"/>
                <rect x="30" y="94" width="3" height="6" fill="#7f1d1d"/>
                <rect x="40" y="94" width="160" height="4" rx="1" fill="#7f1d1d" opacity="0.7"/>
                <rect x="40" y="104" width="200" height="4" rx="1" fill="#a0a0b0" opacity="0.4"/>
                <rect x="30" y="120" width="3" height="6" fill="#c9a961"/>
                <rect x="40" y="120" width="190" height="4" rx="1" fill="#c9a961" opacity="0.6"/>
                <rect x="30" y="136" width="3" height="6" fill="#7f1d1d"/>
                <rect x="40" y="136" width="170" height="4" rx="1" fill="#7f1d1d" opacity="0.7"/>
                <rect x="40" y="146" width="220" height="4" rx="1" fill="#a0a0b0" opacity="0.4"/>
                <rect x="30" y="162" width="3" height="6" fill="#a0a0b0"/>
                <rect x="40" y="162" width="180" height="4" rx="1" fill="#a0a0b0" opacity="0.5"/>
                <rect x="30" y="178" width="3" height="6" fill="#7f1d1d"/>
                <rect x="40" y="178" width="200" height="4" rx="1" fill="#7f1d1d" opacity="0.7"/>
                <!-- Input prompt -->
                <line x1="20" y1="195" x2="300" y2="195" stroke="#2a2a35"/>
                <text x="30" y="210" font-family="monospace" font-size="13" fill="#7f1d1d" font-weight="700">&gt;</text>
                <rect x="44" y="206" width="80" height="2" fill="#fff" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.2s" repeatCount="indefinite"/>
                </rect>
              </svg>
            </div>
            <div class="step-caption">
              <span class="lbl">Paso 2</span>
              <span class="desc">Selecciona la pestaña "Console"</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ CRÉDITOS GRATIS — guia de duplicação v0 ═══ -->
      <div class="credit-block">
        <div class="ch">
          <span class="ch-icon">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
              <line x1="16" y1="9" x2="16" y2="23" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              <line x1="9" y1="16" x2="23" y2="16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
            </svg>
          </span>
          <h4>Créditos Gratis</h4>
        </div>

        <div class="step-list">
          <div class="step-row">
            <span class="step-marker">1º Paso:</span>
            <div class="step-content">
              <p>Crea una nueva cuenta en <code>v0</code>.</p>
            </div>
          </div>

          <div class="step-row">
            <span class="step-marker">2º Paso:</span>
            <div class="step-content">
              <p>Haz clic en <strong>"Compartir"</strong>:</p>
              <div class="mock-frame">
                <svg viewBox="0 0 360 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <!-- Botão Compartir (destacado) -->
                  <rect x="50" y="25" width="120" height="40" rx="6" fill="#1a1a24" stroke="#2a2a35" stroke-width="1"/>
                  <!-- Cadeado (Lucide-style lock) -->
                  <rect x="73" y="42" width="14" height="11" rx="1.5" fill="none" stroke="#fff" stroke-width="1.6"/>
                  <path d="M 76 42 L 76 38 a 4 4 0 0 1 8 0 L 84 42" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
                  <text x="95" y="50" font-family="serif" font-size="14" font-weight="600" fill="#fff">Compartir</text>
                  <!-- Círculo vermelho de destaque -->
                  <ellipse cx="110" cy="45" rx="68" ry="26" class="mock-circle"/>
                  <!-- Botão Publish (não destacado) -->
                  <rect x="190" y="25" width="100" height="40" rx="6" fill="#1a1a24" stroke="#2a2a35" stroke-width="1"/>
                  <path d="M 210 38 L 218 38 M 210 42 L 222 42 M 210 46 L 218 46 M 210 50 L 222 50" stroke="#a0a0b0" stroke-width="1.2" stroke-linecap="round"/>
                  <text x="232" y="50" font-family="serif" font-size="14" font-weight="600" fill="#a0a0b0">Publish</text>
                  <!-- Avatar circular gradient -->
                  <defs>
                    <linearGradient id="avtg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#5b8def"/>
                      <stop offset="100%" stop-color="#a855f7"/>
                    </linearGradient>
                  </defs>
                  <circle cx="320" cy="45" r="14" fill="url(#avtg)"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="step-row">
            <span class="step-marker">3º Paso:</span>
            <div class="step-content">
              <p>En <strong>"Visibility"</strong>, selecciona: <strong>Anyone with the link</strong>:</p>
              <div class="mock-frame">
                <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <!-- Item Private com cadeado -->
                  <rect x="20" y="15" width="360" height="40" rx="3" fill="#1a1a24" stroke="#2a2a35" stroke-width="1"/>
                  <rect x="38" y="29" width="14" height="11" rx="1.5" fill="none" stroke="#a0a0b0" stroke-width="1.6"/>
                  <path d="M 41 29 L 41 25 a 4 4 0 0 1 8 0 L 49 29" fill="none" stroke="#a0a0b0" stroke-width="1.6" stroke-linecap="round"/>
                  <text x="70" y="40" font-family="serif" font-size="14" font-weight="500" fill="#a0a0b0">Private</text>

                  <!-- Item destacado: Anyone with the link (ícone de clipe) -->
                  <rect x="20" y="100" width="360" height="40" rx="3" fill="#1a1a24" stroke="#2a2a35" stroke-width="1"/>
                  <!-- Paperclip icon (Lucide-style) -->
                  <path d="M 53 116 L 47 122 a 4 4 0 1 1 -5.5 -5.5 L 49 109 a 2.5 2.5 0 0 1 3.5 3.5 L 45 120 a 1 1 0 0 1 -1.5 -1.5 L 50 113" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  <text x="70" y="125" font-family="serif" font-size="14" font-weight="600" fill="#fff">Anyone with the link</text>
                  <!-- Círculo vermelho destacando -->
                  <ellipse cx="180" cy="120" rx="160" ry="24" class="mock-circle"/>

                  <!-- Anyone on the web (ícone de globo/rede) -->
                  <rect x="20" y="148" width="360" height="40" rx="3" fill="#1a1a24" stroke="#2a2a35" stroke-width="1"/>
                  <circle cx="46" cy="168" r="8.5" fill="none" stroke="#888" stroke-width="1.5"/>
                  <line x1="37.5" y1="168" x2="54.5" y2="168" stroke="#888" stroke-width="1.2"/>
                  <ellipse cx="46" cy="168" rx="3.5" ry="8.5" fill="none" stroke="#888" stroke-width="1.2"/>
                  <text x="70" y="173" font-family="serif" font-size="14" font-weight="500" fill="#888">Anyone on the web</text>
                </svg>
              </div>
            </div>
          </div>

          <div class="step-row">
            <span class="step-marker">4º Paso:</span>
            <div class="step-content">
              <p><strong>Copiar enlace</strong>:</p>
              <div class="mock-frame">
                <svg viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <!-- Modal frame -->
                  <rect x="10" y="10" width="420" height="260" rx="6" fill="#0f0f17" stroke="#2a2a35" stroke-width="1"/>
                  <!-- Title -->
                  <text x="30" y="40" font-family="serif" font-size="16" font-weight="600" fill="#fff">Share</text>
                  <line x1="10" y1="55" x2="430" y2="55" stroke="#2a2a35"/>
                  <!-- People with access -->
                  <text x="30" y="75" font-family="serif" font-size="11" fill="#a0a0b0">People with access</text>
                  <defs>
                    <linearGradient id="modAv" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#5b8def"/>
                      <stop offset="100%" stop-color="#a855f7"/>
                    </linearGradient>
                  </defs>
                  <circle cx="42" cy="105" r="14" fill="url(#modAv)"/>
                  <text x="65" y="103" font-family="serif" font-size="12" font-weight="600" fill="#fff">usuario-ejemplo (you)</text>
                  <text x="65" y="118" font-family="serif" font-size="11" fill="#a0a0b0">admin@SEU_DOMINIO.com</text>
                  <rect x="335" y="93" width="80" height="24" rx="3" fill="#1a1a24" stroke="#2a2a35"/>
                  <text x="350" y="109" font-family="serif" font-size="11" fill="#a0a0b0">Owner</text>
                  <!-- Visibility -->
                  <text x="30" y="150" font-family="serif" font-size="11" fill="#a0a0b0">Visibility</text>
                  <rect x="30" y="160" width="220" height="32" rx="3" fill="#1a1a24" stroke="#2a2a35"/>
                  <!-- Paperclip icon (Lucide-style) -->
                  <path d="M 52 173 L 47 178 a 3.5 3.5 0 1 1 -5 -5 L 48 167 a 2 2 0 0 1 3 3 L 45 176 a 0.8 0.8 0 0 1 -1.2 -1.2 L 49 170" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  <text x="65" y="180" font-family="serif" font-size="11" fill="#fff">Anyone with the link</text>
                  <rect x="260" y="160" width="100" height="32" rx="3" fill="#1a1a24" stroke="#2a2a35"/>
                  <text x="280" y="180" font-family="serif" font-size="11" fill="#a0a0b0">Can View</text>
                  <!-- Copiar enlace btn -->
                  <line x1="10" y1="220" x2="430" y2="220" stroke="#2a2a35"/>
                  <text x="30" y="246" font-family="serif" font-size="10" fill="#888">How does sharing chats work?</text>
                  <rect x="270" y="232" width="140" height="32" rx="3" fill="#1a1a24" stroke="#2a2a35"/>
                  <!-- Paperclip icon (Lucide-style) -->
                  <path d="M 296 245 L 291 250 a 3.5 3.5 0 1 1 -5 -5 L 292 239 a 2 2 0 0 1 3 3 L 289 248 a 0.8 0.8 0 0 1 -1.2 -1.2 L 293 242" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  <text x="307" y="252" font-family="serif" font-size="12" font-weight="600" fill="#fff">Copiar enlace</text>
                  <!-- Círculo vermelho destacando -->
                  <ellipse cx="338" cy="248" rx="80" ry="22" class="mock-circle"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="step-row">
            <span class="step-marker">5º Paso:</span>
            <div class="step-content">
              <p>Pega el enlace en el navegador con una <strong>cuenta nueva</strong> abierta.</p>
            </div>
          </div>

          <div class="step-row">
            <span class="step-marker">6º Paso:</span>
            <div class="step-content">
              <p>Y haz clic en <strong>"Duplicate"</strong>:</p>
              <div class="mock-frame">
                <svg viewBox="0 0 360 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <!-- Flag button -->
                  <rect x="50" y="25" width="44" height="40" rx="6" fill="#1a1a24" stroke="#2a2a35"/>
                  <path d="M 67 38 L 67 56 M 67 38 L 78 38 L 75 43 L 78 48 L 67 48" fill="none" stroke="#a0a0b0" stroke-width="1.5" stroke-linejoin="round"/>
                  <!-- Share button -->
                  <rect x="105" y="25" width="80" height="40" rx="6" fill="#1a1a24" stroke="#2a2a35"/>
                  <circle cx="125" cy="38" r="3" fill="none" stroke="#a0a0b0" stroke-width="1.2"/>
                  <circle cx="120" cy="48" r="3" fill="none" stroke="#a0a0b0" stroke-width="1.2"/>
                  <circle cx="130" cy="48" r="3" fill="none" stroke="#a0a0b0" stroke-width="1.2"/>
                  <line x1="123" y1="40" x2="121" y2="46" stroke="#a0a0b0" stroke-width="1.2"/>
                  <line x1="127" y1="40" x2="129" y2="46" stroke="#a0a0b0" stroke-width="1.2"/>
                  <text x="142" y="50" font-family="serif" font-size="13" fill="#a0a0b0">Share</text>
                  <!-- Duplicate button (destacado) -->
                  <rect x="195" y="25" width="100" height="40" rx="6" fill="#1a1a24" stroke="#2a2a35"/>
                  <rect x="210" y="35" width="14" height="14" rx="2" fill="none" stroke="#fff" stroke-width="1.5"/>
                  <rect x="216" y="41" width="14" height="14" rx="2" fill="#1a1a24" stroke="#fff" stroke-width="1.5"/>
                  <text x="237" y="50" font-family="serif" font-size="13" font-weight="600" fill="#fff">Duplicate</text>
                  <ellipse cx="245" cy="45" rx="58" ry="25" class="mock-circle"/>
                  <!-- Avatar -->
                  <defs>
                    <linearGradient id="dupAv" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#5b8def"/>
                      <stop offset="100%" stop-color="#a855f7"/>
                    </linearGradient>
                  </defs>
                  <circle cx="320" cy="45" r="14" fill="url(#dupAv)"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="step-row">
            <span class="step-marker">7º Paso:</span>
            <div class="step-content">
              <p>Confirma la duplicación y <strong>continúa con tu proyecto</strong>.</p>
            </div>
          </div>
        </div>
      </div>
    `,
  },
]

export const EPISODES_T3: Episode[] = [
  {
    num: 1,
    videoId: "VIDEO_ID_TODO",
    title: "Generando Voces Emocionales con IA",
    desc: "Continuación del entrenamiento — Temporada 3.",
    duration: "—",
    thumb: "/episode-thumbs/s3e1.svg",
    notes: `
      <a href="https://www.capcut.com/capcut_pc_web/fission_receive?code=r2XKZe50211520&lng=pt-BR" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Símbolo CapCut: tesoura + película -->
            <!-- Tesoura (scissors) -->
            <circle cx="32" cy="38" r="6" fill="none" stroke="#c9a961" stroke-width="2"/>
            <circle cx="32" cy="62" r="6" fill="none" stroke="#c9a961" stroke-width="2"/>
            <line x1="36" y1="42" x2="68" y2="58" stroke="#c9a961" stroke-width="2" stroke-linecap="round"/>
            <line x1="36" y1="58" x2="68" y2="42" stroke="#c9a961" stroke-width="2" stroke-linecap="round"/>
            <!-- Película de filme abaixo -->
            <rect x="22" y="76" width="56" height="6" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.6"/>
            <line x1="30" y1="76" x2="30" y2="82" stroke="#c9a961" stroke-width="0.8" opacity="0.6"/>
            <line x1="42" y1="76" x2="42" y2="82" stroke="#c9a961" stroke-width="0.8" opacity="0.6"/>
            <line x1="54" y1="76" x2="54" y2="82" stroke="#c9a961" stroke-width="0.8" opacity="0.6"/>
            <line x1="66" y1="76" x2="66" y2="82" stroke="#c9a961" stroke-width="0.8" opacity="0.6"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Edición de Video</div>
          <h4>CapCut</h4>
          <p>Editor de video oficial recomendado para producir tus VSLs y mini-videos del embudo. Click derecho para créditos extra mediante el enlace de invitación.</p>
        </div>
        <span class="agent-cta">
          Acceder a CapCut
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>

      <a href="https://aistudio.google.com/generate-speech" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Speech waveform (barras verticais simulando ondas) -->
            <line x1="28" y1="50" x2="28" y2="50" stroke="#c9a961" stroke-width="3" stroke-linecap="round"/>
            <line x1="34" y1="44" x2="34" y2="56" stroke="#c9a961" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="38" x2="40" y2="62" stroke="#c9a961" stroke-width="3" stroke-linecap="round"/>
            <line x1="46" y1="32" x2="46" y2="68" stroke="#c9a961" stroke-width="3" stroke-linecap="round"/>
            <line x1="52" y1="38" x2="52" y2="62" stroke="#c9a961" stroke-width="3" stroke-linecap="round"/>
            <line x1="58" y1="44" x2="58" y2="56" stroke="#c9a961" stroke-width="3" stroke-linecap="round"/>
            <line x1="64" y1="42" x2="64" y2="58" stroke="#c9a961" stroke-width="3" stroke-linecap="round"/>
            <line x1="70" y1="48" x2="70" y2="52" stroke="#c9a961" stroke-width="3" stroke-linecap="round"/>
            <!-- Sparkle (AI indicator) -->
            <path d="M 76 24 L 78 20 L 80 24 L 84 26 L 80 28 L 78 32 L 76 28 L 72 26 Z" fill="#c9a961" opacity="0.85"/>
            <path d="M 22 76 L 23 73 L 24 76 L 27 77 L 24 78 L 23 81 L 22 78 L 19 77 Z" fill="#c9a961" opacity="0.6"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · IA Generativa</div>
          <h4>Google AI Studio</h4>
          <p>Genera audios profesionales para tus VSLs usando voces sintéticas de Google (Generate Speech). Calidad broadcast con texto-a-voz avanzado.</p>
        </div>
        <span class="agent-cta">
          Acceder a AI Studio
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>

      <a href="https://y2meta.is/en91/" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Frame de vídeo com play -->
            <rect x="22" y="22" width="56" height="36" rx="3" fill="none" stroke="#c9a961" stroke-width="1.8"/>
            <polygon points="42,32 42,48 58,40" fill="#c9a961"/>
            <!-- Arrow down (download) -->
            <line x1="50" y1="62" x2="50" y2="80" stroke="#c9a961" stroke-width="2.2" stroke-linecap="round"/>
            <polyline points="42,73 50,82 58,73" fill="none" stroke="#c9a961" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Descargas</div>
          <h4>Y2Meta</h4>
          <p>Descarga videos de YouTube y otras plataformas para usar como recursos en tus producciones.</p>
        </div>
        <span class="agent-cta">
          Acceder a Y2Meta
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
  {
    num: 2,
    videoId: "VIDEO_ID_TODO",
    title: "Creando un Avatar Ficticio",
    desc: "Continuación del entrenamiento — Temporada 3.",
    duration: "—",
    thumb: "/episode-thumbs/s3e2.svg",
    notes: `
      <a href="https://gemini.google.com/app?hl=pt-BR" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Logo Gemini estilizado: estrela de 4 pontas (diamante) -->
            <path d="M 50 22 L 56 44 L 78 50 L 56 56 L 50 78 L 44 56 L 22 50 L 44 44 Z"
                  fill="none" stroke="#c9a961" stroke-width="2" stroke-linejoin="round"/>
            <path d="M 50 32 L 53 47 L 68 50 L 53 53 L 50 68 L 47 53 L 32 50 L 47 47 Z"
                  fill="#c9a961" opacity="0.4"/>
            <!-- Sparkle pequeno orbitando -->
            <circle cx="78" cy="22" r="2" fill="#c9a961"/>
            <circle cx="22" cy="78" r="1.5" fill="#c9a961" opacity="0.6"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · IA Generativa</div>
          <h4>Gemini</h4>
          <p>Asistente de IA de Google. Úsalo para investigación, generación de copy adicional, brainstorming y refinamiento de ideas dentro de tu embudo.</p>
        </div>
        <span class="agent-cta">
          Acceder a Gemini
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
  {
    num: 3,
    videoId: "VIDEO_ID_TODO",
    title: "Creando un Avatar Ultrarealista",
    desc: "Continuación del entrenamiento — Temporada 3.",
    duration: "—",
    thumb: "/episode-thumbs/s3e3.svg",
    notes: `
      <a href="https://www.heygen.com/?sid=rewardful&via=SEU_AFFILIATE_ID" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Avatar humano (cabeça + ombros) -->
            <circle cx="50" cy="40" r="13" fill="none" stroke="#c9a961" stroke-width="2"/>
            <path d="M 28 78 L 28 68 Q 28 56 50 56 Q 72 56 72 68 L 72 78" fill="none" stroke="#c9a961" stroke-width="2" stroke-linecap="round"/>
            <!-- Halo cinematográfico em volta da cabeça -->
            <circle cx="50" cy="40" r="17" fill="none" stroke="#c9a961" stroke-width="0.6" opacity="0.4" stroke-dasharray="2,2"/>
            <!-- Sparkle indicando IA -->
            <path d="M 76 22 L 78 18 L 80 22 L 84 24 L 80 26 L 78 30 L 76 26 L 72 24 Z" fill="#c9a961" opacity="0.85"/>
            <path d="M 22 70 L 23 67 L 24 70 L 27 71 L 24 72 L 23 75 L 22 72 L 19 71 Z" fill="#c9a961" opacity="0.5"/>
            <!-- Linha de play (indicando vídeo) -->
            <polygon points="46,38 46,46 54,42" fill="#c9a961" opacity="0.7"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Avatar IA</div>
          <h4>HeyGen</h4>
          <p>Crea videos profesionales con avatares de IA hablando en cualquier idioma. Ideal para personalizar las VSLs sin necesidad de grabarte.</p>
        </div>
        <span class="agent-cta">
          Acceder a HeyGen
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
  {
    num: 4,
    videoId: "VIDEO_ID_TODO",
    title: "Editando el Video del Avatar",
    desc: "Continuación del entrenamiento — Temporada 3.",
    duration: "—",
    thumb: "/episode-thumbs/s3e4.svg",
    notes: `
      <a href="https://labs.google/fx/pt/tools/flow" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Camera lens (lente principal — vídeo IA) -->
            <circle cx="50" cy="50" r="22" fill="none" stroke="#c9a961" stroke-width="2"/>
            <circle cx="50" cy="50" r="14" fill="none" stroke="#c9a961" stroke-width="1.2" opacity="0.6"/>
            <circle cx="50" cy="50" r="6" fill="#c9a961" opacity="0.35"/>
            <!-- Play triangle (indicando vídeo) -->
            <polygon points="46,44 46,56 56,50" fill="#c9a961"/>
            <!-- Aperture lines (8 raios saindo da lente) -->
            <line x1="50" y1="20" x2="50" y2="26" stroke="#c9a961" stroke-width="1.2" opacity="0.5"/>
            <line x1="50" y1="74" x2="50" y2="80" stroke="#c9a961" stroke-width="1.2" opacity="0.5"/>
            <line x1="20" y1="50" x2="26" y2="50" stroke="#c9a961" stroke-width="1.2" opacity="0.5"/>
            <line x1="74" y1="50" x2="80" y2="50" stroke="#c9a961" stroke-width="1.2" opacity="0.5"/>
            <line x1="29" y1="29" x2="33" y2="33" stroke="#c9a961" stroke-width="1.2" opacity="0.5"/>
            <line x1="67" y1="33" x2="71" y2="29" stroke="#c9a961" stroke-width="1.2" opacity="0.5"/>
            <line x1="29" y1="71" x2="33" y2="67" stroke="#c9a961" stroke-width="1.2" opacity="0.5"/>
            <line x1="67" y1="67" x2="71" y2="71" stroke="#c9a961" stroke-width="1.2" opacity="0.5"/>
            <!-- Sparkle IA -->
            <path d="M 80 22 L 82 18 L 84 22 L 88 24 L 84 26 L 82 30 L 80 26 L 76 24 Z" fill="#c9a961" opacity="0.85"/>
            <path d="M 16 80 L 17 77 L 18 80 L 21 81 L 18 82 L 17 85 L 16 82 L 13 81 Z" fill="#c9a961" opacity="0.5"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Generación de Video IA</div>
          <h4>Veo 3 (Google Flow)</h4>
          <p>Modelo de generación de video con IA de Google. Crea cinemáticas, transiciones y B-rolls profesionales a partir de prompts de texto.</p>
        </div>
        <span class="agent-cta">
          Acceder a Veo 3
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
  {
    num: 5,
    videoId: "VIDEO_ID_TODO",
    title: "Editando el Audio del Avatar",
    desc: "Continuación del entrenamiento — Temporada 3.",
    duration: "—",
    thumb: "/episode-thumbs/s3e5.svg",
    notes: `
      <a href="https://try.elevenlabs.io/vh9be1ry08ma" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Microfone (mic body) -->
            <rect x="42" y="22" width="16" height="30" rx="8" fill="none" stroke="#c9a961" stroke-width="2"/>
            <line x1="50" y1="30" x2="50" y2="44" stroke="#c9a961" stroke-width="1" opacity="0.5"/>
            <!-- Mic stand/arc -->
            <path d="M 32 48 a 18 18 0 0 0 36 0" fill="none" stroke="#c9a961" stroke-width="2" stroke-linecap="round"/>
            <line x1="50" y1="66" x2="50" y2="74" stroke="#c9a961" stroke-width="2" stroke-linecap="round"/>
            <line x1="42" y1="74" x2="58" y2="74" stroke="#c9a961" stroke-width="2" stroke-linecap="round"/>
            <!-- Waveform à esquerda (áudio entrando) -->
            <line x1="22" y1="40" x2="22" y2="40" stroke="#c9a961" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="26" y1="36" x2="26" y2="44" stroke="#c9a961" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="30" y1="32" x2="30" y2="48" stroke="#c9a961" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
            <!-- Waveform à direita -->
            <line x1="70" y1="32" x2="70" y2="48" stroke="#c9a961" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
            <line x1="74" y1="36" x2="74" y2="44" stroke="#c9a961" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="78" y1="40" x2="78" y2="40" stroke="#c9a961" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Sparkle IA -->
            <path d="M 80 22 L 82 18 L 84 22 L 88 24 L 84 26 L 82 30 L 80 26 L 76 24 Z" fill="#c9a961" opacity="0.85"/>
            <path d="M 16 78 L 17 75 L 18 78 L 21 79 L 18 80 L 17 83 L 16 80 L 13 79 Z" fill="#c9a961" opacity="0.5"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Voz IA</div>
          <h4>ElevenLabs</h4>
          <p>Genera voces sintéticas hiperrealistas en cualquier idioma. La calidad de voz IA más natural del mercado para tus VSLs.</p>
        </div>
        <span class="agent-cta">
          Acceder a ElevenLabs
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>

      <div class="attention-block">
        <div class="ah">
          <span class="ah-icon">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
          <h4>Da tu Feedback</h4>
        </div>
        <p>Quiero mucho escuchar tu <strong>feedback</strong> sobre el entrenamiento.</p>
        <p>Tu opinión es de extrema importancia para que pueda mejorar cada vez más, y cualquier sugerencia, crítica o reclamo será bienvenido.</p>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSfjpBD4lCEP3kA22Ku0SVKzjN5rbT2KVwJrM82cKTyOgFMV_w/viewform?usp=dialog" target="_blank" rel="noopener" class="agent-cta gold" style="margin-top:1rem">
          Enviar Feedback
          <i data-lucide="message-square" style="width:14px;height:14px"></i>
        </a>
      </div>
    `,
  },
  {
    num: 6,
    videoId: "VIDEO_ID_TODO",
    title: "Incorporando Video en V0",
    desc: "Continuación del entrenamiento — Temporada 3.",
    duration: "—",
    thumb: "/episode-thumbs/s3e6.svg",
    notes: `
      <a href="https://www.vturb.com/?via=SEU_AFFILIATE_ID" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Player de vídeo (frame principal) -->
            <rect x="22" y="26" width="56" height="36" rx="3" fill="none" stroke="#c9a961" stroke-width="2"/>
            <!-- Play button central -->
            <polygon points="42,36 42,52 56,44" fill="#c9a961"/>
            <!-- Barra de progresso -->
            <line x1="22" y1="60" x2="78" y2="60" stroke="#c9a961" stroke-width="1" opacity="0.4"/>
            <line x1="22" y1="60" x2="48" y2="60" stroke="#c9a961" stroke-width="1.8"/>
            <circle cx="48" cy="60" r="2" fill="#c9a961"/>
            <!-- Analytics/dashboard bars abaixo (representando métricas do vTurb) -->
            <rect x="24" y="72" width="6" height="10" fill="#c9a961" opacity="0.5"/>
            <rect x="34" y="68" width="6" height="14" fill="#c9a961" opacity="0.7"/>
            <rect x="44" y="74" width="6" height="8" fill="#c9a961" opacity="0.4"/>
            <rect x="54" y="66" width="6" height="16" fill="#c9a961" opacity="0.85"/>
            <rect x="64" y="70" width="6" height="12" fill="#c9a961" opacity="0.6"/>
            <rect x="74" y="78" width="2" height="4" fill="#c9a961" opacity="0.3"/>
            <!-- Sparkle -->
            <path d="M 80 22 L 82 18 L 84 22 L 88 24 L 84 26 L 82 30 L 80 26 L 76 24 Z" fill="#c9a961" opacity="0.85"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Video Player</div>
          <h4>vTurb</h4>
          <p>Player de video profesional con analytics avanzados. La plataforma oficial que utilizamos para hospedar las VSLs del embudo con tracking integrado.</p>
        </div>
        <span class="agent-cta">
          Acceder a vTurb
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
]

export const EPISODES_T4: Episode[] = [
  {
    num: 1,
    videoId: "VIDEO_ID_TODO",
    title: "Agregando el Píxel de Facebook al Proyecto",
    desc: "Continuación del entrenamiento — Temporada 4.",
    duration: "—",
    thumb: "/episode-thumbs/s4e1.svg",
    intro: `
      <div class="attention-block">
        <div class="ah">
          <span class="ah-icon">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
          <h4>Este módulo no tiene audio</h4>
        </div>
        <p>Los videos son muy cortos, de aproximadamente <strong>1 minuto</strong>, y he marcado todos los botones en los que debes hacer clic para implementar el proceso. Solo tienes que copiar el paso a paso.</p>
        <p>Si surge alguna duda, escríbeme al soporte y con gusto te ayudo.</p>
      </div>
    `,
    notes: `
      <div class="attention-block">
        <div class="ah">
          <span class="ah-icon">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
          <h4>Prompt para v0</h4>
        </div>
        <p>Pega este prompt en <code>v0</code> junto con el código del Píxel de Facebook:</p>
        <div class="prompt-quote">
          <p>Agrega este código del píxel de Facebook en el head del sitio:</p>
          <p><em>[CÓDIGO PÍXEL AQUÍ]</em></p>
        </div>
      </div>
    `,
  },
  {
    num: 2,
    videoId: "VIDEO_ID_TODO",
    title: "Agregando Microsoft Clarity al Proyecto",
    desc: "Continuación del entrenamiento — Temporada 4.",
    duration: "—",
    thumb: "/episode-thumbs/s4e2.svg",
    notes: `
      <div class="attention-block">
        <div class="ah">
          <span class="ah-icon">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 16 5 L 28 26 L 4 26 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M 16 9 L 25 24 L 7 24 Z" fill="currentColor" opacity="0.12"/>
              <line x1="16" y1="13" x2="16" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="16" cy="22.5" r="0.95" fill="currentColor"/>
            </svg>
          </span>
          <h4>Prompt para v0</h4>
        </div>
        <p>Pega este prompt en <code>v0</code> junto con el código de Microsoft Clarity:</p>
        <div class="prompt-quote">
          <p>Agrega este código del Microsoft Clarity debajo del head del sitio:</p>
          <p><em>[CÓDIGO CLARITY AQUÍ]</em></p>
        </div>
      </div>
      <a href="https://clarity.microsoft.com/" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Heatmap grid (representando análise de comportamento) -->
            <rect x="24" y="24" width="14" height="14" fill="#c9a961" opacity="0.85"/>
            <rect x="40" y="24" width="14" height="14" fill="#c9a961" opacity="0.55"/>
            <rect x="56" y="24" width="14" height="14" fill="#c9a961" opacity="0.25"/>
            <rect x="24" y="40" width="14" height="14" fill="#c9a961" opacity="0.65"/>
            <rect x="40" y="40" width="14" height="14" fill="#c9a961" opacity="1"/>
            <rect x="56" y="40" width="14" height="14" fill="#c9a961" opacity="0.45"/>
            <rect x="24" y="56" width="14" height="14" fill="#c9a961" opacity="0.35"/>
            <rect x="40" y="56" width="14" height="14" fill="#c9a961" opacity="0.55"/>
            <rect x="56" y="56" width="14" height="14" fill="#c9a961" opacity="0.75"/>
            <!-- Cursor de clique -->
            <path d="M 70 72 L 70 84 L 74 80 L 78 88 L 82 86 L 78 78 L 84 78 Z" fill="#c9a961" stroke="#0a0a0f" stroke-width="0.8"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Analytics</div>
          <h4>Microsoft Clarity</h4>
          <p>Mapas de calor, grabaciones de sesión y análisis de comportamiento del usuario — gratuito y sin límites. Esencial para entender cómo los visitantes interactúan con tu embudo.</p>
        </div>
        <span class="agent-cta">
          Acceder a Clarity
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
  {
    num: 3,
    videoId: "VIDEO_ID_TODO",
    title: "Creando un hosting web",
    desc: "Continuación del entrenamiento — Temporada 4.",
    duration: "—",
    thumb: "/episode-thumbs/s4e3.svg",
    notes: `
      <a href="https://www.hostinger.com/" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Server racks empilhados -->
            <rect x="26" y="28" width="48" height="14" rx="2" fill="none" stroke="#c9a961" stroke-width="1.8"/>
            <circle cx="32" cy="35" r="1.6" fill="#c9a961"/>
            <line x1="38" y1="35" x2="68" y2="35" stroke="#c9a961" stroke-width="0.8" opacity="0.5"/>
            <rect x="26" y="46" width="48" height="14" rx="2" fill="none" stroke="#c9a961" stroke-width="1.8"/>
            <circle cx="32" cy="53" r="1.6" fill="#c9a961" opacity="0.7"/>
            <line x1="38" y1="53" x2="68" y2="53" stroke="#c9a961" stroke-width="0.8" opacity="0.5"/>
            <rect x="26" y="64" width="48" height="14" rx="2" fill="none" stroke="#c9a961" stroke-width="1.8"/>
            <circle cx="32" cy="71" r="1.6" fill="#c9a961" opacity="0.4"/>
            <line x1="38" y1="71" x2="68" y2="71" stroke="#c9a961" stroke-width="0.8" opacity="0.5"/>
            <!-- Globo (web hosting) -->
            <circle cx="80" cy="22" r="6" fill="none" stroke="#c9a961" stroke-width="1.2" opacity="0.85"/>
            <ellipse cx="80" cy="22" rx="2.5" ry="6" fill="none" stroke="#c9a961" stroke-width="0.8" opacity="0.7"/>
            <line x1="74" y1="22" x2="86" y2="22" stroke="#c9a961" stroke-width="0.8" opacity="0.7"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Hospedaje y Dominio</div>
          <h4>Hostinger</h4>
          <p>Plataforma de hospedaje web y registro de dominios. Aquí compras tu dominio personalizado y conectas el embudo creado en v0 a tu propia URL profesional.</p>
        </div>
        <span class="agent-cta">
          Acceder a Hostinger
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>
    `,
  },
  {
    num: 4,
    videoId: "VIDEO_ID_TODO",
    title: "Publicar sitio web",
    desc: "Continuación del entrenamiento — Temporada 4.",
    duration: "—",
    thumb: "/episode-thumbs/s4e4.svg",
    notes: `
      <a href="https://vercel.com/" target="_blank" rel="noopener" class="agent-card">
        <div class="agent-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame técnico -->
            <rect x="14" y="14" width="72" height="72" fill="none" stroke="#c9a961" stroke-width="1" opacity="0.3"/>
            <!-- Triângulo Vercel (logo icônico) -->
            <polygon points="50,28 78,72 22,72" fill="none" stroke="#c9a961" stroke-width="2.5" stroke-linejoin="round"/>
            <polygon points="50,38 70,68 30,68" fill="#c9a961" opacity="0.25"/>
            <!-- Linhas de deploy/edge network -->
            <line x1="22" y1="78" x2="78" y2="78" stroke="#c9a961" stroke-width="1" opacity="0.6"/>
            <circle cx="22" cy="78" r="1.8" fill="#c9a961"/>
            <circle cx="50" cy="78" r="1.8" fill="#c9a961" opacity="0.7"/>
            <circle cx="78" cy="78" r="1.8" fill="#c9a961"/>
            <!-- Sparkle (deploy success) -->
            <path d="M 82 22 L 84 18 L 86 22 L 90 24 L 86 26 L 84 30 L 82 26 L 78 24 Z" fill="#c9a961" opacity="0.85"/>
          </svg>
        </div>
        <div class="agent-info">
          <div class="agent-type">Herramienta · Deploy</div>
          <h4>Vercel</h4>
          <p>Plataforma oficial de deploy del embudo. Conecta tu proyecto de v0 directamente a Vercel para publicar tu sitio en producción con dominio personalizado, edge network global y HTTPS automático.</p>
        </div>
        <span class="agent-cta">
          Acceder a Vercel
          <i data-lucide="arrow-up-right" style="width:14px;height:14px"></i>
        </span>
      </a>

    `,
  },
]


export function getEpisodesBySeason(num: number): Episode[] {
  switch (num) {
    case 1: return EPISODES_T1
    case 2: return EPISODES_T2
    case 3: return EPISODES_T3
    case 4: return EPISODES_T4
    default: return []
  }
}

export function buildConverteaiEmbedUrl(videoId: string): string {
  return `https://scripts.converteai.net/${CONVERTEAI_ACCOUNT}/players/${videoId}/v4/embed.html`
}
// Force rebuild 1777805104
