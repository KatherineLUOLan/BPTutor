import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import Login from './Login';
import TaskA from './TaskA';
import AdminPanel from './AdminPanel';

function App() {
  // 登录状态管理
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  
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
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // 画布拖拽移动
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasDragStart, setCanvasDragStart] = useState({ x: 0, y: 0 });
  
  // 双指缩放
  const [isPinching, setIsPinching] = useState(false);
  const [pinchStartDistance, setPinchStartDistance] = useState(0);
  const [pinchStartZoom, setPinchStartZoom] = useState(1);
  const [pinchCenter, setPinchCenter] = useState({ x: 0, y: 0 });
  
  
  // 写作内容分析和新idea建议
  const [previousWritings, setPreviousWritings] = useState({}); // 存储每个idea的写作内容历史
  const [generatedIdeas, setGeneratedIdeas] = useState({}); // 存储LLM生成的新idea建议
  const [isAnalyzingWriting, setIsAnalyzingWriting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // 全屏状态
  const [editingAnalysisId, setEditingAnalysisId] = useState(null); // 正在编辑分析的idea ID
  const [editingAnalysisText, setEditingAnalysisText] = useState(''); // 编辑中的分析文本
  const [isChatOpen, setIsChatOpen] = useState(false); // 移动端聊天浮层状态
  
  // 引用
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);
  const ideaRefs = useRef({}); // 存储每个idea的DOM引用

  // 登录处理函数
  const handleLogin = (loginData) => {
    setUserInfo(loginData);
    setIsLoggedIn(true);
  };

  // 登出处理函数
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    // 清空所有数据
    setIdeas([]);
    setCurrentIdea('');
    setSelectedIdeaId(null);
    setIdeaWritings({});
    setIdeaChats({});
    setChatInput('');
    setSelectedFrameworkId(1);
    setEditingIdeaId(null);
    setEditingText('');
  };

  // 写作框架模板
  const writingFramework = [
    { 
      id: 1, 
      title: '用户痛点', 
      placeholder: `🎯 用户痛点分析核心要素：

• 明确目标用户群体（年龄、职业、收入、行为特征）
• 识别具体痛点（效率低、成本高、体验差、安全风险等）
• 量化痛点影响（时间损失、金钱损失、情感困扰）
• 分析用户当前解决方案的不足`,
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
      placeholder: `📊 市场分析核心要素：

• 市场规模分析（TAM/SAM/SOM模型）
• 市场增长趋势（年复合增长率、驱动因素）
• 市场细分（按地域、用户群体、应用场景）
• 市场机会识别（空白市场、新兴需求）`,
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
      placeholder: `🚀 产品介绍核心要素：

• 产品核心功能（解决什么问题）
• 产品独特价值（与竞品的差异化）
• 产品使用场景（何时何地使用）
• 产品技术特点（创新点、技术优势）`,
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
      placeholder: `⚔️ 竞争分析核心要素：

• 直接竞争对手分析（产品、价格、渠道、营销）
• 间接竞争对手识别（替代方案）
• 竞争优势分析（技术、资源、团队、模式）
• 竞争壁垒构建（专利、数据、网络效应）`,
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
      placeholder: `✅ 可行性分析核心要素：

• 技术可行性（技术难度、开发周期、技术风险）
• 运营可行性（团队能力、资源需求、执行难度）
• 财务可行性（成本结构、收入模式、盈利预测）
• 法律合规性（政策风险、知识产权、监管要求）`,
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
      placeholder: `💰 融资计划核心要素：

• 融资需求（金额、轮次、时间节点）
• 资金用途（研发、市场、运营、团队）
• 估值依据（市场比较法、现金流折现法）
• 投资回报（退出方式、预期回报率）`,
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
      placeholder: `👥 团队介绍核心要素：

• 核心团队背景（教育、工作经验、专业技能）
• 团队互补性（技术、市场、运营、财务）
• 团队执行力（过往成就、项目经验）
• 团队发展规划（人才招聘、激励机制）`,
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

  // 保存ideas数据到MongoDB（使用useCallback避免重复创建）
  const saveIdeasToDatabase = useCallback(async () => {
    if (!userInfo || !userInfo.username) return;
    
    try {
      const canvasState = {
        zoomLevel,
        canvasOffset
      };
      
      await fetch('http://localhost:5050/api/save-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userInfo.username,
          ideas,
          ideaWritings,
          ideaChats,
          generatedIdeas,
          previousWritings,
          canvasState
        }),
      });
      
      console.log('✅ Ideas数据已保存到MongoDB');
    } catch (error) {
      console.error('保存ideas数据错误:', error);
    }
  }, [userInfo, ideas, ideaWritings, ideaChats, generatedIdeas, previousWritings, zoomLevel, canvasOffset]);

  // 从MongoDB加载ideas数据
  const loadIdeasFromDatabase = useCallback(async () => {
    if (!userInfo || !userInfo.username) return;
    
    try {
      const response = await fetch(`http://localhost:5050/api/load-ideas?user_id=${userInfo.username}`);
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        setIdeas(result.data.ideas || []);
        setIdeaWritings(result.data.ideaWritings || {});
        setIdeaChats(result.data.ideaChats || {});
        setGeneratedIdeas(result.data.generatedIdeas || {});
        setPreviousWritings(result.data.previousWritings || {});
        
        if (result.data.canvasState) {
          setZoomLevel(result.data.canvasState.zoomLevel || 1);
          setCanvasOffset(result.data.canvasState.canvasOffset || { x: 0, y: 0 });
        }
        
        console.log('✅ Ideas数据已从MongoDB加载');
      }
    } catch (error) {
      console.error('加载ideas数据错误:', error);
    }
  }, [userInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [ideaChats, selectedIdeaId, selectedFrameworkId]);

  // 登录后加载数据
  useEffect(() => {
    if (userInfo && userInfo.username && isLoggedIn) {
      loadIdeasFromDatabase();
    }
  }, [userInfo, isLoggedIn, loadIdeasFromDatabase]);

  // 自动保存ideas数据到MongoDB（防抖）
  useEffect(() => {
    if (!userInfo || !userInfo.username || !isLoggedIn) return;
    
    const saveTimer = setTimeout(() => {
      saveIdeasToDatabase();
    }, 1000); // 1秒后保存，避免频繁保存
    
    return () => clearTimeout(saveTimer);
  }, [ideas, ideaWritings, ideaChats, generatedIdeas, previousWritings, zoomLevel, canvasOffset, userInfo, isLoggedIn, saveIdeasToDatabase]);



  // 添加想法到画布
  const addIdea = () => {
    if (currentIdea.trim()) {
      const newIdea = {
        id: Date.now(),
        text: currentIdea,
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
        color: `hsl(${Math.random() * 60 + 180}, 30%, 85%)`
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

  // 切换全屏模式
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 开始编辑分析内容
  const startEditingAnalysis = (ideaId, e) => {
    e.stopPropagation();
    const analysis = generatedIdeas[ideaId];
    if (analysis) {
      setEditingAnalysisId(ideaId);
      setEditingAnalysisText(analysis.analysis);
    }
  };


  // 保存编辑的分析内容
  const saveAnalysisEdit = (ideaId) => {
    if (editingAnalysisText.trim()) {
      setGeneratedIdeas({
        ...generatedIdeas,
        [ideaId]: {
          ...generatedIdeas[ideaId],
          analysis: editingAnalysisText.trim()
        }
      });
    }
    setEditingAnalysisId(null);
    setEditingAnalysisText('');
  };

  // 取消编辑分析
  const cancelAnalysisEdit = (ideaId) => {
    setEditingAnalysisId(null);
    setEditingAnalysisText('');
  };

  // 分析新idea的影响因素
  // 获取父节点链的所有信息
  const getParentChainInfo = (ideaId) => {
    const chain = [];
    let currentId = ideaId;
    
    while (currentId) {
      const currentIdea = ideas.find(i => i.id === currentId);
      if (!currentIdea) break;
      
      chain.push({
        id: currentIdea.id,
        text: currentIdea.text,
        writings: ideaWritings[currentId] || {},
        connectionType: currentIdea.connectionType
      });
      
      currentId = currentIdea.parentId;
    }
    
    return chain.reverse(); // 反转，从根节点到直接父节点
  };

  const analyzeNewIdea = async (idea) => {
    setIsAnalyzingWriting(true);
    
    // 获取整个父节点链的信息
    const parentChain = idea.parentId ? getParentChainInfo(idea.parentId) : [];
    const directParent = parentChain[parentChain.length - 1] || null;
    
    // 构建父节点链的文本描述
    const parentChainText = parentChain.map(node => node.text).filter(Boolean).join(' → ');
    
    // 合并所有父节点的写作内容
    const allParentWritings = {};
    parentChain.forEach(node => {
      Object.keys(node.writings || {}).forEach(key => {
        if (node.writings[key] && node.writings[key].trim()) {
          allParentWritings[key] = (allParentWritings[key] || '') + node.writings[key] + '\n';
        }
      });
    });
    
    const previousIdeaText = directParent?.text || '';
    const previousWritings = allParentWritings;
    const currentWritings = ideaWritings[idea.id] || {};
    
    try {
      const response = await fetch('http://localhost:5050/api/analyze-writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            ideaText: idea.text,
            previousIdeaText: previousIdeaText,
            parentChainText: parentChainText, // 整个父节点链的文本
            parentChain: parentChain.map(node => ({
              text: node.text,
              connectionType: node.connectionType
            })), // 父节点链的详细信息
            previousWritings: previousWritings,
            currentWritings: currentWritings,
            currentSection: idea.connectionType === 'refine' ? '细化想法' : idea.connectionType === 'branch' ? '分支想法' : '新想法分析',
            connectionType: idea.connectionType || null
          }
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        const content = data.data.choices[0].message.content;
        
        // 存储LLM影响因素分析结果
        setGeneratedIdeas({
          ...generatedIdeas,
          [idea.id]: {
            analysis: content,
            timestamp: new Date()
          }
        });
        
        // 同时在聊天框中输出分析结果
        const analysisMessage = {
          id: Date.now(),
          type: 'ai',
          content: `📊 影响因素分析完成\n\n${content}`,
          timestamp: new Date(),
          isAnalysis: true // 标记为分析消息
        };
        
        // 如果当前选中的是同一个idea，则添加到聊天记录
        if (selectedIdeaId === idea.id) {
          const currentMessages = getCurrentChatMessages();
          const newMessages = [...currentMessages, analysisMessage];
          
          setIdeaChats({
            ...ideaChats,
            [idea.id]: {
              ...ideaChats[idea.id],
              [selectedFrameworkId]: newMessages
            }
          });
        }
      }
    } catch (error) {
      console.error('新idea分析失败:', error);
    } finally {
      setIsAnalyzingWriting(false);
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
      color: `hsl(${Math.random() * 60 + 180}, 30%, 85%)`,
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
      color: `hsl(${Math.random() * 60 + 180}, 30%, 85%)`,
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
      const updatedIdea = { ...ideas.find(idea => idea.id === id), text: editingText.trim() };
      setIdeas(ideas.map(idea => 
        idea.id === id ? updatedIdea : idea
      ));
      
      // 检查是否是新建的idea（通过细化或分支创建的），如果是则分析
      if (updatedIdea && (updatedIdea.parentId || updatedIdea.connectionType === 'refine' || updatedIdea.connectionType === 'branch')) {
        // 延迟分析，确保状态已更新
        setTimeout(() => {
          analyzeNewIdea(updatedIdea);
        }, 100);
      }
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
    // 删除对应的分析结果
    const newGeneratedIdeas = { ...generatedIdeas };
    delete newGeneratedIdeas[id];
    setGeneratedIdeas(newGeneratedIdeas);
    if (selectedIdeaId === id) {
      setSelectedIdeaId(null);
    }
  };

  // 开始拖动idea（触摸）
  const handleIdeaTouchStart = (id, e) => {
    if (editingIdeaId || e.target.closest('.remove-idea') || e.target.closest('.idea-action-btn')) return;
    // 只处理单点触摸
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const idea = ideas.find(i => i.id === id);
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setDraggingIdeaId(id);
    // 计算触摸点相对于idea框左上角的偏移量
    setDragOffset({
      x: touch.clientX - rect.left - idea.x,
      y: touch.clientY - rect.top - idea.y
    });
  };

  // 拖动idea（触摸移动）
  const handleTouchMove = (e) => {
    if (draggingIdeaId && canvasRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      // 计算触摸点在canvas中的位置，减去初始偏移量，得到idea的新位置
      // 移除边界限制，允许无限拖动
      const newX = touch.clientX - rect.left - dragOffset.x;
      const newY = touch.clientY - rect.top - dragOffset.y;
      
      setIdeas(ideas.map(idea =>
        idea.id === draggingIdeaId ? { ...idea, x: newX, y: newY } : idea
      ));
      e.preventDefault();
    }
  };

  // 停止拖动（触摸结束）
  const handleTouchEnd = () => {
    setDraggingIdeaId(null);
  };

  // 缩放功能
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  // 检查是否应该拖拽画布
  const shouldDragCanvas = (target) => {
    const isIdeaBubble = target.closest('.idea-bubble');
    const isButton = target.closest('button');
    const isInput = target.closest('input');
    const isTextarea = target.closest('textarea');
    const isSelect = target.closest('select');
    
    return !isIdeaBubble && !isButton && !isInput && !isTextarea && !isSelect;
  };

  // 计算两个触摸点之间的距离
  const getTouchDistance = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 计算两个触摸点的中点
  const getTouchCenter = (touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  // 画布拖拽处理（触摸）
  const handleCanvasTouchStart = (e) => {
    if (shouldDragCanvas(e.target)) {
      if (e.touches.length === 2) {
        // 双指缩放
        setIsPinching(true);
        setIsDraggingCanvas(false);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = getTouchDistance(touch1, touch2);
        const center = getTouchCenter(touch1, touch2);
        
        setPinchStartDistance(distance);
        setPinchStartZoom(zoomLevel);
        setPinchCenter(center);
        e.preventDefault();
        e.stopPropagation();
      } else if (e.touches.length === 1) {
        // 单指拖拽
        setIsDraggingCanvas(true);
        setIsPinching(false);
        const touch = e.touches[0];
        setCanvasDragStart({
          x: touch.clientX - canvasOffset.x,
          y: touch.clientY - canvasOffset.y
        });
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  // 画布拖拽移动（触摸）
  const handleCanvasTouchMove = (e) => {
    if (isPinching && e.touches.length === 2) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = getTouchDistance(touch1, touch2);
      const currentCenter = getTouchCenter(touch1, touch2);
      
      if (pinchStartDistance > 0 && canvasRef.current) {
        // 计算缩放比例
        const scale = currentDistance / pinchStartDistance;
        const newZoom = Math.max(0.5, Math.min(3, pinchStartZoom * scale));
        
        // 计算缩放中心点相对于画布的坐标
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = currentCenter.x - rect.left;
        const centerY = currentCenter.y - rect.top;
        
        // 调整画布偏移，使缩放中心点保持不变
        // 使用函数式更新确保使用最新的状态值
        setZoomLevel(newZoom);
        setCanvasOffset(prevOffset => {
          const zoomChange = newZoom / pinchStartZoom;
          return {
            x: centerX - (centerX - prevOffset.x) * zoomChange,
            y: centerY - (centerY - prevOffset.y) * zoomChange
          };
        });
      }
      e.preventDefault();
    } else if (isDraggingCanvas && e.touches.length === 1) {
      // 单指拖拽
      const touch = e.touches[0];
      const newOffset = {
        x: touch.clientX - canvasDragStart.x,
        y: touch.clientY - canvasDragStart.y
      };
      setCanvasOffset(newOffset);
      e.preventDefault();
    }
  };

  // 画布拖拽结束（触摸）
  const handleCanvasTouchEnd = (e) => {
    if (e.touches.length === 0) {
      // 所有手指都离开
      setIsDraggingCanvas(false);
      setIsPinching(false);
      setPinchStartDistance(0);
    } else if (e.touches.length === 1 && isPinching) {
      // 从双指变为单指，切换到拖拽模式
      setIsPinching(false);
      setIsDraggingCanvas(true);
      const touch = e.touches[0];
      setCanvasDragStart({
        x: touch.clientX - canvasOffset.x,
        y: touch.clientY - canvasOffset.y
      });
    }
  };

  // 画布拖拽处理（鼠标）
  const handleCanvasMouseDown = (e) => {
    if (shouldDragCanvas(e.target) && e.button === 0) { // 只处理左键
      setIsDraggingCanvas(true);
      setCanvasDragStart({
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y
      });
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // 画布拖拽移动（鼠标）
  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas) {
      const newOffset = {
        x: e.clientX - canvasDragStart.x,
        y: e.clientY - canvasDragStart.y
      };
      setCanvasOffset(newOffset);
      e.preventDefault();
    }
  };

  // 画布拖拽结束（鼠标）
  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  // 监听想法气泡拖拽事件（触摸）
  useEffect(() => {
    if (draggingIdeaId) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [draggingIdeaId, ideas, dragOffset]);

  // 监听画布拖拽和缩放事件（触摸和鼠标）
  useEffect(() => {
    if (isDraggingCanvas || isPinching) {
      // 触摸事件
      window.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
      window.addEventListener('touchend', handleCanvasTouchEnd);
      window.addEventListener('touchcancel', handleCanvasTouchEnd);
      // 鼠标事件（只在拖拽时，不在缩放时）
      if (isDraggingCanvas) {
        window.addEventListener('mousemove', handleCanvasMouseMove);
        window.addEventListener('mouseup', handleCanvasMouseUp);
      }
      
      return () => {
        window.removeEventListener('touchmove', handleCanvasTouchMove);
        window.removeEventListener('touchend', handleCanvasTouchEnd);
        window.removeEventListener('touchcancel', handleCanvasTouchEnd);
        if (isDraggingCanvas) {
          window.removeEventListener('mousemove', handleCanvasMouseMove);
          window.removeEventListener('mouseup', handleCanvasMouseUp);
        }
      };
    }
  }, [isDraggingCanvas, isPinching, canvasDragStart]);

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
    
    // 保存当前写作内容作为历史版本，包括原始想法文本
    const currentWritings = ideaWritings[selectedIdeaId] || {};
    const selectedIdea = ideas.find(i => i.id === selectedIdeaId);
    setPreviousWritings({
      ...previousWritings,
      [selectedIdeaId]: { 
        ...currentWritings,
        originalIdea: selectedIdea?.text || ''
      }
    });
    
    // 更新写作内容
    const newWritings = {
      ...ideaWritings,
      [selectedIdeaId]: {
        ...ideaWritings[selectedIdeaId],
        [field]: value
      }
    };
    setIdeaWritings(newWritings);
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
    
    // 保存用户消息到数据库
    saveChatToDatabase(userMessage, selectedIdeaId, selectedFrameworkId);

    try {
      const selectedIdea = ideas.find(i => i.id === selectedIdeaId);
      const currentFramework = writingFramework.find(f => f.id === selectedFrameworkId);
      
      const response = await fetch('http://localhost:5050/api/strategy', {
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
        
        // 保存AI回复到数据库
        saveChatToDatabase(aiMessage, selectedIdeaId, selectedFrameworkId);
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


  // 保存聊天记录到数据库
  const saveChatToDatabase = async (message, ideaId, frameworkId) => {
    try {
      const idea = ideas.find(i => i.id === ideaId);
      const framework = writingFramework.find(f => f.id === frameworkId);
      
      console.log('保存聊天记录到数据库:', {
        user_id: userInfo.username,
        task_type: 'taskB',
        idea_id: ideaId,
        idea_name: idea?.text || '未命名想法',
        section_id: frameworkId,
        section_name: framework?.title || '未知板块',
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
          task_type: 'taskB',
          idea_id: ideaId,
          idea_name: idea?.text || '未命名想法',
          section_id: frameworkId,
          section_name: framework?.title || '未知板块',
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
      if (e.target.id === 'idea-input') {
        addIdea();
      } else if (e.target.id === 'chat-input') {
        sendChatMessage();
      }
    }
  };

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // 如果用户是管理员，显示管理员后台
  if (userInfo.role === 'admin') {
    return <AdminPanel userInfo={userInfo} onLogout={handleLogout} />;
  }

  // 如果用户选择Task A，显示Task A界面
  if (userInfo.task === 'taskA') {
    return <TaskA userInfo={userInfo} onLogout={handleLogout} />;
  }

  // 如果用户选择Task B，显示元反思工作台（原有界面）
  return (
    <div className={`app ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* 简化的全屏模式 - 只隐藏侧边栏，保留画布 */}
      <div className="app-header">
            <h1>商业计划书写作-元反思工作台</h1>
            <div className="header-right">
              <div className="user-info">
                <span className="user-name">
                  {userInfo.role === 'admin' ? '管理员' : `用户 ${userInfo.username}`}
                </span>
                {userInfo.role === 'user' && (
                  <span className="user-task">
                    {userInfo.task === 'taskA' ? 'Task A' : 'Task B'}
                  </span>
                )}
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                退出登录
              </button>
              <div className="status-indicator">
                <span className="status-dot"></span>
                服务运行中
              </div>
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
                <button 
                  className="chat-toggle-btn" 
                  onClick={() => setIsChatOpen(true)}
                  title="打开GPT聊天"
                >
                  💬
                </button>
              </div>
            </div>
            
            <div 
              className="canvas-container" 
              ref={canvasRef}
              onTouchStart={handleCanvasTouchStart}
              onMouseDown={handleCanvasMouseDown}
            >
              {/* 画布内容容器 */}
              <div 
                className="canvas-content"
                style={{
                  transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: '0 0',
                  transition: isDraggingCanvas ? 'none' : 'transform 0.2s ease-out'
                }}
              >
                {/* 绘制连接箭头 - 计算SVG尺寸以覆盖所有想法 */}
                {(() => {
                  // 计算所有想法的边界
                  const minX = ideas.length > 0 ? Math.min(...ideas.map(i => i.x)) : 0;
                  const maxX = ideas.length > 0 ? Math.max(...ideas.map(i => i.x + 280)) : 1000;
                  const minY = ideas.length > 0 ? Math.min(...ideas.map(i => i.y)) : 0;
                  const maxY = ideas.length > 0 ? Math.max(...ideas.map(i => i.y + 300)) : 1000;
                  const svgWidth = Math.max(2000, maxX - minX + 400);
                  const svgHeight = Math.max(2000, maxY - minY + 400);
                  const svgX = Math.min(0, minX - 200);
                  const svgY = Math.min(0, minY - 200);
                  
                  return (
                    <svg 
                      className="connection-svg" 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                {ideas.map(idea => {
                  if (idea.parentId) {
                    const parentIdea = ideas.find(i => i.id === idea.parentId);
                    if (parentIdea) {
                      // 获取实际卡片尺寸
                      const getBubbleSize = (ideaId) => {
                        const element = ideaRefs.current[ideaId];
                        if (element) {
                          return { 
                            width: element.offsetWidth, 
                            height: element.offsetHeight
                          };
                        }
                        // 如果没有DOM元素，使用默认值
                        return { width: 200, height: 150 };
                      };
                      
                      const parentSize = getBubbleSize(parentIdea.id);
                      const childSize = getBubbleSize(idea.id);
                      
                      // 向右（refine）：从父卡片右边到子卡片左边
                      // 向下（branch）：从父卡片下面到子卡片上面
                      // 注意：idea.x 和 idea.y 已经是相对于canvas-content的坐标
                      let startX, startY, endX, endY;
                      
                      if (idea.connectionType === 'refine') {
                        // 向右：从父卡片右边缘到子卡片左边缘
                        startX = parentIdea.x + parentSize.width;
                        startY = parentIdea.y + parentSize.height / 2;
                        endX = idea.x;
                        endY = idea.y + childSize.height / 2;
                      } else {
                        // 向下：从父卡片下边缘到子卡片上边缘
                        startX = parentIdea.x + parentSize.width / 2;
                        startY = parentIdea.y + parentSize.height;
                        endX = idea.x + childSize.width / 2;
                        endY = idea.y;
                      }
                      
                      // 创建路径
                      const midX = (startX + endX) / 2;
                      const midY = (startY + endY) / 2;
                      let path;
                      let strokeColor = '#667eea';
                      
                      if (idea.connectionType === 'refine') {
                        path = `M ${startX} ${startY} L ${endX} ${endY}`; // 直线（细化）
                      } else if (idea.connectionType === 'ai-generated') {
                        path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`; // S型曲线（AI生成）
                        strokeColor = '#ffd700'; // 金色表示AI生成
                      } else {
                        path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`; // S型曲线（分支）
                      }
                      
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
                              <polygon points="0 0, 10 3, 0 6" fill={strokeColor} />
                            </marker>
                          </defs>
                          <path
                            d={path}
                            stroke={strokeColor}
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
                  );
                })()}
                {/* 想法气泡 */}
                {ideas.map(idea => (
                  <div
                    key={idea.id}
                    ref={(el) => {
                      if (el) {
                        ideaRefs.current[idea.id] = el;
                      } else {
                        delete ideaRefs.current[idea.id];
                      }
                    }}
                    className={`idea-bubble ${selectedIdeaId === idea.id ? 'selected' : ''} ${editingIdeaId === idea.id ? 'editing' : ''} ${draggingIdeaId === idea.id ? 'dragging' : ''}`}
                    style={{
                      left: idea.x,
                      top: idea.y,
                      backgroundColor: idea.color
                    }}
                  onTouchStart={(e) => handleIdeaTouchStart(idea.id, e)}
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
                        className={`idea-action-btn refine-btn ${isFullscreen ? 'disabled' : ''}`}
                        onClick={isFullscreen ? undefined : (e) => refineIdea(idea.id, e)}
                        title={isFullscreen ? "全屏模式下不可用" : "细化想法"}
                        disabled={isFullscreen}
                      >
                        <span className="action-icon">→</span>
                        <span className="action-text">细化</span>
                      </button>
                      <button 
                        className={`idea-action-btn duplicate-btn ${isFullscreen ? 'disabled' : ''}`}
                        onClick={isFullscreen ? undefined : (e) => duplicateIdea(idea.id, e)}
                        title={isFullscreen ? "全屏模式下不可用" : "分支想法"}
                        disabled={isFullscreen}
                      >
                        <span className="action-icon">↓</span>
                        <span className="action-text">分支</span>
                      </button>
                    </div>
                  )}
                  
                  {/* LLM影响因素分析结果 - 只对新建的idea显示 */}
                  {generatedIdeas[idea.id] && (idea.parentId || idea.connectionType === 'refine' || idea.connectionType === 'branch') && (
                    <div className="idea-analysis">
                      <div className="analysis-header">
                        <span className="analysis-icon">🔍</span>
                        <span className="analysis-text">认知启发分析</span>
                        <button 
                          className="edit-analysis-btn" 
                          onClick={(e) => startEditingAnalysis(idea.id, e)}
                          title="编辑分析内容"
                        >
                          ✏️
                        </button>
                      </div>
                      <div className="analysis-content">
                        {editingAnalysisId === idea.id ? (
                          <div className="analysis-edit-mode">
                            <textarea
                              className="analysis-edit-textarea"
                              value={editingAnalysisText}
                              onChange={(e) => setEditingAnalysisText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                  saveAnalysisEdit(idea.id);
                                } else if (e.key === 'Escape') {
                                  cancelAnalysisEdit(idea.id);
                                }
                              }}
                              onBlur={() => saveAnalysisEdit(idea.id)}
                              placeholder="编辑分析内容..."
                              autoFocus
                            />
                            <div className="analysis-edit-controls">
                              <button 
                                className="save-analysis-btn" 
                                onClick={() => saveAnalysisEdit(idea.id)}
                              >
                                保存
                              </button>
                              <button 
                                className="cancel-analysis-btn" 
                                onClick={() => cancelAnalysisEdit(idea.id)}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          generatedIdeas[idea.id].analysis
                        )}
                      </div>
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
          </div>

        </div>

        {/* 聊天浮层遮罩 */}
        {isChatOpen && (
          <div className="chat-overlay" onClick={() => setIsChatOpen(false)}></div>
        )}
        
        {/* 右侧：GPT 聊天窗口 */}
        <div className={`chat-section ${isChatOpen ? 'chat-open' : ''}`}>
          <div className="section-header">
            <h3>🤖 GPT 策略顾问</h3>
            <div className="chat-tools">
              {selectedIdeaId && (
                <select 
                  className="framework-select"
                  value={selectedFrameworkId}
                  onChange={(e) => setSelectedFrameworkId(Number(e.target.value))}
                >
                  {writingFramework.map(framework => (
                    <option key={framework.id} value={framework.id}>
                      {framework.title}
                    </option>
                  ))}
                </select>
              )}
              <button 
                className="chat-close-btn mobile-only" 
                onClick={() => setIsChatOpen(false)}
                title="关闭聊天"
              >
                ×
              </button>
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
                {/* 聊天消息区域 */}
                {getCurrentChatMessages().map(message => (
                  <div key={message.id} className={`message ${message.type} ${message.isReflection ? 'reflection' : ''} ${message.isAnalysis ? 'analysis' : ''}`}>
                    <div className="message-header">
                      <span className="message-sender">
                        {message.isReflection ? '💭 反思' : message.isAnalysis ? '📊 分析' : (message.type === 'user' ? '你' : 'GPT')}
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
}

export default App;
