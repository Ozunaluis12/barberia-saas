/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit lee sus archivos .afm de fuentes con fs.readFileSync en tiempo de
  // ejecución; si webpack lo empaqueta, esos archivos no quedan disponibles
  // en la ruta esperada. Se deja como paquete externo para que corra con el
  // require nativo de Node.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
