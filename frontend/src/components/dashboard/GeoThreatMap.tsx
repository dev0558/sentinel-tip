'use client';

import { cn } from '@/lib/utils';
import type { GeoData } from '@/lib/types';

interface GeoThreatMapProps {
  data: GeoData[];
  loading: boolean;
}

export default function GeoThreatMap({ data, loading }: GeoThreatMapProps) {
  // Simplified map visualization - top countries by threat count
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="sentinel-card">
      <div className="px-5 py-3 border-b border-sentinel-border">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-sentinel-text-muted">
          GEOGRAPHIC DISTRIBUTION
        </h3>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-16 h-3 bg-sentinel-bg-tertiary rounded" />
                <div className="flex-1 h-3 bg-sentinel-bg-tertiary rounded" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-sentinel-text-muted text-xs font-mono">
            Geographic data will appear after IP-based IOCs are enriched
          </div>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 10).map((item, i) => (
              <div key={item.country} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <span className="text-xs font-mono text-sentinel-text-muted w-20 flex-shrink-0 truncate">
                  {item.country}
                </span>
                <div className="flex-1 h-3 bg-sentinel-bg-primary rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${(item.count / maxCount) * 100}%`,
                      backgroundColor: item.avg_score >= 76 ? '#ef4444' : item.avg_score >= 51 ? '#f59e0b' : '#00e5ff',
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-sentinel-text-muted w-8 text-right flex-shrink-0">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
