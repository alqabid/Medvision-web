import { jsPDF } from "jspdf";

interface ReportData {
  prediction: string;
  confidence: number;
  findings: string;
  timestamp: string;
  filename: string;
  imageDataUrl?: string | null;
  patientName?: string;
  practitioner?: string;
}

export const generateReport = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(15, 65, 81);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MedVision", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Pneumonia Detection Report", 14, 24);

  // Reset color
  doc.setTextColor(20, 20, 20);
  let y = 40;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnostic Summary", 14, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const lines = [
    ["Patient", data.patientName || "Not specified"],
    ["Practitioner", data.practitioner || "Not specified"],
    ["File", data.filename],
    ["Generated", data.timestamp],
    ["Model", "MobileNetV2 (Transfer Learning, AI-assisted)"],
  ];
  lines.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), 55, y);
    y += 7;
  });

  // Result box
  y += 4;
  const isPneumonia = data.prediction === "Pneumonia";
  doc.setFillColor(isPneumonia ? 254 : 240, isPneumonia ? 226 : 253, isPneumonia ? 226 : 244);
  doc.setDrawColor(isPneumonia ? 220 : 16, isPneumonia ? 38 : 185, isPneumonia ? 38 : 129);
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(isPneumonia ? 153 : 6, isPneumonia ? 27 : 95, isPneumonia ? 27 : 70);
  doc.text(`Prediction: ${data.prediction}`, 20, y + 11);
  doc.setFontSize(12);
  doc.text(`Confidence: ${Number(data.confidence).toFixed(2)}%`, 20, y + 20);
  y += 34;

  // Findings
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("AI Findings (Explainability)", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const findings = doc.splitTextToSize(data.findings || "No findings.", pageWidth - 28);
  doc.text(findings, 14, y);
  y += findings.length * 5 + 6;

  // Image
  if (data.imageDataUrl) {
    try {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Original X-Ray", 14, y);
      y += 4;
      doc.addImage(data.imageDataUrl, "JPEG", 14, y, 80, 80);
      y += 86;
    } catch (e) {
      console.error("Image embed failed:", e);
    }
  }

  // Footer
  const footY = doc.internal.pageSize.getHeight() - 18;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footY, pageWidth - 14, footY);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "This is an AI-assisted analysis and should not replace professional medical diagnosis.",
    14,
    footY + 6
  );
  doc.text(`MedVision © ${new Date().getFullYear()}`, 14, footY + 11);

  doc.save(`medvision-report-${Date.now()}.pdf`);
};
