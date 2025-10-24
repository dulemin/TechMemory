'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface QRCodeCardProps {
  eventTitle: string;
  eventCode: string;
  guestUrl: string;
}

export function QRCodeCard({ eventTitle, eventCode, guestUrl }: QRCodeCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      toast.info('QR-Code wird generiert...');

      // QR-Code als Data URL generieren
      const qrDataUrl = await QRCode.toDataURL(guestUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // PDF erstellen
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Titel
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(eventTitle, 105, 30, { align: 'center' });

      // Untertitel
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Gästebuch-Beiträge hochladen', 105, 45, { align: 'center' });

      // QR-Code einfügen (zentriert)
      const qrSize = 80;
      const qrX = (210 - qrSize) / 2; // A4 width = 210mm
      const qrY = 60;
      pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Event-Code unter QR-Code
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Code: ${eventCode}`, 105, qrY + qrSize + 15, { align: 'center' });

      // Anweisungen
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const instructions = [
        '1. QR-Code mit Smartphone-Kamera scannen',
        '2. Link öffnen und Namen eingeben',
        '3. Fotos, Videos oder Nachrichten hochladen',
        '',
        'Alternativ: Event-Code manuell eingeben unter',
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://tech-memory-web.vercel.app'}`,
      ];

      let yPos = qrY + qrSize + 30;
      instructions.forEach((line) => {
        pdf.text(line, 105, yPos, { align: 'center' });
        yPos += 7;
      });

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Powered by TechMemory', 105, 280, { align: 'center' });

      // PDF herunterladen
      const fileName = `QR-Code-${eventTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      pdf.save(fileName);

      toast.success('QR-Code erfolgreich heruntergeladen!');
    } catch (error) {
      console.error('Error generating QR code PDF:', error);
      toast.error('Fehler beim Generieren des QR-Codes');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer border-brand-primary/20 ${
        isGenerating ? 'opacity-50 pointer-events-none' : ''
      }`}
      onClick={handleDownloadPDF}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-primary-light rounded-lg">
            <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-brand-text-dark">
              {isGenerating ? 'Generiere PDF...' : 'QR-Karten herunterladen'}
            </h3>
            <p className="text-sm text-brand-text-mid mt-1">PDF für Tischkarten</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
