# Turnify

SaaS de agenda de citas para cualquier negocio con equipo: barberías, salones de
belleza, spas, consultorios médicos, veterinarias, talleres, gimnasios y más. Los
clientes reservan online eligiendo especialista (o dejando que el sistema asigne
al más disponible) y el dueño administra personal, servicios, citas sin cita
previa, pagos, reseñas y reportes desde un solo panel.

## Por qué existe

Pensado como alternativa a Booksy, Fresha, StyleSeat, Vagaro y Square
Appointments, resolviendo lo que esas plataformas hacen mal:

- **Sin comisiones ocultas** — precio plano por negocio, no un % por cliente.
- **El cliente elige a su especialista**, o el sistema asigna automáticamente al
  disponible con menos carga ese día (balanceo de citas entre el equipo).
- **Citas sin cita previa y online en el mismo calendario**, sin choques de horario.
- **Vocabulario adaptado al rubro** — barbero, estilista, doctor/a, veterinario/a,
  entrenador/a, técnico... el panel y la reserva usan el término correcto según
  el tipo de negocio.
- **Comisión de cada miembro del equipo configurable** (u opcional, si el
  negocio no paga por comisión) y calculada automáticamente.
- **Reseñas de clientes** después de cada cita completada.
- **Política de cancelación con sanciones**: los clientes acumulan strikes por
  cancelaciones tardías o no-shows, visibles en su historial.
- **Instalable como app** (PWA) desde el navegador del celular.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Prisma](https://www.prisma.io/) con PostgreSQL
- TailwindCSS
- Autenticación propia con `bcryptjs` (hash de contraseñas) y `jose` (sesión JWT)

## Modelo de datos

- **Business** — el negocio (tenant): tiene un `category` (rubro), plan
  (`GRATIS`/`PRO`), política de cancelación, canal de recordatorios y si tiene
  pagos en línea habilitados.
- **User** — dueño/usuario con acceso al panel.
- **Staff** — miembro del equipo, con % de comisión opcional, horario y días
  laborales.
- **Service** — servicio ofrecido, con duración y precio.
- **Client** — historial de un cliente dentro de un negocio, con contador de
  `strikes`.
- **Appointment** — cita, con estado (`CONFIRMED`, `CANCELLED`, `COMPLETED`,
  `NO_SHOW`), origen (`ONLINE`/`WALK_IN`), método y estado de pago.
- **Review** — reseña (1 a 5) que un cliente deja tras una cita completada.

El vocabulario que se muestra en pantalla (cómo se llama al personal, la
pregunta del paso 2 de la reserva, etc.) según el `category` del negocio vive en
`src/lib/vocabulary.ts`.

## Funciones que todavía son solo el esqueleto (sin proveedor conectado)

- **Pagos en línea** — el modelo ya tiene `paymentMethod`/`paymentStatus` y hoy
  se puede marcar una cita como pagada en efectivo o tarjeta desde el panel.
  Falta conectar un proveedor real (ej. Stripe) para cobrar en línea.
- **Recordatorios por WhatsApp/SMS/correo** — cada negocio puede configurar
  canal y horas de anticipación en Configuración, y `src/lib/notifications.ts`
  tiene el punto de extensión listo, pero todavía no envía nada de verdad hasta
  que se conecte un proveedor (Twilio, WhatsApp Business API, Resend, etc.).

## Estructura del proyecto

```
src/
  app/
    page.tsx              landing pública
    manifest.ts, icon.tsx  PWA (manifest + ícono generado)
    signup/, login/        alta e inicio de sesión (con selector de rubro)
    book/[slug]/           flujo de reserva del cliente
    cita/[id]/              confirmación, cancelación y reseña de una cita
    dashboard/
      page.tsx              resumen
      staff/                 gestión del equipo
      services/              gestión de servicios
      appointments/          agenda + registro de citas sin cita previa
      clients/               historial de clientes y strikes
      reviews/                reseñas de clientes
      reports/                reportes de desempeño por miembro del equipo
      settings/               configuración del negocio (rubro, recordatorios, pagos)
    actions/                server actions (auth, booking, appointments, reviews, etc.)
  lib/
    db.ts                   cliente de Prisma
    auth.ts / session.ts    hash de contraseñas y sesión JWT
    availability.ts         cálculo de huecos libres y balanceo del equipo
    guard.ts                protección de rutas del dashboard
    vocabulary.ts           vocabulario dinámico según el rubro del negocio
    notifications.ts        punto de extensión para recordatorios (sin proveedor aún)
prisma/
  schema.prisma             modelo de datos
  seed.ts                   datos de ejemplo (una barbería y un spa)
```

## Cómo correrlo en local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un archivo `.env` (no se versiona, ver `.env.example`) con la cadena de
   conexión a una base PostgreSQL (local, o directamente la de Render/Neon):

   ```
   DATABASE_URL="postgresql://usuario:password@host:5432/basededatos"
   SESSION_SECRET="una-cadena-larga-y-aleatoria"
   ```

3. Aplicar el esquema de la base de datos y cargar datos de ejemplo:

   ```bash
   npx prisma db push
   npm run seed
   ```

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   La app queda disponible en `http://localhost:3000`. El seed crea dos
   negocios de ejemplo: `/book/demo-barberia` (barbería) y `/book/demo-spa`
   (spa) — cada uno con su propio login (ver la salida del seed para las
   credenciales).

## Scripts disponibles

| Comando         | Descripción                                  |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Servidor de desarrollo                        |
| `npm run build` | Build de producción                           |
| `npm start`     | Levanta el build de producción                |
| `npm run seed`  | Carga datos de ejemplo en la base de datos    |

## Despliegue en Render

El repositorio incluye un `render.yaml` (Blueprint) que provisiona en un solo
paso la app web y una base de datos PostgreSQL, ya conectadas entre sí:

1. En el dashboard de Render: **New +** → **Blueprint** → conectar este
   repositorio.
2. Render lee `render.yaml`, crea la base de datos `turnify-db` y el servicio
   web `turnify-app`, y genera automáticamente `DATABASE_URL` y
   `SESSION_SECRET`.
3. Al desplegar, el build corre `prisma db push` para sincronizar el esquema
   contra la base de datos nueva — no hace falta ejecutar nada a mano.

**Importante:** el plan `free` de PostgreSQL en Render se borra a los 30 días.
Para uso real del negocio, cambiar `plan: free` a `plan: starter` en el bloque
`databases` de `render.yaml` (o mover `DATABASE_URL` a un proveedor gratuito
permanente como [Neon](https://neon.tech)) antes de depender de los datos.

**Nota sobre el rename a Turnify:** si ya tenías desplegado el Blueprint
anterior con los nombres `corteya-db`/`corteya-app`, Render no renombra esos
recursos solo porque `render.yaml` cambió de nombre — hay que renombrarlos a
mano en el dashboard (o aceptar que Render cree recursos nuevos `turnify-db`/
`turnify-app` en el próximo sync del Blueprint).

## Planes

- **Gratis** — todo el producto hoy: equipo y reservas ilimitadas, walk-ins,
  reseñas, reportes de desempeño y comisiones, historial de clientes con
  sanciones. El campo `plan` existe en el modelo de datos pero **no hay
  ninguna limitación ni cobro implementado todavía**.
- **Pro** (en construcción, sin fecha) — multi-sucursal, recordatorios
  automáticos por WhatsApp/SMS y cobro en línea. Ninguno de los tres está
  construido; no anunciar como disponible hasta que lo estén.
