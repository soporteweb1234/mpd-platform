"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export interface RakebackPdfRecord {
  period: string;
  roomName: string;
  rakeGenerated: number;
  rakebackPercent: number;
  rakebackAmount: number;
  status: string;
}

interface Props {
  records: RakebackPdfRecord[];
  userName: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  AVAILABLE: "Disponible",
  REDEEMED: "Canjeado",
  WITHDRAWN: "Retirado",
  EXPIRED: "Expirado",
};

function fmt(value: number) {
  return `€${value.toFixed(2)}`;
}

export function RakebackPdfButton({ records, userName }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;

      // Color palette
      const C = {
        black:   [13,  17,  23]  as [number,number,number],
        surface: [22,  27,  34]  as [number,number,number],
        border:  [48,  54,  61]  as [number,number,number],
        gold:    [201, 168, 76]  as [number,number,number],
        white:   [230, 237, 243] as [number,number,number],
        gray:    [139, 148, 158] as [number,number,number],
        green:   [0,   200, 117] as [number,number,number],
      };

      // ── HEADER BAND ──────────────────────────────────────────────
      doc.setFillColor(...C.black);
      doc.rect(0, 0, W, 50, "F");

      // Gold accent line
      doc.setFillColor(...C.gold);
      doc.rect(0, 50, W, 1.5, "F");

      // Gold left bar
      doc.setFillColor(...C.gold);
      doc.rect(14, 14, 3, 22, "F");

      // Brand name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...C.gold);
      doc.text("MPD", 22, 26);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.gray);
      doc.text("Manager Poker Deal", 22, 33);

      // Report title (right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...C.white);
      doc.text("Informe de Rakeback", W - 14, 24, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.gray);
      const now = new Date();
      doc.text(`Generado: ${now.toLocaleDateString("es-ES")}`, W - 14, 31, { align: "right" });
      doc.text("Jugador:", W - 14, 39, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...C.white);
      doc.text(userName, W - 14, 45, { align: "right" });

      // ── SUMMARY BOXES ────────────────────────────────────────────
      const totalRakeback  = records.reduce((s, r) => s + r.rakebackAmount, 0);
      const totalNGR       = records.reduce((s, r) => s + r.rakeGenerated, 0);
      const available      = records.filter((r) => r.status === "AVAILABLE")
                                    .reduce((s, r) => s + r.rakebackAmount, 0);

      const summaryY = 60;
      const boxW     = (W - 28 - 8) / 3;

      const boxes = [
        { label: "Rakeback Total", value: fmt(totalRakeback), color: C.green },
        { label: "Comisión NGR Total", value: fmt(totalNGR), color: C.white },
        { label: "Disponible", value: fmt(available), color: C.gold },
      ];

      boxes.forEach((b, i) => {
        const x = 14 + i * (boxW + 4);
        doc.setFillColor(...C.surface);
        doc.rect(x, summaryY, boxW, 18, "F");
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.3);
        doc.rect(x, summaryY, boxW, 18, "S");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...C.gray);
        doc.text(b.label, x + boxW / 2, summaryY + 6, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...b.color);
        doc.text(b.value, x + boxW / 2, summaryY + 14, { align: "center" });
      });

      // ── TABLE ─────────────────────────────────────────────────────
      autoTable(doc, {
        startY: summaryY + 26,
        head: [["Período", "Sala", "Comisión NGR", "%", "Rakeback", "Estado"]],
        body: records.map((r) => [
          r.period,
          r.roomName,
          fmt(r.rakeGenerated),
          `${r.rakebackPercent.toFixed(1)}%`,
          fmt(r.rakebackAmount),
          STATUS_LABELS[r.status] ?? r.status,
        ]),
        headStyles: {
          fillColor: C.black,
          textColor: C.gold,
          fontStyle: "bold",
          fontSize: 8,
          lineColor: C.border,
          lineWidth: 0.3,
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [40, 40, 40],
          fontSize: 8,
          lineColor: [220, 220, 220],
          lineWidth: 0.2,
        },
        alternateRowStyles: { fillColor: [248, 248, 250] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 38 },
          2: { halign: "right", cellWidth: 30 },
          3: { halign: "right", cellWidth: 16 },
          4: { halign: "right", cellWidth: 30, fontStyle: "bold" },
          5: { halign: "center", cellWidth: 24 },
        },
        margin: { left: 14, right: 14 },
        theme: "grid",
      });

      // ── FOOTER ───────────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY: number = (doc as any).lastAutoTable?.finalY ?? 220;

      if (finalY < 272) {
        doc.setDrawColor(...C.gold);
        doc.setLineWidth(0.4);
        doc.line(14, finalY + 10, W - 14, finalY + 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...C.gray);
        doc.text(
          "Manager Poker Deal — El jugador solo tiene que jugar al poker.",
          W / 2, finalY + 16, { align: "center" }
        );
        doc.text(
          "Este informe es confidencial y está destinado exclusivamente al titular de la cuenta.",
          W / 2, finalY + 21, { align: "center" }
        );
      }

      const safeName = userName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
      doc.save(`MPD_Rakeback_${safeName}_${now.getFullYear()}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  if (records.length === 0) return null;

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Descargar Informe PDF
    </Button>
  );
}
