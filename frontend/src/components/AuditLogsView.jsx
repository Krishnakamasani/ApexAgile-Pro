import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import StageShowcase from './StageShowcase';

export default function AuditLogsView({ project }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(40);
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'CREATED': return 'badge-done';
      case 'STATUS_CHANGED': return 'badge-in_progress';
      case 'DELETED': return 'badge-critical';
      case 'FAILED': return 'badge-critical';
      default: return 'badge-low';
    }
  };

  return (
    <>
    <StageShowcase stage="audit" project={project} logs={logs} />
    <div className="audit-log-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>📜 System Audit & Activity Log</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
            Transparent timeline of work item modifications, state transitions, and background events
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchLogs}>
          Refresh Log
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-sub)' }}>Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-sub)' }}>No logs recorded yet.</div>
      ) : (
        <div className="audit-log-list">
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <span className="key-tag" style={{ fontSize: '11px' }}>
                  {log.entity_type}
                </span>
                <span className={`badge ${getActionBadgeClass(log.action)}`} style={{ fontSize: '10px' }}>
                  {log.action}
                </span>
                <span style={{ fontSize: '13.5px', color: '#e2e8f0' }}>
                  {log.details || `Modified ${log.entity_type} #${log.entity_id}`}
                </span>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--text-sub)', fontFamily: 'var(--font-mono)' }}>
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
