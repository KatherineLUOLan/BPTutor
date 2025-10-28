import React, { useState, useRef, useEffect } from 'react';
import './TaskA.css';

const TaskA = ({ userInfo, onLogout }) => {
  // 状态管理
  const [writings, setWritings] = useState({
    userPainPoints: '',
    marketAnalysis: '',
    productIntro: '',
    competitiveAnalysis: '',
    feasibilityAnalysis: '',
    fundingPlan: '',
    teamIntro: ''
  });
  const [selectedSection, setSelectedSection] = useState(1);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 引用
  const chatEndRef = useRef(null);

  // 写作框架模板 - 针对Task A的基础写作
  const writingFramework = [
    { 
      id: 1, 
      title: '用户痛点', 
      placeholder: `🎯 用户痛点分析

请详细描述你的目标用户群体和他们的核心痛点：

• 目标用户是谁？（年龄、职业、收入、行为特征）
• 用户当前面临什么具体问题？
• 这些问题给用户带来什么损失或困扰？
• 用户现在是如何解决这些问题的？
• 现有解决方案有什么不足？

请用具体的数据和案例来说明。`,
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
      placeholder: `📊 市场分析

请分析你的目标市场：

• 市场规模有多大？（用具体数据说明）
• 市场增长趋势如何？
• 市场有哪些细分领域？
• 市场的主要驱动因素是什么？
• 有哪些政策或技术趋势会影响市场？

请提供可靠的数据来源。`,
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
      placeholder: `🚀 产品介绍

请详细介绍你的产品或服务：

• 产品的核心功能是什么？
• 产品如何解决用户痛点？
• 产品有哪些独特的功能或特点？
• 产品能为用户创造什么价值？
• 产品的使用场景和流程是怎样的？

请用简洁明了的语言描述。`,
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
      placeholder: `⚔️ 竞争分析

请分析你的竞争对手：

• 主要竞争对手有哪些？
• 竞争对手的产品、价格、渠道、营销策略如何？
• 我们的产品与竞品相比有什么优势？
• 市场上还有哪些替代方案？
• 如何建立竞争壁垒？

请客观分析，不要贬低竞争对手。`,
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
      placeholder: `✅ 可行性分析

请分析项目的可行性：

• 技术实现的难点和风险在哪里？
• 运营模式是否可持续？
• 需要什么资源和团队？
• 预期的成本结构是什么？
• 可能面临哪些法律或监管风险？

请诚实评估项目的可行性。`,
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
      placeholder: `💰 融资计划

请制定融资计划：

• 计划融资多少？分几轮？
• 资金主要用在哪些方面？
• 预期的估值和投资回报如何？
• 有哪些退出机制？
• 如何吸引投资者？

请提供具体的财务预测。`,
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
      placeholder: `👥 团队介绍

请介绍你的团队：

• 核心团队成员有哪些？
• 各自的背景和专长是什么？
• 团队在这个领域有什么优势？
• 团队还缺少什么关键角色？
• 如何吸引和留住优秀人才？

请突出团队的执行力。`,
      examples: [
        '核心团队成员有哪些？',
        '团队有什么独特优势？',
        '还缺少什么关键角色？',
        '如何吸引优秀人才？'
      ]
    }
  ];

  // 获取当前聊天消息
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

  // 获取当前框架项对应的字段名
  const getFieldName = (frameworkId) => {
    const fieldMap = {
      1: 'userPainPoints',
      2: 'marketAnalysis',
      3: 'productIntro',
      4: 'competitiveAnalysis',
      5: 'feasibilityAnalysis',
      6: 'fundingPlan',
      7: 'teamIntro'
    };
    return fieldMap[frameworkId];
  };

  // 更新写作内容
  const updateWriting = (field, value) => {
    setWritings({
      ...writings,
      [field]: value
    });
  };

  // 保存写作内容
  const saveWriting = () => {
    console.log('保存写作内容:', writings);
    alert('写作内容已保存！');
  };

  // 清空当前写作
  const clearWriting = () => {
    if (window.confirm('确定要清空当前写作内容吗？')) {
      setWritings({
        userPainPoints: '',
        marketAnalysis: '',
        productIntro: '',
        competitiveAnalysis: '',
        feasibilityAnalysis: '',
        fundingPlan: '',
        teamIntro: ''
      });
    }
  };

  // 发送聊天消息
  const sendChatMessage = async (messageText = null) => {
    const text = messageText || chatInput.trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      sectionId: selectedSection
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setIsLoading(true);
    
    // 保存用户消息到数据库
    saveChatToDatabase(userMessage);

    try {
      const currentFramework = writingFramework.find(f => f.id === selectedSection);
      const currentWriting = writings[getFieldName(selectedSection)];
      
      const response = await fetch('http://localhost:5050/api/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          context: {
            ideaText: '商业计划书写作',
            currentSection: currentFramework?.title,
            allWritings: writings,
            currentSectionContent: currentWriting,
            chatHistory: getCurrentChatMessages().slice(-6)
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
          sectionId: selectedSection
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
        sectionId: selectedSection
      };
      
      setChatMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存聊天记录到数据库
  const saveChatToDatabase = async (message) => {
    try {
      const sectionName = writingFramework.find(f => f.id === message.sectionId)?.title || '未知板块';
      
      console.log('保存聊天记录到数据库:', {
        user_id: userInfo.username,
        task_type: 'taskA',
        section_id: message.sectionId,
        section_name: sectionName,
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
          section_id: message.sectionId,
          section_name: sectionName,
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

  // 切换全屏模式
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`task-a-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
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
        {/* 左侧：写作工作区 */}
        <div className="writing-panel">
          <div className="writing-header">
            <h3>✍️ 写作工作区</h3>
            <div className="writing-tools">
              <button className="tool-btn" onClick={saveWriting}>保存</button>
              <button className="tool-btn" onClick={clearWriting}>清空</button>
              <button className="tool-btn fullscreen-btn" onClick={toggleFullscreen}>
                {isFullscreen ? "⤓" : "⤢"}
              </button>
            </div>
          </div>
          
          <div className="writing-content">
            {/* 左侧：写作框架 */}
            <div className="writing-framework">
              <h4>写作框架</h4>
              {writingFramework.map(section => (
                <div 
                  key={section.id} 
                  className={`framework-section ${selectedSection === section.id ? 'active' : ''}`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <label>{section.title}</label>
                </div>
              ))}
            </div>

            {/* 右侧：写作区域 */}
            <div className="writing-editor">
              <div className="editor-field">
                <div className="editor-field-header">
                  {writingFramework.find(s => s.id === selectedSection)?.title}
                </div>
                <textarea
                  value={writings[getFieldName(selectedSection)] || ''}
                  onChange={(e) => updateWriting(getFieldName(selectedSection), e.target.value)}
                  placeholder={writingFramework.find(s => s.id === selectedSection)?.placeholder}
                  className="editor-textarea"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：聊天区域 */}
        <div className="chat-panel">
          <div className="chat-header">
            <h3>🤖 GPT 写作助手</h3>
            <div className="chat-tools">
              <span className="current-section-indicator">
                {writingFramework.find(f => f.id === selectedSection)?.title}
              </span>
            </div>
          </div>
          
          <div className="chat-messages">
            {getCurrentChatMessages().length === 0 ? (
              <div className="empty-chat">
                <p>💡 关于「{writingFramework.find(f => f.id === selectedSection)?.title}」</p>
                <p>你可以问我以下问题来完善写作：</p>
                <div className="example-questions">
                  {writingFramework.find(f => f.id === selectedSection)?.examples.map((example, index) => (
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
