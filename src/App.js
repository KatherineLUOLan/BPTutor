import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Login from './Login';
import TaskA from './TaskA';
import AdminPanel from './AdminPanel';
import config from './config';

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
  const [documentViewIdeaId, setDocumentViewIdeaId] = useState(null); // 正在查看文档的idea ID
  const [modal, setModal] = useState({ show: false, message: '', type: 'info', onConfirm: null }); // 自定义弹窗状态
  
  // 拖动和缩放
  const [draggingIdeaId, setDraggingIdeaId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // 画布拖拽移动
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasDragStart, setCanvasDragStart] = useState({ x: 0, y: 0 });
  
  
  // 写作内容分析和新idea建议
  const [previousWritings, setPreviousWritings] = useState({}); // 存储每个idea的写作内容历史
  const [generatedIdeas, setGeneratedIdeas] = useState({}); // 存储LLM生成的新idea建议
  const [isAnalyzingWriting, setIsAnalyzingWriting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // 全屏状态
  const [editingAnalysisId, setEditingAnalysisId] = useState(null); // 正在编辑分析的idea ID
  const [editingAnalysisText, setEditingAnalysisText] = useState(''); // 编辑中的分析文本
  const [rightPanelWidth, setRightPanelWidth] = useState(500); // 右侧面板宽度
  const [isResizing, setIsResizing] = useState(false); // 是否正在调整大小
  const [todoChecked, setTodoChecked] = useState({}); // Task B 每个想法、每个板块的 to-do 勾选 { ideaId: { sectionId: boolean[] } }
  
  // 引用
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);
  const editorRef = useRef(null);
  const isComposingRef = useRef(false); // 标记是否正在输入法组合中
  const isEditingRef = useRef(false); // 标记是否正在编辑中，避免useEffect更新DOM
  const lastFrameworkIdRef = useRef(null); // 跟踪上次的框架ID
  const lastDocumentViewIdeaIdRef = useRef(null); // 跟踪上次的想法ID

  // 登录处理函数
  const handleLogin = async (loginData) => {
    setUserInfo(loginData);
    setIsLoggedIn(true);
    
    // 如果是Task B，加载之前保存的界面状态
    if (loginData.task === 'taskB') {
      await loadUserState(loginData.username, 'taskB');
    }
  };
  
  // 加载用户界面状态
  const loadUserState = async (userId, taskType) => {
    try {
      const response = await fetch(`${config.endpoints.loadState}?user_id=${userId}&task_type=${taskType}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        const state = data.data;
        
        // 恢复想法列表
        if (state.ideas && Array.isArray(state.ideas)) {
          setIdeas(state.ideas);
        }
        
        // 恢复写作内容
        if (state.ideaWritings) {
          setIdeaWritings(state.ideaWritings);
        }
        
        // 恢复聊天记录，需要将timestamp字符串转换为Date对象
        if (state.ideaChats) {
          const restoredChats = {};
          Object.keys(state.ideaChats).forEach(ideaId => {
            restoredChats[ideaId] = {};
            Object.keys(state.ideaChats[ideaId]).forEach(frameworkId => {
              restoredChats[ideaId][frameworkId] = (state.ideaChats[ideaId][frameworkId] || []).map(msg => ({
                ...msg,
                timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
              }));
            });
          });
          setIdeaChats(restoredChats);
        }
        
        // 恢复选中的想法和框架
        if (state.selectedIdeaId) {
          setSelectedIdeaId(state.selectedIdeaId);
        }
        if (state.selectedFrameworkId) {
          setSelectedFrameworkId(state.selectedFrameworkId);
        }
        
        // 恢复文档视图
        if (state.documentViewIdeaId) {
          setDocumentViewIdeaId(state.documentViewIdeaId);
        }
        
        // 恢复生成的想法分析
        if (state.generatedIdeas) {
          setGeneratedIdeas(state.generatedIdeas);
        }
        
        console.log('✅ 界面状态已恢复');
      }
    } catch (error) {
      console.error('加载界面状态失败:', error);
    }
  };
  
  // 保存用户界面状态
  const saveUserState = async () => {
    if (!userInfo || userInfo.task !== 'taskB') return;
    
    try {
      const state = {
        ideas,
        ideaWritings,
        ideaChats,
        selectedIdeaId,
        selectedFrameworkId,
        documentViewIdeaId,
        generatedIdeas
      };
      
      const response = await fetch(config.endpoints.saveState, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userInfo.username,
          task_type: 'taskB',
          state
        }),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        console.log('✅ 界面状态已保存');
      }
    } catch (error) {
      console.error('保存界面状态失败:', error);
    }
  };

  // 登出处理函数
  const handleLogout = async () => {
    // 登出前保存一次状态
    if (userInfo && userInfo.task === 'taskB') {
      await saveUserState();
    }
    
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
    setDocumentViewIdeaId(null);
    setGeneratedIdeas({});
  };

  // Writing framework template
  const writingFramework = [
    { 
      id: 1, 
      title: 'User Pain Points', 
      placeholder: `🎯 User pain points – key elements:

• Target user identification (age, occupation, income, behavior)
• Specific pain analysis (efficiency, cost, experience, security)
• Impact (time, money, emotional cost)
• Gaps in current solutions`,
      examples: [
        'Who is the target user group? What do they have in common?',
        'How do users currently solve this problem?',
        'What does this pain cost or trouble users?',
        'How urgent is the need to solve it?'
      ]
    },
    { 
      id: 2, 
      title: 'Market Analysis', 
      placeholder: `📊 Market analysis – key elements:

• Market size (TAM/SAM/SOM)
• Growth trends (CAGR, drivers)
• Segmentation (region, user group, use case)
• Opportunities (white space, new demand)`,
      examples: [
        'How large is the market? What are the growth trends?',
        'What segments and opportunities exist?',
        'What are the main market drivers?',
        'What policies or tech trends affect the market?'
      ]
    },
    { 
      id: 3, 
      title: 'Product Overview', 
      placeholder: `🚀 Product overview – key elements:

• Core features (what problem, how solved)
• Unique value vs. competitors
• Use cases and flow
• Tech strengths and differentiators`,
      examples: [
        'What are the core features? How do they address pain points?',
        'What makes the product unique?',
        'What concrete value does it create for users?',
        'What are the main use cases and flows?'
      ]
    },
    { 
      id: 4, 
      title: 'Competitive Analysis', 
      placeholder: `⚔️ Competitive analysis – key elements:

• Direct competitors (product, price, channel, marketing)
• Indirect competitors and substitutes
• Your advantages (tech, resources, team, model)
• Moats (IP, data, network effects, brand)`,
      examples: [
        'Who are the main competitors? Their strengths and weaknesses?',
        'How does our product differ from competitors?',
        'What alternatives exist in the market?',
        'How do we build defensibility?'
      ]
    },
    { 
      id: 5, 
      title: 'Feasibility Analysis', 
      placeholder: `✅ Feasibility – key elements:

• Technical (difficulty, timeline, risks, roadmap)
• Operational (team, resources, execution, model)
• Financial (cost, revenue, projections, cash flow)
• Legal & compliance (policy, IP, regulation)`,
      examples: [
        'Where are the main technical challenges and risks?',
        'Is the operating model sustainable? What resources are needed?',
        'What are the cost structure and revenue sources?',
        'What legal or regulatory risks exist?'
      ]
    },
    { 
      id: 6, 
      title: 'Funding Plan', 
      placeholder: `💰 Funding plan – key elements:

• Amount, rounds, timeline
• Use of funds (R&D, marketing, ops, team, infra)
• Valuation basis (comps, DCF, user value)
• Returns and exit (exit routes, expected returns)`,
      examples: [
        'How much to raise? In how many rounds?',
        'Where will the funds be used?',
        'What valuation and returns are expected?',
        'What exit options are there?'
      ]
    },
    { 
      id: 7, 
      title: 'Team', 
      placeholder: `👥 Team – key elements:

• Core members (background, experience, expertise)
• Complementarity (skills, roles, collaboration)
• Track record (achievements, projects, cases)
• Hiring and scaling plan`,
      examples: [
        'Who are the core team members? Their background and expertise?',
        'What unique advantages does the team have?',
        'What key roles are still missing?',
        'How will you attract and retain talent?'
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

  // 调整右侧面板宽度
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleResize = (e) => {
      if (!isResizing) return;
      
      const appContent = document.querySelector('.app-content');
      if (!appContent) return;
      
      const rect = appContent.getBoundingClientRect();
      // 计算右侧面板的宽度：从鼠标位置到app-content右边缘的距离
      // 减去右侧padding (1rem = 16px)
      const newWidth = rect.right - e.clientX - 16;
      
      // 限制宽度范围：最小300px，最大800px
      const minWidth = 300;
      const maxWidth = 800;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setRightPanelWidth(clampedWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
      if (!isResizing) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [isResizing]);

  useEffect(() => {
    scrollToBottom();
  }, [ideaChats, selectedIdeaId, selectedFrameworkId]);
  
  // 自动保存界面状态
  useEffect(() => {
    if (!userInfo || userInfo.task !== 'taskB' || !isLoggedIn) return;
    
    saveUserState();
  }, [ideas, ideaWritings, ideaChats, selectedIdeaId, selectedFrameworkId, documentViewIdeaId, generatedIdeas, userInfo, isLoggedIn]);
  
  // 自动保存界面状态
  useEffect(() => {
    if (!userInfo || userInfo.task !== 'taskB' || !isLoggedIn) return;
    
    saveUserState();
  }, [ideas, ideaWritings, ideaChats, selectedIdeaId, selectedFrameworkId, documentViewIdeaId, generatedIdeas, userInfo, isLoggedIn]);

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
      // 新卡片的 to-do 勾选状态与上一节点（当前选中的卡片）保持一致
      setTodoChecked(prev => ({
        ...prev,
        [newIdea.id]: selectedIdeaId != null && prev[selectedIdeaId]
          ? JSON.parse(JSON.stringify(prev[selectedIdeaId]))
          : {}
      }));
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

  // 递归获取所有父节点（整个链路）
  const getAllParentIdeas = (ideaId, allIdeas) => {
    const parentChain = [];
    let currentId = ideaId;
    
    while (currentId) {
      const currentIdea = allIdeas.find(i => i.id === currentId);
      if (!currentIdea || !currentIdea.parentId) break;
      
      const parentIdea = allIdeas.find(i => i.id === currentIdea.parentId);
      if (parentIdea) {
        parentChain.push(parentIdea);
        currentId = parentIdea.id;
      } else {
        break;
      }
    }
    
    return parentChain;
  };

  // 分析新idea的影响因素
  const analyzeNewIdea = async (idea) => {
    // 立即显示分析区域，标记为正在生成中
    setGeneratedIdeas({
      ...generatedIdeas,
      [idea.id]: {
        analysis: '',
        isGenerating: true,
        timestamp: new Date()
      }
    });
    
    setIsAnalyzingWriting(true);
    
    try {
      // 获取所有父节点（整个链路）
      const allParentIdeas = getAllParentIdeas(idea.id, ideas);
      
      // 收集所有父节点的信息
      const parentIdeasInfo = allParentIdeas.map(parent => ({
        id: parent.id,
        text: parent.text,
        writings: ideaWritings[parent.id] || {}
      }));
      
      // 获取直接父节点（用于兼容性）
      const directParentIdea = idea.parentId ? ideas.find(i => i.id === idea.parentId) : null;
      const directParentWritings = directParentIdea ? (ideaWritings[idea.parentId] || {}) : {};
      
      const response = await fetch(config.endpoints.analyzeWriting, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            ideaText: idea.text,
            previousIdeaText: directParentIdea ? directParentIdea.text : null,
            previousWritings: directParentWritings,
            allParentIdeas: parentIdeasInfo, // 所有父节点信息
            currentWritings: ideaWritings[idea.id] || {},
            currentSection: '新想法分析',
            connectionType: idea.connectionType || null,
            isRefine: idea.connectionType === 'refine' || idea.connectionType === 'branch'
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
            isGenerating: false,
            timestamp: new Date()
          }
        });
        
        // 同时在聊天框中输出分析结果并询问是否需要修改
        const analysisMessage = {
          id: Date.now(),
          type: 'ai',
          content: `${content}\n\n💡 Does this analysis look accurate? Anything to change or add?`,
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

  // 选择想法 - 点击后显示文档
  const selectIdea = (id, e) => {
    if (editingIdeaId || draggingIdeaId) return;
    
    // 如果已经显示了这个想法的文档，不做任何操作（不能通过点击卡片关闭）
    if (documentViewIdeaId === id) {
      return;
    }
    
    setSelectedIdeaId(id);
    setDocumentViewIdeaId(id);
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
    // 如果删除的是正在查看文档的idea，关闭文档
    if (documentViewIdeaId === id) {
      setDocumentViewIdeaId(null);
    }
  };

  // 替换想法（分支）- 纵向新增，继承点击卡片的上一个节点内容，并复制到上一个节点的聊天记录
  // 如果点击的是第一个节点（没有 parentId），则新卡片为空白
  const duplicateIdea = (id, e) => {
    e.stopPropagation();
    const originalIdea = ideas.find(idea => idea.id === id);
    if (!originalIdea) return;
    
    // 判断是否是第一个节点（没有 parentId）
    const isFirstNode = !originalIdea.parentId;
    
    const newIdea = {
      id: Date.now(),
      text: '',
      x: originalIdea.x,
      y: originalIdea.y + 350, // 在下方，增加间距避免重叠（考虑卡片高度和认知分析区域）
      color: `hsl(${Math.random() * 60 + 180}, 30%, 85%)`,
      parentId: id,
      connectionType: 'branch' // 分支类型
    };
    
    setIdeas([...ideas, newIdea]);
    
    if (isFirstNode) {
      // 第一个节点的纵向：新卡片为空白
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
      
      // 清空聊天记录
      setIdeaChats({
        ...ideaChats,
        [newIdea.id]: {
          1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
        }
      });
      
      // to-do 为空
      setTodoChecked(prev => ({
        ...prev,
        [newIdea.id]: {}
      }));
    } else {
      // 非第一个节点：继承上一个节点（parentId）的内容和聊天记录
      const previousNodeId = originalIdea.parentId;
      
      // 继承上一个节点的写作内容
      setIdeaWritings({
        ...ideaWritings,
        [newIdea.id]: ideaWritings[previousNodeId]
          ? { ...ideaWritings[previousNodeId] }
          : {
              userPainPoints: '',
              marketAnalysis: '',
              productIntro: '',
              competitiveAnalysis: '',
              feasibilityAnalysis: '',
              fundingPlan: '',
              teamIntro: ''
            }
      });
      
      // 复制到上一个节点的聊天记录（深度复制避免引用问题）
      const previousChats = ideaChats[previousNodeId] || { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
      setIdeaChats({
        ...ideaChats,
        [newIdea.id]: {
          1: (previousChats[1] || []).map(msg => ({ ...msg })),
          2: (previousChats[2] || []).map(msg => ({ ...msg })),
          3: (previousChats[3] || []).map(msg => ({ ...msg })),
          4: (previousChats[4] || []).map(msg => ({ ...msg })),
          5: (previousChats[5] || []).map(msg => ({ ...msg })),
          6: (previousChats[6] || []).map(msg => ({ ...msg })),
          7: (previousChats[7] || []).map(msg => ({ ...msg }))
        }
      });
      
      // 纵向分支：to-do 勾选状态与上一个节点保持一致
      setTodoChecked(prev => ({
        ...prev,
        [newIdea.id]: prev[previousNodeId] ? JSON.parse(JSON.stringify(prev[previousNodeId])) : {}
      }));
    }
    
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
    // 细化出的新卡片：to-do 勾选状态与父节点保持一致
    setTodoChecked(prev => ({
      ...prev,
      [newIdea.id]: prev[id] ? JSON.parse(JSON.stringify(prev[id])) : {}
    }));
    
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
        analyzeNewIdea(updatedIdea);
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
    // 如果删除的是正在查看文档的idea，关闭文档
    if (documentViewIdeaId === id) {
      setDocumentViewIdeaId(null);
    }
  };

  // 开始拖动idea
  const handleIdeaMouseDown = (id, e) => {
    if (editingIdeaId || e.target.closest('.remove-idea') || e.target.closest('.idea-action-btn')) return;
    e.stopPropagation();
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingIdeaId(id);
    // 计算鼠标相对于idea框左上角的偏移量
    setDragOffset({
      x: e.clientX - rect.left - idea.x,
      y: e.clientY - rect.top - idea.y
    });
  };

  // 拖动idea
  const handleMouseMove = (e) => {
    if (draggingIdeaId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // 计算鼠标在canvas中的位置，减去初始偏移量，得到idea的新位置
      const newX = Math.max(0, Math.min(rect.width - 220, e.clientX - rect.left - dragOffset.x));
      const newY = Math.max(0, Math.min(rect.height - 100, e.clientY - rect.top - dragOffset.y));
      
      setIdeas(ideas.map(idea =>
        idea.id === draggingIdeaId ? { ...idea, x: newX, y: newY } : idea
      ));
    }
  };

  // 停止拖动
  const handleMouseUp = () => {
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

  // 画布拖拽处理
  const handleCanvasMouseDown = (e) => {
    // 检查是否点击了文档区域
    const isDocument = e.target.closest('.idea-document');
    if (isDocument) {
      return; // 如果点击了文档，不处理画布拖拽
    }
    
    // 只有在点击空白区域（不是想法气泡）时才开始拖拽
    const isIdeaBubble = e.target.closest('.idea-bubble');
    
    if (!isIdeaBubble) {
      setIsDraggingCanvas(true);
      setCanvasDragStart({
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y
      });
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas) {
      const newOffset = {
        x: e.clientX - canvasDragStart.x,
        y: e.clientY - canvasDragStart.y
      };
      setCanvasOffset(newOffset);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
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
  }, [draggingIdeaId, ideas, dragOffset]);

  // 监听画布拖拽事件
  useEffect(() => {
    if (isDraggingCanvas) {
      window.addEventListener('mousemove', handleCanvasMouseMove);
      window.addEventListener('mouseup', handleCanvasMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleCanvasMouseMove);
        window.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isDraggingCanvas, canvasDragStart]);

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
    const section = writingFramework.find(s => s.id === selectedFrameworkId);
    return section ? getTodoItemsFromPlaceholder(section.placeholder) : [];
  };

  // 获取当前想法、当前板块的勾选状态数组
  const getTodoCheckedList = () => {
    const ideaId = documentViewIdeaId;
    const sectionId = selectedFrameworkId;
    if (!ideaId) return [];
    const byIdea = todoChecked[ideaId] || {};
    return byIdea[sectionId] || [];
  };

  // 切换某一项的勾选
  const toggleTodoItem = (index) => {
    const ideaId = documentViewIdeaId;
    const sectionId = selectedFrameworkId;
    if (ideaId == null) return;
    const items = getCurrentTodoItems();
    const byIdea = todoChecked[ideaId] || {};
    const list = byIdea[sectionId] || items.map(() => false);
    const newList = [...list];
    while (newList.length < items.length) newList.push(false);
    newList[index] = !newList[index];
    setTodoChecked({
      ...todoChecked,
      [ideaId]: { ...byIdea, [sectionId]: newList }
    });
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
      setModal({
        show: true,
        message: 'Please select an idea first',
        type: 'info',
        onConfirm: null
      });
      return;
    }
    const selectedIdea = ideas.find(idea => idea.id === selectedIdeaId);
    const writing = ideaWritings[selectedIdeaId];
    console.log('保存写作内容:', {
      idea: selectedIdea?.text,
      writing: writing
    });
    setModal({
      show: true,
      message: `已保存 "${selectedIdea?.text}" 的写作内容！`,
      type: 'success',
      onConfirm: null
    });
  };

  // 清空当前写作
  const clearWriting = () => {
    if (!selectedIdeaId) {
      setModal({
        show: true,
        message: 'Please select an idea first',
        type: 'info',
        onConfirm: null
      });
      return;
    }
    setModal({
      show: true,
      message: 'Clear current writing content?',
      type: 'confirm',
      onConfirm: () => {
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
        setModal({ show: false, message: '', type: 'info', onConfirm: null });
      }
    });
  };
  
  // 关闭弹窗
  const closeModal = () => {
    setModal({ show: false, message: '', type: 'info', onConfirm: null });
  };
  
  // 确认弹窗操作
  const confirmModal = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    } else {
      closeModal();
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
      
      const response = await fetch(config.endpoints.strategy, {
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

      const raw = await response.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (_) {
        data = { error: response.statusText || 'Server returned an error' };
      }
      const backendError = data.error || (response.ok ? null : (response.statusText || 'Request failed'));

      if (response.ok && data.status === 'success') {
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
        throw new Error(backendError || 'Request failed');
      }
    } catch (error) {
      console.error('聊天错误:', error);
      const displayError = (error && error.message) ? error.message : 'Service temporarily unavailable. Please try again later.';
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: displayError,
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
        idea_name: idea?.text || 'Untitled idea',
        section_id: frameworkId,
        section_name: framework?.title || 'Unknown section',
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
          task_type: 'taskB',
          idea_id: ideaId,
          idea_name: idea?.text || 'Untitled idea',
          section_id: frameworkId,
          section_name: framework?.title || 'Unknown section',
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
            <h1>Business Plan – Meta-reflection Workspace</h1>
            <div className="header-right">
              <div className="user-info">
                <span className="user-name">
                  {userInfo.role === 'admin' ? 'Admin' : `User ${userInfo.username}`}
                </span>
                {userInfo.role === 'user' && (
                  <span className="user-task">
                    {userInfo.task === 'taskA' ? 'Task A' : 'Task B'}
                  </span>
                )}
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                Log out
              </button>
              <div className="status-indicator">
                <span className="status-dot"></span>
                Service running
              </div>
            </div>
          </div>
          
          <div className="app-content">
        {/* 左侧区域 */}
        <div className="left-panel">
          {/* Idea iteration canvas */}
          <div className="idea-canvas-section">
            <div className="section-header">
              <h3>💡 Idea Iteration Canvas</h3>
              <div className="header-controls">
                <div className="idea-input-group">
                  <input
                    id="idea-input"
                    type="text"
                    value={currentIdea}
                    onChange={(e) => setCurrentIdea(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter new idea..."
                    className="idea-input"
                  />
                  <button onClick={addIdea} className="add-idea-btn">
                    +
                  </button>
                </div>
                 <div className="zoom-controls">
                   <button className="zoom-btn" onClick={handleZoomOut}>-</button>
                   <span className="zoom-value">{Math.round(zoomLevel * 100)}%</span>
                   <button className="zoom-btn" onClick={handleZoomIn}>+</button>
                   <button className="zoom-btn reset-btn" onClick={handleResetZoom}>⟲</button>
                   <button className="zoom-btn fullscreen-btn" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                     {isFullscreen ? "⤓" : "⤢"}
                   </button>
                 </div>
              </div>
            </div>
            
            <div 
              className="canvas-container" 
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              style={{
                cursor: isDraggingCanvas ? 'grabbing' : 'grab'
              }}
            >
              {/* 画布内容容器 */}
              <div 
                className="canvas-content"
                style={{
                  transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDraggingCanvas ? 'none' : 'transform 0.2s ease-out'
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
                  onDoubleClick={(e) => {
                    if (!editingIdeaId && !draggingIdeaId) {
                      e.stopPropagation();
                      selectIdea(idea.id, e);
                    }
                  }}
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
                        placeholder="Enter new idea..."
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="idea-text">{idea.text || 'Blank idea'}</span>
                        <button className="remove-idea" onClick={(e) => removeIdea(idea.id, e)}>×</button>
                      </>
                    )}
                  </div>
                  {editingIdeaId !== idea.id && (
                    <div className="idea-actions">
                      <button 
                        className={`idea-action-btn refine-btn ${isFullscreen ? 'disabled' : ''}`}
                        onClick={isFullscreen ? undefined : (e) => refineIdea(idea.id, e)}
                        title={isFullscreen ? "Not available in fullscreen" : "Refine idea"}
                        disabled={isFullscreen}
                      >
                        <span className="action-icon">🔍</span>
                        <span className="action-text">Refine</span>
                      </button>
                      <button 
                        className={`idea-action-btn duplicate-btn ${isFullscreen ? 'disabled' : ''}`}
                        onClick={isFullscreen ? undefined : (e) => duplicateIdea(idea.id, e)}
                        title={isFullscreen ? "Not available in fullscreen" : "Replace idea"}
                        disabled={isFullscreen}
                      >
                        <span className="action-icon">🔄</span>
                        <span className="action-text">Replace</span>
                      </button>
                    </div>
                  )}
                  
                  {/* LLM影响因素分析结果 - 只在保存想法名称后显示 */}
                  {generatedIdeas[idea.id] && (idea.parentId || idea.connectionType === 'refine' || idea.connectionType === 'branch') && (
                    <div className="idea-analysis">
                      <div className="analysis-header">
                        <span className="analysis-icon">🔍</span>
                        <span className="analysis-text">Cognitive analysis</span>
                        {generatedIdeas[idea.id] && !generatedIdeas[idea.id].isGenerating && (
                          <button 
                            className="edit-analysis-btn" 
                            onClick={(e) => startEditingAnalysis(idea.id, e)}
                            title="Edit analysis"
                          >
                            ✏️
                          </button>
                        )}
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
                              placeholder="Edit analysis..."
                              autoFocus
                            />
                            <div className="analysis-edit-controls">
                              <button 
                                className="save-analysis-btn" 
                                onClick={() => saveAnalysisEdit(idea.id)}
                              >
                                Save
                              </button>
                              <button 
                                className="cancel-analysis-btn" 
                                onClick={() => cancelAnalysisEdit(idea.id)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : generatedIdeas[idea.id]?.isGenerating ? (
                          <div className="analysis-generating">
                            <div className="generating-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                            <span className="generating-text">Generating...</span>
                          </div>
                        ) : generatedIdeas[idea.id]?.analysis ? (
                          generatedIdeas[idea.id].analysis
                        ) : (
                          <div className="analysis-generating">
                            <div className="generating-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                            <span className="generating-text">Generating...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {ideas.length === 0 && (
                <div className="empty-canvas">
                  <p>Use the input above to add ideas</p>
                  <p>Click an idea card to view its document</p>
                </div>
              )}
              </div>
              
              {/* 文档显示 - 固定在画布容器内，不跟随画布移动 */}
              {documentViewIdeaId && (
                <div 
                  className="idea-document"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="document-header">
                    <h4>{ideas.find(i => i.id === documentViewIdeaId)?.text || 'Untitled idea'}</h4>
                    <button 
                      className="close-document-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocumentViewIdeaId(null);
                        setSelectedIdeaId(null);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="document-content">
                    <div className="document-framework">
                      {writingFramework.map(section => (
                        <div 
                          key={section.id} 
                          className={`document-section ${selectedFrameworkId === section.id ? 'active' : ''}`}
                          onClick={() => setSelectedFrameworkId(section.id)}
                        >
                          <label>{section.title}</label>
                        </div>
                      ))}
                    </div>
                    <div className="document-editor">
                      <div className="editor-field">
                        {/* 直接显示 to-do 列表，无上方标题 */}
                        <div className="editor-todo-list">
                          {getCurrentTodoItems().map((item, index) => {
                            const checkedList = getTodoCheckedList();
                            const checked = checkedList[index] === true;
                            return (
                              <label key={index} className={`editor-todo-item ${checked ? 'checked' : ''}`} onClick={(e) => e.stopPropagation()}>
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
                          value={ideaWritings[documentViewIdeaId]?.[getFieldName(selectedFrameworkId)] || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateIdeaWriting(getFieldName(selectedFrameworkId), e.target.value);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="editor-textarea"
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                  <div className="document-footer">
                    <button className="tool-btn" onClick={clearWriting}>Clear</button>
                    <button className="tool-btn" onClick={saveWriting}>Save</button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 分隔条 */}
        <div 
          className="resize-handle"
          onMouseDown={handleResizeStart}
          style={{ cursor: 'col-resize' }}
        />

        {/* 右侧：GPT 聊天窗口 */}
        <div className="chat-section" style={{ width: `${rightPanelWidth}px`, flex: `0 0 ${rightPanelWidth}px`, maxWidth: `${rightPanelWidth}px` }}>
          <div className="section-header">
            <h3>🤖 GPT Strategy Advisor</h3>
            <div className="chat-tools">
              {selectedIdeaId && selectedFrameworkId && (
                <span className="current-section-indicator">
                  {writingFramework.find(f => f.id === selectedFrameworkId)?.title}
                </span>
              )}
            </div>
          </div>
          
          <div className="chat-messages">
            {!selectedIdeaId ? (
              <div className="empty-chat">
                <p>👋 Hi, I'm your strategy advisor</p>
                <p>Select an idea on the canvas first</p>
                <p>Then pick a section on the left to start the discussion</p>
              </div>
            ) : getCurrentChatMessages().length === 0 ? (
              <div className="empty-chat">
                <p>💡 About 「{writingFramework.find(f => f.id === selectedFrameworkId)?.title}」</p>
                <p>You can ask me these questions to refine your idea:</p>
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
                        {message.isReflection ? '💭 Reflection' : message.isAnalysis ? '📊 Analysis' : (message.type === 'user' ? 'You' : 'GPT')}
                      </span>
                      <span className="message-time">
                        {message.timestamp instanceof Date 
                          ? message.timestamp.toLocaleTimeString() 
                          : new Date(message.timestamp).toLocaleTimeString()}
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
        <div className="custom-modal-overlay" onClick={modal.type === 'confirm' ? undefined : closeModal}>
          <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-content">
              <p>{modal.message}</p>
            </div>
            <div className="custom-modal-buttons">
              {modal.type === 'confirm' ? (
                <>
                  <button className="modal-btn modal-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="modal-btn modal-btn-confirm" onClick={confirmModal}>
                    OK
                  </button>
                </>
              ) : (
                <button className="modal-btn modal-btn-ok" onClick={closeModal}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
