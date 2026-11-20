import React, { useState, useEffect } from 'react';
import ImageAttachmentsField from './ImageAttachmentsField';

export default function StoryModal({ isOpen, onClose, onSave, story, users }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [points, setPoints] = useState(3);
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('BACKLOG');
  const [assigneeId, setAssigneeId] = useState('');
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (story) {
      setTitle(story.title || '');
      setDescription(story.description || '');
      setAcceptanceCriteria(story.acceptance_criteria || '');
      setPoints(story.points || 3);
      setPriority(story.priority || 'MEDIUM');
      setStatus(story.status || 'BACKLOG');
      setAssigneeId(story.assignee_id ? String(story.assignee_id) : '');
      setAttachments(story.attachments || []);
    } else {
      setTitle('');
      setDescription('');
      setAcceptanceCriteria('');
      setPoints(3);
      setPriority('MEDIUM');
      setStatus('BACKLOG');
      setAssigneeId('');
      setAttachments([]);
    }
  }, [story, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      acceptance_criteria: acceptanceCriteria.trim(),
      points: Number(points),
      priority,
      status,
      assignee_id: assigneeId ? Number(assigneeId) : null,
      attachments
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{story ? `Edit Story (${story.story_key})` : 'New User Story'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">USER STORY TITLE</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. As a user, I want to filter tasks by priority..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">STORY POINTS (Fibonacci)</label>
                <select className="form-select" value={points} onChange={(e) => setPoints(e.target.value)}>
                  <option value={1}>1 Point</option>
                  <option value={2}>2 Points</option>
                  <option value={3}>3 Points</option>
                  <option value={5}>5 Points</option>
                  <option value={8}>8 Points</option>
                  <option value={13}>13 Points</option>
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
                <label className="form-label">STATUS</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
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
            </div>

            <div className="form-group">
              <label className="form-label">ACCEPTANCE CRITERIA</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="1. Given..., When..., Then...&#10;2. Verified by QA..."
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">DESCRIPTION & USER VALUE</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Detailed business requirements and technical context..."
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
              {story ? 'Save Changes' : 'Create User Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
