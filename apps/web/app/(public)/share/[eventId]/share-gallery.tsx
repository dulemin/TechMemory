'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Contribution {
  id: string;
  guest_name: string;
  type: 'video' | 'photo' | 'text';
  content_url: string | null;
  text_content: string | null;
  created_at: string;
  duration_seconds?: number | null;
}

interface ShareGalleryProps {
  contributions: Contribution[];
}

export function ShareGallery({ contributions }: ShareGalleryProps) {
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [filter, setFilter] = useState<'all' | 'video' | 'photo' | 'text'>('all');

  const filteredContributions = contributions.filter((c) => {
    if (filter === 'all') return true;
    return c.type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Alle ({contributions.length})
          </TabsTrigger>
          <TabsTrigger value="video">
            📹 Videos ({contributions.filter((c) => c.type === 'video').length})
          </TabsTrigger>
          <TabsTrigger value="photo">
            📷 Fotos ({contributions.filter((c) => c.type === 'photo').length})
          </TabsTrigger>
          <TabsTrigger value="text">
            💬 Texte ({contributions.filter((c) => c.type === 'text').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContributions.map((contribution) => (
          <div
            key={contribution.id}
            className="relative group cursor-pointer overflow-hidden rounded-lg border bg-card hover:shadow-lg transition-all"
            onClick={() => setSelectedContribution(contribution)}
          >
            {/* Video Thumbnail */}
            {contribution.type === 'video' && contribution.content_url && (
              <div className="relative aspect-video bg-muted">
                <video
                  src={contribution.content_url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  <div className="text-white text-6xl">▶</div>
                </div>
                {contribution.duration_seconds && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {contribution.duration_seconds}s
                  </div>
                )}
              </div>
            )}

            {/* Photo Thumbnail */}
            {contribution.type === 'photo' && contribution.content_url && (
              <div className="relative aspect-video bg-muted">
                <img
                  src={contribution.content_url}
                  alt={`Foto von ${contribution.guest_name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Text Preview */}
            {contribution.type === 'text' && (
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 p-6 flex items-center justify-center">
                <p className="text-center line-clamp-4 text-sm">
                  {contribution.text_content}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="p-4">
              <p className="font-medium">{contribution.guest_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(contribution.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredContributions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Keine {filter === 'all' ? '' : filter === 'video' ? 'Videos' : filter === 'photo' ? 'Fotos' : 'Texte'} vorhanden.</p>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedContribution} onOpenChange={() => setSelectedContribution(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedContribution && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedContribution.guest_name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedContribution.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </DialogHeader>

              <div className="mt-4">
                {selectedContribution.type === 'video' && selectedContribution.content_url && (
                  <video
                    src={selectedContribution.content_url}
                    controls
                    className="w-full rounded-lg"
                    autoPlay
                  />
                )}

                {selectedContribution.type === 'photo' && selectedContribution.content_url && (
                  <img
                    src={selectedContribution.content_url}
                    alt={`Foto von ${selectedContribution.guest_name}`}
                    className="w-full rounded-lg"
                  />
                )}

                {selectedContribution.type === 'text' && (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{selectedContribution.text_content}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedContribution(null)}>
                  Schließen
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
