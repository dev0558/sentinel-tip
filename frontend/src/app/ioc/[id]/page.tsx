'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Download, Globe, Link, Hash, ExternalLink, Mail, ShieldAlert, Tag } from 'lucide-react';
import { getIOC, triggerEnrichment } from '@/lib/api';
import ScoreBadge from '@/components/ioc/ScoreBadge';
import { cn, formatDate, formatTimestamp, getScoreCategory, getScoreColor } from '@/lib/utils';
import type { IOCDetail } from '@/lib/types';

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ip: Globe,
  domain: Link,
  hash: Hash,
  url: ExternalLink,
  email: Mail,
  cve: ShieldAlert,
};

export default function IOCDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ioc, setIOC] = useState<IOCDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [activeTab, setActiveTab] = useState('enrichment');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getIOC(params.id as string);
        setIOC(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load IOC');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleEnrich = async () => {
    if (!ioc) return;
    setEnriching(true);
    try {
      await triggerEnrichment(ioc.id);
      const data = await getIOC(ioc.id);
      setIOC(data);
    } catch {
      // ignore
    } finally {
      setEnriching(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-sentinel-bg-tertiary rounded animate-pulse" />
        <div className="sentinel-card p-6 space-y-4 animate-pulse">
          <div className="h-8 w-96 bg-sentinel-bg-tertiary rounded" />
          <div className="h-4 w-64 bg-sentinel-bg-tertiary rounded" />
        </div>
      </div>
    );
  }

  if (error || !ioc) {
    return (
      <div className="sentinel-card p-8 text-center">
        <p className="text-sentinel-danger font-mono text-sm">{error || 'IOC not found'}</p>
        <button onClick={() => router.back()} className="mt-4 text-xs font-mono text-sentinel-accent hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const Icon = typeIcons[ioc.type] || Globe;
  const scoreColor = getScoreColor(ioc.threat_score);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-mono text-sentinel-text-muted hover:text-sentinel-accent transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back to search
      </button>

      {/* IOC Header */}
      <div className="sentinel-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded bg-sentinel-bg-primary border border-sentinel-border">
              <Icon className="w-6 h-6" style={{ color: scoreColor }} />
            </div>
            <div>
              <p className="font-mono text-lg text-sentinel-text-primary break-all">{ioc.value}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sentinel-text-muted px-2 py-0.5 rounded bg-sentinel-bg-primary border border-sentinel-border">
                  {ioc.type}
                </span>
                <span className="text-[10px] font-mono text-sentinel-text-muted">
                  {ioc.sighting_count} sightings
                </span>
                <span className="text-[10px] font-mono text-sentinel-text-muted">
                  First: {formatDate(ioc.first_seen)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-3xl font-mono font-bold" style={{ color: scoreColor }}>{ioc.threat_score}</p>
              <p className="text-[10px] font-mono uppercase" style={{ color: scoreColor }}>{getScoreCategory(ioc.threat_score)}</p>
            </div>
            <button
              onClick={handleEnrich}
              disabled={enriching}
              className="px-3 py-2 rounded border border-sentinel-border text-xs font-mono text-sentinel-text-secondary hover:text-sentinel-accent hover:border-sentinel-accent/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3 h-3', enriching && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Tags */}
        {ioc.tags && ioc.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Tag className="w-3 h-3 text-sentinel-text-muted" />
            {ioc.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-[10px] font-mono rounded bg-sentinel-accent/10 text-sentinel-accent border border-sentinel-accent/20">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* MITRE Techniques */}
        {ioc.mitre_techniques && ioc.mitre_techniques.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <ShieldAlert className="w-3 h-3 text-sentinel-text-muted" />
            {ioc.mitre_techniques.map((tech) => (
              <span key={tech} className="px-2 py-0.5 text-[10px] font-mono rounded bg-sentinel-accent-secondary/10 text-purple-400 border border-purple-500/20">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sentinel-border">
        {['enrichment', 'sources', 'relationships', 'raw'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'text-sentinel-accent border-sentinel-accent'
                : 'text-sentinel-text-muted border-transparent hover:text-sentinel-text-secondary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'enrichment' && (
          <div className="space-y-4">
            {ioc.enrichments.length === 0 ? (
              <div className="sentinel-card p-8 text-center">
                <p className="text-sentinel-text-muted text-sm font-mono">No enrichment data available</p>
                <button onClick={handleEnrich} className="mt-3 text-xs font-mono text-sentinel-accent hover:underline">
                  Trigger enrichment
                </button>
              </div>
            ) : (
              ioc.enrichments.map((e, i) => (
                <div key={i} className="sentinel-card p-5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-sentinel-text-muted">{e.source}</h3>
                    <span className="text-[10px] font-mono text-sentinel-text-muted">{formatTimestamp(e.enriched_at)}</span>
                  </div>
                  <pre className="text-[11px] font-mono text-sentinel-text-secondary bg-sentinel-bg-primary rounded p-3 overflow-x-auto">
                    {JSON.stringify(e.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="sentinel-card overflow-hidden">
            {ioc.sources.length === 0 ? (
              <div className="p-8 text-center text-sentinel-text-muted text-sm font-mono">No source information available</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sentinel-border">
                    <th className="px-4 py-2.5 text-left text-[10px] font-mono font-semibold uppercase text-sentinel-text-muted">Feed</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-mono font-semibold uppercase text-sentinel-text-muted">Ingested</th>
                  </tr>
                </thead>
                <tbody>
                  {ioc.sources.map((s, i) => (
                    <tr key={i} className="border-b border-sentinel-border/50">
                      <td className="px-4 py-2.5 font-mono text-xs text-sentinel-text-primary">{s.feed_name}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-sentinel-text-muted">{formatTimestamp(s.ingested_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="sentinel-card overflow-hidden">
            {ioc.relationships.length === 0 ? (
              <div className="p-8 text-center text-sentinel-text-muted text-sm font-mono">No relationships discovered yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sentinel-border">
                    <th className="px-4 py-2.5 text-left text-[10px] font-mono font-semibold uppercase text-sentinel-text-muted">Related IOC</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-mono font-semibold uppercase text-sentinel-text-muted">Type</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-mono font-semibold uppercase text-sentinel-text-muted">Relationship</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-mono font-semibold uppercase text-sentinel-text-muted">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {ioc.relationships.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-sentinel-border/50 cursor-pointer hover:bg-sentinel-bg-hover transition-colors"
                      onClick={() => router.push(`/ioc/${r.id}`)}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-sentinel-text-primary">{r.value}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-sentinel-text-muted uppercase">{r.type}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-sentinel-accent">{r.relationship_type}</td>
                      <td className="px-4 py-2.5"><ScoreBadge score={r.threat_score} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="sentinel-card p-5">
            <pre className="text-[11px] font-mono text-sentinel-text-secondary bg-sentinel-bg-primary rounded p-4 overflow-x-auto max-h-[500px]">
              {JSON.stringify(ioc, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
