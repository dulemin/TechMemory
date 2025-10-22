'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Contribution {
  id: string;
  type: 'video' | 'photo' | 'text';
  guest_name: string;
  content_url: string | null;
  text_content: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface ModerationViewProps {
  eventId: string;
  eventTitle: string;
  initialContributions: Contribution[];
}

export function ModerationView({
  eventId,
  eventTitle,
  initialContributions,
}: ModerationViewProps) {
  const [contributions, setContributions] =
    useState<Contribution[]>(initialContributions);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Realtime-Subscription für neue Contributions
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`moderation:${eventId}`)
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

          if (payload.eventType === 'INSERT') {
            setContributions((prev) => [payload.new as Contribution, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setContributions((prev) =>
              prev.map((c) =>
                c.id === payload.new.id ? (payload.new as Contribution) : c
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setContributions((prev) =>
              prev.filter((c) => c.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleStatusChange = async (
    contributionId: string,
    newStatus: 'approved' | 'rejected'
  ) => {
    setIsLoading(contributionId);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('contributions')
        .update({ status: newStatus })
        .eq('id', contributionId);

      if (error) throw error;

      // Local update (Realtime wird auch triggern, aber für sofortiges Feedback)
      setContributions((prev) =>
        prev.map((c) => (c.id === contributionId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Status-Änderung fehlgeschlagen');
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (contributionId: string) => {
    if (!confirm('Beitrag wirklich löschen?')) return;

    setIsLoading(contributionId);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', contributionId);

      if (error) throw error;

      setContributions((prev) => prev.filter((c) => c.id !== contributionId));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Löschen fehlgeschlagen');
    } finally {
      setIsLoading(null);
    }
  };

  const pendingContributions = contributions.filter((c) => c.status === 'pending');
  const approvedContributions = contributions.filter((c) => c.status === 'approved');
  const rejectedContributions = contributions.filter((c) => c.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{eventTitle}</h1>
          <p className="text-muted-foreground">Moderiere Gast-Beiträge</p>
        </div>
        <Link href={`/events/${eventId}/wall`}>
          <Button>🎬 Live-Wall öffnen</Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            ⏳ Wartend ({pendingContributions.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            ✅ Freigegeben ({approvedContributions.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            ❌ Abgelehnt ({rejectedContributions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingContributions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine wartenden Beiträge
              </CardContent>
            </Card>
          ) : (
            pendingContributions.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                onApprove={() => handleStatusChange(contribution.id, 'approved')}
                onReject={() => handleStatusChange(contribution.id, 'rejected')}
                onDelete={() => handleDelete(contribution.id)}
                isLoading={isLoading === contribution.id}
                showActions
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedContributions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine freigegebenen Beiträge
              </CardContent>
            </Card>
          ) : (
            approvedContributions.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                onReject={() => handleStatusChange(contribution.id, 'rejected')}
                onDelete={() => handleDelete(contribution.id)}
                isLoading={isLoading === contribution.id}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {rejectedContributions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine abgelehnten Beiträge
              </CardContent>
            </Card>
          ) : (
            rejectedContributions.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                onApprove={() => handleStatusChange(contribution.id, 'approved')}
                onDelete={() => handleDelete(contribution.id)}
                isLoading={isLoading === contribution.id}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Contribution Card Component
interface ContributionCardProps {
  contribution: Contribution;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete: () => void;
  isLoading: boolean;
  showActions?: boolean;
}

function ContributionCard({
  contribution,
  onApprove,
  onReject,
  onDelete,
  isLoading,
  showActions = false,
}: ContributionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{contribution.guest_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(contribution.created_at).toLocaleString('de-DE', {
                day: '2-digit',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <Badge
            variant={
              contribution.type === 'video'
                ? 'default'
                : contribution.type === 'photo'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {contribution.type === 'video'
              ? '📹 Video'
              : contribution.type === 'photo'
                ? '📷 Foto'
                : '✍️ Text'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Preview */}
        {contribution.type === 'video' && contribution.content_url && (
          <video src={contribution.content_url} controls className="w-full rounded-lg" />
        )}

        {contribution.type === 'photo' && contribution.content_url && (
          <img
            src={contribution.content_url}
            alt="Photo"
            className="w-full rounded-lg"
          />
        )}

        {contribution.type === 'text' && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm italic">"{contribution.text_content}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {showActions && onApprove && (
            <Button
              onClick={onApprove}
              disabled={isLoading}
              variant="default"
              size="sm"
            >
              ✅ Freigeben
            </Button>
          )}

          {showActions && onReject && (
            <Button
              onClick={onReject}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              ❌ Ablehnen
            </Button>
          )}

          {!showActions && onApprove && (
            <Button
              onClick={onApprove}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              ✅ Wieder freigeben
            </Button>
          )}

          {!showActions && onReject && (
            <Button
              onClick={onReject}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              ❌ Wieder ablehnen
            </Button>
          )}

          <Button
            onClick={onDelete}
            disabled={isLoading}
            variant="destructive"
            size="sm"
          >
            🗑️ Löschen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
