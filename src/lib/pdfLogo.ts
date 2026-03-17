// Utility to load the Busato logo as base64 for jsPDF
let cachedLogo: string | null = null;

// ── Corporate color palette (matching Busato logo) ──
export const PDF_COLORS = {
  primary: [59, 130, 187] as const,      // Blue from logo
  primaryDark: [42, 90, 140] as const,    // Darker blue
  accent: [58, 79, 122] as const,         // Navy blue accent
  lightBg: [232, 241, 250] as const,      // Soft blue background
  gray: [128, 128, 128] as const,         // Gray from logo text
  dark: [45, 55, 65] as const,            // Dark text
  lightGray: [245, 247, 250] as const,    // Alternate row
  white: [255, 255, 255] as const,
  subtleLine: [190, 210, 230] as const,   // Subtle blue line
};

export async function getBusatoLogoBase64(): Promise<string | null> {
  if (cachedLogo) return cachedLogo;
  try {
    const res = await fetch('/images/busato-logo-full.png');
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
  const now = options?.now ?? new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Primary blue header bar
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, pw, 26, 'F');
  // Accent stripe
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 26, pw, 3, 'F');

  // Logo image
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 6, 3, 45, 20);
    } catch {
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

  doc.setDrawColor(...PDF_COLORS.primary); doc.setLineWidth(0.5);
  doc.line(14, ph - 14, pw - 14, ph - 14);
  doc.setFontSize(7); doc.setTextColor(...PDF_COLORS.gray); doc.setFont('helvetica', 'normal');
  doc.text('Busato — Documento gerado automaticamente pelo sistema. Proibida a reprodução sem autorização.', 14, ph - 9);
  doc.text(`Página ${pageNum}`, pw - 14, ph - 9, { align: 'right' });
}

/**
 * Draws a section heading with blue accent bar.
 */
export function drawSectionHeading(
  doc: any,
  title: string,
  y: number,
  options?: { margin?: number; pageWidth?: number }
) {
  const margin = options?.margin ?? 14;
  const pw = options?.pageWidth ?? doc.internal.pageSize.getWidth();

  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.rect(margin, y, pw - margin * 2, 10, 'F');
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(margin, y, 3, 10, 'F');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin + 7, y + 7);
  doc.setTextColor(0);
  return y + 14;
}
