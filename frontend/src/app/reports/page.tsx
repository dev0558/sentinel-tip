'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, RefreshCw, Calendar, Download } from 'lucide-react';
import { getReports, getDailyBrief, generateReport } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import Modal from '@/components/shared/Modal';
import type { Report } from '@/lib/types';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await generateReport({ title, report_type: 'custom' });
      setShowCreate(false);
      setTitle('');
      await loadReports();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function handleDailyBrief() {
    try {
      await getDailyBrief();
      await loadReports();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-display font-bold text-sentinel-text-primary">Reports</h1>
          <p className="text-xs font-mono text-sentinel-text-muted mt-0.5">
            Threat intelligence reports and daily briefs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDailyBrief}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border border-sentinel-border text-sentinel-text-secondary hover:text-sentinel-accent hover:border-sentinel-accent/30 transition-colors"
          >
            <Calendar className="w-3 h-3" />
            DAILY BRIEF
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded bg-sentinel-accent/10 border border-sentinel-accent/30 text-sentinel-accent hover:bg-sentinel-accent/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            NEW REPORT
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sentinel-card p-5 animate-pulse">
              <div className="h-4 w-64 bg-sentinel-bg-tertiary rounded mb-2" />
              <div className="h-3 w-96 bg-sentinel-bg-tertiary rounded" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="sentinel-card p-12 text-center">
          <FileText className="w-10 h-10 text-sentinel-text-muted mx-auto mb-3" />
          <p className="text-sentinel-text-muted text-sm font-mono">No reports generated yet</p>
          <p className="text-sentinel-text-muted text-xs font-mono mt-1">Create a custom report or generate a daily brief</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report, i) => (
            <div
              key={report.id}
              className="sentinel-card p-5 cursor-pointer hover:border-sentinel-border-hover transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-sentinel-text-muted" />
                  <h3 className="text-sm font-mono font-semibold text-sentinel-text-primary">{report.title}</h3>
                </div>
                <span className="text-[10px] font-mono text-sentinel-text-muted uppercase px-2 py-0.5 rounded bg-sentinel-bg-primary border border-sentinel-border">
                  {report.report_type}
                </span>
              </div>
              {report.summary && (
                <p className="text-xs font-mono text-sentinel-text-secondary ml-7">{report.summary}</p>
              )}
              <p className="text-[10px] font-mono text-sentinel-text-muted ml-7 mt-1">
                Generated: {formatDate(report.generated_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Report Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Generate Report">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-sentinel-text-muted uppercase block mb-1">Report Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Threat Summary"
              className="w-full px-3 py-2 rounded bg-sentinel-bg-primary border border-sentinel-border text-sm font-mono text-sentinel-text-primary outline-none focus:border-sentinel-accent/40"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim()}
            className="w-full px-4 py-2 rounded bg-sentinel-accent/10 border border-sentinel-accent/30 text-sentinel-accent text-xs font-mono font-semibold hover:bg-sentinel-accent/20 disabled:opacity-30 transition-colors"
          >
            {creating ? 'GENERATING...' : 'GENERATE REPORT'}
          </button>
        </div>
      </Modal>

      {/* Report Detail Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.title || ''}
        className="max-w-2xl"
      >
        {selectedReport && (
          <div className="space-y-4">
            {selectedReport.summary && (
              <p className="text-xs font-mono text-sentinel-text-secondary">{selectedReport.summary}</p>
            )}
            <pre className="text-[11px] font-mono text-sentinel-text-secondary bg-sentinel-bg-primary rounded p-4 overflow-x-auto max-h-96">
              {JSON.stringify(selectedReport.content, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
