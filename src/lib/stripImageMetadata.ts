/**
 * Strips EXIF and other metadata from an image file before it's uploaded.
 *
 * How it works: browsers' <canvas> export (toBlob/toDataURL) only ever encodes
 * the raw pixel data it was given — it does not carry over the original file's
 * EXIF headers (camera info, GPS location, timestamps, etc.), because canvas
 * pixels have no concept of metadata to begin with. So decoding the uploaded
 * image into a canvas and re-exporting it as a new file reliably produces a
 * clean copy with no metadata, regardless of what the original file contained.
 *
 * This runs entirely in the browser before the file is uploaded anywhere —
 * the original file (with its metadata) is never sent to storage.
 */
export async function stripImageMetadata(file: File): Promise<File> {
  const imageBitmap = await createImageBitmap(file);

  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // If canvas isn't available for some reason, fall back to the original file
    // rather than failing the whole upload.
    return file;
  }
  ctx.drawImage(imageBitmap, 0, 0);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const quality = outputType === "image/jpeg" ? 0.95 : undefined;

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, outputType, quality)
  );

  if (!blob) {
    return file; // fallback: don't block the upload if re-encoding fails
  }

  return new File([blob], file.name, { type: outputType });
}
