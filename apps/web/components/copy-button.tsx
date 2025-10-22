'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'link';
}

export function CopyButton({
  text,
  label = 'Kopieren',
  size = 'sm',
  variant = 'outline'
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('In Zwischenablage kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
    >
      {copied ? '✓ Kopiert' : label}
    </Button>
  );
}
