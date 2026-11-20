import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrandMark from './BrandMark';

const NAV_ITEMS = [
  { id: 'dashboard', title: 'Dashboard', icon: '▦', detail: 'Sprint overview and delivery health' },
  { id: 'tree', title: 'Tree Hierarchy', icon: '⌘', detail: 'Projects, stories, and tasks' },
  { id: 'kanban', title: 'Kanban Board', icon: '▤', detail: 'Work flowing across statuses' },
  { id: 'analytics', title: 'Team Capacity', icon: '◉', detail: 'Team load and sprint analytics' },
  { id: 'audit', title: 'Audit Log', icon: '◷', detail: 'Recent workspace activity' }
];

const RESULT_TYPES = {
  employee: { label: 'Employee', icon: '◉' },
  project: { label: 'Project', icon: '◇' },
  story: { label: 'User story', icon: '▱' },
  task: { label: 'Task', icon: '▪' }
};

export default function Navbar({
  currentUser,
  onLogout,
  projects,
  selectedProjectId,
  onSelectProject,
  activeTab,
  setActiveTab,
  onOpenProjectModal,
  onOpenStoryModal,
  onOpenJobsDrawer,
  onSeedData,
  activeJobsCount,
  users,
  currentProject,
  onSelectSearchResult
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const headerRef = useRef(null);
  const searchInputRef = useRef(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    const records = [
      ...users.map((user) => ({
        type: 'employee',
        id: user.id,
        title: user.name,
        subtitle: `${user.role?.replaceAll('_', ' ') || 'Team member'} · ${user.email}`,
        item: user
      })),
      ...projects.map((project) => ({
        type: 'project',
        id: project.id,
        title: project.name,
        subtitle: `${project.key} · ${project.status || 'Project'}`,
        item: project
      })),
      ...(currentProject?.stories || []).map((story) => ({
        type: 'story',
        id: story.id,
        title: story.title,
        subtitle: `${story.story_key} · ${story.status?.replaceAll('_', ' ') || 'User story'}`,
        item: story
      })),
      ...(currentProject?.stories || []).flatMap((story) => (story.tasks || []).map((task) => ({
        type: 'task',
        id: task.id,
        title: task.title,
        subtitle: `${task.task_key} · ${story.story_key}`,
        item: task
      })))
    ];

    return records
      .filter((record) => `${record.title} ${record.subtitle}`.toLocaleLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [currentProject, normalizedQuery, projects, users]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) setIsMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const chooseSearchResult = (result) => {
    onSelectSearchResult(result);
    setQuery('');
    setIsSearchOpen(false);
    setIsMenuOpen(false);
    searchInputRef.current?.blur();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsSearchOpen(false);
      setQuery('');
    } else if (event.key === 'Enter' && searchResults.length > 0) {
      event.preventDefault();
      chooseSearchResult(searchResults[0]);
    }
  };

  return (
    <header className="app-header" ref={headerRef}>
      <div className="brand-section">
        <div className="logo-badge"><BrandMark /></div>
        <div className="brand-title">
          <span>ApexAgile</span>
          <span className="brand-badge">Enterprise Pro</span>
        </div>
      </div>

      <div className="global-search" role="search">
        <label className="global-search-box">
          <span className="global-search-icon" aria-hidden="true">⌕</span>
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            placeholder="Search people, projects, stories, tasks..."
            aria-label="Search people, projects, stories, and tasks"
            aria-expanded={Boolean(normalizedQuery && isSearchOpen)}
            aria-controls="global-search-results"
            onFocus={() => setIsSearchOpen(true)}
            onChange={(event) => { setQuery(event.target.value); setIsSearchOpen(true); }}
            onKeyDown={handleSearchKeyDown}
          />
          {query ? (
            <button type="button" className="global-search-clear" aria-label="Clear search" onClick={() => { setQuery(''); setIsSearchOpen(true); }}>
              ×
            </button>
          ) : <kbd>Ctrl K</kbd>}
        </label>
        {normalizedQuery && isSearchOpen && (
          <div className="global-search-results" id="global-search-results" role="listbox" aria-label="Search results">
            {searchResults.length ? searchResults.map((result) => {
              const type = RESULT_TYPES[result.type];
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="global-search-result"
                  key={`${result.type}-${result.id}`}
                  onClick={() => chooseSearchResult(result)}
                >
                  <span className={`search-result-icon search-result-${result.type}`} aria-hidden="true">{type.icon}</span>
                  <span className="search-result-copy">
                    <strong>{result.title}</strong>
                    <small>{result.subtitle}</small>
                  </span>
                  <span className="search-result-type">{type.label}</span>
                </button>
              );
            }) : (
              <div className="global-search-empty">
                <strong>No matches found</strong>
                <span>Try a name, project key, story, or task.</span>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className={`menu-toggle ${isMenuOpen ? 'is-open' : ''}`}
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        aria-controls="main-nav-panel"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <span /><span /><span />
      </button>

      <nav className={`nav-menu-panel ${isMenuOpen ? 'is-open' : ''}`} id="main-nav-panel" aria-label="Main navigation" aria-hidden={!isMenuOpen}>
        <div className="nav-menu-heading">
          <span>WORKSPACE MENU</span>
          <strong>{NAV_ITEMS.find((item) => item.id === activeTab)?.title}</strong>
        </div>
        <div className="nav-menu-items">
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
            >
              <span className="nav-menu-item-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-menu-item-copy">
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
              <span className="nav-menu-item-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="header-actions">
        <select
          className="form-select project-select"
          value={selectedProjectId || ''}
          onChange={(event) => onSelectProject(Number(event.target.value))}
          disabled={projects.length === 0}
          aria-label="Select project"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.key} - {project.name}</option>
          ))}
        </select>

        <button className="btn btn-primary btn-sm" onClick={onOpenStoryModal} title="Create user story">
          <span aria-hidden="true">＋</span><span className="header-action-label">Story</span>
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onOpenProjectModal} title="Create project">
          <span aria-hidden="true">＋</span><span className="header-action-label">Project</span>
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onOpenJobsDrawer} title="Open async jobs">
          <span aria-hidden="true">⚙</span><span className="header-action-label">Jobs</span>
          {activeJobsCount > 0 && <span className="active-jobs-count">{activeJobsCount}</span>}
        </button>
        <button className="btn btn-secondary btn-sm seed-demo-button" onClick={onSeedData} title="Reset or populate demo data">
          <span aria-hidden="true">↻</span><span className="header-action-label">Seed</span>
        </button>

        {currentUser && (
          <div className="user-profile-pill">
            <div className="avatar-circle-sm" style={{ backgroundColor: currentUser.avatar_color || '#6366f1' }}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="user-profile-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{currentUser.role}</span>
            </div>
            <button className="logout-icon-btn" onClick={onLogout} title="Sign Out" aria-label="Sign out">
              ↪
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
