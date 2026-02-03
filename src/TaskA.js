import React, { useState, useRef, useEffect } from 'react';
import './TaskA.css';
import config from './config';

const TaskA = ({ userInfo, onLogout }) => {
  // 文档管理状态
  const [documents, setDocuments] = useState([
    {
      id: Date.now(),
      name: 'Business Plan 1',
      writings: {
        userPainPoints: '',
        marketAnalysis: '',
        productIntro: '',
        competitiveAnalysis: '',
        feasibilityAnalysis: '',
        fundingPlan: '',
        teamIntro: ''
      },
      chatMessages: []
    }
  ]);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [editingDocumentName, setEditingDocumentName] = useState('');
  
  // 当前文档的状态（从documents中获取）
  const currentDocument = documents.find(doc => doc.id === currentDocumentId) || documents[0];
  const [writings, setWritings] = useState(currentDocument?.writings || {
    userPainPoints: '',
    marketAnalysis: '',
    productIntro: '',
    competitiveAnalysis: '',
    feasibilityAnalysis: '',
    fundingPlan: '',
    teamIntro: ''
  });
  const [chatMessages, setChatMessages] = useState(currentDocument?.chatMessages || []);
  
  const [selectedSection, setSelectedSection] = useState(1);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modal, setModal] = useState({ show: false, message: '', type: 'info', onConfirm: null });
  // 每个文档、每个板块的 to-do 勾选状态 { docId: { sectionId: boolean[] } }
  const [todoChecked, setTodoChecked] = useState({});
  
  // 引用
  const chatEndRef = useRef(null);
  
  // 初始化：设置当前文档ID
  useEffect(() => {
    if (documents.length > 0 && !currentDocumentId) {
      setCurrentDocumentId(documents[0].id);
    }
  }, [documents, currentDocumentId]);
  
  // 当切换文档时，更新writings和chatMessages
  useEffect(() => {
    if (currentDocumentId && currentDocument) {
      setWritings({ ...currentDocument.writings });
      setChatMessages([...currentDocument.chatMessages]);
    }
  }, [currentDocumentId]);

  // 当writings或chatMessages变化时，更新当前文档（使用ref避免循环）
  const prevWritingsRef = useRef(writings);
  const prevChatMessagesRef = useRef(chatMessages);
  
  useEffect(() => {
    if (currentDocumentId && 
        (JSON.stringify(prevWritingsRef.current) !== JSON.stringify(writings) ||
         JSON.stringify(prevChatMessagesRef.current) !== JSON.stringify(chatMessages))) {
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === currentDocumentId 
            ? { ...doc, writings: { ...writings }, chatMessages: [...chatMessages] }
            : doc
        )
      );
      prevWritingsRef.current = writings;
      prevChatMessagesRef.current = chatMessages;
    }
  }, [writings, chatMessages, currentDocumentId]);

  // Writing framework for Task A
  const writingFramework = [
    { 
      id: 1, 
      title: 'User Pain Points', 
      placeholder: `🎯 User pain points

Describe your target users and their core pains:

• Who are they? (age, occupation, income, behavior)
• What specific problems do they face?
• What does this cost or trouble them?
• How do they solve it today?
• What’s wrong with current solutions?

Use concrete data and examples.`,
      examples: [
        'Who is my target user group?',
        'What are the main pain points?',
        'What do these pains cost users?',
        'How do users solve this today?'
      ]
    },
    { 
      id: 2, 
      title: 'Market Analysis', 
      placeholder: `📊 Market analysis

Analyze your target market:

• How large is the market? (with data)
• What are the growth trends?
• What segments exist?
• What are the main drivers?
• What policies or tech trends affect it?

Cite reliable sources.`,
      examples: [
        'How large is the market?',
        'What are the growth trends?',
        'What segments and opportunities exist?',
        'What are the main market drivers?'
      ]
    },
    { 
      id: 3, 
      title: 'Product Overview', 
      placeholder: `🚀 Product overview

Describe your product or service:

• What are the core features?
• How does it address user pains?
• What’s unique about it?
• What value does it create?
• What are the use cases and flow?

Keep it clear and concise.`,
      examples: [
        'What are my product’s core features?',
        'How does it solve user pains?',
        'What are its unique advantages?',
        'What is the usage flow?'
      ]
    },
    { 
      id: 4, 
      title: 'Competitive Analysis', 
      placeholder: `⚔️ Competitive analysis

Analyze your competitors:

• Who are the main competitors?
• Their product, price, channel, marketing?
• Our advantages vs. competitors?
• What alternatives exist?
• How do we build moats?

Be objective.`,
      examples: [
        'Who are the main competitors?',
        'What are our advantages vs. competitors?',
        'How do we build defensibility?',
        'What alternatives exist?'
      ]
    },
    { 
      id: 5, 
      title: 'Feasibility Analysis', 
      placeholder: `✅ Feasibility analysis

Assess feasibility:

• Where are the technical challenges and risks?
• Is the operating model sustainable?
• What resources and team are needed?
• What is the cost structure?
• What legal or regulatory risks exist?

Be honest.`,
      examples: [
        'Where are the technical challenges?',
        'Is the operating model sustainable?',
        'What resources and team are needed?',
        'What risks do we face?'
      ]
    },
    { 
      id: 6, 
      title: 'Funding Plan', 
      placeholder: `💰 Funding plan

Outline your funding plan:

• How much to raise? In how many rounds?
• Where will the funds be used?
• Expected valuation and returns?
• Exit options?
• How to attract investors?

Include financial projections.`,
      examples: [
        'How much to raise? In how many rounds?',
        'Where will the funds be used?',
        'What returns can investors expect?',
        'How to attract investors?'
      ]
    },
    { 
      id: 7, 
      title: 'Team', 
      placeholder: `👥 Team

Introduce your team:

• Who are the core members?
• Their background and expertise?
• What advantages does the team have?
• What key roles are missing?
• How will you attract and retain talent?

Highlight execution.`,
      examples: [
        'Who are the core team members?',
        'What unique advantages does the team have?',
        'What key roles are missing?',
        'How will you attract talent?'
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

  // 从 placeholder 文本解析出 to-do 列表项（以 • 开头的行）
  const getTodoItemsFromPlaceholder = (placeholderText) => {
    if (!placeholderText) return [];
    return placeholderText
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.startsWith('•') || line.startsWith('*'))
      .map(line => line.replace(/^[•*]\s*/, '').trim())
      .filter(Boolean);
  };

  // 获取当前板块的 to-do 项
  const getCurrentTodoItems = () => {
    const section = writingFramework.find(s => s.id === selectedSection);
    return section ? getTodoItemsFromPlaceholder(section.placeholder) : [];
  };

  // 获取当前文档、当前板块的勾选状态数组
  const getTodoCheckedList = () => {
    const docId = currentDocumentId;
    const sectionId = selectedSection;
    if (!docId) return [];
    const byDoc = todoChecked[docId] || {};
    return byDoc[sectionId] || [];
  };

  // 切换某一项的勾选
  const toggleTodoItem = (index) => {
    const docId = currentDocumentId;
    const sectionId = selectedSection;
    if (docId == null) return;
    const items = getCurrentTodoItems();
    const byDoc = todoChecked[docId] || {};
    const list = byDoc[sectionId] || items.map(() => false);
    const newList = [...list];
    while (newList.length < items.length) newList.push(false);
    newList[index] = !newList[index];
    setTodoChecked({
      ...todoChecked,
      [docId]: { ...byDoc, [sectionId]: newList }
    });
  };

  // 更新写作内容
  const updateWriting = (field, value) => {
    setWritings({
      ...writings,
      [field]: value
    });
  };

  // 显示自定义弹窗
  const showModal = (message, type = 'info', onConfirm = null) => {
    setModal({ show: true, message, type, onConfirm });
  };

  // 隐藏弹窗
  const hideModal = () => {
    setModal({ show: false, message: '', type: 'info', onConfirm: null });
  };

  // 处理确认
  const handleConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    hideModal();
  };

  // 保存写作内容
  const saveWriting = () => {
    console.log('保存写作内容:', writings);
    showModal('Writing saved!', 'success');
  };

  // 清空当前写作
  const clearWriting = () => {
    showModal('Clear current writing content?', 'confirm', () => {
      setWritings({
        userPainPoints: '',
        marketAnalysis: '',
        productIntro: '',
        competitiveAnalysis: '',
        feasibilityAnalysis: '',
        fundingPlan: '',
        teamIntro: ''
      });
    });
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
      
      const response = await fetch(config.endpoints.strategy, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          context: {
            ideaText: 'Business plan writing',
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
        throw new Error(data.error || 'Request failed');
      }
    } catch (error) {
      console.error('聊天错误:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Service temporarily unavailable. Please try again later.',
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
      const sectionName = writingFramework.find(f => f.id === message.sectionId)?.title || 'Unknown section';
      
      console.log('保存聊天记录到数据库:', {
        user_id: userInfo.username,
        task_type: 'taskA',
        section_id: message.sectionId,
        section_name: sectionName,
        message_type: message.type,
        content: message.content.substring(0, 50) + '...',
        timestamp: message.timestamp
      });
      
      const response = await fetch(config.endpoints.saveChat, {
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
  
  // 创建新文档
  const createNewDocument = () => {
    const newDoc = {
      id: Date.now(),
      name: `Business Plan ${documents.length + 1}`,
      writings: {
        userPainPoints: '',
        marketAnalysis: '',
        productIntro: '',
        competitiveAnalysis: '',
        feasibilityAnalysis: '',
        fundingPlan: '',
        teamIntro: ''
      },
      chatMessages: []
    };
    setDocuments([...documents, newDoc]);
    setCurrentDocumentId(newDoc.id);
  };
  
  // 切换文档
  const switchDocument = (docId) => {
    setCurrentDocumentId(docId);
  };
  
  // 删除文档
  const deleteDocument = (docId, e) => {
    e.stopPropagation();
    if (documents.length <= 1) {
      showModal('At least one document is required', 'info');
      return;
    }
    showModal('Delete this document?', 'confirm', () => {
      const newDocs = documents.filter(doc => doc.id !== docId);
      setDocuments(newDocs);
      if (docId === currentDocumentId) {
        setCurrentDocumentId(newDocs[0].id);
      }
    });
  };
  
  // 开始编辑文档名称
  const startEditingDocumentName = (docId, e) => {
    e.stopPropagation();
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setEditingDocumentId(docId);
      setEditingDocumentName(doc.name);
    }
  };
  
  // 保存文档名称
  const saveDocumentName = (docId) => {
    if (editingDocumentName.trim()) {
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === docId ? { ...doc, name: editingDocumentName.trim() } : doc
        )
      );
    }
    setEditingDocumentId(null);
    setEditingDocumentName('');
  };
  
  // 取消编辑文档名称
  const cancelEditingDocumentName = () => {
    setEditingDocumentId(null);
    setEditingDocumentName('');
  };

  return (
    <div className={`task-a-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* 头部 */}
      <div className="task-a-header">
        <h1>Task A – Basic Business Plan Writing</h1>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">User {userInfo.username}</span>
            <span className="user-task">Task A</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Log out
          </button>
          <div className="status-indicator">
            <span className="status-dot"></span>
            Service running
          </div>
        </div>
      </div>
      
      <div className="task-a-content">
        {/* 左侧：写作工作区 */}
        <div className="writing-panel">
          <div className="writing-header">
            <h3>✍️ Writing workspace</h3>
            <div className="writing-tools">
              <button className="tool-btn" onClick={saveWriting}>Save</button>
              <button className="tool-btn" onClick={clearWriting}>Clear</button>
              <button className="tool-btn fullscreen-btn" onClick={toggleFullscreen}>
                {isFullscreen ? "⤓" : "⤢"}
              </button>
            </div>
          </div>
          
          {/* 文档标签栏 */}
          <div className="document-tabs">
            {documents.map(doc => (
              <div
                key={doc.id}
                className={`document-tab ${currentDocumentId === doc.id ? 'active' : ''}`}
                onClick={() => switchDocument(doc.id)}
              >
                {editingDocumentId === doc.id ? (
                  <input
                    type="text"
                    value={editingDocumentName}
                    onChange={(e) => setEditingDocumentName(e.target.value)}
                    onBlur={() => saveDocumentName(doc.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveDocumentName(doc.id);
                      } else if (e.key === 'Escape') {
                        cancelEditingDocumentName();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="document-name-input"
                    autoFocus
                  />
                ) : (
                  <>
                    <span 
                      className="document-name"
                      onDoubleClick={(e) => startEditingDocumentName(doc.id, e)}
                    >
                      {doc.name}
                    </span>
                    {documents.length > 1 && (
                      <button
                        className="document-close-btn"
                        onClick={(e) => deleteDocument(doc.id, e)}
                        title="Delete document"
                      >
                        ×
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
            <button
              className="document-tab new-document-btn"
              onClick={createNewDocument}
              title="New document"
            >
              +
            </button>
          </div>
          
          <div className="writing-content">
            {/* 左侧：写作框架 */}
            <div className="writing-framework">
              <h4>Writing framework</h4>
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
                {/* 导航栏和文本框之间的 to-do 列表 */}
                <div className="editor-todo-list">
                  {getCurrentTodoItems().map((item, index) => {
                    const checkedList = getTodoCheckedList();
                    const checked = checkedList[index] === true;
                    return (
                      <label key={index} className={`editor-todo-item ${checked ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTodoItem(index)}
                        />
                        <span className="editor-todo-text">{item}</span>
                      </label>
                    );
                  })}
                </div>
                <textarea
                  value={writings[getFieldName(selectedSection)] || ''}
                  onChange={(e) => updateWriting(getFieldName(selectedSection), e.target.value)}
                  className="editor-textarea"
                  placeholder=""
                />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：聊天区域 */}
        <div className="chat-panel">
          <div className="chat-header">
            <h3>🤖 GPT Writing Assistant</h3>
            <div className="chat-tools">
              <span className="current-section-indicator">
                {writingFramework.find(f => f.id === selectedSection)?.title}
              </span>
            </div>
          </div>
          
          <div className="chat-messages">
            {getCurrentChatMessages().length === 0 ? (
              <div className="empty-chat">
                <p>💡 About 「{writingFramework.find(f => f.id === selectedSection)?.title}」</p>
                <p>You can ask me these questions to improve your writing:</p>
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
                        {message.type === 'user' ? 'You' : 'GPT'}
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
              placeholder="Enter your question or idea..."
              className="chat-input"
              rows="3"
            />
            <div className="chat-buttons">
              <button 
                onClick={() => sendChatMessage()} 
                className="send-btn"
                disabled={isLoading || !chatInput.trim()}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 自定义弹窗 */}
      {modal.show && (
        <div className="modal-overlay" onClick={modal.type === 'info' ? hideModal : undefined}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{modal.type === 'confirm' ? 'Confirm' : modal.type === 'success' ? 'Success' : 'Notice'}</h4>
            </div>
            <div className="modal-content">
              <p>{modal.message}</p>
            </div>
            <div className="modal-actions">
              {modal.type === 'confirm' ? (
                <>
                  <button className="modal-btn cancel" onClick={hideModal}>Cancel</button>
                  <button className="modal-btn confirm" onClick={handleConfirm}>OK</button>
                </>
              ) : (
                <button className="modal-btn confirm" onClick={hideModal}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskA;
