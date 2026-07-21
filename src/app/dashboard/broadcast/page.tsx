import { requireOwner } from "@/lib/guard";
import { prisma } from "@/lib/db";
import BroadcastForm from "./BroadcastForm";

export default async function BroadcastPage() {
  const session = await requireOwner();

  const [total, optedIn] = await Promise.all([
    prisma.client.count({ where: { organizationId: session.organizationId } }),
    prisma.client.count({ where: { organizationId: session.organizationId, marketingOptIn: true } }),
  ]);

  const twilioConfigured = Boolean(process.env.TWILIO_WHATSAPP_FROM);

  return (
    <div>
      <h1 className="text-2xl font-bold">Difusión por WhatsApp</h1>
      <p className="mt-1 text-sm text-cream/60">
        Envía el mismo mensaje a todos tus clientes que no lo hayan desactivado ({optedIn} de{" "}
        {total} clientes lo recibirán). Cada cliente puede desactivarlo desde su ficha en{" "}
        <span className="text-gold">Clientes</span>.
      </p>

      {!twilioConfigured && (
        <p className="mt-4 rounded-md bg-yellow-500/10 px-3 py-2 text-sm text-yellow-400">
          Twilio todavía no está configurado: los mensajes se registrarán en el servidor pero no se
          enviarán de verdad hasta que se conecten las variables de entorno.
        </p>
      )}

      <div className="mt-6">
        <BroadcastForm />
      </div>
    </div>
  );
}
