import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // 验证输入
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    // 检查是否为管理员
    if (username.toLowerCase() === 'admin') {
      onLogin({
        username: username,
        role: 'admin',
        task: 'admin'
      });
      return;
    }

    // 检查是否为数字（普通用户）
    if (!/^\d+$/.test(username.trim())) {
      setError('普通用户请输入数字作为用户名');
      return;
    }

    // 检查是否选择了任务
    if (!selectedTask) {
      setError('请选择任务类型');
      return;
    }

    // 普通用户登录
    onLogin({
      username: username,
      role: 'user',
      task: selectedTask
    });
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    // 如果是admin，自动清空任务选择
    if (value.toLowerCase() === 'admin') {
      setSelectedTask('');
    }
  };

  const isAdmin = username.toLowerCase() === 'admin';

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>商业计划书写作工作台</h1>
          <p>请登录以开始使用</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="请输入数字"
              className="form-input"
            />
            <div className="input-hint">
              普通用户请输入数字
            </div>
          </div>

          {!isAdmin && (
            <div className="form-group">
              <label>选择任务类型</label>
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
                      <small>基础商业计划书写作</small>
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
                      <small>元反思工作台</small>
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
            开始任务
          </button>
        </form>

        <div className="login-footer">
          <div className="help-text">
            <h4>使用说明：</h4>
            <ul>
              <li><strong>普通用户：</strong>输入数字作为用户名，选择Task A（基础写作）或Task B（元反思工作台）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
