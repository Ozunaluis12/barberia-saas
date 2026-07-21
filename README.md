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
- **Catálogo de servicios y productos**, cada uno con descripción y precio
  propios, sin que los productos participen del flujo de reserva.
- **Permisos granulares por cuenta de Personal**: el dueño elige, por persona,
  si puede ver Personal, Catálogo, Reportes y/o Configuración — Equipo y
  Sucursales son siempre exclusivas del dueño.
- **Reseñas de clientes** después de cada cita completada.
- **Historial de procedimientos por cliente**: quién fue la última persona que
  lo atendió, y el detalle de cada visita anterior.
- **Calendario por sucursal**, con una vista que junta las citas de todas las
  sucursales del mismo dueño.
- **Caja registradora**: apertura y cierre por empleado o general, con lo
  esperado calculado automáticamente y el historial de cierres guardado para
  siempre.
- **Política de cancelación con sanciones**: los clientes acumulan strikes por
  cancelaciones tardías o no-shows, visibles en su historial.
- **Instalable como app** (PWA) desde el navegador del celular.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Prisma](https://www.prisma.io/) con PostgreSQL
- TailwindCSS
- Autenticación propia con `bcryptjs` (hash de contraseñas) y `jose` (sesión JWT)

## Modelo de datos

- **Organization** — el dueño/marca completo. Puede tener una o varias
  sucursales (`Business`). `Client` vive aquí, no en la sucursal, para
  compartirse entre todas las ubicaciones del mismo dueño.
- **Business** — una sucursal/ubicación: tiene un `category` (rubro), plan
  (`GRATIS`/`PRO`), política de cancelación, canal de recordatorios y si tiene
  pagos en línea habilitados.
- **User** — cuenta con acceso al panel. `role` es `OWNER` o `STAFF`;
  `permissions` (CSV) define qué secciones adicionales puede ver una cuenta
  `STAFF` (`staff`, `catalog`, `reports`, `settings`).
- **Staff** — miembro del equipo (el roster, no la cuenta de acceso), con % de
  comisión opcional, horario y días laborales.
- **Service** — servicio agendable, con duración, precio y descripción
  opcional.
- **Product** — producto físico en venta (sin relación con las citas), con
  descripción y precio propios.
- **Client** — historial de un cliente dentro de una organización, con
  contador de `strikes`.
- **Appointment** — cita, con estado (`CONFIRMED`, `CANCELLED`, `COMPLETED`,
  `NO_SHOW`), origen (`ONLINE`/`WALK_IN`), método/estado de pago y `paidAt`.
- **Review** — reseña (1 a 5) que un cliente deja tras una cita completada.
- **CashSession** — apertura/cierre de caja por empleado o general, con monto
  esperado (calculado), contado y la diferencia.

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
- **Fotos de personal/servicios/productos** — `Service.imageUrl` y
  `Product.imageUrl` ya existen en el esquema (listos, sin usar todavía);
  `Staff` aún no tiene su campo de foto. Falta conectar Cloudinary (cuenta +
  `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`) antes
  de construir la subida de imágenes.

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
      staff/                 gestión del roster (con [id] para editar)
      catalog/                servicios y productos ([service]/[product] para editar)
      appointments/          agenda + registro de citas sin cita previa
      calendar/               agenda por sucursal o todas juntas
      register/               caja: abrir/cerrar turnos, historial de cierres
      clients/                historial de clientes ([id] = detalle/procedimientos)
      reviews/                reseñas de clientes
      reports/                reportes de desempeño por miembro del equipo
      team/                   cuentas de Personal y sus permisos ([id] = editar)
      locations/              sucursales de la organización
      settings/               configuración del negocio (rubro, recordatorios, pagos)
    actions/                server actions (auth, booking, appointments, reviews,
                            products, team, cashRegister, etc.)
  lib/
    db.ts                   cliente de Prisma
    auth.ts / session.ts    hash de contraseñas y sesión JWT
    availability.ts         cálculo de huecos libres y balanceo del equipo
    guard.ts                protección de rutas del dashboard
    vocabulary.ts           vocabulario dinámico según el rubro del negocio
    notifications.ts        punto de extensión para recordatorios (sin proveedor aún)
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

## Planes

- **Gratis** — todo el producto hoy: equipo y reservas ilimitadas, walk-ins,
  reseñas, reportes de desempeño y comisiones, historial de clientes con
  sanciones. El campo `plan` existe en el modelo de datos pero **no hay
  ninguna limitación ni cobro implementado todavía**.
- **Pro** (en construcción, sin fecha) — multi-sucursal, recordatorios
  automáticos por WhatsApp/SMS y cobro en línea. Ninguno de los tres está
  construido; no anunciar como disponible hasta que lo estén.
