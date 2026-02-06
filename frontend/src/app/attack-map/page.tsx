'use client';

import { useState, useEffect } from 'react';
import { Grid3X3, RefreshCw } from 'lucide-react';
import { getAttackHeatmap } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { HeatmapEntry } from '@/lib/types';

const TACTICS_ORDER = [
  'Reconnaissance',
  'Resource Development',
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
];

export default function AttackMapPage() {
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechnique, setSelectedTechnique] = useState<HeatmapEntry | null>(null);

  useEffect(() => {
    loadHeatmap();
  }, []);

  async function loadHeatmap() {
    setLoading(true);
    try {
      const data = await getAttackHeatmap(0);
      setHeatmap(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const groupedByTactic: Record<string, HeatmapEntry[]> = {};
  TACTICS_ORDER.forEach(t => { groupedByTactic[t] = []; });
  heatmap.forEach(entry => {
    if (groupedByTactic[entry.tactic]) {
      groupedByTactic[entry.tactic].push(entry);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-display font-bold text-sentinel-text-primary">MITRE ATT&CK Map</h1>
          <p className="text-xs font-mono text-sentinel-text-muted mt-0.5">
            ATT&CK Enterprise technique heatmap based on observed IOCs
          </p>
        </div>
        <button
          onClick={loadHeatmap}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border border-sentinel-border text-sentinel-text-secondary hover:text-sentinel-accent hover:border-sentinel-accent/30 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          REFRESH
        </button>
      </div>

      {loading ? (
        <div className="sentinel-card p-8 text-center animate-pulse">
          <Grid3X3 className="w-10 h-10 text-sentinel-text-muted mx-auto mb-3" />
          <p className="text-sentinel-text-muted text-sm font-mono">Loading ATT&CK matrix...</p>
        </div>
      ) : heatmap.length === 0 ? (
        <div className="sentinel-card p-12 text-center">
          <Grid3X3 className="w-10 h-10 text-sentinel-text-muted mx-auto mb-3" />
          <p className="text-sentinel-text-muted text-sm font-mono">No ATT&CK data loaded</p>
          <p className="text-sentinel-text-muted text-xs font-mono mt-1">
            Run the MITRE seed script: python scripts/seed_mitre.py
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-flex gap-2 min-w-full">
            {TACTICS_ORDER.map((tactic) => {
              const techniques = groupedByTactic[tactic] || [];
              if (techniques.length === 0) return null;

              return (
                <div key={tactic} className="flex-shrink-0 w-40">
                  <div className="sentinel-card overflow-hidden">
                    <div className="px-3 py-2 border-b border-sentinel-border bg-sentinel-bg-tertiary">
                      <h3 className="text-[9px] font-mono font-semibold uppercase tracking-wider text-sentinel-accent truncate">
                        {tactic}
                      </h3>
                    </div>
                    <div className="p-1 space-y-1 max-h-[500px] overflow-y-auto">
                      {techniques.map((tech) => (
                        <button
                          key={tech.technique_id}
                          onClick={() => setSelectedTechnique(tech)}
                          className={cn(
                            'w-full text-left px-2 py-1.5 rounded text-[9px] font-mono transition-colors',
                            selectedTechnique?.technique_id === tech.technique_id
                              ? 'bg-sentinel-accent/20 text-sentinel-accent'
                              : 'hover:bg-sentinel-bg-hover text-sentinel-text-secondary'
                          )}
                          style={{
                            backgroundColor: tech.ioc_count > 0
                              ? `rgba(0, 229, 255, ${Math.min(tech.intensity * 0.4, 0.4)})`
                              : undefined,
                          }}
                        >
                          <div className="flex justify-between items-center gap-1">
                            <span className="truncate">{tech.technique_id}</span>
                            {tech.ioc_count > 0 && (
                              <span className="text-sentinel-accent flex-shrink-0">{tech.ioc_count}</span>
                            )}
                          </div>
                          <p className="truncate text-[8px] text-sentinel-text-muted mt-0.5">{tech.technique_name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Technique Detail */}
      {selectedTechnique && (
        <div className="sentinel-card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-mono font-semibold text-sentinel-text-primary">
              {selectedTechnique.technique_id}: {selectedTechnique.technique_name}
            </h3>
            <span className="text-[10px] font-mono text-sentinel-accent">{selectedTechnique.ioc_count} associated IOCs</span>
          </div>
          <p className="text-xs font-mono text-sentinel-text-muted">
            Tactic: {selectedTechnique.tactic}
          </p>
        </div>
      )}
    </div>
  );
}
