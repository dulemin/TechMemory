'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { MoreVertical, Check, X, Trash2, Clock, CheckCircle, XCircle, Play } from 'lucide-react';

interface Contribution {
  id: string;
  type: 'video' | 'photo' | 'text';
  guest_name: string;
  content_url: string | null;
  text_content: string | null;
  question_answered: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  file_size_bytes?: number;
  duration_seconds?: number;
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

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingContribution, setViewingContribution] = useState<Contribution | null>(null);

  const currentContributions =
    activeTab === 'pending' ? pendingContributions :
    activeTab === 'approved' ? approvedContributions :
    rejectedContributions;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(currentContributions.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (action === 'delete' && !confirm(`${ids.length} Beiträge wirklich löschen?`)) return;

    setIsLoading('bulk');

    try {
      const supabase = createClient();

      if (action === 'delete') {
        for (const id of ids) {
          await supabase.from('contributions').delete().eq('id', id);
        }
        setContributions(prev => prev.filter(c => !selectedIds.has(c.id)));
      } else {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        for (const id of ids) {
          await supabase.from('contributions').update({ status: newStatus }).eq('id', id);
        }
        setContributions(prev =>
          prev.map(c => selectedIds.has(c.id) ? { ...c, status: newStatus } : c)
        );
      }

      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk action failed:', err);
      alert('Aktion fehlgeschlagen');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{eventTitle}</h1>
        <p className="text-sm text-muted-foreground">Verwalte die Gast-Beiträge für dein Event</p>
      </div>

      {/* Pill-Style Tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('pending'); setSelectedIds(new Set()); }}
          className="rounded-full"
        >
          <Clock className="w-4 h-4 mr-2" />
          Wartend <Badge variant="secondary" className="ml-2">{pendingContributions.length}</Badge>
        </Button>
        <Button
          variant={activeTab === 'approved' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('approved'); setSelectedIds(new Set()); }}
          className="rounded-full"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Freigegeben <Badge variant="secondary" className="ml-2">{approvedContributions.length}</Badge>
        </Button>
        <Button
          variant={activeTab === 'rejected' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('rejected'); setSelectedIds(new Set()); }}
          className="rounded-full"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Abgelehnt <Badge variant="secondary" className="ml-2">{rejectedContributions.length}</Badge>
        </Button>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <>
            <div className="h-6 w-px bg-border" />
            <span className="text-sm text-muted-foreground">{selectedIds.size} ausgewählt</span>
            <Button
              size="sm"
              variant="outline"
              onClick={deselectAll}
            >
              Abwählen
            </Button>
            {activeTab === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleBulkAction('approve')}
                  disabled={isLoading === 'bulk'}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Freigeben
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('reject')}
                  disabled={isLoading === 'bulk'}
                >
                  <X className="w-4 h-4 mr-2" />
                  Ablehnen
                </Button>
              </>
            )}
            {activeTab === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('reject')}
                disabled={isLoading === 'bulk'}
              >
                <X className="w-4 h-4 mr-2" />
                Zurückziehen
              </Button>
            )}
            {activeTab === 'rejected' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleBulkAction('approve')}
                disabled={isLoading === 'bulk'}
              >
                <Check className="w-4 h-4 mr-2" />
                Wiederherstellen
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction('delete')}
              disabled={isLoading === 'bulk'}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
          </>
        )}
      </div>

      {/* Grid Layout */}
      {currentContributions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Keine Beiträge in dieser Kategorie
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectedIds.size === currentContributions.length ? deselectAll : selectAll}
              className="h-8"
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                selectedIds.size === currentContributions.length ? 'bg-primary border-primary' : 'border-input'
              }`}>
                {selectedIds.size === currentContributions.length && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
              <span className="ml-2">Alle auswählen</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentContributions.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                onApprove={() => handleStatusChange(contribution.id, 'approved')}
                onReject={() => handleStatusChange(contribution.id, 'rejected')}
                onDelete={() => handleDelete(contribution.id)}
                isLoading={isLoading === contribution.id}
                activeTab={activeTab}
                isSelected={selectedIds.has(contribution.id)}
                onToggleSelect={() => toggleSelection(contribution.id)}
                onView={() => setViewingContribution(contribution)}
              />
            ))}
          </div>
        </>
      )}

      {/* View Modal */}
      <Dialog open={!!viewingContribution} onOpenChange={(open) => !open && setViewingContribution(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-6">
          {viewingContribution && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingContribution.guest_name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(viewingContribution.created_at).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {viewingContribution.question_answered && (
                  <p className="text-sm text-muted-foreground italic mt-1">
                    "{viewingContribution.question_answered}"
                  </p>
                )}
              </DialogHeader>

              <div className="mt-4 flex items-center justify-center">
                {viewingContribution.type === 'video' && viewingContribution.content_url && (
                  <video
                    src={viewingContribution.content_url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[70vh] rounded-lg object-contain"
                  />
                )}

                {viewingContribution.type === 'photo' && viewingContribution.content_url && (
                  <img
                    src={viewingContribution.content_url}
                    alt="Photo"
                    className="max-w-full max-h-[70vh] rounded-lg object-contain"
                  />
                )}

                {viewingContribution.type === 'text' && (
                  <div className="bg-muted p-6 rounded-lg max-w-2xl">
                    <p className="text-lg">{viewingContribution.text_content}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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
  activeTab: 'pending' | 'approved' | 'rejected';
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
}

function ContributionCard({
  contribution,
  onApprove,
  onReject,
  onDelete,
  isLoading,
  activeTab,
  isSelected,
  onToggleSelect,
  onView,
}: ContributionCardProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays > 0) return `Vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    if (diffHrs > 0) return `Vor ${diffHrs} Std`;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `Vor ${diffMins} Min`;
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Thumbnail with Overlay */}
      <div
        className="relative aspect-video bg-muted cursor-pointer"
        onClick={onView}
      >
        {contribution.type === 'video' && contribution.content_url && (
          <>
            <video
              src={contribution.content_url}
              className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-white rounded-full p-4 shadow-lg">
                <Play className="w-8 h-8 text-black fill-black" />
              </div>
            </div>
            {contribution.duration_seconds && (
              <Badge className="absolute bottom-2 right-2 bg-black/70 text-white pointer-events-none">
                {Math.floor(contribution.duration_seconds / 60)}:{String(contribution.duration_seconds % 60).padStart(2, '0')}
              </Badge>
            )}
          </>
        )}

        {contribution.type === 'photo' && contribution.content_url && (
          <img
            src={contribution.content_url}
            alt="Photo"
            className="w-full h-full object-cover pointer-events-none"
          />
        )}

        {contribution.type === 'text' && (
          <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 pointer-events-none">
            <p className="text-sm text-center line-clamp-4 italic">
              "{contribution.text_content}"
            </p>
          </div>
        )}

        {/* Checkbox for selection (top-left) */}
        <div className="absolute top-2 left-2 pointer-events-auto z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-primary border-primary'
                : 'border-white bg-white/80 hover:bg-white'
            }`}
          >
            {isSelected && (
              <Check className="w-4 h-4 text-primary-foreground" />
            )}
          </button>
        </div>

        {/* Dropdown Menu (top-right) */}
        <div className="absolute top-2 right-2 pointer-events-auto z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-white/80 hover:bg-white"
                disabled={isLoading}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {activeTab === 'pending' && onApprove && (
                <DropdownMenuItem onClick={onApprove} disabled={isLoading}>
                  <Check className="mr-2 h-4 w-4" />
                  Freigeben
                </DropdownMenuItem>
              )}
              {activeTab === 'pending' && onReject && (
                <DropdownMenuItem onClick={onReject} disabled={isLoading}>
                  <X className="mr-2 h-4 w-4" />
                  Ablehnen
                </DropdownMenuItem>
              )}
              {activeTab === 'approved' && onReject && (
                <DropdownMenuItem onClick={onReject} disabled={isLoading}>
                  <X className="mr-2 h-4 w-4" />
                  Zurückziehen
                </DropdownMenuItem>
              )}
              {activeTab === 'rejected' && onApprove && (
                <DropdownMenuItem onClick={onApprove} disabled={isLoading}>
                  <Check className="mr-2 h-4 w-4" />
                  Wiederherstellen
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} disabled={isLoading} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info Section */}
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{contribution.guest_name}</h3>
        {contribution.question_answered && (
          <p className="text-xs text-muted-foreground italic line-clamp-1 mt-0.5">
            "{contribution.question_answered}"
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatTimeAgo(contribution.created_at)} • {formatFileSize(contribution.file_size_bytes)}
        </p>
      </CardContent>
    </Card>
  );
}
