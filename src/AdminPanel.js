import React, { useState, useEffect } from 'react';
import './AdminPanel.css';
import config from './config';

const AdminPanel = ({ userInfo, onLogout }) => {
  const [activeTab, setActiveTab] = useState('stats');
  const [userStats, setUserStats] = useState([]);
  const [chatRecords, setChatRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedStats, setSelectedStats] = useState([]);
  const [selectAllStats, setSelectAllStats] = useState(false);
  const recordsPerPage = 20;

  // 获取用户统计
  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(config.endpoints.admin.userStats);
      const data = await response.json();
      if (data.status === 'success') {
        setUserStats(data.data);
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取聊天记录
  const fetchChatRecords = async (page = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * recordsPerPage;
      let url = `${config.endpoints.admin.chatRecords}?limit=${recordsPerPage}&offset=${offset}`;
      
      if (selectedUser) {
        url += `&user_id=${selectedUser}`;
      }
      if (selectedTaskType) {
        url += `&task_type=${selectedTaskType}`;
      }
      
      console.log('获取聊天记录URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('聊天记录API响应:', data);
      
      if (data.status === 'success') {
        setChatRecords(data.data);
        setTotalRecords(data.total);
        console.log(`✅ 获取到 ${data.data.length} 条聊天记录`);
      } else {
        console.error('❌ 获取聊天记录失败:', data);
      }
    } catch (error) {
      console.error('获取聊天记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchUserStats();
    } else if (activeTab === 'chats') {
      fetchChatRecords(currentPage);
    }
  }, [activeTab, currentPage, selectedUser, selectedTaskType]);

  // 格式化时间
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 格式化消息类型
  const formatMessageType = (type) => {
    return type === 'user' ? 'User' : 'GPT';
  };

  // Get task type display name
  const getTaskTypeName = (taskType) => {
    return taskType === 'taskA' ? 'Task A – Basic writing' : 'Task B – Meta-reflection';
  };

  // 分页处理
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // 选择记录处理
  const handleSelectRecord = (recordId) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  // 选择统计记录处理
  const handleSelectStat = (statId) => {
    setSelectedStats(prev => {
      if (prev.includes(statId)) {
        return prev.filter(id => id !== statId);
      } else {
        return [...prev, statId];
      }
    });
  };

  // 全选处理（聊天记录）
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(chatRecords.map(record => record._id));
    }
    setSelectAll(!selectAll);
  };

  // 全选处理（用户统计）
  const handleSelectAllStats = () => {
    if (selectAllStats) {
      setSelectedStats([]);
    } else {
      setSelectedStats(userStats.map(stat => stat._id));
    }
    setSelectAllStats(!selectAllStats);
  };

  // 删除选中的统计记录
  const deleteSelectedStats = async () => {
    if (selectedStats.length === 0) {
      alert('Please select records to delete first');
      return;
    }

    if (!window.confirm(`Delete ${selectedStats.length} selected user stat record(s)? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(config.endpoints.admin.deleteUserStats, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stat_ids: selectedStats
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert(`Deleted ${data.deleted_count} record(s)`);
        setSelectedStats([]);
        setSelectAllStats(false);
        fetchUserStats(); // 刷新列表
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (error) {
      console.error('Delete stat records failed:', error);
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // 删除选中的记录
  const deleteSelectedRecords = async () => {
    if (selectedRecords.length === 0) {
      alert('Please select records to delete first');
      return;
    }

    if (!window.confirm(`Delete ${selectedRecords.length} selected record(s)? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(config.endpoints.admin.deleteChatRecords, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record_ids: selectedRecords
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert(`Deleted ${data.deleted_count} record(s)`);
        setSelectedRecords([]);
        setSelectAll(false);
        fetchChatRecords(currentPage); // 刷新列表
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (error) {
      console.error('Delete records failed:', error);
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // 导出Excel
  const exportToExcel = async () => {
    setLoading(true);
    try {
      // 获取所有记录（不分页）
      let url = `${config.endpoints.admin.chatRecords}?limit=10000&offset=0`;
      
      if (selectedUser) {
        url += `&user_id=${selectedUser}`;
      }
      if (selectedTaskType) {
        url += `&task_type=${selectedTaskType}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'success') {
        // 创建Excel内容
        const excelContent = createExcelContent(data.data);
        downloadExcel(excelContent, `chat_records_${new Date().toISOString().split('T')[0]}.xlsx`);
        alert(`Exported ${data.data.length} record(s)`);
      } else {
        alert('Export failed: ' + data.error);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    } finally {
      setLoading(false);
    }
  };

  // 创建Excel内容
  const createExcelContent = (records) => {
    const headers = ['Time', 'User', 'Task type', 'Idea/Section', 'Message type', 'Content'];
    const rows = records.map(record => [
      formatTime(record.timestamp),
      record.user_id,
      getTaskTypeName(record.task_type),
      record.task_type === 'taskA' ? record.section_name : `${record.idea_name || 'Untitled idea'} - ${record.section_name}`,
      formatMessageType(record.message_type),
      record.content
    ]);
    
    return [headers, ...rows];
  };

  // 下载Excel文件
  const downloadExcel = (data, filename) => {
    // 创建CSV内容（简化版Excel）
    const csvContent = data.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.xlsx', '.csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-panel">
      {/* 头部 */}
      <div className="admin-header">
        <h1>Admin panel</h1>
        <div className="header-right">
          <div className="admin-info">
            <span className="admin-name">Admin</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 User stats
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          💬 Chat records
        </button>
      </div>

      {/* 内容区域 */}
      <div className="admin-content">
        {activeTab === 'stats' && (
          <div className="stats-panel">
            <div className="panel-header">
              <h2>User usage stats</h2>
              <div className="stats-actions">
                <button className="refresh-btn" onClick={fetchUserStats}>
                  🔄 Refresh
                </button>
                <button 
                  className="delete-btn" 
                  onClick={deleteSelectedStats}
                  disabled={selectedStats.length === 0}
                >
                  🗑️ Delete selected ({selectedStats.length})
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="stats-table">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          checked={selectAllStats}
                          onChange={handleSelectAllStats}
                          className="select-checkbox"
                        />
                      </th>
                      <th>User ID</th>
                      <th>Task type</th>
                      <th>Total messages</th>
                      <th>Total ideas</th>
                      <th>Last active</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((stat, index) => (
                      <tr key={index} className={selectedStats.includes(stat._id) ? 'selected' : ''}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedStats.includes(stat._id)}
                            onChange={() => handleSelectStat(stat._id)}
                            className="select-checkbox"
                          />
                        </td>
                        <td>{stat.user_id}</td>
                        <td>
                          <span className={`task-badge ${stat.task_type}`}>
                            {getTaskTypeName(stat.task_type)}
                          </span>
                        </td>
                        <td>{stat.total_messages}</td>
                        <td>{stat.total_ideas}</td>
                        <td>{formatTime(stat.last_active)}</td>
                        <td>{formatTime(stat.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {userStats.length === 0 && (
                  <div className="empty-state">
                    <p>No user data yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="chats-panel">
            <div className="panel-header">
              <h2>Chat records</h2>
              <div className="filters">
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All users</option>
                  {userStats.map(stat => (
                    <option key={stat.user_id} value={stat.user_id}>
                      {stat.user_id}
                    </option>
                  ))}
                </select>
                
                <select 
                  value={selectedTaskType} 
                  onChange={(e) => setSelectedTaskType(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All tasks</option>
                  <option value="taskA">Task A – Basic writing</option>
                  <option value="taskB">Task B – Meta-reflection</option>
                </select>
                
                <button className="refresh-btn" onClick={() => fetchChatRecords(currentPage)}>
                  🔄 Refresh
                </button>
                
                <button className="export-btn" onClick={exportToExcel}>
                  📊 Export Excel
                </button>
                
                <button 
                  className="delete-btn" 
                  onClick={deleteSelectedRecords}
                  disabled={selectedRecords.length === 0}
                >
                  🗑️ Delete selected ({selectedRecords.length})
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <div className="chats-table">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <input 
                            type="checkbox" 
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="select-checkbox"
                          />
                        </th>
                        <th>Time</th>
                        <th>User</th>
                        <th>Task type</th>
                        <th>Idea/Section</th>
                        <th>Message type</th>
                        <th>Content</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chatRecords.map((record, index) => (
                        <tr key={index} className={selectedRecords.includes(record._id) ? 'selected' : ''}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={selectedRecords.includes(record._id)}
                              onChange={() => handleSelectRecord(record._id)}
                              className="select-checkbox"
                            />
                          </td>
                          <td>{formatTime(record.timestamp)}</td>
                          <td>{record.user_id}</td>
                          <td>
                            <span className={`task-badge ${record.task_type}`}>
                              {getTaskTypeName(record.task_type)}
                            </span>
                          </td>
                          <td>
                            {record.task_type === 'taskA' ? (
                              record.section_name
                            ) : (
                              `${record.idea_name || 'Untitled idea'} - ${record.section_name}`
                            )}
                          </td>
                          <td>
                            <span className={`message-type ${record.message_type}`}>
                              {formatMessageType(record.message_type)}
                            </span>
                          </td>
                          <td className="content-cell">
                            <div className="content-preview">
                              {record.content.length > 100 
                                ? `${record.content.substring(0, 100)}...` 
                                : record.content
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {chatRecords.length === 0 && (
                    <div className="empty-state">
                      <p>No chat records yet</p>
                    </div>
                  )}
                </div>
                
                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="page-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    <span className="page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button 
                      className="page-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
