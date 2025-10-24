'use client';

import { useState } from 'react';
import { createAnonClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface TextUploadProps {
  eventId: string;
  guestName: string;
  questionAnswered?: string;
}

export function TextUpload({ eventId, guestName, questionAnswered }: TextUploadProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName || !guestName.trim()) {
      toast.error('Bitte gib zuerst deinen Namen ein');
      return;
    }

    if (!text.trim()) {
      toast.error('Bitte schreibe eine Nachricht');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createAnonClient();

      const { error: insertError } = await supabase.from('contributions').insert({
        event_id: eventId,
        guest_name: guestName,
        type: 'text',
        text_content: text.trim(),
        status: 'pending',
        question_answered: questionAnswered || null,
      });

      if (insertError) throw insertError;

      toast.success('Nachricht erfolgreich gesendet! Der Host wird sie bald freigeben.');
      setText('');
    } catch (err) {
      console.error('Text-Upload fehlgeschlagen:', err);
      toast.error(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Deine Nachricht</Label>
        <Textarea
          id="message"
          placeholder="Schreibe eine schöne Nachricht für das Event..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={1000}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground text-right">
          {text.length} / 1000 Zeichen
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting || !text.trim()} className="w-full">
        {isSubmitting ? 'Sende...' : 'Nachricht senden'}
      </Button>
    </form>
  );
}
