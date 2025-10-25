'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Contribution {
  id: string;
  type: 'video' | 'photo' | 'text';
  guest_name: string;
  content_url: string | null;
  text_content: string | null;
  question_answered: string | null;
  created_at: string;
}

interface SlideshowProps {
  contributions: Contribution[];
}

export function Slideshow({ contributions }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentContribution = contributions[currentIndex];

  // Auto-Rotation (alle 8 Sekunden)
  useEffect(() => {
    if (isPaused || contributions.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contributions.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isPaused, contributions.length]);

  // Manuelle Navigation
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % contributions.length);
  };

  const goToPrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + contributions.length) % contributions.length
    );
  };

  if (!currentContribution) return null;

  return (
    <div className="h-screen relative flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Contribution Content - begrenzte Höhe für Viewport-fit */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        {currentContribution.type === 'video' && currentContribution.content_url && (
          <div className="w-full max-w-4xl h-full flex items-center justify-center">
            <video
              key={currentContribution.id}
              src={currentContribution.content_url}
              controls
              autoPlay
              className="w-full max-h-[calc(100vh-180px)] object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}

        {currentContribution.type === 'photo' && currentContribution.content_url && (
          <div className="w-full max-w-4xl h-full flex items-center justify-center">
            <img
              src={currentContribution.content_url}
              alt={`Foto von ${currentContribution.guest_name}`}
              className="w-full max-h-[calc(100vh-180px)] object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}

        {currentContribution.type === 'text' && (
          <div className="max-w-3xl bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700">
            <p className="text-2xl leading-relaxed text-gray-100 text-center italic">
              "{currentContribution.text_content}"
            </p>
          </div>
        )}
      </div>

      {/* Info Box - kompakt am unteren Rand */}
      <div className="px-6 pb-6 pt-3 shrink-0">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-brand-primary shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-brand-primary">Von</p>
              <p className="text-lg font-semibold text-white">
                {currentContribution.guest_name}
              </p>
              {currentContribution.question_answered && (
                <p className="text-xs text-gray-300 italic mt-1">
                  "{currentContribution.question_answered}"
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-brand-primary">
                {currentIndex + 1} / {contributions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrev}
          className="h-12 w-12 rounded-full bg-gray-900/80 backdrop-blur-sm border-brand-primary hover:bg-brand-primary hover:text-white shadow-lg"
        >
          ←
        </Button>
      </div>

      <div className="absolute top-1/2 right-4 -translate-y-1/2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          className="h-12 w-12 rounded-full bg-gray-900/80 backdrop-blur-sm border-brand-primary hover:bg-brand-primary hover:text-white shadow-lg"
        >
          →
        </Button>
      </div>

      {/* Play/Pause Toggle */}
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPaused(!isPaused)}
          className="bg-gray-900/80 backdrop-blur-sm border-brand-primary text-white hover:bg-brand-primary"
        >
          {isPaused ? '▶ Play' : '⏸ Pause'}
        </Button>
      </div>

    </div>
  );
}
