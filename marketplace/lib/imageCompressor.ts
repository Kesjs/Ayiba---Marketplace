/**
 * Compression d'image automatique côté client (Canvas HTML5) :
 * - Redimensionne l'image si elle dépasse `maxDimension` (1200px par défaut)
 * - Convertit au format WebP ultra-léger avec une qualité de 82%
 * - Réduit les photos de 5-15 Mo en un fichier ultra-rapide de ~100-250 Ko
 * - Évite de rejeter les photos des vendeurs et accélère l'affichage pour les acheteurs
 */
export async function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !file.type.startsWith("image/")) {
      return resolve(file);
    }

    if (file.size < 250 * 1024 && (file.type === "image/webp" || file.type === "image/jpeg")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = "image/webp";
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: outputType, lastModified: Date.now() }
            );
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
