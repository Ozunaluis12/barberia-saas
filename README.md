# CorteYa

SaaS de agenda de citas para barberías con varios barberos. Los clientes reservan
online eligiendo barbero (o dejando que el sistema asigne al más disponible) y el
dueño administra barberos, servicios, walk-ins, comisiones y reportes desde un
panel.

## Por qué existe

Pensado como alternativa a Booksy, Fresha, StyleSeat, Vagaro y Square
Appointments, resolviendo lo que esas plataformas hacen mal:

- **Sin comisiones ocultas** — precio plano por barbería, no un % por cliente.
- **El cliente elige a su barbero**, o el sistema asigna automáticamente al
  disponible con menos carga ese día (balanceo de citas entre el equipo).
- **Walk-ins y citas online en el mismo calendario**, sin choques de horario.
- **Comisión de cada barbero configurable** y calculada automáticamente.
- **Multi-sucursal desde el día uno.**
- **Política de cancelación con sanciones**: los clientes acumulan strikes por
  cancelaciones tardías o no-shows, visibles en su historial.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Prisma](https://www.prisma.io/) con PostgreSQL
- TailwindCSS
- Autenticación propia con `bcryptjs` (hash de contraseñas) y `jose` (sesión JWT)

## Modelo de datos

- **Shop** — la barbería (tenant). Tiene plan (`GRATIS`/`PRO`) y horas de aviso
  para cancelación.
- **User** — dueño/usuario con acceso al panel.
- **Barber** — barbero con % de comisión, horario y días laborales.
- **Service** — servicio ofrecido, con duración y precio.
- **Client** — historial de un cliente dentro de una barbería, con contador de
  `strikes`.
- **Appointment** — cita, con estado (`CONFIRMED`, `CANCELLED`, `COMPLETED`,
  `NO_SHOW`), origen (`ONLINE`/`WALK_IN`) y si fue cancelación tardía.

## Estructura del proyecto

```
src/
  app/
    page.tsx              landing pública
    signup/, login/        alta e inicio de sesión
    book/[slug]/           flujo de reserva del cliente
    cita/[id]/              confirmación y cancelación de una cita
    dashboard/
      page.tsx              resumen
      barbers/               gestión de barberos
      services/              gestión de servicios
      appointments/          agenda + registro de walk-ins
      clients/               historial de clientes y strikes
      reports/                reportes y comisiones
      settings/               configuración de la barbería
    actions/                server actions (auth, booking, appointments, etc.)
  lib/
    db.ts                   cliente de Prisma
    auth.ts / session.ts    hash de contraseñas y sesión JWT
    availability.ts         cálculo de huecos libres y balanceo de barberos
    guard.ts                protección de rutas del dashboard
prisma/
  schema.prisma             modelo de datos
  seed.ts                   datos de ejemplo
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

   La app queda disponible en `http://localhost:3000`. La barbería de ejemplo
   del seed se puede probar en `/book/demo-barberia`.

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
   repositorio (`Ozunaluis12/barberia-saas`).
2. Render lee `render.yaml`, crea la base de datos `corteya-db` y el servicio
   web `corteya-app`, y genera automáticamente `DATABASE_URL` y
   `SESSION_SECRET`.
3. Al desplegar, el build corre `prisma db push` para sincronizar el esquema
   contra la base de datos nueva — no hace falta ejecutar nada a mano.

**Importante:** el plan `free` de PostgreSQL en Render se borra a los 30 días.
Para uso real del negocio, cambiar `plan: free` a `plan: starter` en el bloque
`databases` de `render.yaml` (o mover `DATABASE_URL` a un proveedor gratuito
permanente como [Neon](https://neon.tech)) antes de depender de los datos.

## Planes

- **Gratis** — hasta 2 barberos, reservas online ilimitadas, panel de
  comisiones.
- **Pro** — $19.99/mes por sucursal, barberos ilimitados, multi-sucursal,
  recordatorios automáticos, soporte y reportes incluidos.
