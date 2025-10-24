'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface CopyLinkCardProps {
  guestUrl: string;
}

export function CopyLinkCard({ guestUrl }: CopyLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      toast.success('Link kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer border-brand-primary/20"
      onClick={handleCopy}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-primary-light rounded-lg">
            <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-brand-text-dark">Link teilen</h3>
            <p className="text-sm text-brand-text-mid mt-1">
              {copied ? '✓ Link kopiert!' : 'Per WhatsApp oder kopieren'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
