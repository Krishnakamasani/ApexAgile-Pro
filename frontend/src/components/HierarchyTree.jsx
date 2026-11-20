import React, { useEffect, useState } from 'react';
import StageShowcase from './StageShowcase';

export default function HierarchyTree({
  project,
  onOpenStoryModal,
  onOpenTaskModal,
  onEditStory,
  onEditTask,
  onDeleteStory,
  onDeleteTask,
  onUpdateTaskStatus,
  onUpdateStoryStatus,
  focusItem
}) {
  const [expandedStories, setExpandedStories] = useState({});

  useEffect(() => {
    if (!focusItem || focusItem.type !== 'task' || !focusItem.storyId) return;
    setExpandedStories((previous) => ({ ...previous, [focusItem.storyId]: true }));
  }, [focusItem]);

  useEffect(() => {
    if (!focusItem) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`work-item-${focusItem.type}-${focusItem.id}`)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center'
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expandedStories, focusItem]);

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-sub)' }}>
        No project selected. Select or create a project to view work items.
      </div>
    );
  }

  const toggleExpand = (storyId) => {
    setExpandedStories((prev) => ({
      ...prev,
      [storyId]: prev[storyId] === undefined ? false : !prev[storyId]
    }));
  };

  const isExpanded = (storyId) => {
    return expandedStories[storyId] !== false; // Default expanded
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'DONE': return 'badge-done';
      case 'IN_PROGRESS': return 'badge-in_progress';
      case 'IN_REVIEW': return 'badge-in_review';
      default: return 'badge-todo';
    }
  };

  const getNextTaskStatus = (current) => {
    const sequence = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    const idx = sequence.indexOf(current);
    return sequence[(idx + 1) % sequence.length];
  };

  return (
    <>
    <StageShowcase stage="tree" project={project} />
    <div className="tree-container">
      {/* Project Overview Card */}
      <div className="metric-card" style={{ background: 'var(--bg-card)', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="key-tag" style={{ background: '#4f46e5', color: '#fff', fontSize: '13px' }}>
                {project.key}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{project.name}</h2>
              <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                {project.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '750px' }}>
              {project.description || 'No description provided.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: 600 }}>COMPLETION</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)' }}>
                {project.progress_percentage}%
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onOpenStoryModal(project.id)}>
              + Add User Story
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container" style={{ marginTop: '14px' }}>
          <div className="progress-bar-fill" style={{ width: `${project.progress_percentage}%` }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-sub)' }}>
          <span>Stories: {project.done_stories} / {project.total_stories} completed</span>
          <span>Story Points: {project.completed_points} / {project.total_points} SP</span>
          <span>Tasks: {project.done_tasks} / {project.total_tasks} completed</span>
        </div>
      </div>

      {/* User Stories List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(!project.stories || project.stories.length === 0) ? (
          <div style={{ background: 'var(--bg-surface)', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>No user stories in this project yet.</p>
            <button className="btn btn-primary btn-sm" onClick={() => onOpenStoryModal(project.id)}>
              Create First Story
            </button>
          </div>
        ) : (
          project.stories.map((story) => {
            const expanded = isExpanded(story.id);
            return (
              <div key={story.id} id={`work-item-story-${story.id}`} className={`story-tree-node ${focusItem?.type === 'story' && focusItem.id === story.id ? 'search-focus' : ''}`}>
                {/* Story Header Row */}
                <div
                  className={`story-header-row ${expanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(story.id)}
                >
                  <div className="story-info-left">
                    <span style={{ color: 'var(--text-sub)', fontSize: '14px', width: '16px' }}>
                      {expanded ? '▼' : '▶'}
                    </span>
                    <span className="key-tag">{story.story_key}</span>
                    <span className="story-title-text">{story.title}</span>
                  </div>

                  <div className="story-badges-right" onClick={(e) => e.stopPropagation()}>
                    <span
                      className="badge"
                      style={{ background: '#312e81', color: '#a5b4fc', border: '1px solid #4338ca' }}
                      title="Story Points"
                    >
                      {story.points} SP
                    </span>

                    <span className={`badge ${getPriorityBadgeClass(story.priority)}`}>
                      {story.priority}
                    </span>

                    {/* Story status dropdown */}
                    <select
                      className={`badge ${getStatusBadgeClass(story.status)}`}
                      style={{ cursor: 'pointer', padding: '3px 8px' }}
                      value={story.status}
                      onChange={(e) => onUpdateStoryStatus(story.id, e.target.value)}
                    >
                      <option value="BACKLOG">BACKLOG</option>
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="IN_REVIEW">IN_REVIEW</option>
                      <option value="DONE">DONE</option>
                    </select>

                    {story.assignee && (
                      <div
                        className="avatar-circle"
                        style={{ backgroundColor: story.assignee.avatar_color || '#6366f1' }}
                        title={`Assigned to ${story.assignee.name} (${story.assignee.role})`}
                      >
                        {story.assignee.name.charAt(0)}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => onOpenTaskModal(story.id)}
                        title="Add Task under this Story"
                      >
                        + Task
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => onEditStory(story)}
                        title="Edit Story"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => onDeleteStory(story.id)}
                        title="Delete Story & Child Tasks"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Section: Acceptance Criteria & Child Tasks */}
                {expanded && (
                  <div className="task-list-nested">
                    {story.acceptance_criteria && (
                      <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '4px', borderLeft: '3px solid #6366f1' }}>
                        <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: '3px' }}>ACCEPTANCE CRITERIA</div>
                        <div style={{ color: '#cbd5e1', whiteSpace: 'pre-line' }}>{story.acceptance_criteria}</div>
                      </div>
                    )}

                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 2px' }}>
                      Sub-Tasks ({story.completed_task_count || 0} / {story.task_count || 0} done)
                    </div>

                    {(!story.tasks || story.tasks.length === 0) ? (
                      <div style={{ color: 'var(--text-sub)', fontSize: '12px', fontStyle: 'italic', padding: '6px 0' }}>
                        No tasks created under this story. Click "+ Task" above to add one.
                      </div>
                    ) : (
                      story.tasks.map((task) => (
                        <div key={task.id} id={`work-item-task-${task.id}`} className={`task-item-row ${focusItem?.type === 'task' && focusItem.id === task.id ? 'search-focus' : ''}`}>
                          <div className="task-info-left">
                            <span className="key-tag" style={{ fontSize: '11px', padding: '2px 6px' }}>
                              {task.task_key}
                            </span>
                            <span className="task-title-text">{task.title}</span>
                          </div>

                          <div className="task-actions-right">
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              ⏱️ {task.logged_hours}h / {task.estimated_hours}h
                            </span>

                            {task.assignee && (
                              <div
                                className="avatar-circle"
                                style={{ backgroundColor: task.assignee.avatar_color || '#10b981', width: '22px', height: '22px', fontSize: '10px' }}
                                title={`Assigned to ${task.assignee.name}`}
                              >
                                {task.assignee.name.charAt(0)}
                              </div>
                            )}

                            {/* Status Cycler button */}
                            <button
                              className={`badge ${getStatusBadgeClass(task.status)}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => onUpdateTaskStatus(task.id, getNextTaskStatus(task.status))}
                              title="Click to advance status"
                            >
                              {task.status} ➔
                            </button>

                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                              onClick={() => onEditTask(task)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                              onClick={() => onDeleteTask(task.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
    </>
  );
}
