// ═══════════════════════════════════════════════════════════════════════════
//  DÓNDE ATERRIZA LA INVITACIÓN
// ═══════════════════════════════════════════════════════════════════════════
//
// La invitación que recibe un miembro nuevo lleva a esta dirección, y allí
// crea su contraseña. Lo pide `member-sync` cuando el embudo activa a
// alguien, y también la herramienta de administración que manda una
// invitación de prueba.
//
// ── POR QUÉ ESTÁ AQUÍ Y NO ESCRITA EN CADA SITIO ──────────────────────────
// Porque si los dos sitios no apuntan EXACTAMENTE al mismo lugar, la prueba
// deja de probar lo que se cree que prueba: saldría bien mientras los
// miembros de verdad acaban en otra pantalla. Un solo texto, un solo
// destino.
//
// Supabase solo manda a esta dirección si está en su lista de redirecciones
// permitidas (Authentication → URL Configuration). Si se cambia aquí, hay
// que cambiarla allí.

export const URL_ACTIVAR_CUENTA = "https://los144000.com/activar-cuenta"
