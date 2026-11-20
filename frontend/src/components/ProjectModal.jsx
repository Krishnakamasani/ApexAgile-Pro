import React, { useState, useEffect } from 'react';

export default function ProjectModal({ isOpen, onClose, onSave, project }) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    if (project) {
      setKey(project.key || '');
      setName(project.name || '');
      setDescription(project.description || '');
      setStatus(project.status || 'ACTIVE');
    } else {
      setKey('');
      setName('');
      setDescription('');
      setStatus('ACTIVE');
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      key: key.toUpperCase().trim(),
      name: name.trim(),
      description: description.trim(),
      status
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{project ? 'Edit Project' : 'Create New Project'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">PROJECT KEY (e.g. CORE, APM)</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  disabled={!!project}
                  placeholder="CORE"
                  maxLength={8}
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group">
                <label className="form-label">STATUS</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">PROJECT NAME</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. NextGen Web Platform"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">DESCRIPTION & SPRINT GOAL</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="High-level objectives and context for the team..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
