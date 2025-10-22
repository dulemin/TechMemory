'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { createClient } from '@/lib/supabase/client';

interface PDFExportButtonProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
}

export function PDFExportButton({ eventId, eventTitle, eventDate }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Alle approved Beiträge laden
      const { data: contributions, error: fetchError } = await supabase
        .from('contributions')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (!contributions || contributions.length === 0) {
        throw new Error('Keine freigegebenen Beiträge zum Exportieren');
      }

      // PDF erstellen
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      // Titel-Seite
      doc.setFontSize(24);
      doc.text(eventTitle, pageWidth / 2, y, { align: 'center' });
      y += 15;

      doc.setFontSize(12);
      doc.text(
        `Event-Datum: ${new Date(eventDate).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 10;

      doc.text(
        `Export-Datum: ${new Date().toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 10;

      doc.text(
        `Anzahl Beiträge: ${contributions.length}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 20;

      // Trennlinie
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;

      // Beiträge hinzufügen
      contributions.forEach((contribution, index) => {
        // Neue Seite wenn nötig
        if (y > pageHeight - 40) {
          doc.addPage();
          y = margin;
        }

        // Beitrags-Nummer
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Beitrag #${index + 1}`, margin, y);
        y += 8;

        // Metadaten
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Von: ${contribution.guest_name}`, margin, y);
        y += 6;
        doc.text(
          `Typ: ${contribution.type === 'video' ? 'Video' : contribution.type === 'photo' ? 'Foto' : 'Text'}`,
          margin,
          y
        );
        y += 6;
        doc.text(
          `Datum: ${new Date(contribution.created_at).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          margin,
          y
        );
        y += 8;

        // Content
        if (contribution.type === 'text' && contribution.text_content) {
          doc.setFont('helvetica', 'italic');
          const lines = doc.splitTextToSize(contribution.text_content, pageWidth - 2 * margin);

          lines.forEach((line: string) => {
            if (y > pageHeight - 20) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin, y);
            y += 6;
          });
          y += 5;
        } else if (contribution.type === 'video') {
          doc.setFont('helvetica', 'normal');
          doc.text(
            `📹 Video (${contribution.duration_seconds || 0}s)`,
            margin,
            y
          );
          y += 6;
          if (contribution.content_url) {
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 255);
            doc.textWithLink('Link zum Video', margin, y, { url: contribution.content_url });
            doc.setTextColor(0, 0, 0);
            y += 8;
          }
        } else if (contribution.type === 'photo') {
          doc.setFont('helvetica', 'normal');
          doc.text('📷 Foto', margin, y);
          y += 6;
          if (contribution.content_url) {
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 255);
            doc.textWithLink('Link zum Foto', margin, y, { url: contribution.content_url });
            doc.setTextColor(0, 0, 0);
            y += 8;
          }
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Trennlinie
        if (y > pageHeight - 30) {
          doc.addPage();
          y = margin;
        }
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      });

      // Footer auf jeder Seite
      const pageCount = doc.internal.pages.length - 1; // -1 wegen der ersten leeren Seite
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Seite ${i} von ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.setTextColor(0);
      }

      // PDF speichern
      const fileName = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Gästebuch.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
      setError(err instanceof Error ? err.message : 'PDF-Export fehlgeschlagen');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? '📄 Exportiere...' : '📄 Als PDF exportieren'}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
