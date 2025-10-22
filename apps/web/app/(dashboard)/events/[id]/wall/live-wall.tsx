'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Slideshow } from './slideshow';
import { Gallery } from './gallery';
import Link from 'next/link';

interface Contribution {
  id: string;
  type: 'video' | 'photo' | 'text';
  guest_name: string;
  content_url: string | null;
  text_content: string | null;
  created_at: string;
}

interface LiveWallProps {
  eventId: string;
  eventTitle: string;
  initialContributions: Contribution[];
}

type ViewMode = 'slideshow' | 'grid';

export function LiveWall({
  eventId,
  eventTitle,
  initialContributions,
}: LiveWallProps) {
  const [contributions, setContributions] =
    useState<Contribution[]>(initialContributions);
  const [viewMode, setViewMode] = useState<ViewMode>('slideshow');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Realtime-Subscription für neue approved Beiträge
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`contributions:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contributions',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);

          // Nur approved Beiträge anzeigen
          if (payload.new && (payload.new as any).status === 'approved') {
            if (payload.eventType === 'INSERT') {
              // Neuer Beitrag
              setContributions((prev) => [payload.new as Contribution, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              // Beitrag updated (z.B. von pending zu approved)
              setContributions((prev) => {
                const exists = prev.find((c) => c.id === payload.new.id);
                if (exists) {
                  // Update existing
                  return prev.map((c) =>
                    c.id === payload.new.id ? (payload.new as Contribution) : c
                  );
                } else {
                  // Add if newly approved
                  return [payload.new as Contribution, ...prev];
                }
              });
            } else if (payload.eventType === 'DELETE') {
              // Beitrag gelöscht
              setContributions((prev) =>
                prev.filter((c) => c.id !== payload.old.id)
              );
            }
          }

          // Wenn Status von approved zu rejected geändert wird
          if (
            payload.eventType === 'UPDATE' &&
            (payload.old as any)?.status === 'approved' &&
            (payload.new as any)?.status !== 'approved'
          ) {
            setContributions((prev) =>
              prev.filter((c) => c.id !== payload.new.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Fullscreen-Event-Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header (nur wenn nicht Fullscreen) */}
      {!isFullscreen && (
        <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
              <span>/</span>
              <Link href={`/events/${eventId}`} className="hover:text-white">
                Event-Details
              </Link>
              <span>/</span>
              <span className="text-white font-medium">Live-Wall</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{eventTitle}</h1>
                <p className="text-sm text-gray-400">
                  {contributions.length} Beiträge
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Navigation Buttons */}
                <Link href={`/events/${eventId}/moderate`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    ⚖️ Moderation
                  </Button>
                </Link>

                {/* View Mode Toggle */}
                <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'slideshow' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('slideshow')}
                  >
                    🎬 Slideshow
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    🎨 Galerie
                  </Button>
                </div>

                {/* Fullscreen Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="border-gray-700 bg-white text-gray-900 hover:bg-gray-100"
                >
                  {isFullscreen ? '⤓ Exit' : '⤢ Vollbild'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={isFullscreen ? 'h-screen' : 'min-h-[calc(100vh-80px)]'}>
        {contributions.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-xl mb-2">Noch keine Beiträge</p>
              <p className="text-sm">
                Warte auf die ersten freigegebenen Beiträge...
              </p>
            </div>
          </div>
        ) : viewMode === 'slideshow' ? (
          <Slideshow contributions={contributions} />
        ) : (
          <Gallery contributions={contributions} />
        )}
      </div>
    </div>
  );
}
