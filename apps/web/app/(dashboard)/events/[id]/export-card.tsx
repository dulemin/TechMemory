'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface ExportCardProps {
  eventId: string;
  eventTitle: string;
}

export function ExportCard({ eventId, eventTitle }: ExportCardProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    console.log('Starting export for event:', eventId);

    try {
      const response = await fetch(`/api/events/${eventId}/export`);
      console.log('Export response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || 'Export fehlgeschlagen';
        console.error('Export failed:', errorMessage);

        // Spezifische Fehlermeldung für keine approved Beiträge
        if (errorMessage.includes('No approved contributions')) {
          throw new Error('Keine freigegebenen Beiträge zum Exportieren. Bitte gib zuerst Beiträge frei.');
        }

        throw new Error(errorMessage);
      }

      // Überprüfen ob Response ein Blob ist
      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);

      if (!contentType?.includes('application/zip')) {
        throw new Error(`Unerwarteter Content-Type: ${contentType}`);
      }

      // ZIP-Datei als Blob holen
      const blob = await response.blob();
      console.log('Blob received, size:', blob.size, 'bytes');

      if (blob.size === 0) {
        throw new Error('ZIP-Datei ist leer');
      }

      // Download triggern
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('Download triggered successfully');
      toast.success('Download gestartet!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error(err instanceof Error ? err.message : 'Export fehlgeschlagen');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer border-brand-primary/20 ${isExporting ? 'opacity-50' : ''}`}
      onClick={handleExport}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-primary-light rounded-lg">
            <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-brand-text-dark">Als ZIP herunterladen</h3>
            <p className="text-sm text-brand-text-mid mt-1">
              {isExporting ? 'Exportiere...' : 'Alle Videos & Fotos'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
