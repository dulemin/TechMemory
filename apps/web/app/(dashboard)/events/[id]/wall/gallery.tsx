'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Contribution {
  id: string;
  type: 'video' | 'photo' | 'text';
  guest_name: string;
  content_url: string | null;
  text_content: string | null;
  created_at: string;
}

interface GalleryProps {
  contributions: Contribution[];
}

export function Gallery({ contributions }: GalleryProps) {
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null);

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {contributions.map((contribution) => (
            <div
              key={contribution.id}
              onClick={() => setSelectedContribution(contribution)}
              className="group relative aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            >
              {/* Preview */}
              {contribution.type === 'photo' && contribution.content_url && (
                <img
                  src={contribution.content_url}
                  alt={`Foto von ${contribution.guest_name}`}
                  className="w-full h-full object-cover"
                />
              )}

              {contribution.type === 'video' && contribution.content_url && (
                <div className="relative w-full h-full">
                  <video
                    src={contribution.content_url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <span className="text-3xl">▶</span>
                    </div>
                  </div>
                </div>
              )}

              {contribution.type === 'text' && (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
                  <p className="text-sm text-gray-300 line-clamp-6 text-center">
                    "{contribution.text_content}"
                  </p>
                </div>
              )}

              {/* Overlay mit Guest Name */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm font-medium text-white truncate">
                  {contribution.guest_name}
                </p>
              </div>

              {/* Type Badge */}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                {contribution.type === 'video'
                  ? '📹'
                  : contribution.type === 'photo'
                    ? '📷'
                    : '✍️'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal für Full-Size Ansicht */}
      <Dialog
        open={!!selectedContribution}
        onOpenChange={(open) => !open && setSelectedContribution(null)}
      >
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-700 text-white">
          {selectedContribution && (
            <div className="space-y-4">
              {/* Content */}
              {selectedContribution.type === 'video' &&
                selectedContribution.content_url && (
                  <video
                    src={selectedContribution.content_url}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[70vh] rounded-lg"
                  />
                )}

              {selectedContribution.type === 'photo' &&
                selectedContribution.content_url && (
                  <img
                    src={selectedContribution.content_url}
                    alt={`Foto von ${selectedContribution.guest_name}`}
                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                  />
                )}

              {selectedContribution.type === 'text' && (
                <div className="bg-gray-800/50 rounded-lg p-8">
                  <p className="text-2xl leading-relaxed text-gray-100 italic">
                    "{selectedContribution.text_content}"
                  </p>
                </div>
              )}

              {/* Guest Info */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Von</p>
                <p className="text-lg font-semibold">
                  {selectedContribution.guest_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedContribution.created_at).toLocaleString(
                    'de-DE',
                    {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
