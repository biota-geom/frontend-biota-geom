/*
 * Hands the browser a file to save. The anchor is never attached to the
 * document: clicking a detached one still starts the download, and the object
 * URL is released right after so the blob does not stay in memory.
 */
export function saveBlobAs(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(objectUrl);
}
