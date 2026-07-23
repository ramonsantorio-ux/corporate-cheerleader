// Utility to load the Busato logo as base64 for jsPDF
let cachedLogo: string | null = null;

/** Minimal interface covering the jsPDF methods we call internally. */
interface JsPDFDoc {
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  addImage(data: string, format: string, x: number, y: number, w: number, h: number): void;
  setTextColor(r: number, g: number, b: number): void;
  setFontSize(size: number): void;
  setFont(family: string, style: string): void;
  text(text: string, x: number, y: number, options?: { align?: string }): void;
  setDrawColor(r: number, g: number, b: number): void;
  setLineWidth(width: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  setFillColor(r: number, g: number, b: number): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
}
// ── Corporate color palette (matching Busato logo) ──
export const PDF_COLORS = {
  primary: [59, 130, 187] as const,      // Blue from logo
  primaryDark: [42, 90, 140] as const,    // Darker blue
  accent: [58, 79, 122] as const,         // Navy blue accent
  lightBg: [238, 244, 250] as const,      // Soft blue background (matches reference)
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
 * Draws standard Busato header on a jsPDF doc based on the new corporate layout.
 * Returns the Y position after the header (typically 75).
 */
export function drawBusatoHeader(
  doc: JsPDFDoc,
  logoBase64: string | null,
  title: string,
  subtitle: string,
  options?: { pageWidth?: number; now?: string }
) {
  const pw = options?.pageWidth ?? doc.internal.pageSize.getWidth();
  const now = options?.now ?? new Date().toLocaleDateString('pt-BR');

  // Header Logo and Date
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, 10, 45, 15);
    } catch {
      doc.setTextColor(...PDF_COLORS.primary); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('BUSATO', 14, 20);
    }
  } else {
    doc.setTextColor(...PDF_COLORS.primary); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('BUSATO', 14, 20);
  }

  // Date on the right
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(now, pw - 14, 20, { align: 'right' });

  // Thick Blue Line Separator
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(14, 28, pw - 14, 28);

  // Main Title
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 45);

  // Subtitle
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(12);
  doc.text(subtitle.toUpperCase(), 14, 53);

  // Short Blue Line below subtitle
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(1.5);
  doc.line(14, 60, 70, 60);
  
  // Return new Y position so content knows where to start
  return 75;
}

export function drawBusatoFooter(
  doc: JsPDFDoc,
  pageNum: number = 1,
  options?: { pageWidth?: number; pageHeight?: number }
) {
  const pw = options?.pageWidth ?? doc.internal.pageSize.getWidth();
  const ph = options?.pageHeight ?? doc.internal.pageSize.getHeight();

  doc.setDrawColor(...PDF_COLORS.primary); doc.setLineWidth(0.5);
  doc.line(14, ph - 14, pw - 14, ph - 14);
  doc.setFontSize(8); doc.setTextColor(...PDF_COLORS.gray); doc.setFont('helvetica', 'normal');
  doc.text('BUSATO LOCAÇÕES E SERVIÇOS LTDA • CNPJ: 54.167.719/0001-40', 14, ph - 9);
  doc.text(`Página ${pageNum}`, pw - 14, ph - 9, { align: 'right' });
}

/**
 * Draws a section heading with blue accent bar (like "EMPRESA LOCADORA").
 */
export function drawSectionHeading(
  doc: JsPDFDoc,
  title: string,
  y: number,
  options?: { margin?: number; pageWidth?: number }
) {
  const margin = options?.margin ?? 14;
  const pw = options?.pageWidth ?? doc.internal.pageSize.getWidth();

  // Full width light blue background like the PDF
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.rect(margin, y, pw - margin * 2, 8, 'F');
  
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), margin + 4, y + 5.5);
  doc.setTextColor(0);
  
  return y + 12;
}

/**
 * Draws a horizontal progress bar for charts.
 */
export function drawPdfBarChart(
  doc: JsPDFDoc,
  label: string,
  percentage: number,
  y: number,
  options?: { margin?: number; width?: number; color?: readonly [number, number, number] }
) {
  const margin = options?.margin ?? 14;
  const width = options?.width ?? 80;
  const color = options?.color ?? PDF_COLORS.primary;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.dark);
  doc.text(`${label} (${percentage}%)`, margin, y);

  const barY = y + 2;
  const barHeight = 5;

  // Background
  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.rect(margin, barY, width, barHeight, 'F');

  // Fill
  const fillWidth = (percentage / 100) * width;
  if (fillWidth > 0) {
    doc.setFillColor(...color);
    doc.rect(margin, barY, fillWidth, barHeight, 'F');
  }

  return barY + barHeight + 8; // Next Y
}

/**
 * Draws a bidirectional slider (like MBTI / DISC trends).
 */
export function drawPdfSlider(
  doc: JsPDFDoc,
  leftLabel: string,
  rightLabel: string,
  leftVal: number,
  rightVal: number,
  y: number,
  options?: { margin?: number; width?: number; leftColor?: readonly [number, number, number]; rightColor?: readonly [number, number, number] }
) {
  const margin = options?.margin ?? 14;
  const width = options?.width ?? 180;
  
  // Custom colors or defaults
  const lColor = options?.leftColor ?? [79, 70, 229]; // Indigo
  const rColor = options?.rightColor ?? [203, 213, 225]; // Slate

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.dark);
  
  doc.text(`${leftLabel} (${leftVal}%)`, margin, y);
  doc.text(`${rightLabel} (${rightVal}%)`, margin + width, y, { align: 'right' });

  const barY = y + 2;
  const barHeight = 5;

  // Left fill
  const leftWidth = (leftVal / 100) * width;
  if (leftWidth > 0) {
    doc.setFillColor(...lColor);
    doc.rect(margin, barY, leftWidth, barHeight, 'F');
  }

  // Right fill
  const rightWidth = (rightVal / 100) * width;
  if (rightWidth > 0) {
    doc.setFillColor(...rColor);
    doc.rect(margin + leftWidth, barY, rightWidth, barHeight, 'F');
  }

  return barY + barHeight + 8; // Next Y
}
