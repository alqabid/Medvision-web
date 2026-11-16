import { jsPDF } from "jspdf";

export type ScanModality = "xray" | "ct";

interface ReportData {
  modality?: ScanModality;
  prediction: string;
  confidence: number;
  findings: string;
  timestamp: string;
  filename: string;
  imageDataUrl?: string | null;
  heatmapDataUrl?: string | null;
  classProbabilities?: Record<string, number>;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
  patientNotes?: string;
  practitioner?: string;
  hospital?: string;
  modelUsed?: string;
}

export const generateReport = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const modality: ScanModality = data.modality === "ct" ? "ct" : "xray";
  const scanLabel = modality === "ct" ? "Chest CT" : "Chest X-ray";

  // Header (Dentivo Deep Emerald)
  doc.setFillColor(7, 34, 30);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MedVision", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`AI-Powered ${scanLabel} Diagnostic Report`, 14, 25);
  doc.setFontSize(9);
  doc.text(`Report ID: MV-${Date.now()}`, pageWidth - 14, 18, { align: "right" });
  doc.text(data.timestamp, pageWidth - 14, 25, { align: "right" });

  doc.setTextColor(20, 20, 20);
  let y = 42;

  // Patient section
  doc.setFillColor(240, 245, 243);
  doc.roundedRect(14, y - 6, pageWidth - 28, 48, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Patient Information", 18, y);
  y += 7;
  doc.setFontSize(10);
  const patientRows: Array<[string, string]> = [
    ["Patient Name", data.patientName || "Not specified"],
    ["Age / Gender", `${data.patientAge ?? "N/A"}  /  ${data.patientGender || "Unspecified"}`],
    ["Scan Type", modality === "ct" ? "Chest CT (Lung-Cancer Subtype Classification)" : "Chest X-ray (Pneumonia Classification)"],
    ["Attending Practitioner", data.practitioner || "Not specified"],
    ["Hospital", data.hospital || "Not specified"],
    ["Clinical Notes", data.patientNotes || "None"],
  ];
  patientRows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, 18, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(String(v), pageWidth - 90);
    doc.text(wrapped, 70, y);
    y += Math.max(6, wrapped.length * 5);
  });

  y += 6;

  // Diagnostic result box
  const p = data.prediction;
  const isNormal = p === "Normal";
  const isInvalid = p === "Invalid";
  const [r, g, b] = isNormal ? [16, 185, 129] : isInvalid ? [234, 179, 8] : [220, 38, 38];
  const [br, bg, bb] = isNormal ? [240, 253, 244] : isInvalid ? [254, 249, 195] : [254, 226, 226];
  doc.setFillColor(br, bg, bb);
  doc.setDrawColor(r, g, b);
  doc.roundedRect(14, y, pageWidth - 28, 28, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(r, g, b);
  doc.text(`Diagnosis: ${p}`, 20, y + 12);
  doc.setFontSize(12);
  doc.text(`Confidence: ${Number(data.confidence).toFixed(2)}%`, 20, y + 22);
  doc.setFontSize(10);
  doc.text(`Modality: ${scanLabel}`, pageWidth - 20, y + 12, { align: "right" });
  y += 36;

  doc.setTextColor(20, 20, 20);

  // Class probabilities
  if (data.classProbabilities && Object.keys(data.classProbabilities).length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Classification Breakdown", 14, y);
    y += 6;
    doc.setFontSize(10);
    const barMaxW = pageWidth - 28 - 60;
    Object.entries(data.classProbabilities).forEach(([cls, prob]) => {
      doc.setFont("helvetica", "normal");
      doc.text(cls, 14, y + 4);
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(60, y, barMaxW, 5, 1, 1, "F");
      doc.setFillColor(16, 150, 115);
      doc.roundedRect(60, y, (barMaxW * Number(prob)) / 100, 5, 1, 1, "F");
      doc.text(`${Number(prob).toFixed(1)}%`, pageWidth - 14, y + 4, { align: "right" });
      y += 8;
    });
    y += 4;
  }

  // Findings
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("AI Findings", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const findings = doc.splitTextToSize(data.findings || "No findings.", pageWidth - 28);
  doc.text(findings, 14, y);
  y += findings.length * 5 + 6;

  // Images side-by-side
  if (data.imageDataUrl || data.heatmapDataUrl) {
    if (y > pageHeight - 100) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Imaging", 14, y);
    y += 4;
    const imgW = data.heatmapDataUrl && data.imageDataUrl ? 85 : 120;
    const imgH = 85;
    try {
      if (data.imageDataUrl) {
        doc.addImage(data.imageDataUrl, "JPEG", 14, y, imgW, imgH);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text(`Original ${scanLabel}`, 14, y + imgH + 5);
      }
      if (data.heatmapDataUrl) {
        const x2 = data.imageDataUrl ? 14 + imgW + 8 : 14;
        doc.addImage(data.heatmapDataUrl, "PNG", x2, y, imgW, imgH);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Grad-CAM Heatmap (Explainability)", x2, y + imgH + 5);
      }
      y += imgH + 12;
    } catch (e) {
      console.error("Image embed failed:", e);
    }
  }

  // Meta
  if (y > pageHeight - 40) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Technical Details", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Scan Type: ${scanLabel}`, 14, y); y += 5;
  doc.text(
    `Model: ${data.modelUsed || (modality === "ct" ? "MobileNetV2 (4-class CT, fine-tuned)" : "MobileNetV2 (3-class, fine-tuned)")}`,
    14,
    y
  );
  y += 5;
  doc.text(`Source File: ${data.filename}`, 14, y); y += 5;
  doc.text(`Generated: ${data.timestamp}`, 14, y); y += 5;

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footY = pageHeight - 14;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, footY - 4, pageWidth - 14, footY - 4);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("AI-assisted analysis · not a substitute for professional medical diagnosis.", 14, footY);
    doc.text(`MedVision © ${new Date().getFullYear()}  ·  Page ${i}/${pageCount}`, pageWidth - 14, footY, { align: "right" });
  }

  doc.save(`medvision-${modality}-report-${(data.patientName || "patient").replace(/\s+/g, "_")}-${Date.now()}.pdf`);
};
