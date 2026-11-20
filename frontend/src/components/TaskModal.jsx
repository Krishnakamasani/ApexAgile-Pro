import React, { useState, useEffect } from 'react';
import ImageAttachmentsField from './ImageAttachmentsField';

export default function TaskModal({ isOpen, onClose, onSave, task, users }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [loggedHours, setLoggedHours] = useState(0.0);
  const [assigneeId, setAssigneeId] = useState('');
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'TODO');
      setPriority(task.priority || 'MEDIUM');
      setEstimatedHours(task.estimated_hours || 2.0);
      setLoggedHours(task.logged_hours || 0.0);
      setAssigneeId(task.assignee_id ? String(task.assignee_id) : '');
      setAttachments(task.attachments || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setEstimatedHours(2.0);
      setLoggedHours(0.0);
      setAssigneeId('');
      setAttachments([]);
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      estimated_hours: parseFloat(estimatedHours) || 0.0,
      logged_hours: parseFloat(loggedHours) || 0.0,
      assignee_id: assigneeId ? Number(assigneeId) : null,
      attachments
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{task ? `Edit Task (${task.task_key})` : 'Create Sub-Task'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">TASK TITLE</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Implement input validation tests"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">STATUS</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">PRIORITY</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">ESTIMATED HOURS</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-input"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">LOGGED HOURS</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-input"
                  value={loggedHours}
                  onChange={(e) => setLoggedHours(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ASSIGNEE</label>
              <select className="form-select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">DESCRIPTION / NOTES</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Technical notes, file references, or checklist..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <ImageAttachmentsField images={attachments} onChange={setAttachments} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
