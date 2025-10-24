'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ShareLinkButtonProps {
  eventId: string;
  eventDate: string;
  shareExpireDays: number;
}

export function ShareLinkButton({ eventId, eventDate, shareExpireDays }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  // Fallback auf aktuelle Domain, falls NEXT_PUBLIC_APP_URL nicht gesetzt
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://tech-memory-web.vercel.app');
  const shareUrl = `${baseUrl}/share/${eventId}`;

  // Expiry-Datum berechnen
  const eventDateObj = new Date(eventDate);
  const expiryDate = new Date(eventDateObj);
  expiryDate.setDate(expiryDate.getDate() + shareExpireDays);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          🔗 Share-Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share-Link für Gäste</DialogTitle>
          <DialogDescription>
            Teile diesen Link mit deinen Gästen, damit sie alle freigegebenen Beiträge sehen können.
            <br />
            <span className="text-xs">
              Gültig bis: {expiryDate.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })} ({shareExpireDays} Tage nach Event)
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button onClick={handleCopy} variant={copied ? 'default' : 'outline'}>
              {copied ? '✓ Kopiert' : 'Kopieren'}
            </Button>
          </div>

          <div className="text-center">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Share-Seite in neuem Tab öffnen →
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
