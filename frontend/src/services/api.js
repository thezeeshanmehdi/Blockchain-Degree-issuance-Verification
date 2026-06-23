const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;
export const FILE_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth calls
  auth: {
    register: async (name, email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      return await res.json();
    },
    login: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await res.json();
    }
  },

  // Student application submissions
  applications: {
    submit: async (formData) => {
      const token = localStorage.getItem('token');
      // For multipart uploads, content-type is set automatically by fetch/browser with correct boundaries
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}/applications/submit`, {
        method: 'POST',
        headers,
        body: formData
      });
      return await res.json();
    },
    getMy: async () => {
      const res = await fetch(`${API_BASE_URL}/applications/my-applications`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await res.json();
    }
  },

  // Admin capabilities
  admin: {
    getApplications: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/applications`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await res.json();
    },
    getApplicationById: async (id) => {
      const res = await fetch(`${API_BASE_URL}/admin/applications/${id}`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await res.json();
    },
    reRunOCR: async (id) => {
      const res = await fetch(`${API_BASE_URL}/admin/applications/${id}/ocr`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await res.json();
    },
    approve: async (id, cgpa) => {
      const res = await fetch(`${API_BASE_URL}/admin/applications/${id}/approve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ cgpa })
      });
      return await res.json();
    },
    reject: async (id, rejectionReason) => {
      const res = await fetch(`${API_BASE_URL}/admin/applications/${id}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rejectionReason })
      });
      return await res.json();
    },
    getMetrics: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/metrics`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await res.json();
    }
  },

  // Public Verification
  verification: {
    verify: async (hash) => {
      const res = await fetch(`${API_BASE_URL}/verify/${hash}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    }
  }
};
