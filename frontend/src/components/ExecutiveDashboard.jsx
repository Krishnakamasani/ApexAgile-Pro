import React, { Suspense, lazy } from 'react';

const WorkspaceScene = lazy(() => import('./WorkspaceScene'));

export default function ExecutiveDashboard({
  project,
  analytics,
  onOpenStoryModal,
  onOpenJobsDrawer,
  onNavigateTab
}) {
  if (!project) return null;

  const totalPoints = project.total_points || 0;
  const completedPoints = project.completed_points || 0;
  const remainingPoints = Math.max(0, totalPoints - completedPoints);
  const velocityPct = project.progress_percentage || 0;

  // Generate SVG Burndown Chart Coordinates
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = 28;

  // 10 sprint days
  const days = ['Day 1', 'Day 3', 'Day 5', 'Day 7', 'Day 9', 'Day 10'];
  const idealPoints = [totalPoints, totalPoints * 0.8, totalPoints * 0.6, totalPoints * 0.4, totalPoints * 0.2, 0];
  const actualPoints = [
    totalPoints,
    totalPoints - 2,
    Math.max(remainingPoints, totalPoints - 5),
    remainingPoints,
    remainingPoints,
    remainingPoints
  ];

  const scaleY = (val) => {
    if (totalPoints === 0) return chartHeight - padding;
    return padding + (1 - val / totalPoints) * (chartHeight - padding * 2);
  };

  const scaleX = (idx) => {
    return padding + (idx / (days.length - 1)) * (chartWidth - padding * 2);
  };

  const idealPath = days.map((_, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(idealPoints[i])}`).join(' ');
  const actualPath = days.map((_, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(actualPoints[i])}`).join(' ');

  return (
    <div className="dashboard-content">
      {/* Top Hero Banner with Live Sprint Health */}
      <div className="dashboard-hero-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="key-tag" style={{ background: '#4f46e5', color: '#fff', fontSize: '13px' }}>
                {project.key}
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>
                {project.name}
              </h2>
              <span className="badge badge-done" style={{ fontSize: '11px' }}>
                ACTIVE SPRINT
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '700px' }}>
              {project.description || 'Sprint sync platform for real-time agile execution and team velocity.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={onOpenJobsDrawer}>
              ⚡ Run Async Report
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onOpenStoryModal(project.id)}>
              + Add User Story
            </button>
          </div>
        </div>

        {/* Sprint KPIs Row */}
        <div className="dashboard-kpi-row">
          <div className="kpi-mini-card">
            <div className="kpi-title">VELOCITY COMPLETION</div>
            <div className="kpi-number" style={{ color: 'var(--success)' }}>
              {velocityPct}%
            </div>
            <div className="progress-bar-container" style={{ height: '6px' }}>
              <div className="progress-bar-fill" style={{ width: `${velocityPct}%` }} />
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-title">STORY POINTS BURNDOWN</div>
            <div className="kpi-number">
              {completedPoints} <span style={{ fontSize: '14px', color: 'var(--text-sub)' }}>/ {totalPoints} SP</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {remainingPoints} SP remaining to complete Definition of Done
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-title">TOTAL USER STORIES</div>
            <div className="kpi-number">
              {project.total_stories}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {project.done_stories} finished, {project.total_stories - project.done_stories} in progress/backlog
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-title">SUB-TASKS BREAKDOWN</div>
            <div className="kpi-number" style={{ color: 'var(--info)' }}>
              {project.done_tasks} <span style={{ fontSize: '14px', color: 'var(--text-sub)' }}>/ {project.total_tasks} Tasks</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {project.total_tasks > 0 ? Math.round((project.done_tasks / project.total_tasks) * 100) : 0}% task execution rate
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="workspace-scene-fallback">Preparing interactive 3D workspace…</div>}>
        <WorkspaceScene project={project} onNavigateTab={onNavigateTab} />
      </Suspense>

      {/* Middle Grid: Burndown Chart & Sprint Progress breakdown */}
      <div className="dashboard-insights-grid">
        {/* Sprint Burndown Visualizer */}
        <div className="panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                📉 Sprint Burndown Chart
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                Target Ideal vs Actual Remaining Story Points
              </p>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8' }}>
                <span style={{ width: '10px', height: '2px', background: '#64748b', display: 'inline-block' }} /> Ideal
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6366f1' }}>
                <span style={{ width: '10px', height: '3px', background: '#6366f1', display: 'inline-block' }} /> Actual
              </span>
            </div>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', maxHeight: '200px' }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = padding + pct * (chartHeight - padding * 2);
                return (
                  <line
                    key={idx}
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Ideal Guide Line (Dashed) */}
              <path d={idealPath} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5 5" />

              {/* Actual Burndown Line (Glow) */}
              <path d={actualPath} fill="none" stroke="#6366f1" strokeWidth="3.5" />

              {/* Points */}
              {days.map((_, i) => (
                <circle
                  key={i}
                  cx={scaleX(i)}
                  cy={scaleY(actualPoints[i])}
                  r="4.5"
                  fill="#6366f1"
                  stroke="#1e1b4b"
                  strokeWidth="2"
                />
              ))}

              {/* X Axis labels */}
              {days.map((day, i) => (
                <text
                  key={i}
                  x={scaleX(i)}
                  y={chartHeight - 6}
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="middle"
                  fontFamily="var(--font-sans)"
                >
                  {day}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Workflow Quick Links & Status Distribution */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              🚀 Agile Workflow Hub
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '16px' }}>
              Fast navigation across your agile artifacts
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="quick-nav-tile"
                onClick={() => onNavigateTab('tree')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>📌</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Hierarchy Work Breakdown</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{project.stories?.length || 0} user stories and child tasks</div>
                  </div>
                </div>
                <span>➔</span>
              </button>

              <button
                type="button"
                className="quick-nav-tile"
                onClick={() => onNavigateTab('kanban')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>📋</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Interactive Kanban Board</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>Drag-and-drop state transitions across columns</div>
                  </div>
                </div>
                <span>➔</span>
              </button>

              <button
                type="button"
                className="quick-nav-tile"
                onClick={() => onNavigateTab('analytics')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>👥</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Team Workload Meters</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>Real-time hour capacity and allocation balance</div>
                  </div>
                </div>
                <span>➔</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-sub)' }}>Target Delivery:</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
              {project.target_date ? new Date(project.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Continuous Sprint'}
            </span>
          </div>
        </div>
      </div>

      {/* High Priority Active Stories Preview */}
      <div className="panel-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
              🔥 Active Sprint User Stories
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
              Highest priority work items currently underway
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('tree')}>
            View Full Tree ➔
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(!project.stories || project.stories.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-sub)', fontSize: '13px' }}>
              No stories created yet. Click "+ Add User Story" above to start!
            </div>
          ) : (
            project.stories.slice(0, 4).map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="key-tag">{s.story_key}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{s.title}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge" style={{ background: '#312e81', color: '#a5b4fc' }}>
                    {s.points} SP
                  </span>
                  <span className={`badge ${s.status === 'DONE' ? 'badge-done' : s.status === 'IN_PROGRESS' ? 'badge-in_progress' : 'badge-todo'}`}>
                    {s.status}
                  </span>
                  {s.assignee && (
                    <div
                      className="avatar-circle"
                      style={{ backgroundColor: s.assignee.avatar_color, width: '24px', height: '24px', fontSize: '10px' }}
                      title={`Assigned to ${s.assignee.name}`}
                    >
                      {s.assignee.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
