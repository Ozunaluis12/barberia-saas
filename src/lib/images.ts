import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen a Cloudinary y devuelve su URL segura (https). Si no hay
 * credenciales configuradas, no sube nada (deja que el llamador siga sin
 * imagen en vez de romper el flujo).
 */
export async function uploadImage(file: File, folder: string): Promise<string | null> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return null;
  if (!file || file.size === 0) return null;

  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `turnify/${folder}`, resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}
