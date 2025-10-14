import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  // 状态管理
  const [ideas, setIdeas] = useState([]);
  const [currentIdea, setCurrentIdea] = useState('');
  const [selectedIdeaId, setSelectedIdeaId] = useState(null);
  const [ideaWritings, setIdeaWritings] = useState({}); // 每个idea的写作内容
  const [ideaChats, setIdeaChats] = useState({}); // 每个idea每个框架的聊天记录 {ideaId: {frameworkId: [messages]}}
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState(1); // 当前选中的框架项
  const [editingIdeaId, setEditingIdeaId] = useState(null); // 正在编辑的idea
  const [editingText, setEditingText] = useState(''); // 编辑中的文本
  
  // 拖动和缩放
  const [draggingIdeaId, setDraggingIdeaId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  
  // 推荐问题
  const [recommendedQuestions, setRecommendedQuestions] = useState({});
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  // 引用
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);

  // 写作框架模板
  const writingFramework = [
    { 
      id: 1, 
      title: '用户痛点', 
      placeholder: '描述目标用户面临的核心痛点...',
      examples: [
        '目标用户群体是谁？他们有什么共同特征？',
        '用户当前是如何解决这个问题的？',
        '这个痛点会给用户带来什么损失或困扰？',
        '用户对解决这个问题的需求有多迫切？'
      ]
    },
    { 
      id: 2, 
      title: '市场分析', 
      placeholder: '分析市场规模、趋势和机会...',
      examples: [
        '目标市场的规模有多大？增长趋势如何？',
        '市场中存在哪些细分领域和机会？',
        '当前市场的主要驱动因素是什么？',
        '有哪些政策或技术趋势会影响市场？'
      ]
    },
    { 
      id: 3, 
      title: '产品介绍', 
      placeholder: '介绍产品功能、特点和价值...',
      examples: [
        '产品的核心功能是什么？如何解决用户痛点？',
        '产品有哪些独特的功能或特点？',
        '产品能为用户创造什么具体价值？',
        '产品的使用场景和流程是怎样的？'
      ]
    },
    { 
      id: 4, 
      title: '竞争分析', 
      placeholder: '分析竞争对手和差异化优势...',
      examples: [
        '主要竞争对手有哪些？他们的优劣势是什么？',
        '我们的产品与竞品相比有什么差异化优势？',
        '市场上还有哪些替代方案？',
        '如何建立竞争壁垒？'
      ]
    },
    { 
      id: 5, 
      title: '可行性分析', 
      placeholder: '评估技术、运营和财务可行性...',
      examples: [
        '技术实现的难点和风险在哪里？',
        '运营模式是否可持续？需要什么资源？',
        '预期的成本结构和收入来源是什么？',
        '可能面临哪些法律或监管风险？'
      ]
    },
    { 
      id: 6, 
      title: '融资计划', 
      placeholder: '说明融资需求、用途和回报...',
      examples: [
        '计划融资多少？分几轮？',
        '资金主要用在哪些方面？',
        '预期的估值和投资回报如何？',
        '有哪些退出机制？'
      ]
    },
    { 
      id: 7, 
      title: '团队介绍', 
      placeholder: '介绍核心团队成员和优势...',
      examples: [
        '核心团队成员有哪些？各自的背景和专长是什么？',
        '团队在这个领域有什么独特优势？',
        '团队还缺少什么关键角色？',
        '如何吸引和留住优秀人才？'
      ]
    }
  ];

  // 获取当前聊天消息
  const getCurrentChatMessages = () => {
    if (!selectedIdeaId || !selectedFrameworkId) return [];
    return ideaChats[selectedIdeaId]?.[selectedFrameworkId] || [];
  };

  // 滚动到聊天底部
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ideaChats, selectedIdeaId, selectedFrameworkId]);

  // 添加想法到画布
  const addIdea = () => {
    if (currentIdea.trim()) {
      const newIdea = {
        id: Date.now(),
        text: currentIdea,
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      };
      setIdeas([...ideas, newIdea]);
      // 初始化该idea的写作内容
      setIdeaWritings({
        ...ideaWritings,
        [newIdea.id]: {
          userPainPoints: '',
          marketAnalysis: '',
          productIntro: '',
          competitiveAnalysis: '',
          feasibilityAnalysis: '',
          fundingPlan: '',
          teamIntro: ''
        }
      });
      // 初始化该idea的聊天记录
      setIdeaChats({
        ...ideaChats,
        [newIdea.id]: {
          1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
        }
      });
      setCurrentIdea('');
      // 自动选中新添加的idea
      setSelectedIdeaId(newIdea.id);
    }
  };

  // 选择想法
  const selectIdea = (id) => {
    setSelectedIdeaId(id);
  };

  // 删除想法
  const removeIdea = (id, e) => {
    e.stopPropagation();
    setIdeas(ideas.filter(idea => idea.id !== id));
    // 删除该idea的写作内容
    const newWritings = { ...ideaWritings };
    delete newWritings[id];
    setIdeaWritings(newWritings);
    // 删除该idea的聊天记录
    const newChats = { ...ideaChats };
    delete newChats[id];
    setIdeaChats(newChats);
    // 如果删除的是当前选中的idea，清空选择
    if (selectedIdeaId === id) {
      setSelectedIdeaId(null);
    }
  };

  // 复制想法（分支）- 纵向新增，清空所有内容
  const duplicateIdea = (id, e) => {
    e.stopPropagation();
    const originalIdea = ideas.find(idea => idea.id === id);
    if (!originalIdea) return;
    
    const newIdea = {
      id: Date.now(),
      text: '',
      x: originalIdea.x,
      y: originalIdea.y + 200, // 在下方，进一步增加间距
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      parentId: id,
      connectionType: 'branch' // 分支类型
    };
    
    setIdeas([...ideas, newIdea]);
    
    // 清空写作内容（新分支从头开始）
    setIdeaWritings({
      ...ideaWritings,
      [newIdea.id]: {
        userPainPoints: '',
        marketAnalysis: '',
        productIntro: '',
        competitiveAnalysis: '',
        feasibilityAnalysis: '',
        fundingPlan: '',
        teamIntro: ''
      }
    });
    
    // 清空聊天记录（新分支从头开始）
    setIdeaChats({
      ...ideaChats,
      [newIdea.id]: {
        1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
      }
    });
    
    // 进入编辑模式
    setEditingIdeaId(newIdea.id);
    setEditingText('');
    setSelectedIdeaId(newIdea.id);
  };

  // 细化想法（创建子想法）- 横向细化，继承所有内容和历史
  const refineIdea = (id, e) => {
    e.stopPropagation();
    const originalIdea = ideas.find(idea => idea.id === id);
    if (!originalIdea) return;
    
    const newIdea = {
      id: Date.now(),
      text: '',
      x: originalIdea.x + 280, // 在右边，增加间距
      y: originalIdea.y,
      color: originalIdea.color, // 继承父idea的颜色
      parentId: id,
      connectionType: 'refine' // 细化类型
    };
    
    setIdeas([...ideas, newIdea]);
    
    // 继承写作内容（保持原有内容）
    setIdeaWritings({
      ...ideaWritings,
      [newIdea.id]: {
        ...ideaWritings[id]
      }
    });
    
    // 继承聊天记录（保持聊天历史）- 深度复制避免引用问题
    const parentChats = ideaChats[id] || { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    setIdeaChats({
      ...ideaChats,
      [newIdea.id]: {
        1: (parentChats[1] || []).map(msg => ({ ...msg })),
        2: (parentChats[2] || []).map(msg => ({ ...msg })),
        3: (parentChats[3] || []).map(msg => ({ ...msg })),
        4: (parentChats[4] || []).map(msg => ({ ...msg })),
        5: (parentChats[5] || []).map(msg => ({ ...msg })),
        6: (parentChats[6] || []).map(msg => ({ ...msg })),
        7: (parentChats[7] || []).map(msg => ({ ...msg }))
      }
    });
    
    // 进入编辑模式
    setEditingIdeaId(newIdea.id);
    setEditingText('');
    setSelectedIdeaId(newIdea.id);
  };

  // 保存编辑的idea名称
  const saveIdeaEdit = (id) => {
    if (editingText.trim()) {
      setIdeas(ideas.map(idea => 
        idea.id === id ? { ...idea, text: editingText.trim() } : idea
      ));
    } else {
      // 如果没有输入内容，删除这个idea
      removeIdeaWithoutEvent(id);
    }
    setEditingIdeaId(null);
    setEditingText('');
  };

  // 取消编辑
  const cancelIdeaEdit = (id) => {
    if (!ideas.find(i => i.id === id)?.text) {
      // 如果是新创建的空idea，删除它
      removeIdeaWithoutEvent(id);
    }
    setEditingIdeaId(null);
    setEditingText('');
  };

  // 删除idea（不需要event）
  const removeIdeaWithoutEvent = (id) => {
    setIdeas(ideas.filter(idea => idea.id !== id));
    const newWritings = { ...ideaWritings };
    delete newWritings[id];
    setIdeaWritings(newWritings);
    const newChats = { ...ideaChats };
    delete newChats[id];
    setIdeaChats(newChats);
    if (selectedIdeaId === id) {
      setSelectedIdeaId(null);
    }
  };

  // 开始拖动idea
  const handleIdeaMouseDown = (id, e) => {
    if (editingIdeaId || e.target.closest('.remove-idea') || e.target.closest('.idea-action-btn')) return;
    e.stopPropagation();
    const idea = ideas.find(i => i.id === id);
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingIdeaId(id);
    // 计算鼠标相对于idea框左上角的偏移量（考虑canvas的缩放）
    setDragOffset({
      x: (e.clientX - rect.left) / canvasScale - idea.x,
      y: (e.clientY - rect.top) / canvasScale - idea.y
    });
  };

  // 拖动idea
  const handleMouseMove = (e) => {
    if (draggingIdeaId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // 计算鼠标在canvas中的位置，减去初始偏移量，得到idea的新位置
      const newX = Math.max(0, Math.min(rect.width / canvasScale - 220, (e.clientX - rect.left) / canvasScale - dragOffset.x));
      const newY = Math.max(0, Math.min(rect.height / canvasScale - 100, (e.clientY - rect.top) / canvasScale - dragOffset.y));
      
      setIdeas(ideas.map(idea =>
        idea.id === draggingIdeaId ? { ...idea, x: newX, y: newY } : idea
      ));
    }
  };

  // 停止拖动
  const handleMouseUp = () => {
    setDraggingIdeaId(null);
  };

  // 缩放canvas
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvasScale(Math.max(0.5, Math.min(2, canvasScale * delta)));
    }
  };

  // 监听鼠标事件
  useEffect(() => {
    if (draggingIdeaId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingIdeaId, ideas, dragOffset, canvasScale]);

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

  // 更新当前idea的写作内容
  const updateIdeaWriting = (field, value) => {
    if (!selectedIdeaId) return;
    setIdeaWritings({
      ...ideaWritings,
      [selectedIdeaId]: {
        ...ideaWritings[selectedIdeaId],
        [field]: value
      }
    });
  };

  // 保存写作内容
  const saveWriting = () => {
    if (!selectedIdeaId) {
      alert('请先选择一个想法');
      return;
    }
    const selectedIdea = ideas.find(idea => idea.id === selectedIdeaId);
    const writing = ideaWritings[selectedIdeaId];
    console.log('保存写作内容:', {
      idea: selectedIdea?.text,
      writing: writing
    });
    alert(`已保存 "${selectedIdea?.text}" 的写作内容！`);
  };

  // 清空当前写作
  const clearWriting = () => {
    if (!selectedIdeaId) {
      alert('请先选择一个想法');
      return;
    }
    if (window.confirm('确定要清空当前写作内容吗？')) {
      setIdeaWritings({
        ...ideaWritings,
        [selectedIdeaId]: {
          userPainPoints: '',
          marketAnalysis: '',
          productIntro: '',
          competitiveAnalysis: '',
          feasibilityAnalysis: '',
          fundingPlan: '',
          teamIntro: ''
        }
      });
    }
  };

  // 发送聊天消息
  const sendChatMessage = async (messageText = null) => {
    const text = messageText || chatInput.trim();
    if (!text || isLoading || !selectedIdeaId) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    // 更新当前框架的聊天记录
    const currentMessages = getCurrentChatMessages();
    const newMessages = [...currentMessages, userMessage];
    
    setIdeaChats({
      ...ideaChats,
      [selectedIdeaId]: {
        ...ideaChats[selectedIdeaId],
        [selectedFrameworkId]: newMessages
      }
    });
    
    setChatInput('');
    setIsLoading(true);

    try {
      const selectedIdea = ideas.find(i => i.id === selectedIdeaId);
      const currentFramework = writingFramework.find(f => f.id === selectedFrameworkId);
      
      const response = await fetch('http://localhost:5000/api/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          context: {
            ideaText: selectedIdea?.text,
            currentSection: currentFramework?.title,
            allWritings: ideaWritings[selectedIdeaId], // 全局写作内容
            currentSectionContent: ideaWritings[selectedIdeaId]?.[getFieldName(selectedFrameworkId)],
            chatHistory: currentMessages.slice(-6) // 保留最近3轮对话
          }
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.data.choices[0].message.content,
          timestamp: new Date()
        };
        
        const updatedMessages = [...newMessages, aiMessage];
        setIdeaChats({
          ...ideaChats,
          [selectedIdeaId]: {
            ...ideaChats[selectedIdeaId],
            [selectedFrameworkId]: updatedMessages
          }
        });
      } else {
        throw new Error(data.error || '请求失败');
      }
    } catch (error) {
      console.error('聊天错误:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '抱歉，服务暂时不可用，请稍后重试。',
        timestamp: new Date()
      };
      
      setIdeaChats({
        ...ideaChats,
        [selectedIdeaId]: {
          ...ideaChats[selectedIdeaId],
          [selectedFrameworkId]: [...newMessages, errorMessage]
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 清空当前板块的聊天记录
  const clearCurrentChat = () => {
    if (!selectedIdeaId || !selectedFrameworkId) return;
    if (window.confirm('确定要清空当前板块的聊天记录吗？')) {
      setIdeaChats({
        ...ideaChats,
        [selectedIdeaId]: {
          ...ideaChats[selectedIdeaId],
          [selectedFrameworkId]: []
        }
      });
      // 清空对应的推荐问题
      const key = `${selectedIdeaId}-${selectedFrameworkId}`;
      const newQuestions = { ...recommendedQuestions };
      delete newQuestions[key];
      setRecommendedQuestions(newQuestions);
    }
  };

  // 生成推荐问题
  const generateRecommendedQuestions = async (ideaId, frameworkId, messages) => {
    if (!ideaId || !frameworkId || messages.length === 0) {
      console.log('跳过生成推荐问题:', { ideaId, frameworkId, messagesLength: messages.length });
      return;
    }
    
    const key = `${ideaId}-${frameworkId}`;
    console.log('开始生成推荐问题:', key);
    setIsGeneratingQuestions(true);

    try {
      const selectedIdea = ideas.find(i => i.id === ideaId);
      const currentFramework = writingFramework.find(f => f.id === frameworkId);
      
      console.log('发送反思请求...');
      const response = await fetch('http://localhost:5000/api/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            ideaText: selectedIdea?.text,
            currentSection: currentFramework?.title,
            currentSectionContent: ideaWritings[ideaId]?.[getFieldName(frameworkId)],
            chatHistory: messages.slice(-6) // 最近3轮对话
          }
        }),
      });

      const data = await response.json();
      console.log('收到反思响应:', data);
      
      if (data.status === 'success') {
        const content = data.data.choices[0].message.content;
        console.log('LLM返回内容:', content);
        
        // 解析返回的问题（假设返回格式为每行一个问题）
        const questions = content.split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^[0-9.\-*]+\s*/, '').trim())
          .filter(q => q.length > 0)
          .slice(0, 3); // 最多3个问题
        
        console.log('解析出的问题:', questions);
        
        // 使用函数式更新确保获取最新状态
        setRecommendedQuestions(prev => ({
          ...prev,
          [key]: questions
        }));
        
        console.log('推荐问题已保存:', key, questions);
        
        // 滚动到推荐问题区域
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        console.error('API返回错误:', data);
      }
    } catch (error) {
      console.error('生成推荐问题失败:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // 处理反思功能
  const handleReflect = async () => {
    if (!selectedIdeaId || isLoading) return;

    const text = chatInput.trim();
    const currentMessages = getCurrentChatMessages();

    // 如果没有用户输入，生成推荐问题
    if (!text) {
      await generateRecommendedQuestions(selectedIdeaId, selectedFrameworkId, currentMessages);
      return;
    }

    // 如果有用户输入，先添加用户消息
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      isReflection: true // 标记为反思消息
    };

    const newMessages = [...currentMessages, userMessage];
    setIdeaChats({
      ...ideaChats,
      [selectedIdeaId]: {
        ...ideaChats[selectedIdeaId],
        [selectedFrameworkId]: newMessages
      }
    });
    
    setChatInput('');
    currentMessages.push(userMessage);
    
    // 滚动到用户消息
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    setIsLoading(true);

    try {
      const selectedIdea = ideas.find(i => i.id === selectedIdeaId);
      const currentFramework = writingFramework.find(f => f.id === selectedFrameworkId);
      
      const response = await fetch('http://localhost:5000/api/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            ideaText: selectedIdea?.text,
            currentSection: currentFramework?.title,
            currentSectionContent: ideaWritings[selectedIdeaId]?.[getFieldName(selectedFrameworkId)],
            chatHistory: currentMessages.slice(-6),
            userQuestion: text // 有用户输入，传递给后端
          }
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        const content = data.data.choices[0].message.content;
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: content,
          timestamp: new Date(),
          isReflection: true // 标记为反思消息
        };

        const updatedMessages = [...(ideaChats[selectedIdeaId]?.[selectedFrameworkId] || []), aiMessage];
        
        setIdeaChats({
          ...ideaChats,
          [selectedIdeaId]: {
            ...ideaChats[selectedIdeaId],
            [selectedFrameworkId]: updatedMessages
          }
        });
        
        // 延迟滚动，确保DOM已更新
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        throw new Error(data.error || '反思功能调用失败');
      }
    } catch (error) {
      console.error('反思功能出错:', error);
      alert('反思功能出现错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取推荐的follow-up问题
  const getRecommendedQuestions = () => {
    if (!selectedIdeaId || !selectedFrameworkId) {
      console.log('未选中idea或框架');
      return [];
    }
    
    const currentMessages = getCurrentChatMessages();
    const currentFramework = writingFramework.find(f => f.id === selectedFrameworkId);
    
    if (!currentFramework) return [];
    
    const key = `${selectedIdeaId}-${selectedFrameworkId}`;
    console.log('获取推荐问题:', { key, messagesLength: currentMessages.length, hasQuestions: !!recommendedQuestions[key] });
    
    // 如果有对话历史，优先返回LLM生成的推荐问题
    if (currentMessages.length > 0 && recommendedQuestions[key]) {
      console.log('返回LLM生成的问题:', recommendedQuestions[key]);
      return recommendedQuestions[key];
    }
    
    // 如果还没有对话，返回示例问题
    if (currentMessages.length === 0) {
      console.log('返回示例问题');
      return currentFramework.examples.slice(0, 3);
    }
    
    // 如果有对话但还没生成推荐问题，返回空数组（等待生成）
    console.log('等待生成推荐问题...');
    return [];
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.target.id === 'idea-input') {
        addIdea();
      } else if (e.target.id === 'chat-input') {
        sendChatMessage();
      }
    }
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>商业计划书写作-元反思工作台</h1>
        <div className="status-indicator">
          <span className="status-dot"></span>
          服务运行中
        </div>
      </div>
      
      <div className="app-content">
        {/* 左侧区域 */}
        <div className="left-panel">
          {/* 左上：Idea 迭代画布 */}
          <div className="idea-canvas-section">
            <div className="section-header">
              <h3>💡 Idea 迭代画布</h3>
              <div className="header-controls">
                <div className="idea-input-group">
                  <input
                    id="idea-input"
                    type="text"
                    value={currentIdea}
                    onChange={(e) => setCurrentIdea(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入新想法..."
                    className="idea-input"
                  />
                  <button onClick={addIdea} className="add-idea-btn">
                    +
                  </button>
                </div>
                <div className="zoom-controls">
                  <button className="zoom-btn" onClick={() => setCanvasScale(Math.max(0.5, canvasScale - 0.1))}>-</button>
                  <span className="zoom-value">{Math.round(canvasScale * 100)}%</span>
                  <button className="zoom-btn" onClick={() => setCanvasScale(Math.min(2, canvasScale + 0.1))}>+</button>
                  <button className="zoom-btn reset-btn" onClick={() => setCanvasScale(1)}>⟲</button>
                </div>
              </div>
            </div>
            
            <div 
              className="canvas-container" 
              ref={canvasRef}
              onWheel={handleWheel}
              style={{
                transform: `scale(${canvasScale})`,
                transformOrigin: 'top left',
                width: `${100 / canvasScale}%`,
                height: `${100 / canvasScale}%`
              }}
            >
              {/* 绘制连接箭头 */}
              <svg className="connection-svg">
                {ideas.map(idea => {
                  if (idea.parentId) {
                    const parentIdea = ideas.find(i => i.id === idea.parentId);
                    if (parentIdea) {
                      // 计算箭头起点和终点（考虑气泡框的实际宽度和高度）
                      const bubbleWidth = 200; // 气泡平均宽度
                      const bubbleHeight = 100; // 气泡平均高度（包含按钮）
                      
                      const startX = parentIdea.x + (idea.connectionType === 'refine' ? bubbleWidth : bubbleWidth / 2);
                      const startY = parentIdea.y + (idea.connectionType === 'refine' ? bubbleHeight / 2 : bubbleHeight + 5);
                      const endX = idea.x + (idea.connectionType === 'refine' ? 0 : bubbleWidth / 2);
                      const endY = idea.y + (idea.connectionType === 'refine' ? bubbleHeight / 2 : -5);
                      
                      // 创建路径
                      const midX = (startX + endX) / 2;
                      const midY = (startY + endY) / 2;
                      const path = idea.connectionType === 'refine' 
                        ? `M ${startX} ${startY} L ${endX} ${endY}` // 直线（细化）
                        : `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`; // S型曲线（分支）
                      
                      return (
                        <g key={`arrow-${idea.id}`}>
                          <defs>
                            <marker
                              id={`arrowhead-${idea.id}`}
                              markerWidth="10"
                              markerHeight="10"
                              refX="9"
                              refY="3"
                              orient="auto"
                            >
                              <polygon points="0 0, 10 3, 0 6" fill="#667eea" />
                            </marker>
                          </defs>
                          <path
                            d={path}
                            stroke="#667eea"
                            strokeWidth="2"
                            fill="none"
                            markerEnd={`url(#arrowhead-${idea.id})`}
                            className="connection-line"
                          />
                        </g>
                      );
                    }
                  }
                  return null;
                })}
              </svg>
              
              {/* 想法气泡 */}
              {ideas.map(idea => (
                <div
                  key={idea.id}
                  className={`idea-bubble ${selectedIdeaId === idea.id ? 'selected' : ''} ${editingIdeaId === idea.id ? 'editing' : ''} ${draggingIdeaId === idea.id ? 'dragging' : ''}`}
                  style={{
                    left: idea.x,
                    top: idea.y,
                    backgroundColor: idea.color,
                    cursor: draggingIdeaId === idea.id ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => handleIdeaMouseDown(idea.id, e)}
                  onClick={() => !editingIdeaId && !draggingIdeaId && selectIdea(idea.id)}
                >
                  <div className="idea-header">
                    {editingIdeaId === idea.id ? (
                      <input
                        type="text"
                        className="idea-edit-input"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveIdeaEdit(idea.id);
                          } else if (e.key === 'Escape') {
                            cancelIdeaEdit(idea.id);
                          }
                        }}
                        onBlur={() => saveIdeaEdit(idea.id)}
                        placeholder="输入新想法..."
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="idea-text">{idea.text || '空白想法'}</span>
                        <button className="remove-idea" onClick={(e) => removeIdea(idea.id, e)}>×</button>
                      </>
                    )}
                  </div>
                  {editingIdeaId !== idea.id && (
                    <div className="idea-actions">
                      <button 
                        className="idea-action-btn refine-btn" 
                        onClick={(e) => refineIdea(idea.id, e)}
                        title="细化想法"
                      >
                        <span className="action-icon">🔍</span>
                        <span className="action-text">细化</span>
                      </button>
                      <button 
                        className="idea-action-btn duplicate-btn" 
                        onClick={(e) => duplicateIdea(idea.id, e)}
                        title="分支想法"
                      >
                        <span className="action-icon">📋</span>
                        <span className="action-text">分支</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {ideas.length === 0 && (
                <div className="empty-canvas">
                  <p>点击上方输入框添加想法</p>
                  <p>点击想法可以在下方编辑内容</p>
                </div>
              )}
            </div>
          </div>

          {/* 左下：Writing 界面 */}
          <div className="writing-section">
            <div className="section-header">
              <h3>✍️ Writing 工作区</h3>
              <div className="writing-tools">
                <span className="selected-idea-indicator">
                  {selectedIdeaId ? 
                    `正在编辑: ${ideas.find(i => i.id === selectedIdeaId)?.text}` : 
                    '请先选择一个想法'}
                </span>
                <button className="tool-btn" onClick={saveWriting}>保存</button>
                <button className="tool-btn" onClick={clearWriting}>清空</button>
              </div>
            </div>
            
            <div className="writing-content">
              {/* 左侧：写作框架 */}
              <div className="writing-framework">
                <h4>写作框架</h4>
                {writingFramework.map(section => (
                  <div 
                    key={section.id} 
                    className={`framework-section ${selectedFrameworkId === section.id ? 'active' : ''}`}
                    onClick={() => setSelectedFrameworkId(section.id)}
                  >
                    <label>{section.title}</label>
                  </div>
                ))}
              </div>

              {/* 右侧：写作区域 */}
              <div className="writing-editor">
                {selectedIdeaId ? (
                  <div className="editor-field">
                    <div className="editor-field-header">
                      {writingFramework.find(s => s.id === selectedFrameworkId)?.title}
                    </div>
                    <textarea
                      value={ideaWritings[selectedIdeaId]?.[getFieldName(selectedFrameworkId)] || ''}
                      onChange={(e) => updateIdeaWriting(getFieldName(selectedFrameworkId), e.target.value)}
                      placeholder={writingFramework.find(s => s.id === selectedFrameworkId)?.placeholder}
                      className="editor-textarea"
                    />
                  </div>
                ) : (
                  <div className="empty-editor">
                    <p>👆 请先在画布上选择一个想法</p>
                    <p>然后按框架填写内容</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：GPT 聊天窗口 */}
        <div className="chat-section">
          <div className="section-header">
            <h3>🤖 GPT 策略顾问</h3>
            <div className="chat-tools">
              {selectedIdeaId && selectedFrameworkId && (
                <span className="current-section-indicator">
                  {writingFramework.find(f => f.id === selectedFrameworkId)?.title}
                </span>
              )}
              <button className="tool-btn" onClick={clearCurrentChat}>清空</button>
            </div>
          </div>
          
          <div className="chat-messages">
            {!selectedIdeaId ? (
              <div className="empty-chat">
                <p>👋 你好！我是你的策略顾问</p>
                <p>请先在画布上选择一个想法</p>
                <p>然后点击左侧的写作框架板块开始讨论</p>
              </div>
            ) : getCurrentChatMessages().length === 0 ? (
              <div className="empty-chat">
                <p>💡 关于「{writingFramework.find(f => f.id === selectedFrameworkId)?.title}」</p>
                <p>你可以问我以下问题来细化想法：</p>
                <div className="example-questions">
                  {writingFramework.find(f => f.id === selectedFrameworkId)?.examples.map((example, index) => (
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
                  <div key={message.id} className={`message ${message.type} ${message.isReflection ? 'reflection' : ''}`}>
                    <div className="message-header">
                      <span className="message-sender">
                        {message.isReflection ? '💭 反思' : (message.type === 'user' ? '你' : 'GPT')}
                      </span>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">
                      {message.type === 'ai' ? (
                        <div className="markdown-content">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}
                {/* 推荐问题区域 */}
                {getCurrentChatMessages().length > 0 && !isLoading && (() => {
                  const messages = getCurrentChatMessages();
                  const lastMessage = messages[messages.length - 1];
                  // 如果最后一条消息是反思消息（用户有输入的反思对话），不显示推荐问题
                  if (lastMessage?.isReflection) return null;
                  
                  return (
                    <>
                      {isGeneratingQuestions && (
                        <div className="recommended-questions">
                          <div className="recommended-header">
                            <span className="recommend-icon">💡</span>
                            <span className="recommend-text">正在根据反思生成推荐问题...</span>
                          </div>
                        </div>
                      )}
                      {!isGeneratingQuestions && getRecommendedQuestions().length > 0 && (
                        <div className="recommended-questions">
                          <div className="recommended-header">
                            <span className="recommend-icon">💡</span>
                            <span className="recommend-text">Idea反思参考</span>
                          </div>
                          <div className="recommended-list">
                            {getRecommendedQuestions().map((question, index) => (
                              <div 
                                key={index}
                                className="recommended-item"
                                onClick={() => sendChatMessage(question)}
                              >
                                <span className="recommend-bullet">→</span>
                                <span className="recommend-question">{question}</span>
                              </div>
                            ))}
                          </div>
                          <div className="recommended-footer">
                            💡 是否有idea的细化或修改，在canvas上请修改！~
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
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
                onClick={handleReflect} 
                className="reflect-btn"
                disabled={isLoading}
                title={chatInput.trim() ? '对当前输入进行反思分析' : '基于对话历史进行反思'}
              >
                💭 反思
              </button>
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
}

export default App;
