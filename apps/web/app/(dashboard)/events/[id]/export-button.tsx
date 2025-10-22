'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  eventId: string;
  eventTitle: string;
}

export function ExportButton({ eventId, eventTitle }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/export`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export fehlgeschlagen');
      }

      // ZIP-Datei als Blob holen
      const blob = await response.blob();

      // Download triggern
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Export fehlgeschlagen');
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
        {isExporting ? '📦 Exportiere...' : '📦 Als ZIP exportieren'}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
