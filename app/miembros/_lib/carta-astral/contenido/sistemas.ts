// ═══════════════════════════════════════════════════════════════════════════
//  LOS DOCE SISTEMAS ORGÁNICOS · equilibrio y desequilibrio
// ═══════════════════════════════════════════════════════════════════════════
//
// GENERADO desde «Camino Solar 2026.xlsx». No se edita a mano: si el texto
// cambia, cambia en el Excel y se vuelve a generar. Editarlo aquí deja el
// Excel y la plataforma diciendo cosas distintas.
//
// El texto es de José, palabra por palabra. No se ha reescrito ni resumido.


export type SistemaId =
  | "esqueleto"
  | "nervioso"
  | "circulatorio"
  | "reproductor"
  | "muscular"
  | "respiratorio"
  | "linfatico"
  | "digestivo"
  | "tegumentario"
  | "inmune"
  | "excretor"
  | "endocrino"

export type ContenidoSistema = {
  nombre: string
  equilibrio: string
  desequilibrio: string
}

export const SISTEMAS: Record<SistemaId, ContenidoSistema> = {
  esqueleto: {
    nombre: "Esqueleto",
    equilibrio: "El sistema óseo equilibrado representa una autoimagen sólida y valoración interna estable. La persona se sostiene, se respeta y tiene estructura para enfrentar la vida.",
    desequilibrio: "En desequilibrio, hay sensación de fragilidad, inseguridad o rigidez extrema. La persona duda de su valor o se endurece para no sentirse vulnerable.",
  },
  nervioso: {
    nombre: "Nervioso",
    equilibrio: "Un sistema nervioso equilibrado permite presencia, conexión interna y respuesta adecuada al entorno. La persona procesa estímulos sin sobrecargarse y mantiene claridad mental.",
    desequilibrio: "En desequilibrio, aparece hiperestimulación, ansiedad, agotamiento o desconexión. El cuerpo está en alerta constante o completamente apagado.",
  },
  circulatorio: {
    nombre: "Circulatorio",
    equilibrio: "El sistema circulatorio equilibrado refleja la capacidad de dar y recibir. La información, el afecto y la energía fluyen sin bloqueo. Hay intercambio sano con el entorno.",
    desequilibrio: "Cuando se altera, aparece dificultad para entregar o recibir. Emocionalmente se vive como cierre afectivo, sobreentrega o desconexión. El flujo vital se ve comprometido.",
  },
  reproductor: {
    nombre: "Reproductor",
    equilibrio: "El sistema reproductor en equilibrio representa la capacidad de crear vida en todas sus formas, no solo biológica. La persona siente impulso creativo, deseo de generar, de iniciar proyectos, vínculos o procesos nuevos. Existe una relación sana con el placer, con la fertilidad y con la continuidad. Se puede gestar, cuidar y sostener aquello que nace. Hay una sensación interna de potencial disponible y de apertura a la creación sin miedo.",
    desequilibrio: "Cuando este sistema se desequilibra, aparece el bloqueo creativo, el miedo a generar o a sostener lo creado. Puede manifestarse como dificultad para iniciar, para concebir, para desear o para disfrutar. La creación se vive con culpa, con presión o con rechazo. El cuerpo puede expresar conflictos relacionados con infertilidad, disfunciones sexuales o desconexión del deseo, mientras emocionalmente aparece la sensación de que “no puedo crear nada nuevo”.",
  },
  muscular: {
    nombre: "Muscular",
    equilibrio: "El sistema muscular equilibrado refleja la capacidad de moverse por la vida con decisión. Hay fuerza disponible, flexibilidad y capacidad de acción. La persona siente que puede avanzar, sostener esfuerzo y adaptarse al movimiento que la vida exige. Existe una relación sana con la iniciativa y con el uso de la energía física y emocional.",
    desequilibrio: "En desequilibrio, el cuerpo expresa rigidez, tensión crónica o debilidad. Aparece la sensación de estar forzado, cargando más de lo que corresponde o, por el contrario, sin fuerza para avanzar. Emocionalmente se vive como resistencia al movimiento, miedo a actuar o imposición constante. El cuerpo se endurece cuando la persona no se permite flexibilizar sus decisiones o soltar el control.",
  },
  respiratorio: {
    nombre: "Respiratorio",
    equilibrio: "El sistema respiratorio equilibrado representa la capacidad de adaptarse al entorno. La persona toma lo que necesita, suelta lo que no, y se ajusta a los cambios sin perder estabilidad interna. Respirar bien es sinónimo de apertura, presencia y contacto con el momento actual. Hay espacio interno para recibir la vida.",
    desequilibrio: "Cuando este sistema se altera, aparece la sensación de ahogo, falta de aire o dificultad para adaptarse. Emocionalmente se manifiesta como miedo, ansiedad o sensación de amenaza constante. La persona se siente obligada, presionada o sin espacio propio. El cuerpo expresa lo que la conciencia no logra soltar.",
  },
  linfatico: {
    nombre: "Linfatico",
    equilibrio: "El sistema linfático equilibrado refleja la capacidad de comunicarse y conectar de manera sana. La persona puede intercambiar, relacionarse y circular en lo social sin perder su identidad. Existe fluidez en los vínculos y sensación de pertenencia sin dependencia.",
    desequilibrio: "En desequilibrio, aparece estancamiento, inflamación o sensación de carga emocional acumulada. La persona retiene lo que no puede expresar, se guarda palabras, emociones o conflictos. Hay dificultad para comunicarse auténticamente o para sentirse parte sin sacrificarse.",
  },
  digestivo: {
    nombre: "Digestivo",
    equilibrio: "El sistema digestivo equilibrado representa la capacidad de transformar experiencias en aprendizaje. La persona puede “digerir” lo que vive, procesarlo y extraer lo útil. No todo agrada, pero todo se integra. Hay aceptación de la experiencia.",
    desequilibrio: "Cuando está alterado, la persona no logra procesar lo vivido. Se acumula enojo, rechazo o frustración. Las experiencias “caen mal”, no se integran y generan malestar. Aparece dificultad para asimilar cambios, proyectos o situaciones nuevas.",
  },
  tegumentario: {
    nombre: "Tegumentario",
    equilibrio: "La piel en equilibrio expresa una relación sana con el contacto. La persona sabe vincularse, acercarse y marcar límites claros. Puede mostrarse sin miedo y protegerse sin aislarse.",
    desequilibrio: "En desequilibrio, la piel reacciona cuando los límites no están claros. Puede haber hipersensibilidad, rechazo al contacto o necesidad excesiva de protección. Emocionalmente aparece dificultad para relacionarse o miedo a exponerse.",
  },
  inmune: {
    nombre: "Inmune",
    equilibrio: "Un sistema inmune equilibrado refleja estabilidad interna y criterio propio. La persona distingue lo que le sirve de lo que no, se protege sin atacar todo. Hay confianza en sí mismo y en el entorno.",
    desequilibrio: "Cuando se altera, la persona vive a la defensiva. Todo es amenaza o, por el contrario, no hay defensa suficiente. Aparecen conflictos de identidad, límites débiles o excesiva rigidez frente al entorno.",
  },
  excretor: {
    nombre: "Excretor",
    equilibrio: "Este sistema equilibrado representa la capacidad de soltar lo que ya no sirve. La persona libera emociones, pensamientos y vínculos que cumplieron su función. No acumula innecesariamente.",
    desequilibrio: "En desequilibrio, se retiene lo que debería salir: emociones viejas, culpas, resentimientos. Aparece miedo a soltar y apego a lo obsoleto. El cuerpo refleja esa retención.",
  },
  endocrino: {
    nombre: "Endocrino",
    equilibrio: "El sistema endocrino equilibrado permite una autorregulación emocional y energética. La persona toma decisiones con coherencia, sin impulsos extremos ni bloqueos. Hay armonía entre acción y descanso.",
    desequilibrio: "Cuando se altera, aparecen desajustes emocionales, cambios bruscos de ánimo y dificultad para decidir. El cuerpo expresa confusión interna y falta de dirección.",
  },
}

export const SISTEMAS_IDS: SistemaId[] = [
  "esqueleto",
  "nervioso",
  "circulatorio",
  "reproductor",
  "muscular",
  "respiratorio",
  "linfatico",
  "digestivo",
  "tegumentario",
  "inmune",
  "excretor",
  "endocrino",
]
