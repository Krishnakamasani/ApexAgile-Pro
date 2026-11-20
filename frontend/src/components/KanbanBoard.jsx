import React, { useState } from 'react';
import StageShowcase from './StageShowcase';

export default function KanbanBoard({
  project,
  users,
  onUpdateStoryStatus,
  onUpdateTaskStatus,
  onEditStory,
  onEditTask
}) {
  const [viewMode, setViewMode] = useState('stories'); // 'stories' or 'tasks'
  const [filterUser, setFilterUser] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  if (!project) return null;

  const COLUMNS = [
    { id: 'BACKLOG', label: 'Backlog / Todo', statuses: ['BACKLOG', 'TODO'], color: '#94a3b8' },
    { id: 'IN_PROGRESS', label: 'In Progress', statuses: ['IN_PROGRESS'], color: '#0ea5e9' },
    { id: 'IN_REVIEW', label: 'In Review', statuses: ['IN_REVIEW'], color: '#a855f7' },
    { id: 'DONE', label: 'Done', statuses: ['DONE'], color: '#10b981' }
  ];

  // Flatten tasks if task view
  const allTasks = [];
  if (project.stories) {
    project.stories.forEach((s) => {
      if (s.tasks) {
        s.tasks.forEach((t) => {
          allTasks.push({ ...t, parentStoryTitle: s.title, parentStoryKey: s.story_key });
        });
      }
    });
  }

  // Filter items
  const items = viewMode === 'stories' ? (project.stories || []) : allTasks;
  const filteredItems = items.filter((item) => {
    if (filterUser && String(item.assignee_id) !== String(filterUser)) return false;
    if (filterPriority && item.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  const getTargetStatus = (currentStatus, direction) => {
    const order = ['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    const norm = currentStatus === 'TODO' ? 'BACKLOG' : currentStatus;
    const idx = order.indexOf(norm);
    if (direction === 'left' && idx > 0) return order[idx - 1];
    if (direction === 'right' && idx < order.length - 1) return order[idx + 1];
    return null;
  };

  return (
    <div>
      <StageShowcase stage="kanban" project={project} />
      {/* Board Controls */}
      <div className="kanban-board-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="kanban-board-view-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-sub)' }}>VIEW AS:</span>
          <div className="nav-tabs" style={{ display: 'inline-flex' }}>
            <button
              className={`nav-tab-btn ${viewMode === 'stories' ? 'active' : ''}`}
              onClick={() => setViewMode('stories')}
            >
              User Stories ({project.stories?.length || 0})
            </button>
            <button
              className={`nav-tab-btn ${viewMode === 'tasks' ? 'active' : ''}`}
              onClick={() => setViewMode('tasks')}
            >
              Tasks ({allTasks.length})
            </button>
          </div>
        </div>

        <div className="kanban-board-filters" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Filter by Assignee */}
          <select
            className="form-select"
            style={{ padding: '6px 12px', fontSize: '12px', minWidth: '150px' }}
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          >
            <option value="">All Team Members</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Filter by Priority */}
          <select
            className="form-select"
            style={{ padding: '6px 12px', fontSize: '12px', minWidth: '130px' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* 4 Column Kanban Grid */}
      <div className="kanban-grid">
        {COLUMNS.map((col) => {
          const colItems = filteredItems.filter((i) => {
            if (col.id === 'BACKLOG') {
              return i.status === 'BACKLOG' || i.status === 'TODO';
            }
            return i.status === col.id;
          });

          const totalPointsInCol = viewMode === 'stories'
            ? colItems.reduce((acc, curr) => acc + (curr.points || 0), 0)
            : null;

          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color, display: 'inline-block' }}></span>
                  <span>{col.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {totalPointsInCol !== null && (
                    <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700 }}>
                      {totalPointsInCol} SP
                    </span>
                  )}
                  <span className="kanban-col-count">{colItems.length}</span>
                </div>
              </div>

              <div className="kanban-cards-wrapper">
                {colItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-sub)', fontSize: '12px', fontStyle: 'italic' }}>
                    No items in this column
                  </div>
                ) : (
                  colItems.map((item) => {
                    const isStory = viewMode === 'stories';
                    const leftTarget = getTargetStatus(item.status, 'left');
                    const rightTarget = getTargetStatus(item.status, 'right');

                    return (
                      <div key={item.id} className="kanban-card">
                        <div className="card-top">
                          <span className="key-tag" style={{ fontSize: '11px' }}>
                            {isStory ? item.story_key : item.task_key}
                          </span>
                          <span className={`badge ${getPriorityBadgeClass(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>

                        <div className="card-title">
                          {item.title}
                        </div>

                        {!isStory && (
                          <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                            Under: <span style={{ color: '#818cf8' }}>{item.parentStoryKey}</span>
                          </div>
                        )}

                        <div className="card-bottom">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isStory ? (
                              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#a5b4fc' }}>
                                {item.points} SP
                              </span>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                ⏱️ {item.logged_hours}h / {item.estimated_hours}h
                              </span>
                            )}

                            {item.assignee && (
                              <div
                                className="avatar-circle"
                                style={{ backgroundColor: item.assignee.avatar_color || '#6366f1', width: '22px', height: '22px', fontSize: '10px' }}
                                title={`Assigned to ${item.assignee.name}`}
                              >
                                {item.assignee.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Fast Move Buttons */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {leftTarget && (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 7px', fontSize: '11px' }}
                                title={`Move left to ${leftTarget}`}
                                onClick={() => isStory ? onUpdateStoryStatus(item.id, leftTarget) : onUpdateTaskStatus(item.id, leftTarget)}
                              >
                                ◀
                              </button>
                            )}

                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 7px', fontSize: '11px' }}
                              title="Edit item"
                              onClick={() => isStory ? onEditStory(item) : onEditTask(item)}
                            >
                              ✏️
                            </button>

                            {rightTarget && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '2px 7px', fontSize: '11px' }}
                                title={`Move right to ${rightTarget}`}
                                onClick={() => isStory ? onUpdateStoryStatus(item.id, rightTarget) : onUpdateTaskStatus(item.id, rightTarget)}
                              >
                                ▶
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
