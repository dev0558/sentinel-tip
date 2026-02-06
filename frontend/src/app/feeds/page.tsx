'use client';

import { useState, useEffect } from 'react';
import { Rss, RefreshCw, ExternalLink, Power, PowerOff } from 'lucide-react';
import { getFeeds, triggerFeedSync, updateFeed } from '@/lib/api';
import StatusDot from '@/components/shared/StatusDot';
import { cn, formatTimestamp, formatNumber } from '@/lib/utils';
import type { FeedSource } from '@/lib/types';

export default function FeedsPage() {
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadFeeds();
  }, []);

  async function loadFeeds() {
    setLoading(true);
    try {
      const data = await getFeeds();
      setFeeds(data);
    } catch {
      // Feeds endpoint not reachable
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(feedId: string) {
    setSyncing(feedId);
    try {
      await triggerFeedSync(feedId);
      await loadFeeds();
    } catch {
      // ignore
    } finally {
      setSyncing(null);
    }
  }

  async function handleToggle(feed: FeedSource) {
    try {
      await updateFeed(feed.id, { is_enabled: !feed.is_enabled });
      await loadFeeds();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-display font-bold text-sentinel-text-primary">Threat Feeds</h1>
          <p className="text-xs font-mono text-sentinel-text-muted mt-0.5">
            Manage and monitor threat intelligence feed sources
          </p>
        </div>
        <button
          onClick={loadFeeds}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border border-sentinel-border text-sentinel-text-secondary hover:text-sentinel-accent hover:border-sentinel-accent/30 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          REFRESH
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="sentinel-card p-5 space-y-3 animate-pulse">
              <div className="h-4 w-32 bg-sentinel-bg-tertiary rounded" />
              <div className="h-3 w-48 bg-sentinel-bg-tertiary rounded" />
              <div className="h-3 w-24 bg-sentinel-bg-tertiary rounded" />
            </div>
          ))}
        </div>
      ) : feeds.length === 0 ? (
        <div className="sentinel-card p-12 text-center">
          <Rss className="w-10 h-10 text-sentinel-text-muted mx-auto mb-3" />
          <p className="text-sentinel-text-muted text-sm font-mono">No feeds configured</p>
          <p className="text-sentinel-text-muted text-xs font-mono mt-1">
            Run the seed script to add default feed sources: python scripts/seed_feeds.py
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeds.map((feed, i) => (
            <div
              key={feed.id}
              className={cn(
                'sentinel-card p-5 animate-fade-in',
                !feed.is_enabled && 'opacity-60'
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusDot status={feed.last_sync_status || 'never_synced'} size="md" />
                  <h3 className="text-sm font-mono font-semibold text-sentinel-text-primary">{feed.name}</h3>
                </div>
                <button
                  onClick={() => handleToggle(feed)}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    feed.is_enabled
                      ? 'text-emerald-400 hover:bg-emerald-400/10'
                      : 'text-sentinel-text-muted hover:bg-sentinel-bg-hover'
                  )}
                >
                  {feed.is_enabled ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              <p className="text-[10px] font-mono text-sentinel-text-muted mb-3 line-clamp-2">
                {feed.description || 'No description'}
              </p>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-sentinel-text-muted">Type</span>
                  <span className="text-sentinel-text-secondary uppercase">{feed.feed_type}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-sentinel-text-muted">IOCs</span>
                  <span className="text-sentinel-text-secondary">{formatNumber(feed.ioc_count)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-sentinel-text-muted">Last Sync</span>
                  <span className="text-sentinel-text-secondary">{feed.last_sync_at ? formatTimestamp(feed.last_sync_at) : 'Never'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-sentinel-text-muted">Frequency</span>
                  <span className="text-sentinel-text-secondary">{Math.round(feed.sync_frequency / 60)}m</span>
                </div>
              </div>

              <button
                onClick={() => handleSync(feed.id)}
                disabled={syncing === feed.id || !feed.is_enabled}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-mono border border-sentinel-border text-sentinel-text-secondary hover:text-sentinel-accent hover:border-sentinel-accent/30 disabled:opacity-30 transition-colors"
              >
                <RefreshCw className={cn('w-3 h-3', syncing === feed.id && 'animate-spin')} />
                {syncing === feed.id ? 'SYNCING...' : 'SYNC NOW'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
