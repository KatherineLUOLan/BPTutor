import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

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
      const response = await fetch('http://localhost:5050/api/admin/user-stats');
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
      let url = `http://localhost:5050/api/admin/chat-records?limit=${recordsPerPage}&offset=${offset}`;
      
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
    return type === 'user' ? '用户' : 'GPT';
  };

  // 获取任务类型显示名称
  const getTaskTypeName = (taskType) => {
    return taskType === 'taskA' ? 'Task A - 基础写作' : 'Task B - 元反思工作台';
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
      alert('请先选择要删除的记录');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedStats.length} 条用户统计记录吗？此操作不可恢复。`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5050/api/admin/delete-user-stats', {
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
        alert(`成功删除 ${data.deleted_count} 条记录`);
        setSelectedStats([]);
        setSelectAllStats(false);
        fetchUserStats(); // 刷新列表
      } else {
        alert('删除失败: ' + data.error);
      }
    } catch (error) {
      console.error('删除统计记录失败:', error);
      alert('删除统计记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除选中的记录
  const deleteSelectedRecords = async () => {
    if (selectedRecords.length === 0) {
      alert('请先选择要删除的记录');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedRecords.length} 条记录吗？此操作不可恢复。`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5050/api/admin/delete-chat-records', {
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
        alert(`成功删除 ${data.deleted_count} 条记录`);
        setSelectedRecords([]);
        setSelectAll(false);
        fetchChatRecords(currentPage); // 刷新列表
      } else {
        alert('删除失败: ' + data.error);
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      alert('删除记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出Excel
  const exportToExcel = async () => {
    setLoading(true);
    try {
      // 获取所有记录（不分页）
      let url = 'http://localhost:5050/api/admin/chat-records?limit=10000&offset=0';
      
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
        downloadExcel(excelContent, `聊天记录_${new Date().toISOString().split('T')[0]}.xlsx`);
        alert(`成功导出 ${data.data.length} 条记录`);
      } else {
        alert('导出失败: ' + data.error);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建Excel内容
  const createExcelContent = (records) => {
    const headers = ['时间', '用户', '任务类型', '想法/板块', '消息类型', '内容'];
    const rows = records.map(record => [
      formatTime(record.timestamp),
      record.user_id,
      getTaskTypeName(record.task_type),
      record.task_type === 'taskA' ? record.section_name : `${record.idea_name || '未命名想法'} - ${record.section_name}`,
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
        <h1>管理员后台</h1>
        <div className="header-right">
          <div className="admin-info">
            <span className="admin-name">管理员</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 用户统计
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          💬 聊天记录
        </button>
      </div>

      {/* 内容区域 */}
      <div className="admin-content">
        {activeTab === 'stats' && (
          <div className="stats-panel">
            <div className="panel-header">
              <h2>用户使用统计</h2>
              <div className="stats-actions">
                <button className="refresh-btn" onClick={fetchUserStats}>
                  🔄 刷新
                </button>
                <button 
                  className="delete-btn" 
                  onClick={deleteSelectedStats}
                  disabled={selectedStats.length === 0}
                >
                  🗑️ 删除选中 ({selectedStats.length})
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">加载中...</div>
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
                      <th>用户ID</th>
                      <th>任务类型</th>
                      <th>消息总数</th>
                      <th>想法总数</th>
                      <th>最后活跃</th>
                      <th>注册时间</th>
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
                    <p>暂无用户数据</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="chats-panel">
            <div className="panel-header">
              <h2>聊天记录管理</h2>
              <div className="filters">
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="filter-select"
                >
                  <option value="">所有用户</option>
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
                  <option value="">所有任务</option>
                  <option value="taskA">Task A - 基础写作</option>
                  <option value="taskB">Task B - 元反思工作台</option>
                </select>
                
                <button className="refresh-btn" onClick={() => fetchChatRecords(currentPage)}>
                  🔄 刷新
                </button>
                
                <button className="export-btn" onClick={exportToExcel}>
                  📊 导出Excel
                </button>
                
                <button 
                  className="delete-btn" 
                  onClick={deleteSelectedRecords}
                  disabled={selectedRecords.length === 0}
                >
                  🗑️ 删除选中 ({selectedRecords.length})
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">加载中...</div>
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
                        <th>时间</th>
                        <th>用户</th>
                        <th>任务类型</th>
                        <th>想法/板块</th>
                        <th>消息类型</th>
                        <th>内容</th>
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
                              `${record.idea_name || '未命名想法'} - ${record.section_name}`
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
                      <p>暂无聊天记录</p>
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
                      上一页
                    </button>
                    
                    <span className="page-info">
                      第 {currentPage} 页，共 {totalPages} 页
                    </span>
                    
                    <button 
                      className="page-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      下一页
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
