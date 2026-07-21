# Turnify

SaaS de agenda de citas para barberías, salones de belleza y spas. Los clientes
reservan online eligiendo especialista (o dejando que el sistema asigne al más
disponible) y el dueño administra personal, servicios, citas sin cita previa,
pagos, reseñas y reportes desde un solo panel.

El modelo de datos es genérico (soporta cualquier rubro con equipo y citas),
pero por ahora el producto solo se ofrece y se prueba para estas tres
categorías — el resto se dejó fuera hasta que estén completas de verdad.

## Por qué existe

Pensado como alternativa a Booksy, Fresha, StyleSeat, Vagaro y Square
Appointments, resolviendo lo que esas plataformas hacen mal:

- **Sin comisiones ocultas** — precio plano por negocio, no un % por cliente.
- **El cliente elige a su especialista**, o el sistema asigna automáticamente al
  disponible con menos carga ese día (balanceo de citas entre el equipo).
- **Citas sin cita previa y online en el mismo calendario**, sin choques de horario.
- **Vocabulario adaptado al rubro** — barbero, estilista o especialista: el
  panel y la reserva usan el término correcto según seas barbería, salón de
  belleza o spa.
- **Comisión de cada miembro del equipo configurable** (u opcional, si el
  negocio no paga por comisión) y calculada automáticamente.
- **Catálogo de servicios y productos**, cada uno con descripción, precio y
  foto propios (subida a Cloudinary), sin que los productos participen del
  flujo de reserva.
- **Catálogo público** (`/catalogo/[slug]`): los clientes pueden ver servicios,
  productos y equipo con foto y precio sin necesidad de empezar una reserva.
- **Fotos del equipo**: cada miembro del personal puede tener foto, visible en
  el panel y en el paso de elegir especialista de la reserva pública.
- **Permisos granulares por cuenta de Personal**: el dueño elige, por persona,
  si puede ver Personal, Catálogo, Reportes y/o Configuración — Equipo y
  Sucursales son siempre exclusivas del dueño.
- **Reseñas de clientes** después de cada cita completada.
- **Historial de procedimientos por cliente**: quién fue la última persona que
  lo atendió, y el detalle de cada visita anterior.
- **Calendario por sucursal**, con una vista que junta las citas de todas las
  sucursales del mismo dueño.
- **Caja registradora**: apertura y cierre por empleado o general, con conteo
  a ciegas (lo esperado nunca se muestra antes de cerrar) y el historial
  guardado para siempre. Cada cuenta de Personal puede vincularse a un
  miembro del roster para que solo pueda abrir/cerrar su propia caja — la
  general queda exclusiva del dueño. Si la diferencia supera un umbral
  configurable, se avisa por correo a los dueños.
- **Política de cancelación con sanciones**: los clientes acumulan strikes por
  cancelaciones tardías o no-shows, visibles en su historial.
- **Excepciones de horario por staff**: vacaciones o incapacidades puntuales
  que bloquean la reserva ese rango de fechas, sin tocar el horario semanal fijo.
- **Programa de puntos de fidelidad**: configurable por negocio (puntos por
  visita, umbral de recompensa), se suman solos al completar una cita y se
  canjean desde la ficha del cliente.
- **Control de inventario de productos**: stock opcional por producto, con
  botón de venta que lo descuenta y que además alimenta el esperado de la
  caja general cuando el pago fue en efectivo.
- **Nómina por período de pago**: cierre congelado de la comisión de cada
  miembro del equipo para un rango de fechas, con historial, para no
  recalcular (ni pagar dos veces) el mismo período.
- **Lista de espera**: si un día no tiene cupo, el cliente puede pedir que le
  avisen por WhatsApp — al cancelarse una cita de ese día/servicio, se le
  notifica automáticamente.
- **Difusión masiva por WhatsApp**: el dueño manda un mismo mensaje/promoción
  a todos los clientes que no lo hayan desactivado.
- **Citas recurrentes**: el cliente puede pedir repetir su cita cada 1/2/4
  semanas con el mismo especialista, agendando lo que tenga cupo.
- **Panel de analítica**: horas pico, servicios/productos más vendidos y tasa
  de clientes recurrentes.
- **Reporte de caja en PDF** descargable, además del CSV existente.
- **Instalable como app** (PWA) desde el navegador del celular.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Prisma](https://www.prisma.io/) con PostgreSQL
- TailwindCSS
- Autenticación propia con `bcryptjs` (hash de contraseñas) y `jose` (sesión JWT)
- [Cloudinary](https://cloudinary.com/) para fotos de personal, servicios y productos
- [Resend](https://resend.com/) para correo transaccional (recuperación de contraseña)
- [Twilio](https://www.twilio.com/) para WhatsApp (recordatorios, lista de espera, difusión)
- [pdfkit](https://pdfkit.org/) para el reporte de caja en PDF

## Modelo de datos

- **Organization** — el dueño/marca completo. Puede tener una o varias
  sucursales (`Business`). `Client` vive aquí, no en la sucursal, para
  compartirse entre todas las ubicaciones del mismo dueño.
- **Business** — una sucursal/ubicación: tiene un `category` (rubro), plan
  (`GRATIS`/`PRO`), política de cancelación, canal de recordatorios, si tiene
  pagos en línea habilitados, la configuración del programa de fidelidad y el
  umbral de alerta por diferencia de caja.
- **User** — cuenta con acceso al panel. `role` es `OWNER` o `STAFF`;
  `permissions` (CSV) define qué secciones adicionales puede ver una cuenta
  `STAFF` (`staff`, `catalog`, `reports`, `settings`); `staffId` opcional la
  vincula a un miembro del roster para restringir qué caja puede operar.
- **Staff** — miembro del equipo (el roster, no la cuenta de acceso), con % de
  comisión opcional, horario y días laborales, y rangos de `StaffTimeOff`
  (vacaciones/incapacidad) que bloquean la reserva esos días.
- **Service** — servicio agendable, con duración, precio y descripción
  opcional.
- **Product** — producto físico en venta (sin relación con las citas), con
  descripción, precio y stock opcional propios; cada venta queda en `ProductSale`.
- **Client** — historial de un cliente dentro de una organización, con
  contador de `strikes`, puntos de fidelidad y si acepta difusión por WhatsApp.
- **Appointment** — cita, con estado (`CONFIRMED`, `CANCELLED`, `COMPLETED`,
  `NO_SHOW`), origen (`ONLINE`/`WALK_IN`), método/estado de pago, `paidAt` y
  `recurrenceGroupId` opcional si pertenece a una serie recurrente.
- **Review** — reseña (1 a 5) que un cliente deja tras una cita completada.
- **CashSession** — apertura/cierre de caja por empleado o general, con monto
  esperado (calculado, incluye ventas de producto en efectivo), contado, la
  diferencia y quién la abrió/cerró (`openedByUserId`/`closedByUserId`).
- **PayrollPayout** — cierre congelado de comisión de un staff para un rango
  de fechas, para no recalcular el mismo período dos veces.
- **WaitlistEntry** — cliente esperando que se libere un horario en un día
  sin cupo; se le avisa por WhatsApp al cancelarse una cita que calce.

El vocabulario que se muestra en pantalla (cómo se llama al personal, la
pregunta del paso 2 de la reserva, etc.) según el `category` del negocio vive en
`src/lib/vocabulary.ts`.

## Funciones que todavía son solo el esqueleto (sin proveedor conectado)

- **Pagos en línea** — el modelo ya tiene `paymentMethod`/`paymentStatus` y hoy
  se puede marcar una cita como pagada en efectivo o tarjeta desde el panel.
  Falta conectar un proveedor real (ej. Stripe) para cobrar en línea.
- **Recordatorios y difusión por SMS/correo** — el canal WhatsApp ya envía de
  verdad vía Twilio (recordatorios, lista de espera y difusión masiva) cuando
  `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_WHATSAPP_FROM` están
  configuradas; `src/lib/notifications.ts` tiene el punto de extensión listo
  para SMS y correo, pero esos dos canales todavía solo registran el mensaje
  en el log.

## Estructura del proyecto

```
src/
  app/
    page.tsx              landing pública
    manifest.ts, icon.tsx  PWA (manifest + ícono generado)
    signup/, login/        alta e inicio de sesión (con selector de rubro)
    book/[slug]/           flujo de reserva del cliente
    catalogo/[slug]/        catálogo público (servicios, productos y equipo, sin reservar)
    cita/[id]/              confirmación, cancelación y reseña de una cita
    dashboard/
      page.tsx              resumen
      staff/                 gestión del roster, con foto (con [id] para editar)
      services/               catálogo de servicios, con foto ([id] para editar)
      catalog/                catálogo de productos, con foto ([id] para editar)
      appointments/          agenda + registro de citas sin cita previa
      calendar/               agenda por sucursal o todas juntas
      register/               caja: abrir/cerrar turnos, historial de cierres + PDF
      clients/                historial de clientes ([id] = detalle, puntos, opt-in WhatsApp)
      reviews/                reseñas de clientes
      reports/                reportes de comisión + cierre de nómina por período
      analytics/              horas pico, más vendidos, clientes recurrentes
      waitlist/                lista de espera por día/servicio
      broadcast/               difusión masiva por WhatsApp (solo dueño)
      team/                   cuentas de Personal y sus permisos ([id] = editar)
      locations/              sucursales de la organización
      settings/               configuración del negocio (rubro, recordatorios, fidelidad, pagos)
    actions/                server actions (auth, booking, appointments, reviews,
                            products, team, cashRegister, payroll, loyalty,
                            broadcast, clients, etc.)
  lib/
    db.ts                   cliente de Prisma
    auth.ts / session.ts    hash de contraseñas y sesión JWT
    availability.ts         cálculo de huecos libres, balanceo del equipo y excepciones de horario
    guard.ts                protección de rutas del dashboard
    vocabulary.ts           vocabulario dinámico según el rubro del negocio
    images.ts               subida de fotos a Cloudinary
    notifications.ts        envío de WhatsApp (Twilio) + punto de extensión para SMS/correo
    waitlist.ts             aviso automático a la lista de espera al liberarse un horario
prisma/
  schema.prisma             modelo de datos
  seed.ts                   datos de ejemplo (barbería, salón y spa)
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

   La app queda disponible en `http://localhost:3000`. El seed crea un
   negocio de ejemplo por cada categoría soportada, con su propia reserva
   pública y su propio login al panel:

   | Categoría          | Reserva pública           | Login del panel        | Contraseña       |
   | ------------------ | -------------------------- | ----------------------- | ---------------- |
   | Barbería            | `/book/demo-barberia`      | `barberia@demo.com`     | `Barberia123`     |
   | Salón de belleza    | `/book/demo-salon`         | `salon@demo.com`        | `Salon123`        |
   | Spa                 | `/book/demo-spa`           | `spa@demo.com`          | `Spa123`          |

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

**Variables opcionales que hay que cargar a mano:** `render.yaml` declara
`RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y
`CLOUDINARY_API_SECRET` como `sync: false` — Render crea el campo vacío en el
dashboard del servicio `turnify-app` pero no adivina el valor. Sin esas tres
de Cloudinary, el formulario de subir foto sigue funcionando pero la imagen no
se guarda (falla en silencio). Hay que pegarlas a mano en **turnify-app →
Environment** y volver a desplegar.

## Planes

- **Gratis** — todo el producto hoy: equipo y reservas ilimitadas, walk-ins,
  reseñas, reportes de desempeño y comisiones, historial de clientes con
  sanciones. El campo `plan` existe en el modelo de datos pero **no hay
  ninguna limitación ni cobro implementado todavía**.
- **Pro** (en construcción, sin fecha) — multi-sucursal, recordatorios
  automáticos por WhatsApp/SMS y cobro en línea. Ninguno de los tres está
  construido; no anunciar como disponible hasta que lo estén.
