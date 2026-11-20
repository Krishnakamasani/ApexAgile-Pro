const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('sprintsync_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || `HTTP Error ${response.status}: ${response.statusText}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Stories
  createStory: (projectId, data) => request(`/projects/${projectId}/stories`, { method: 'POST', body: JSON.stringify(data) }),
  getStory: (id) => request(`/stories/${id}`),
  updateStory: (id, data) => request(`/stories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStoryStatus: (id, status) => request(`/stories/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteStory: (id) => request(`/stories/${id}`, { method: 'DELETE' }),

  // Tasks
  createTask: (storyId, data) => request(`/stories/${storyId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),

  // Async Jobs
  getJobs: () => request('/jobs'),
  getJob: (id) => request(`/jobs/${id}`),
  dispatchJob: (type, projectId = null, simulateFailure = false) =>
    request('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        type,
        project_id: projectId,
        simulate_failure: simulateFailure
      })
    }),
  retryJob: (id, maxRetries = null) =>
    request(`/jobs/${id}/retry`, {
      method: 'POST',
      body: JSON.stringify(maxRetries ? { max_retries: maxRetries } : {})
    }),

  // Analytics & Seeding
  getAnalytics: (projectId = null) => request(`/analytics/overview${projectId ? `?project_id=${projectId}` : ''}`),
  seedDatabase: (force = false) => request(`/analytics/seed?force=${force}`, { method: 'POST' }),

  // Audit Logs
  getAuditLogs: (limit = 30) => request(`/audit?limit=${limit}`)
};
