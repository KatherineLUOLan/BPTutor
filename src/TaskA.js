import React, { useState, useRef, useEffect } from 'react';
import './TaskA.css';

const TaskA = ({ userInfo, onLogout }) => {
  // 状态管理
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedSection, setSelectedSection] = useState(1);
  
  // 引用
  const chatEndRef = useRef(null);

  // 写作框架模板
  const writingFramework = [
    { 
      id: 1, 
      title: '用户痛点',
      examples: [
        '我的目标用户群体是什么？',
        '用户当前面临的主要痛点有哪些？',
        '这些痛点会给用户带来什么具体损失？',
        '用户现在是如何解决这些问题的？'
      ]
    },
    { 
      id: 2, 
      title: '市场分析',
      examples: [
        '目标市场的规模有多大？',
        '市场增长趋势如何？',
        '市场中有哪些细分机会？',
        '影响市场的主要因素有哪些？'
      ]
    },
    { 
      id: 3, 
      title: '产品介绍',
      examples: [
        '我的产品核心功能是什么？',
        '产品如何解决用户痛点？',
        '产品有哪些独特优势？',
        '产品的使用流程是怎样的？'
      ]
    },
    { 
      id: 4, 
      title: '竞争分析',
      examples: [
        '主要竞争对手有哪些？',
        '我们的产品与竞品相比有什么优势？',
        '如何建立竞争壁垒？',
        '市场上有哪些替代方案？'
      ]
    },
    { 
      id: 5, 
      title: '可行性分析',
      examples: [
        '技术实现的难点在哪里？',
        '运营模式是否可持续？',
        '需要什么资源和团队？',
        '可能面临哪些风险？'
      ]
    },
    { 
      id: 6, 
      title: '融资计划',
      examples: [
        '计划融资多少？分几轮？',
        '资金主要用在哪些方面？',
        '预期的投资回报如何？',
        '如何吸引投资者？'
      ]
    },
    { 
      id: 7, 
      title: '团队介绍',
      examples: [
        '核心团队成员有哪些？',
        '团队有什么独特优势？',
        '还缺少什么关键角色？',
        '如何吸引优秀人才？'
      ]
    }
  ];

  // 获取当前选中部分的示例问题
  const getCurrentExampleQuestions = () => {
    const currentFramework = writingFramework.find(f => f.id === selectedSection);
    return currentFramework?.examples || [];
  };

  // 获取当前部分的聊天消息（用于显示）
  const getCurrentChatMessages = () => {
    return chatMessages.filter(msg => msg.sectionId === selectedSection);
  };

  // 滚动到聊天底部
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, selectedSection]);

  // 加载聊天历史
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await fetch(
          `http://localhost:5050/api/chat-history?user_id=${userInfo.username}&task_type=taskA`
        );
        
        const data = await response.json();
        
        if (data.status === 'success') {
          // 将数据库记录转换为聊天消息格式，保留 sectionId 信息
          const messages = data.data.map(record => ({
            id: record._id || Date.now() + Math.random(),
            type: record.message_type,
            content: record.content,
            timestamp: new Date(record.timestamp),
            sectionId: record.section_id || null,
            sectionName: record.section_name || null
          }));
          
          setChatMessages(messages);
          console.log(`✅ 加载了 ${messages.length} 条聊天历史`);
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (userInfo && userInfo.username) {
      loadChatHistory();
    }
  }, [userInfo]);

  // 发送聊天消息
  const sendChatMessage = async (messageText = null) => {
    const text = messageText || chatInput.trim();
    if (!text || isLoading) return;

    const currentFramework = writingFramework.find(f => f.id === selectedSection);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      sectionId: selectedSection,
      sectionName: currentFramework?.title
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setIsLoading(true);
    
    // 保存用户消息到数据库
    saveChatToDatabase(userMessage);

    try {
      const response = await fetch('http://localhost:5050/api/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          context: {
            ideaText: '商业计划书写作',
            currentSection: currentFramework?.title || '商业计划书',
            allWritings: {},
            currentSectionContent: '',
            // 使用所有部分的聊天历史作为上下文（合并的记忆）
            chatHistory: chatMessages.slice(-6).map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            }))
          }
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.data.choices[0].message.content,
          timestamp: new Date(),
          sectionId: selectedSection,
          sectionName: currentFramework?.title
        };
        
        setChatMessages([...newMessages, aiMessage]);
        
        // 保存AI回复到数据库
        saveChatToDatabase(aiMessage);
      } else {
        throw new Error(data.error || '请求失败');
      }
    } catch (error) {
      console.error('聊天错误:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '抱歉，服务暂时不可用，请稍后重试。',
        timestamp: new Date(),
        sectionId: selectedSection,
        sectionName: currentFramework?.title
      };
      
      setChatMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存聊天记录到数据库
  const saveChatToDatabase = async (message) => {
    try {
      console.log('保存聊天记录到数据库:', {
        user_id: userInfo.username,
        task_type: 'taskA',
        section_id: message.sectionId,
        section_name: message.sectionName,
        message_type: message.type,
        content: message.content.substring(0, 50) + '...',
        timestamp: message.timestamp
      });
      
      const response = await fetch('http://localhost:5050/api/save-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userInfo.username,
          task_type: 'taskA',
          section_id: message.sectionId || null,
          section_name: message.sectionName || null,
          message_type: message.type,
          content: message.content,
          timestamp: message.timestamp
        }),
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        console.log('✅ 聊天记录保存成功:', result);
      } else {
        console.error('❌ 聊天记录保存失败:', result);
      }
    } catch (error) {
      console.error('保存聊天记录失败:', error);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.target.id === 'chat-input') {
        sendChatMessage();
      }
    }
  };

  return (
    <div className="task-a-container">
      {/* 头部 */}
      <div className="task-a-header">
        <h1>Task A - 基础商业计划书写作</h1>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">用户 {userInfo.username}</span>
            <span className="user-task">Task A</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            退出登录
          </button>
          <div className="status-indicator">
            <span className="status-dot"></span>
            服务运行中
          </div>
        </div>
      </div>
      
      <div className="task-a-content">
        {/* 聊天区域 */}
        <div className="chat-panel chat-open">
          <div className="chat-header">
            <h3>🤖 GPT 写作助手</h3>
            <div className="chat-tools">
              <select 
                className="framework-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(Number(e.target.value))}
              >
                {writingFramework.map(framework => (
                  <option key={framework.id} value={framework.id}>
                    {framework.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="chat-messages">
            {isLoadingHistory ? (
              <div className="empty-chat">
                <p>正在加载聊天历史...</p>
              </div>
            ) : getCurrentChatMessages().length === 0 ? (
              <div className="empty-chat">
                <p>💡 关于「{writingFramework.find(f => f.id === selectedSection)?.title}」</p>
                <p>你可以问我以下问题来完善写作：</p>
                <div className="example-questions">
                  {getCurrentExampleQuestions().map((example, index) => (
                    <div 
                      key={index} 
                      className="example-question"
                      onClick={() => sendChatMessage(example)}
                    >
                      💬 {example}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {getCurrentChatMessages().map(message => (
                  <div key={message.id} className={`message ${message.type}`}>
                    <div className="message-header">
                      <span className="message-sender">
                        {message.type === 'user' ? '你' : 'GPT'}
                      </span>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">
                      {message.content}
                    </div>
                  </div>
                ))}
              </>
            )}
            {isLoading && (
              <div className="message ai">
                <div className="message-header">
                  <span className="message-sender">GPT</span>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="chat-input-group">
            <textarea
              id="chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入你的问题或想法..."
              className="chat-input"
              rows="3"
            />
            <div className="chat-buttons">
              <button 
                onClick={() => sendChatMessage()} 
                className="send-btn"
                disabled={isLoading || !chatInput.trim()}
              >
                {isLoading ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskA;
