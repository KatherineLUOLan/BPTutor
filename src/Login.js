import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Validate input
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    // Check if admin
    if (username.toLowerCase() === 'admin') {
      onLogin({
        username: username,
        role: 'admin',
        task: 'admin'
      });
      return;
    }

    // Check if numeric (regular user)
    if (!/^\d+$/.test(username.trim())) {
      setError('Please enter a number as username for regular users');
      return;
    }

    // Check task selection
    if (!selectedTask) {
      setError('Please select a task type');
      return;
    }

    // Regular user login
    onLogin({
      username: username,
      role: 'user',
      task: selectedTask
    });
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    // If admin, clear task selection
    if (value.toLowerCase() === 'admin') {
      setSelectedTask('');
    }
  };

  const isAdmin = username.toLowerCase() === 'admin';

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Business Plan Writing Workspace</h1>
          <p>Please log in to get started</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter a number"
              className="form-input"
            />
            <div className="input-hint">
              Regular users: enter a number
            </div>
          </div>

          {!isAdmin && (
            <div className="form-group">
              <label>Select task type</label>
              <div className="task-selection">
                <label className="task-option">
                  <input
                    type="radio"
                    name="task"
                    value="taskA"
                    checked={selectedTask === 'taskA'}
                    onChange={(e) => setSelectedTask(e.target.value)}
                  />
                  <span className="task-label">
                    <span className="task-icon">📝</span>
                    <span className="task-text">
                      <strong>Task A</strong>
                      <small>Basic business plan writing</small>
                    </span>
                  </span>
                </label>
                
                <label className="task-option">
                  <input
                    type="radio"
                    name="task"
                    value="taskB"
                    checked={selectedTask === 'taskB'}
                    onChange={(e) => setSelectedTask(e.target.value)}
                  />
                  <span className="task-label">
                    <span className="task-icon">🧠</span>
                    <span className="task-text">
                      <strong>Task B</strong>
                      <small>Meta-reflection workspace</small>
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" className="login-button">
            Start task
          </button>
        </form>

        <div className="login-footer">
          <div className="help-text">
            <h4>Instructions:</h4>
            <ul>
              <li><strong>Regular users:</strong> Enter a number as username, then choose Task A (basic writing) or Task B (meta-reflection workspace).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
