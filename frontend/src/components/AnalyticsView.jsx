import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import StageShowcase from './StageShowcase';

export default function AnalyticsView({ selectedProjectId, project, focusUserId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [selectedProjectId]);

  useEffect(() => {
    if (loading || !focusUserId) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`team-member-${focusUserId}`)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center'
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusUserId, loading]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics(selectedProjectId);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-sub)' }}>Loading sprint analytics...</div>;
  }

  if (!metrics) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <StageShowcase stage="analytics" project={project} metrics={metrics} />
      {/* High-level metrics grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Sprint Velocity</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>
            {metrics.overall_progress}%
          </div>
          <div className="metric-sub">
            {metrics.completed_points} of {metrics.total_points} Story Points done
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${metrics.overall_progress}%` }} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">User Stories</div>
          <div className="metric-value">
            {metrics.total_stories}
          </div>
          <div className="metric-sub">
            {metrics.story_status_breakdown?.DONE || 0} marked Definition of Done
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Sub-Tasks</div>
          <div className="metric-value">
            {metrics.total_tasks}
          </div>
          <div className="metric-sub">
            {metrics.task_status_breakdown?.DONE || 0} completed
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Work in Progress (WIP)</div>
          <div className="metric-value" style={{ color: 'var(--info)' }}>
            {metrics.story_status_breakdown?.IN_PROGRESS || 0} Stories
          </div>
          <div className="metric-sub">
            {metrics.task_status_breakdown?.IN_PROGRESS || 0} active tasks underway
          </div>
        </div>
      </div>

      {/* Team Workload & Capacity Meters */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>
          👥 Team Capacity & Workload Allocation
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '20px' }}>
          Real-time workload distribution across the agile team (3–10 members)
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {metrics.team_workloads?.map((member) => {
            const workloadPct = member.total_estimated_hours > 0
              ? Math.min(100, Math.round((member.total_logged_hours / member.total_estimated_hours) * 100))
              : 0;

            const isHeavy = member.total_estimated_hours > 15;
            const isLight = member.total_estimated_hours === 0;

            return (
              <div
                key={member.user_id}
                id={`team-member-${member.user_id}`}
                className={`team-capacity-card ${focusUserId === member.user_id ? 'search-focus' : ''}`}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      className="avatar-circle"
                      style={{ backgroundColor: member.avatar_color, width: '32px', height: '32px', fontSize: '13px' }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{member.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{member.role}</div>
                    </div>
                  </div>

                  <span
                    className="badge"
                    style={{
                      background: isHeavy ? 'rgba(239, 68, 68, 0.15)' : isLight ? 'rgba(148, 163, 184, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isHeavy ? '#f87171' : isLight ? '#94a3b8' : '#34d399',
                      border: `1px solid ${isHeavy ? 'rgba(239, 68, 68, 0.3)' : isLight ? '#475569' : 'rgba(16, 185, 129, 0.3)'}`
                    }}
                  >
                    {isHeavy ? 'HIGH LOAD' : isLight ? 'AVAILABLE' : 'BALANCED'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <div>Stories Assigned: <b style={{ color: '#fff' }}>{member.assigned_stories}</b></div>
                  <div>Tasks Assigned: <b style={{ color: '#fff' }}>{member.assigned_tasks}</b></div>
                  <div>Logged Hours: <b style={{ color: '#fff' }}>{member.total_logged_hours}h</b></div>
                  <div>Estimated Hours: <b style={{ color: '#fff' }}>{member.total_estimated_hours}h</b></div>
                </div>

                {/* Hours logged progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-sub)', marginBottom: '3px' }}>
                    <span>Hours Logged Rate</span>
                    <span>{workloadPct}%</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '6px' }}>
                    <div className="progress-bar-fill" style={{ width: `${workloadPct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
