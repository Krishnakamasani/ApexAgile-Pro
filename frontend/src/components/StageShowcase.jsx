import React from 'react';

const STAGES = {
  tree: {
    eyebrow: 'WORK BREAKDOWN',
    title: 'The full delivery hierarchy.',
    description: 'Trace each project from its top-level goal through stories and executable tasks.'
  },
  kanban: {
    eyebrow: 'FLOW CONTROL',
    title: 'Work moves with clear momentum.',
    description: 'See the balance of work across every delivery stage and keep handoffs visible.'
  },
  analytics: {
    eyebrow: 'TEAM CAPACITY',
    title: 'A healthier view of team load.',
    description: 'Compare assigned work and logged effort to spot imbalance before it slows delivery.'
  },
  audit: {
    eyebrow: 'ACTIVITY SIGNAL',
    title: 'Every important change, in view.',
    description: 'Follow the events that shape delivery with a clear, time-ordered activity trail.'
  }
};

const LANES = [
  { id: 'BACKLOG', label: 'Backlog', color: '#91a0bd' },
  { id: 'IN_PROGRESS', label: 'In progress', color: '#4bc7ff' },
  { id: 'IN_REVIEW', label: 'In review', color: '#b18bff' },
  { id: 'DONE', label: 'Done', color: '#51deb0' }
];

function getLaneCount(stories, laneId) {
  return stories.filter((story) => laneId === 'BACKLOG'
    ? story.status === 'BACKLOG' || story.status === 'TODO'
    : story.status === laneId).length;
}

function TreeVisual({ project, stories, taskCount }) {
  return (
    <div className="showcase-tree" aria-hidden="true">
      <div className="showcase-tree-root">{project?.key || 'PROJECT'}<span>{project?.name || 'Workspace'}</span></div>
      <div className="showcase-tree-branches">
        <div className="showcase-tree-node story">
          <strong>{stories.length}</strong><span>User stories</span>
        </div>
        <div className="showcase-tree-node task">
          <strong>{taskCount}</strong><span>Tasks</span>
        </div>
      </div>
      <span className="showcase-tree-spark">↗</span>
    </div>
  );
}

function KanbanVisual({ stories }) {
  return (
    <div className="showcase-lanes" aria-hidden="true">
      {LANES.map((lane, index) => {
        const count = getLaneCount(stories, lane.id);
        return (
          <div className="showcase-lane" key={lane.id} style={{ '--lane-color': lane.color, '--lane-index': index }}>
            <span className="showcase-lane-label">{lane.label}</span>
            <strong>{count}</strong>
            <i style={{ height: `${Math.min(88, 18 + count * 14)}px` }} />
            <i style={{ height: `${Math.min(68, 12 + count * 9)}px` }} />
            <i style={{ height: `${Math.min(48, 9 + count * 6)}px` }} />
          </div>
        );
      })}
    </div>
  );
}

function CapacityVisual({ metrics }) {
  const members = (metrics?.team_workloads || []).slice(0, 5);
  return (
    <div className="showcase-capacity" aria-hidden="true">
      {(members.length ? members : [{ user_id: 'team', name: 'Team', total_logged_hours: 0, total_estimated_hours: 1 }]).map((member, index) => {
        const percent = member.total_estimated_hours > 0
          ? Math.min(100, Math.round((member.total_logged_hours / member.total_estimated_hours) * 100))
          : 0;
        return (
          <div className="showcase-capacity-row" key={member.user_id} style={{ '--capacity-index': index }}>
            <span>{member.name}</span>
            <div className="showcase-capacity-track"><i style={{ width: `${percent}%` }} /></div>
            <strong>{percent}%</strong>
          </div>
        );
      })}
      <div className="showcase-capacity-glow" />
    </div>
  );
}

function AuditVisual({ logs }) {
  const events = logs.slice(0, 3);
  return (
    <div className="showcase-audit" aria-hidden="true">
      {(events.length ? events : [{ id: 'waiting-1', action: 'READY', details: 'Workspace activity will appear here.' }]).map((event, index) => (
        <div className="showcase-audit-event" key={event.id} style={{ '--event-index': index }}>
          <span className="showcase-audit-dot" />
          <span className="showcase-audit-copy">
            <strong>{event.action?.replaceAll('_', ' ') || 'UPDATED'}</strong>
            <small>{event.details || `${event.entity_type || 'Workspace'} activity`}</small>
          </span>
          <span className="showcase-audit-time">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LIVE'}</span>
        </div>
      ))}
    </div>
  );
}

export default function StageShowcase({ stage, project, metrics, logs = [] }) {
  const content = STAGES[stage];
  if (!content) return null;

  const stories = project?.stories || [];
  const taskCount = stories.reduce((count, story) => count + (story.tasks?.length || 0), 0);

  return (
    <section className={`stage-showcase stage-showcase-${stage}`} aria-label={`${content.eyebrow} overview`}>
      <div className="stage-showcase-copy">
        <span className="stage-showcase-eyebrow"><i />{content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        <div className="stage-showcase-meta">
          <span>{project?.key || 'APEX'} WORKSPACE</span>
          <span className="stage-showcase-separator" />
          <span>{project?.name || 'Agile delivery overview'}</span>
        </div>
      </div>
      <div className={`stage-showcase-visual visual-${stage}`} aria-hidden="true">
        <div className="showcase-visual-grid" />
        {stage === 'tree' && <TreeVisual project={project} stories={stories} taskCount={taskCount} />}
        {stage === 'kanban' && <KanbanVisual stories={stories} />}
        {stage === 'analytics' && <CapacityVisual metrics={metrics} />}
        {stage === 'audit' && <AuditVisual logs={logs} />}
      </div>
    </section>
  );
}
