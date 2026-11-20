import React, { useState, useEffect, useRef } from 'react';
import { api } from './api/client';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import HierarchyTree from './components/HierarchyTree';
import KanbanBoard from './components/KanbanBoard';
import AnalyticsView from './components/AnalyticsView';
import AuditLogsView from './components/AuditLogsView';
import AsyncJobsDrawer from './components/AsyncJobsDrawer';
import ProjectModal from './components/ProjectModal';
import StoryModal from './components/StoryModal';
import TaskModal from './components/TaskModal';
import ConfirmDialog from './components/ConfirmDialog';
import StageShowcase from './components/StageShowcase';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(localStorage.getItem('sprintsync_token')));

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const projectLoadSequence = useRef(0);
  const toastTimeout = useRef(null);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [teamSearchFocusId, setTeamSearchFocusId] = useState(null);
  const [treeSearchFocus, setTreeSearchFocus] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tree' | 'kanban' | 'analytics' | 'audit'

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetStoryIdForTask, setTargetStoryIdForTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const [isJobsDrawerOpen, setIsJobsDrawerOpen] = useState(false);
  const [activeJobsCount, setActiveJobsCount] = useState(0);

  // Notification Toast
  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    if (toastTimeout.current) window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => () => {
    if (toastTimeout.current) window.clearTimeout(toastTimeout.current);
  }, []);

  // Initial load
  useEffect(() => {
    if (currentUser) {
      loadInitialData();
      return;
    }

    api.getUsers()
      .then((userList) => setUsers(userList || []))
      .catch((err) => showToast(`Failed to load demo team: ${err.message}`, true));
  }, [currentUser]);

  useEffect(() => {
    if (!localStorage.getItem('sprintsync_token')) return;
    api.getMe()
      .then(setCurrentUser)
      .catch(() => {
        localStorage.removeItem('sprintsync_token');
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  useEffect(() => {
    if (currentUser) window.scrollTo(0, 0);
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (activeTab !== 'tree') setTreeSearchFocus(null);
    if (activeTab !== 'analytics') setTeamSearchFocusId(null);
  }, [activeTab]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [projList, userList] = await Promise.all([
        api.getProjects(),
        api.getUsers()
      ]);
      setProjects(projList || []);
      setUsers(userList || []);

      if (projList && projList.length > 0) {
        const projectId = projList.some((project) => project.id === selectedProjectId)
          ? selectedProjectId
          : projList[0].id;
        setSelectedProjectId(projectId);
        await loadProjectDetail(projectId);
      } else {
        projectLoadSequence.current += 1;
        setSelectedProjectId(null);
        setCurrentProject(null);
        setAnalytics(null);
      }
    } catch (err) {
      setLoadError(`Failed to load workspace: ${err.message}`);
      showToast(`Failed to load data: ${err.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectDetail = async (projectId) => {
    if (!projectId) {
      setCurrentProject(null);
      setAnalytics(null);
      return;
    }
    const requestId = ++projectLoadSequence.current;
    setIsLoading(true);
    setLoadError('');
    try {
      const [detail, analyticsData] = await Promise.all([
        api.getProject(projectId),
        api.getAnalytics(projectId)
      ]);
      if (requestId === projectLoadSequence.current) {
        setCurrentProject(detail);
        setAnalytics(analyticsData);
      }
    } catch (err) {
      if (requestId === projectLoadSequence.current) {
        setLoadError(`Failed to load project: ${err.message}`);
        showToast(`Failed to load project details: ${err.message}`, true);
      }
    } finally {
      if (requestId === projectLoadSequence.current) setIsLoading(false);
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    loadProjectDetail(projectId);
  };

  const handleGlobalSearchResult = (result) => {
    if (result.type === 'project') {
      setActiveTab('dashboard');
      handleSelectProject(result.item.id);
      return;
    }

    if (result.type === 'employee') {
      setTeamSearchFocusId(result.item.id);
      setActiveTab('analytics');
      return;
    }

    setTreeSearchFocus({
      type: result.type,
      id: result.item.id,
      storyId: result.item.story_id
    });
    setActiveTab('tree');
  };

  // Auth Handlers
  const handleLogin = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('sprintsync_token', res.access_token);
    setCurrentUser(res.user);
    showToast(`Welcome back, ${res.user.name}!`);
  };

  const handleRegister = async (data) => {
    const res = await api.register(data);
    localStorage.setItem('sprintsync_token', res.access_token);
    setCurrentUser(res.user);
    showToast(`Account created! Welcome, ${res.user.name}.`);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      showToast('Signed out successfully.');
    } catch (err) {
      if (err.status === 401) {
        showToast('Your session had expired. You are signed out.');
      } else {
        showToast(`Signed out on this device, but the server could not revoke the session: ${err.message}`, true);
      }
    } finally {
      setCurrentUser(null);
      setProjects([]);
      setSelectedProjectId(null);
      setCurrentProject(null);
      setAnalytics(null);
      localStorage.removeItem('sprintsync_token');
    }
  };

  // Refresh current project and projects list
  const refreshAll = async (projectId = selectedProjectId) => {
    try {
      const projList = await api.getProjects();
      setProjects(projList || []);
      if (projList && projList.length > 0) {
        const nextProjectId = projList.some((project) => project.id === projectId)
          ? projectId
          : projList[0].id;
        setSelectedProjectId(nextProjectId);
        await loadProjectDetail(nextProjectId);
      } else {
        setSelectedProjectId(null);
        setCurrentProject(null);
        setAnalytics(null);
      }
    } catch (err) {
      setLoadError(`Failed to refresh workspace: ${err.message}`);
      showToast(`Failed to refresh workspace: ${err.message}`, true);
    }
  };

  // Project Actions
  const handleSaveProject = async (data) => {
    try {
      let nextProjectId = selectedProjectId;
      if (editingProject) {
        await api.updateProject(editingProject.id, data);
        showToast('Project updated successfully');
      } else {
        const created = await api.createProject(data);
        showToast(`Project ${created.key} created successfully!`);
        nextProjectId = created.id;
      }
      setIsProjectModalOpen(false);
      setEditingProject(null);
      await refreshAll(nextProjectId);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Story Actions
  const handleOpenStoryModal = (projectId = null) => {
    setEditingStory(null);
    setIsStoryModalOpen(true);
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    setIsStoryModalOpen(true);
  };

  const handleSaveStory = async (data) => {
    try {
      if (editingStory) {
        await api.updateStory(editingStory.id, data);
        showToast(`Updated user story ${editingStory.story_key}`);
      } else {
        const created = await api.createStory(selectedProjectId, data);
        showToast(`Created user story ${created.story_key}`);
      }
      setIsStoryModalOpen(false);
      setEditingStory(null);
      await refreshAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleUpdateStoryStatus = async (storyId, newStatus) => {
    try {
      await api.updateStoryStatus(storyId, newStatus);
      await refreshAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteStory = (storyId) => {
    setConfirmation({
      title: 'Delete this user story?',
      message: 'Its nested tasks will also be permanently deleted.',
      confirmLabel: 'Delete story',
      danger: true,
      action: async () => {
        try {
          await api.deleteStory(storyId);
          showToast('User story deleted');
          await refreshAll();
        } catch (err) {
          showToast(err.message, true);
        }
      }
    });
  };

  // Task Actions
  const handleOpenTaskModal = (storyId) => {
    setTargetStoryIdForTask(storyId);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTargetStoryIdForTask(task.story_id);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (data) => {
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, data);
        showToast(`Task ${editingTask.task_key} updated`);
      } else {
        const created = await api.createTask(targetStoryIdForTask, data);
        showToast(`Created task ${created.task_key}`);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await refreshAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      await refreshAll();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteTask = (taskId) => {
    setConfirmation({
      title: 'Delete this task?',
      message: 'This task will be permanently removed from its story.',
      confirmLabel: 'Delete task',
      danger: true,
      action: async () => {
        try {
          await api.deleteTask(taskId);
          showToast('Task removed');
          await refreshAll();
        } catch (err) {
          showToast(err.message, true);
        }
      }
    });
  };

  // Seed Data Handler
  const handleSeedData = async () => {
    setConfirmation({
      title: 'Restore demo data?',
      message: 'This replaces the current workspace and cannot be undone.',
      confirmLabel: 'Restore demo data',
      danger: true,
      action: async () => {
        try {
          const res = await api.seedDatabase(true);
          showToast(res.message || 'Demo data re-seeded successfully!');
          await loadInitialData();
        } catch (err) {
          showToast(`Seed failed: ${err.message}`, true);
        }
      }
    });
  };

  const runConfirmedAction = () => {
    const action = confirmation?.action;
    setConfirmation(null);
    if (action) action();
  };

  const notification = toast && (
    <div className="toast-container" role={toast.isError ? 'alert' : 'status'} aria-live="polite">
      <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>
        <span aria-hidden="true">{toast.isError ? '!' : '✓'}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );

  if (isAuthLoading) {
    return (
      <div className="workspace-state" role="status">
        <span className="loading-indicator" />
        <h2>Restoring your session</h2>
      </div>
    );
  }

  // If user is not logged in, render the login/register screen
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onRegister={handleRegister}
          demoUsers={users}
        />
        {notification}
      </>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        currentUser={currentUser}
        onLogout={() => setConfirmation({
          title: 'Sign out of ApexAgile?',
          message: 'Your work is saved. You can sign back in any time.',
          confirmLabel: 'Sign out',
          action: handleLogout
        })}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        users={users}
        currentProject={currentProject}
        onSelectSearchResult={handleGlobalSearchResult}
        onOpenProjectModal={() => { setEditingProject(null); setIsProjectModalOpen(true); }}
        onOpenStoryModal={() => handleOpenStoryModal(selectedProjectId)}
        onOpenJobsDrawer={() => setIsJobsDrawerOpen(true)}
        onSeedData={handleSeedData}
        activeJobsCount={activeJobsCount}
      />

      <main key={activeTab} className={`main-content stage-transition stage-${activeTab}`}>
        {isLoading ? (
          <div className="workspace-state" role="status">
            <span className="loading-indicator" />
            <h2>Loading your workspace</h2>
            <p>Getting your projects and team activity ready.</p>
          </div>
        ) : loadError ? (
          <div className="workspace-state workspace-state-error" role="alert">
            <div className="workspace-state-icon">!</div>
            <h2>We couldn’t load your workspace</h2>
            <p>{loadError}</p>
            <button className="btn btn-primary" onClick={loadInitialData}>Try again</button>
          </div>
        ) : !currentProject ? (
          <div className="workspace-state">
            <div className="workspace-state-icon">✦</div>
            <h2>Your workspace starts here</h2>
            <p>Create a project to organize stories, plan work, and follow delivery progress.</p>
            <button className="btn btn-primary" onClick={() => { setEditingProject(null); setIsProjectModalOpen(true); }}>
              Create your first project
            </button>
          </div>
        ) : activeTab === 'dashboard' && (
          <ExecutiveDashboard
            project={currentProject}
            analytics={analytics}
            onOpenStoryModal={handleOpenStoryModal}
            onOpenJobsDrawer={() => setIsJobsDrawerOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {currentProject && activeTab === 'tree' && (
          <HierarchyTree
            project={currentProject}
            focusItem={treeSearchFocus}
            onOpenStoryModal={handleOpenStoryModal}
            onOpenTaskModal={handleOpenTaskModal}
            onEditStory={handleEditStory}
            onEditTask={handleEditTask}
            onDeleteStory={handleDeleteStory}
            onDeleteTask={handleDeleteTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onUpdateStoryStatus={handleUpdateStoryStatus}
          />
        )}

        {currentProject && activeTab === 'kanban' && (
          <KanbanBoard
            project={currentProject}
            users={users}
            onUpdateStoryStatus={handleUpdateStoryStatus}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onEditStory={handleEditStory}
            onEditTask={handleEditTask}
          />
        )}

        {currentProject && activeTab === 'analytics' && (
          <AnalyticsView
            selectedProjectId={selectedProjectId}
            project={currentProject}
            focusUserId={teamSearchFocusId}
          />
        )}

        {currentProject && activeTab === 'audit' && (
          <AuditLogsView project={currentProject} />
        )}
      </main>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
        project={editingProject}
      />

      <StoryModal
        isOpen={isStoryModalOpen}
        onClose={() => { setIsStoryModalOpen(false); setEditingStory(null); }}
        onSave={handleSaveStory}
        story={editingStory}
        users={users}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        task={editingTask}
        users={users}
      />

      {/* Async Jobs Drawer */}
      <AsyncJobsDrawer
        isOpen={isJobsDrawerOpen}
        onClose={() => setIsJobsDrawerOpen(false)}
        selectedProjectId={selectedProjectId}
        onNotify={showToast}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        danger={confirmation?.danger}
        onCancel={() => setConfirmation(null)}
        onConfirm={runConfirmedAction}
      />
      {notification}
    </div>
  );
}
