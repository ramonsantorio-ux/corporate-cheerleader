// Utility to load the Busato logo as base64 for jsPDF
let cachedLogo: string | null = null;

export async function getBusatoLogoBase64(): Promise<string | null> {
  if (cachedLogo) return cachedLogo;
  try {
    const res = await fetch('/images/busato-logo-full.jpeg');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogo = reader.result as string;
        resolve(cachedLogo);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Draws standard Busato header on a jsPDF doc.
 * Returns the Y position after the header (typically 36).
 */
export function drawBusatoHeader(
  doc: any,
  logoBase64: string | null,
  options?: { pageWidth?: number; now?: string; subtitle?: string }
) {
  const pw = options?.pageWidth ?? doc.internal.pageSize.getWidth();
  const teal = [13, 148, 136] as const;
  const now = options?.now ?? new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Teal header bar
  doc.setFillColor(...teal);
  doc.rect(0, 0, pw, 26, 'F');
  doc.setFillColor(180, 220, 216);
  doc.rect(0, 26, pw, 3, 'F');

  // Logo image
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', 6, 3, 45, 20);
    } catch {
      // fallback to text
      doc.setTextColor(255); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('BUSATO', 14, 12);
    }
  } else {
    doc.setTextColor(255); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('BUSATO', 14, 12);
  }

  // Subtitle
  doc.setTextColor(255); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(options?.subtitle ?? 'GESTÃO DE CONTRATO', 55, 20);

  // Right side
  doc.text(`Emitido em: ${now}`, pw - 14, 12, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENTO CONFIDENCIAL', pw - 14, 20, { align: 'right' });
  doc.setTextColor(0);
}

export function drawBusatoFooter(
  doc: any,
  pageNum: number,
  options?: { pageWidth?: number; pageHeight?: number }
) {
  const pw = options?.pageWidth ?? doc.internal.pageSize.getWidth();
  const ph = options?.pageHeight ?? doc.internal.pageSize.getHeight();
  const teal = [13, 148, 136] as const;

  doc.setDrawColor(...teal); doc.setLineWidth(0.5);
  doc.line(14, ph - 14, pw - 14, ph - 14);
  doc.setFontSize(7); doc.setTextColor(120); doc.setFont('helvetica', 'normal');
  doc.text('Busato — Documento gerado automaticamente pelo sistema. Proibida a reprodução sem autorização.', 14, ph - 9);
  doc.text(`Página ${pageNum}`, pw - 14, ph - 9, { align: 'right' });
}
