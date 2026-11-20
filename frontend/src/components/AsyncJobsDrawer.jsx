import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AsyncJobsDrawer({
  isOpen,
  onClose,
  selectedProjectId,
  onNotify
}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [selectedResultJob, setSelectedResultJob] = useState(null);

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
      // Poll active jobs while drawer is open
      const interval = setInterval(() => {
        fetchJobs();
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDispatch = async (jobType) => {
    setLoading(true);
    try {
      await api.dispatchJob(jobType, selectedProjectId, simulateFailure);
      onNotify(`Asynchronous job [${jobType}] dispatched successfully. Processing in background...`);
      fetchJobs();
    } catch (err) {
      onNotify(`Error dispatching job: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId) => {
    try {
      await api.retryJob(jobId);
      onNotify(`Manual retry triggered for job ${jobId.slice(0, 8)}...`);
      fetchJobs();
    } catch (err) {
      onNotify(`Failed to retry job: ${err.message}`, true);
    }
  };

  const getStatusBadge = (status, retryCount) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-done">COMPLETED</span>;
      case 'PROCESSING':
        return <span className="badge badge-in_progress">⚙️ PROCESSING</span>;
      case 'RETRYING':
        return (
          <span className="badge badge-high" style={{ animation: 'pulse 1.5s infinite' }}>
            🔄 RETRYING (Attempt {retryCount})
          </span>
        );
      case 'FAILED':
        return <span className="badge badge-critical">FAILED</span>;
      default:
        return <span className="badge badge-todo">PENDING</span>;
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>⚡ Async Background Workflows</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Non-blocking worker queue with exponential backoff & failure recovery
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div className="drawer-content">
          {/* Dispatch Controls */}
          <div className="job-trigger-box">
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
              Dispatch Background Tasks
            </div>

            {/* Simulated Failure Switch */}
            <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  style={{ accentColor: '#ef4444', width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: simulateFailure ? '#f87171' : '#cbd5e1' }}>
                    Simulate Failure & Automatic Retry
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                    Forces transient external service error on initial attempts to test exponential backoff.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="btn btn-primary btn-sm"
                disabled={loading}
                onClick={() => handleDispatch('SPRINT_REPORT')}
              >
                📊 Generate Sprint Digest
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={loading}
                onClick={() => handleDispatch('WORKLOAD_AUDIT')}
              >
                🔍 Capacity Risk Scanner
              </button>
            </div>
          </div>

          {/* Job Queue List */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-sub)' }}>
              Recent Execution Queue ({jobs.length})
            </span>
            <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={fetchJobs}>
              Refresh
            </button>
          </div>

          <div className="job-list-container">
            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-sub)', fontSize: '13px' }}>
                No jobs enqueued yet. Dispatch a task above!
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="key-tag" style={{ fontSize: '11px' }}>{job.type}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-sub)', fontFamily: 'var(--font-mono)' }}>
                        {job.id.slice(0, 8)}...
                      </span>
                    </div>
                    {getStatusBadge(job.status, job.retry_count)}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="progress-bar-container" style={{ height: '6px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${job.progress}%`,
                          background: job.status === 'FAILED' ? '#ef4444' : job.status === 'RETRYING' ? '#f59e0b' : undefined
                        }}
                      />
                    </div>
                  </div>

                  {/* Error / Backoff notice */}
                  {job.error_message && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#fca5a5' }}>
                      {job.error_message.split('\n')[0]}
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                      Retries: {job.retry_count} / {job.max_retries}
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {job.result && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={() => setSelectedResultJob(selectedResultJob?.id === job.id ? null : job)}
                        >
                          {selectedResultJob?.id === job.id ? 'Hide Report' : 'View Report'}
                        </button>
                      )}

                      {(job.status === 'FAILED' || job.status === 'RETRYING') && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={() => handleRetry(job.id)}
                        >
                          Retry Now
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Result Viewer Accordion */}
                  {selectedResultJob?.id === job.id && job.result && (
                    <div className="job-result-viewer">
                      {JSON.stringify(JSON.parse(job.result), null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
