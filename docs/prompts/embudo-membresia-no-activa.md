# Prompt para el proyecto del EMBUDO

> Cópialo entero y pégalo en una sesión abierta en el proyecto del embudo
> (no en el de la plataforma). Sustituye `CORREO-DE-LA-PERSONA` antes de enviarlo.

---

Trabajas en el proyecto del **embudo** de Los 144000. No tienes acceso al
proyecto de la plataforma (el área de miembros) y no lo necesitas: lo que hay
que mirar está aquí.

## El problema

Una persona con la suscripción pagada y al día entra sin problemas al área de
miembros, pero cuando pulsa el botón de Telegram le responde **«Tu membresía no
está activa»**.

La persona concreta es: `CORREO-DE-LA-PERSONA`

## Por qué eso apunta al embudo

Son **dos proyectos de Supabase distintos**:

- La **plataforma** guarda las cuentas (`auth.users`, perfiles, insignias…).
- El **embudo** guarda las suscripciones, en la tabla `embudo_registros`.

Lo único que une las dos bases es **el correo**. No hay `user_id` compartido.

Cuando alguien pulsa el botón de Telegram, una Edge Function de la plataforma
le pregunta al embudo, por correo, si tiene suscripción. Esta es la regla
exacta que aplica, copiada del código de la plataforma:

```ts
// 1. Si es administrador, pasa.
// 2. Si no, busca en embudo_registros:
const { data: registro } = await embudo
  .from("embudo_registros")
  .select("subscription_status, current_period_end")
  .ilike("email", persona.email)              // el correo de la PLATAFORMA
  .not("subscription_status", "is", null)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (!registro) return false;                   // ← no hay fila: no pasa

const fin = registro.current_period_end ? new Date(registro.current_period_end) : null;
if (fin === null || fin.getTime() <= Date.now()) return false;   // ← manda la FECHA

return ["active", "trialing", "canceled"].includes(registro.subscription_status);
```

Tres detalles que importan para el diagnóstico:

1. Se coge **una sola fila**, la de `updated_at` más reciente. Si hay
   duplicados por correo, la vieja gana si se actualizó después.
2. Manda **`current_period_end`**, no el estado. Si está vacío o en el pasado,
   no pasa aunque el estado diga `active`.
3. `canceled` **sí** entra: cancelar en Stripe no corta el servicio hasta el
   final del periodo ya cobrado. Los que no entran son `past_due`, `unpaid`,
   `incomplete`, `incomplete_expired`, `paused` y cualquier otro.

## Lo que te pido que hagas

**Solo mirar y contarme. No cambies nada todavía.**

### 1. Busca esa persona en `embudo_registros`

```sql
select
  email,
  subscription_status,
  current_period_end,
  (current_period_end > now())                               as periodo_vigente,
  (subscription_status in ('active','trialing','canceled'))  as estado_aceptado,
  updated_at,
  created_at
from embudo_registros
where email ilike 'CORREO-DE-LA-PERSONA'
order by updated_at desc;
```

Si no sale nada, búscala de forma más laxa —por el nombre, por el dominio del
correo, por los últimos dígitos de la tarjeta en Stripe— y dime **con qué
correo compró de verdad**.

### 2. Comprueba si hay más de una fila para ese correo

```sql
select email, count(*), max(updated_at)
from embudo_registros
group by email
having count(*) > 1
order by max(updated_at) desc
limit 20;
```

Importa porque la consulta de la plataforma se queda con una sola.

### 3. Comprueba si el correo está guardado tal cual lo escribió la persona

```sql
select
  email,
  (email <> btrim(email))   as tiene_espacios,
  (email <> lower(email))   as tiene_mayusculas
from embudo_registros
where email ilike '%CORREO-DE-LA-PERSONA%';
```

Un espacio invisible al final rompe la búsqueda; las mayúsculas no, porque la
plataforma usa `ilike`.

### 4. Mira si `current_period_end` se está actualizando en general

```sql
select
  subscription_status,
  count(*)                                   as filas,
  count(current_period_end)                  as con_fecha,
  count(*) filter (where current_period_end <= now()) as fecha_pasada
from embudo_registros
group by subscription_status
order by filas desc;
```

Si hay muchas filas `active` con `current_period_end` vacío o pasado, el
problema no es de esta persona: es que el webhook de Stripe no está
refrescando la fecha en las renovaciones. Dime qué eventos de Stripe escribe
hoy `current_period_end` (busca en el código del webhook:
`customer.subscription.updated`, `customer.subscription.created`,
`invoice.payment_succeeded`, `invoice.paid`).

## Lo que quiero de vuelta

Un informe corto, en este orden:

1. Qué fila(s) hay para esa persona, con su estado y su fecha.
2. Cuál de estos cuatro es el caso:
   - **A** · no hay fila con ese correo → compró con otro correo.
   - **B** · hay fila, pero `current_period_end` está vacío o en el pasado.
   - **C** · hay fila y fecha buena, pero el estado no está en la lista
     (dime cuál es).
   - **D** · todo está bien → entonces el fallo está en la plataforma y lo
     miro yo por ese lado.
3. Si es **B** por un problema general del webhook, dime cuántas filas están
   afectadas y qué eventos faltan por manejar.
4. Qué propondrías arreglar, **sin hacerlo**.

## Restricciones, y van en serio

- **No ejecutes nada que escriba**: ni `update`, ni `insert`, ni `delete`, ni
  `alter`. Solo `select`. Si hace falta corregir una fila, me lo dices y lo
  decido yo.
- **No hagas despliegues** de ninguna clase, ni de Edge Functions, ni del
  sitio, ni de workers.
- **No toques Stripe**: ni productos, ni precios, ni suscripciones, ni
  webhooks.
- **No cambies variables de entorno ni claves.** Si necesitas saber si una
  existe, dime solo **EXISTE / NO EXISTE** y **dónde se usa**. Nunca escribas
  el valor de una clave en tu respuesta, ni en un archivo, ni en la terminal.
- **No corras migraciones en producción.** Si propones un cambio de esquema,
  déjalo escrito en un `.sql` y no lo ejecutes.
- **Nada destructivo en git**: ni `reset --hard`, ni `clean -fd`, ni revertir
  trabajo de otros.

## El arreglo de fondo (para después, no ahora)

Mientras lo único que una las dos bases sea el correo, esto va a volver a
pasar cada vez que alguien compre con un correo y entre con otro. La salida
es que el embudo guarde también el `user_id` de la plataforma cuando se crea
la cuenta, y que la comprobación mire primero el `user_id` y solo use el
correo como respaldo.

No lo implementes todavía. Dime qué haría falta por tu lado para guardarlo.
