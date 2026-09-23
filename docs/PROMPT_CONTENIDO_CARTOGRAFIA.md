# Instrucción para ChatGPT — contenido de Cartografía Estelar 144

Copia todo lo que va debajo de la línea y pégalo en ChatGPT.

---

# ENCARGO

Necesito contenido editorial en español para una herramienta de
autoconocimiento llamada **Cartografía Estelar 144**, de la plataforma
Los 144.000.

La herramienta compara la carta de nacimiento de una persona con 50 objetos
celestes (estrellas, cúmulos, nebulosas, galaxias y centros cósmicos) mediante
cálculo astronómico real. Tú **no** escribes nada astronómico: el cálculo ya
está hecho y verificado. Tú escribes **la capa interpretativa**.

## LO MÁS IMPORTANTE: LAS DOS CAPAS

La herramienta separa estrictamente dos cosas:

- **Capa A — astronomía.** Posiciones reales, orbes, aspectos. Ya está hecha.
- **Capa B — interpretación.** Lo que tú vas a escribir.

Tu texto **nunca** debe afirmar algo astronómico ni presentarse como ciencia.
Y nunca debe decir que alguien "viene de" un sitio, "es de" una estrella o
"pertenece a" una raza estelar.

En la pantalla aparece siempre este aviso:

> Las posiciones y relaciones celestes corresponden a cálculos astronómicos.
> Las interpretaciones sobre resonancia, memoria y conciencia estelar
> pertenecen al marco espiritual y contemplativo de Los 144000.

Tu texto tiene que ser coherente con eso.

## TRES REGLAS DE TONO QUE NO SE ROMPEN

1. **Nunca afirmes lo que alguien ES.** Describe con qué se RELACIONA una
   configuración y cómo PUEDE expresarse. Escribe "suele traducirse en", "se
   relaciona con", "puede manifestarse como". Nunca "tú eres", "tienes alma
   de", "perteneces a".

2. **Nunca predigas.** No hay futuro en estos textos. Nada de "vas a",
   "conocerás", "te ocurrirá", "este año traerá".

3. **La tensión no es un defecto ni un diagnóstico.** Es la forma que toma un
   don cuando se sostiene solo. Escríbela sin dramatismo y sin alarmar.

Tampoco uses lenguaje de valor: nada es "bueno", "malo", "favorable",
"desfavorable", "afortunado" ni "maléfico".

## PROHIBIDO COPIAR

No uses, ni parafrasees, ni te inspires en:

Galactic Astro Chart · Galactic Astrology de Julia Balaz · Starseed Astrology
de ningún autor · Gene Keys · Human Design · Starseed Strategies · cursos ·
PDF · tablas interpretativas comerciales · listas de "razas estelares".

Si reconoces una descripción típica de esas fuentes ("los sirianos son…",
"los pleyadianos tienden a…"), **no la uses**. Escribe desde cero, con
observación humana concreta.

## ESTILO

- Español neutro, sin regionalismos marcados.
- Concreto y observable. Mejor "se reconoce en la cantidad de cosas que tienes
  empezadas a la vez" que "energía de apertura cósmica".
- Sin jerga esotérica vacía: nada de "frecuencia vibracional", "activación de
  códigos", "portal dimensional", "ADN estelar".
- Que una persona sin ningún interés en astrología pueda leerlo y reconocerse.
- Segunda persona, sin nombre propio.

## FORMATO DE SALIDA

Devuélvemelo como TypeScript, exactamente con esta forma. Un objeto por portal,
usando el `id` tal cual aparece en la lista:

```ts
  sirio: {
    id: "sirio",
    estado: "draft",
    esencia: "servicio consciente · disciplina · transmisión",
    arquetipo: "…",
    potencial: "…",
    tension: "…",
    preguntas: ["…", "…", "…"],
    integracion: "…",
  },
```

Longitudes:

| Campo | Extensión |
|---|---|
| `esencia` | tres palabras o expresiones separadas por ` · ` |
| `arquetipo` | 2–3 frases, 180–320 caracteres |
| `potencial` | 1–2 frases, 100–200 caracteres |
| `tension` | 1–2 frases, 100–220 caracteres |
| `preguntas` | entre 3 y 5, cada una una sola frase |
| `integracion` | 1–2 frases. Un ejercicio observable, no una afirmación |

`estado` siempre `"draft"` en lo que entregues. Lo marco como `"reviewed"`
cuando lo revisemos.

**Las preguntas** deben poder responderse mirando la propia vida, no creyendo
nada. Mal: "¿sientes tu conexión estelar?". Bien: "¿qué sostienes que nadie te
pidió que sostuvieras?".

**La integración** es algo que se hace en una semana, observable. Mal: "medita
sobre tu origen". Bien: "elige algo que empezaste y no terminaste; escribe en
una línea por qué lo dejaste".

## ENTREGA POR TANDAS

Son 50 portales. No intentes hacerlos todos de una vez.

Entrégamelos **de diez en diez**, en el orden de la lista. Al terminar cada
tanda, para y espera a que te diga que sigas. Así puedo revisar el tono antes
de que escribas los cuarenta restantes.

---

# LOS 50 PORTALES

El `tipo` importa para el tono: un sistema estelar concreto no se escribe igual
que un supercúmulo de galaxias. Las **anclas** son las estrellas reales que
componen cada portal; puedes mencionarlas, pero el texto describe el portal
entero.

## Ya tienen esencia fijada — respétala y desarrolla lo demás

| id | nombre | tipo | esencia (NO la cambies) | anclas |
|---|---|---|---|---|
| `pleyades` | Pléyades | CLUSTER | memoria del vínculo · pertenencia · sensibilidad colectiva | Alcyone, Atlas, Electra, Maia, Mérope, Taygeta, Pléyone |
| `sirio` | Sirio | STAR_SYSTEM | servicio consciente · disciplina · transmisión | Sirio |
| `arcturus` | Arcturus | STAR_SYSTEM | arquitectura · patrones · inteligencia sistémica | Arcturus |
| `lyra` | Lyra · Vega | CONSTELLATION | soberanía · creación · individualidad | Vega, Sheliak, Sulafat |
| `orion` | Orión | CONSTELLATION | polaridad · discernimiento · integración del conflicto | Betelgeuse, Rigel, Bellatrix, Mintaka, Alnilam, Alnitak, Saiph |
| `andromeda` | Andrómeda | CONSTELLATION | libertad · expansión · perspectiva | Alpheratz, Mirach, Almach |
| `alfa_centauri` | Alfa Centauri | STAR_SYSTEM | proximidad · encarnación · puente entre mundos | Rigil Kentaurus |
| `antares` | Antares · Escorpio | STAR_SYSTEM | intensidad · transformación · voluntad | Antares |
| `regulus` | Regulus · Leo | STAR_SYSTEM | liderazgo · corazón · uso consciente del poder | Regulus |
| `centro_galactico` | Centro Galáctico | COSMIC_REFERENCE | origen · eje · retorno al centro | Sagitario A* |

> Pléyades, Sirio y Arcturus ya tienen borrador escrito. Reescríbelos también:
> quiero que los 50 tengan la misma voz.

## Necesitan todo, incluida la esencia

| id | nombre | tipo | anclas |
|---|---|---|---|
| `aldebaran` | Aldebarán · Híades | STAR_FAMILY | Aldebarán, Ain |
| `fomalhaut` | Fomalhaut | STAR_SYSTEM | Fomalhaut |
| `spica` | Spica · Virgo | STAR_SYSTEM | Spica |
| `altair` | Altair | STAR_SYSTEM | Altair |
| `deneb` | Deneb · Cisne | CONSTELLATION | Deneb, Albireo |
| `polaris` | Polaris | STAR_SYSTEM | Polaris |
| `capella` | Capella | STAR_SYSTEM | Capella |
| `canopus` | Canopus | STAR_SYSTEM | Canopus |
| `achernar` | Achernar | STAR_SYSTEM | Achernar |
| `geminis` | Cástor y Pólux · Géminis | CONSTELLATION | Cástor, Pólux |
| `perseo` | Perseo | CONSTELLATION | Algol, Mirfak |
| `casiopea` | Casiopea | CONSTELLATION | Schedar, Caph |
| `cefeo` | Cefeo | CONSTELLATION | Alderamin |
| `draco` | Draco | CONSTELLATION | Eltanin, Thuban |
| `ofiuco` | Ofiuco | CONSTELLATION | Rasalhague |
| `hercules` | Hércules | CONSTELLATION | Rasalgethi, Kornephoros |
| `pegaso` | Pegaso | CONSTELLATION | Markab, Scheat, Algenib |
| `crux` | Cruz del Sur | CONSTELLATION | Acrux, Mimosa, Gacrux |
| `centaurus` | Centauro · Hadar | CONSTELLATION | Hadar |
| `libra` | Libra | CONSTELLATION | Zubenelgenubi, Zubeneschamali |
| `hydra` | Hidra · Alphard | CONSTELLATION | Alphard |
| `corvus` | Cuervo | CONSTELLATION | Gienah, Algorab |
| `phoenix` | Fénix | CONSTELLATION | Ankaa |
| `grus` | Grulla | CONSTELLATION | Alnair |
| `aquarius` | Acuario | CONSTELLATION | Sadalsuud, Sadalmelik |
| `capricornus` | Capricornio | CONSTELLATION | Deneb Algedi |
| `sagittarius` | Sagitario | CONSTELLATION | Kaus Australis, Nunki |
| `sculptor` | Escultor | CONSTELLATION | Alfa Sculptoris |
| `m31` | Galaxia de Andrómeda · M31 | GALAXY | M31 |
| `m42` | Nebulosa de Orión · M42 | NEBULA | M42 |
| `m1` | Nebulosa del Cangrejo · M1 | NEBULA | M1 |
| `m57` | Nebulosa del Anillo · M57 | NEBULA | M57 |
| `omega_centauri` | Omega Centauri | CLUSTER | Omega Centauri |
| `m13` | Cúmulo de Hércules · M13 | CLUSTER | M13 |
| `virgo_m87` | Virgo · M87 | GALAXY | M87 |
| `gran_atractor` | Gran Atractor · Norma | COSMIC_REFERENCE | Cúmulo de Norma (Abell 3627) |
| `shapley` | Supercúmulo de Shapley | COSMIC_REFERENCE | Abell 3558 |
| `procyon` | Procyon | STAR_SYSTEM | Procyon |
| `tau_ceti` | Tau Ceti | STAR_SYSTEM | Tau Ceti |
| `epsilon_eridani` | Epsilon Eridani | STAR_SYSTEM | Epsilon Eridani |

---

# AVISOS SOBRE CASOS CONCRETOS

**Los tres centros cósmicos** (Centro Galáctico, Gran Atractor, Shapley) no son
estrellas: son estructuras de escala enorme. Escríbelos con otro registro —
más de orientación y escala, menos de carácter personal.

**Las nebulosas** (M42, M1, M57) son lugares donde nacen o mueren estrellas.
Ese hecho puede informar el tono sin que lo conviertas en afirmación
astronómica.

**Ofiuco** aparece en muchos textos comerciales como "el decimotercer signo".
No entres en esa discusión: escríbelo como constelación, sin polémica.

**Algol** (en Perseo) arrastra siglos de mala fama en la astrología
tradicional. No la repitas. Escribe Perseo sin heredar ese juicio, siguiendo
la regla de que nada es favorable ni desfavorable.

**Cuervo** — el ancla se llama "Gienah", y ese nombre designa a dos estrellas
distintas en el cielo. Aquí es la de Cuervo. No lo menciones en el texto, solo
para que no te confundas si consultas algo.

---

# QUÉ NECESITO DE VUELTA

Para cada tanda de diez:

1. El bloque de TypeScript listo para pegar.
2. Una línea diciéndome si algún portal te ha costado y por qué.

Nada más. Sin introducción, sin resumen, sin explicarme lo que has hecho.
