'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDashboardStats,
  getDashboardTimeline,
  getTopThreats,
  getFeedHealth,
  getDashboardGeo,
} from '@/lib/api';
import type {
  DashboardStats,
  TimelineEntry,
  TopThreat,
  FeedHealth,
  GeoData,
} from '@/lib/types';

interface DashboardData {
  stats: DashboardStats | null;
  timeline: TimelineEntry[];
  topThreats: TopThreat[];
  feedHealth: FeedHealth[];
  geoData: GeoData[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [topThreats, setTopThreats] = useState<TopThreat[]>([]);
  const [feedHealth, setFeedHealth] = useState<FeedHealth[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t, th, fh, g] = await Promise.allSettled([
        getDashboardStats(),
        getDashboardTimeline(50),
        getTopThreats(20),
        getFeedHealth(),
        getDashboardGeo(),
      ]);

      if (s.status === 'fulfilled') setStats(s.value);
      if (t.status === 'fulfilled') setTimeline(t.value);
      if (th.status === 'fulfilled') setTopThreats(th.value);
      if (fh.status === 'fulfilled') setFeedHealth(fh.value);
      if (g.status === 'fulfilled') setGeoData(g.value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { stats, timeline, topThreats, feedHealth, geoData, loading, error, refresh: fetchData };
}
