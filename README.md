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
  avisen. El negocio decide a mano a quién y cuándo avisar por WhatsApp desde
  el panel, y puede quitar a alguien de la lista en cualquier momento.
- **Difusión masiva por WhatsApp**: el dueño manda un mismo mensaje/promoción
  a todos los clientes que no lo hayan desactivado.
- **Citas recurrentes**: el cliente puede pedir repetir su cita cada 1/2/4
  semanas con el mismo especialista, agendando lo que tenga cupo.
- **Panel de analítica**: horas pico, servicios/productos más vendidos y tasa
  de clientes recurrentes.
- **Reporte de caja en PDF** descargable, además del CSV existente.
- **Recibo en PDF** por cita pagada o venta de producto, descargable desde
  Citas y Catálogo — es un comprobante interno, no una factura electrónica.
- **Pago anticipado manual sin pasarela**: cada negocio decide si exige pago
  para reservar en línea (precio completo, una seña fija del negocio, o una
  seña específica por servicio), muestra su QR, llave Bre-B y cuenta(s), y el
  cliente envía el comprobante por WhatsApp. El horario se reserva de
  inmediato como "pago pendiente" — visible también si el cliente vuelve a
  `/cita/[id]` — y el negocio lo confirma o rechaza desde Citas (avisando al
  cliente por WhatsApp en ambos casos). Si no se confirma a tiempo, el
  horario se libera solo, no sin antes recordarle al cliente a mitad de
  camino que falta su comprobante; el dueño también recibe un aviso por
  WhatsApp apenas entra una reserva pendiente, y el resumen del panel muestra
  cuántas hay por verificar.
- **Reembolsos reales**: marcar una cita pagada como reembolsada (con motivo
  obligatorio) la excluye automáticamente de reportes, nómina y analítica.
- **Enlaces de WhatsApp con un clic**: en Citas, cada cita confirmada tiene
  botones para mandar el recordatorio o el enlace de cancelación por
  WhatsApp, y cada cita completada uno para pedir reseña — abren WhatsApp
  con el mensaje ya escrito, listos para enviar desde el número real del
  negocio, sin depender de Twilio ni de la aprobación de Meta.
- **Protección anti-spam sin dependencias externas**: rate-limit por teléfono
  e IP en reservas/lista de espera/login/signup/recuperación de contraseña, y
  campo honeypot en los formularios públicos.
- **Tiempo de colchón entre citas**: cada miembro del personal puede tener
  minutos de limpieza/descanso obligatorios después de cada cita, para que no
  se agenden pegadas sin ningún margen.
- **Cupones de descuento** (porcentaje o monto fijo, con límite de usos y
  vencimiento opcionales) aplicables al reservar en línea — no a venta de
  producto ni a citas sin cita previa.
- **Programa de referidos**: cada cliente tiene un código propio para
  compartir; cuando alguien nuevo reserva por primera vez con su enlace, el
  referidor suma los puntos configurados (reutiliza el sistema de fidelidad).
- **Bitácora de auditoría**: registro de acciones sensibles (cambios de
  Configuración, permisos de Equipo, apertura/cierre de caja, confirmar/
  rechazar/reembolsar un pago) visible solo para el dueño.
- **Checklist de onboarding**: guía los primeros pasos (agregar personal,
  servicio, teléfono) en el resumen del panel hasta completarlos u ocultarla.
- **Alertas de stock bajo**: cada producto puede tener un stock mínimo
  configurable; al cruzarlo en una venta, se avisa por correo a los dueños.
- **Control de gastos operativos**: registro de gastos (arriendo, insumos,
  servicios) que se descuenta del ingreso en Reportes y Analítica para
  mostrar la ganancia real, no solo el ingreso bruto.
- **Resumen semanal automático por correo**: cada lunes, los dueños reciben
  un correo con el ingreso, las citas completadas y el servicio más pedido
  de la última semana, sin tener que entrar al panel.
- **Reprogramar cita desde el enlace público**: además de cancelar, el
  cliente puede mover su cita a otro horario libre del mismo especialista
  desde `/cita/[id]`, respetando el mismo margen de anticipación que exige
  una cancelación.
- **Paquetes de sesiones prepagadas**: el dueño arma paquetes de un servicio
  (ej. "5 cortes por $80.000") y se los vende a un cliente; al registrar un
  walk-in para ese cliente y servicio, el panel ofrece consumir una sesión
  del paquete en vez de cobrar de nuevo.
- **Metas de venta por especialista**: meta de ingreso mensual opcional por
  miembro del equipo, con barra de progreso visible en Reportes.
- **Instalable como app** (PWA) desde el navegador del celular.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Prisma](https://www.prisma.io/) con PostgreSQL
- TailwindCSS
- Autenticación propia con `bcryptjs` (hash de contraseñas) y `jose` (sesión JWT)
- [Cloudinary](https://cloudinary.com/) para fotos de personal, servicios y productos
- [Resend](https://resend.com/) para correo transaccional (recuperación de contraseña, recordatorios de cita)
- [Twilio](https://www.twilio.com/) para WhatsApp (recordatorios, lista de espera, difusión)
- [pdfkit](https://pdfkit.org/) para el reporte de caja en PDF

## Modelo de datos

- **Organization** — el dueño/marca completo. Puede tener una o varias
  sucursales (`Business`). `Client` vive aquí, no en la sucursal, para
  compartirse entre todas las ubicaciones del mismo dueño.
- **Business** — una sucursal/ubicación: tiene un `category` (rubro), plan
  (`GRATIS`/`PRO`), política de cancelación, canales de recordatorios (se
  puede activar varios a la vez), la
  configuración del programa de fidelidad y de referidos, el umbral de alerta
  por diferencia de caja, la configuración de pago anticipado (QR, llave
  Bre-B, cuenta, monto de la seña y horas para expirar) y si ya se ocultó el
  checklist de onboarding.
- **User** — cuenta con acceso al panel. `role` es `OWNER` o `STAFF`;
  `permissions` (CSV) define qué secciones adicionales puede ver una cuenta
  `STAFF` (`staff`, `catalog`, `reports`, `settings`); `staffId` opcional la
  vincula a un miembro del roster para restringir qué caja puede operar.
- **Staff** — miembro del equipo (el roster, no la cuenta de acceso), con % de
  comisión opcional, horario y días laborales, minutos de colchón después de
  cada cita, meta de ingreso mensual opcional, y rangos de `StaffTimeOff`
  (vacaciones/incapacidad) que bloquean la reserva esos días.
- **Service** — servicio agendable, con duración, precio, descripción y seña
  de pago anticipado opcionales (si no se define, usa la seña general del
  negocio o el precio completo).
- **Product** — producto físico en venta (sin relación con las citas), con
  descripción, precio, stock y stock mínimo (para la alerta) opcionales
  propios; cada venta queda en `ProductSale`.
- **Client** — historial de un cliente dentro de una organización, con
  contador de `strikes`, puntos de fidelidad, si acepta difusión por WhatsApp,
  correo opcional (para recordatorios), su `referralCode` propio y quién lo
  refirió (`referredById`), si aplica.
- **Appointment** — cita, con estado (`CONFIRMED`, `CANCELLED`, `COMPLETED`,
  `NO_SHOW`, `PENDING_PAYMENT`), origen (`ONLINE`/`WALK_IN`), método/estado de
  pago (incluye `TRANSFER`/`AWAITING_VERIFICATION`/`REFUNDED` con motivo y
  fecha), `paidAt`, `couponCode` si se usó uno, `packagePurchaseId` si se
  pagó consumiendo un paquete prepagado, `clientEmail` (snapshot opcional,
  igual que `clientName`/`clientPhone`) y `recurrenceGroupId` opcional si
  pertenece a una serie recurrente.
- **Review** — reseña (1 a 5) que un cliente deja tras una cita completada.
- **CashSession** — apertura/cierre de caja por empleado o general, con monto
  esperado (calculado, incluye ventas de producto en efectivo), contado, la
  diferencia y quién la abrió/cerró (`openedByUserId`/`closedByUserId`).
- **PayrollPayout** — cierre congelado de comisión de un staff para un rango
  de fechas, para no recalcular el mismo período dos veces.
- **WaitlistEntry** — cliente esperando que se libere un horario en un día
  sin cupo; el negocio le avisa por WhatsApp a mano desde el panel, no
  automáticamente.
- **Coupon** — código de descuento (porcentaje o monto fijo) por negocio, con
  límite de usos y vencimiento opcionales; solo aplica a la reserva pública.
- **AuditLog** — bitácora de acciones sensibles (dinero y accesos), con el
  nombre del usuario guardado como snapshot para seguir siendo legible aunque
  la cuenta se borre o desactive.
- **Expense** — gasto operativo (categoría, monto, descripción, fecha) que se
  descuenta del ingreso en Reportes y Analítica.
- **ServicePackage** — paquete de sesiones prepagadas de un servicio (nombre,
  número de sesiones, precio), definido por el dueño.
- **ClientPackagePurchase** — lo que un cliente concreto compró de un
  `ServicePackage`, con las sesiones que le van quedando (`sessionsRemaining`).

El vocabulario que se muestra en pantalla (cómo se llama al personal, la
pregunta del paso 2 de la reserva, etc.) según el `category` del negocio vive en
`src/lib/vocabulary.ts`.

## Funciones que todavía son solo el esqueleto (sin proveedor conectado)

- **Pagos en línea con pasarela** — no hay ninguna conectada (Stripe, Wompi,
  MercadoPago, etc.). Lo que sí existe es un pago anticipado **manual**: el
  negocio muestra su QR/Bre-B/cuenta, el cliente transfiere y manda el
  comprobante por WhatsApp, y el negocio confirma a mano desde Citas.
- **Recordatorios por SMS** — WhatsApp (Twilio) y correo (Resend) ya envían de
  verdad. WhatsApp necesita `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/
  `TWILIO_WHATSAPP_FROM`; correo necesita `RESEND_API_KEY` y que el cliente
  haya dejado su email al reservar (si no lo dejó, simplemente no se le
  manda). El canal SMS todavía solo registra el mensaje en el log —
  `src/lib/notifications.ts` tiene el punto de extensión listo para
  conectarlo cuando se decida el proveedor.
- **Factura electrónica legal** — el recibo en PDF (por cita o venta de
  producto) es solo un comprobante interno. Facturación electrónica de
  verdad (DIAN en Colombia, CFDI/SAT en México, etc.) requiere elegir un
  proveedor autorizado por país y no está conectada todavía.
- **Cobro de la suscripción a los dueños de negocio** — `Business.plan`
  (`GRATIS`/`PRO`) existe pero no está conectado a ninguna pasarela de pago;
  hoy no hay forma de cobrarle a un negocio por usar Turnify ni de que el
  plan bloquee o desbloquee funciones.
- **Captcha real** — la protección contra spam (`src/lib/rateLimit.ts` +
  honeypot) es deliberadamente ligera y sin dependencias externas; un
  hCaptcha/reCAPTCHA real requeriría crear una cuenta en ese servicio y
  pasar una site key, igual que Cloudinary o Stripe.

## Estructura del proyecto

```
src/
  app/
    page.tsx              landing pública
    manifest.ts, icon.tsx  PWA (manifest + ícono generado)
    signup/, login/        alta e inicio de sesión (con selector de rubro)
    book/[slug]/           flujo de reserva del cliente
    catalogo/[slug]/        catálogo público (servicios, productos y equipo, sin reservar)
    cita/[id]/              confirmación, cancelación, reprogramar y reseña de una cita
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
      coupons/                 cupones de descuento para la reserva pública
      packages/                paquetes de sesiones prepagadas y sus ventas
      expenses/                gastos operativos del negocio
      audit/                   bitácora de acciones sensibles (solo dueño)
      team/                   cuentas de Personal y sus permisos ([id] = editar)
      locations/              sucursales de la organización
      settings/               configuración del negocio (rubro, recordatorios, fidelidad, pagos)
    actions/                server actions (auth, booking, appointments, reviews,
                            products, team, cashRegister, payroll, loyalty,
                            broadcast, clients, coupons, etc.)
  lib/
    db.ts                   cliente de Prisma
    auth.ts / session.ts    hash de contraseñas y sesión JWT
    availability.ts         cálculo de huecos libres, balanceo del equipo, excepciones de horario y colchón
    guard.ts                protección de rutas del dashboard
    vocabulary.ts           vocabulario dinámico según el rubro del negocio
    images.ts               subida de fotos a Cloudinary
    notifications.ts        envío de recordatorios: WhatsApp (Twilio) y correo (Resend); punto de extensión para SMS
    whatsapp.ts             arma enlaces wa.me (comprobante de pago anticipado)
    rateLimit.ts            rate-limit en memoria + IP del cliente (anti-spam sin dependencias)
    audit.ts                registra entradas en la bitácora de auditoría
    owners.ts               resuelve los correos de los dueños de una organización, para alertas
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
`RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y
`TWILIO_WHATSAPP_FROM` como `sync: false` — Render crea el campo vacío en el
dashboard pero no adivina el valor. Sin las tres de Cloudinary, el formulario
de subir foto sigue funcionando pero la imagen no se guarda (falla en
silencio); sin las tres de Twilio, ningún WhatsApp automático se manda de
verdad (confirmar/rechazar pago anticipado, difusión masiva, avisar a la
lista de espera, recordatorios) — solo queda registrado en el log. Hay que
pegarlas a mano en **turnify-app → Environment** y volver a desplegar.

El cron `turnify-reminders` es un servicio **aparte, con sus propias
variables — no hereda nada de `turnify-app`**: necesita su propio
`RESEND_API_KEY` (recordatorios y resumen semanal por correo) y sus propias
`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_WHATSAPP_FROM` (recordatorios
por WhatsApp), cargadas a mano en **turnify-reminders → Environment**.

## Planes

- **Gratis** — todo el producto hoy: equipo y reservas ilimitadas, walk-ins,
  reseñas, reportes de desempeño y comisiones, historial de clientes con
  sanciones. El campo `plan` existe en el modelo de datos pero **no hay
  ninguna limitación ni cobro implementado todavía**.
- **Pro** (en construcción, sin fecha) — recordatorios automáticos por SMS y
  cobro en línea con pasarela. Multi-sucursal ya está construido (ver
  `/dashboard/locations`) y disponible hoy sin restricción de plan; los otros
  dos no están construidos, no anunciarlos como disponibles hasta que lo estén.
