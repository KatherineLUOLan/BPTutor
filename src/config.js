// API config
// Server: http://43.138.178.98, backend port: 3000
// API base URL is derived from current host + port 3000
const API_PORT = 3000;

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${API_PORT}`;
    }
    return `http://${hostname}:${API_PORT}`;
  }
  return `http://localhost:${API_PORT}`;
};

const API_BASE_URL = getApiBaseUrl();

export default {
  API_BASE_URL,
  // API endpoints
  endpoints: {
    strategy: `${API_BASE_URL}/api/strategy`,
    analyzeWriting: `${API_BASE_URL}/api/analyze-writing`,
    saveChat: `${API_BASE_URL}/api/save-chat`,
    saveState: `${API_BASE_URL}/api/save-state`,
    loadState: `${API_BASE_URL}/api/load-state`,
    admin: {
      userStats: `${API_BASE_URL}/api/admin/user-stats`,
      chatRecords: `${API_BASE_URL}/api/admin/chat-records`,
      deleteUserStats: `${API_BASE_URL}/api/admin/delete-user-stats`,
      deleteChatRecords: `${API_BASE_URL}/api/admin/delete-chat-records`,
    }
  }
};
