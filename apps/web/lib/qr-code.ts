import QRCode from 'qrcode';

/**
 * Generiert einen QR-Code als Data URL (PNG-Image)
 * @param url Die URL, die der QR-Code enthalten soll
 * @param options Optionale QR-Code-Optionen
 * @returns Data URL des generierten QR-Codes
 */
export async function generateQRCode(
  url: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: options?.width || 512,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
    });

    return dataUrl;
  } catch (error) {
    console.error('QR-Code-Generierung fehlgeschlagen:', error);
    throw new Error('QR-Code konnte nicht generiert werden');
  }
}

/**
 * Konvertiert eine Data URL in ein Blob
 * @param dataUrl Data URL (z.B. von QR-Code)
 * @returns Blob
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0]?.match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}
