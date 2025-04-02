class ChatAgent {
  constructor() {
    this.conversationHistory = new Map(); // 使用 Map 存储不同部分的对话历史
    this.currentContext = null;
  }

  // 设置当前上下文（部分和子部分）
  setContext(section, subsection = null) {
    const contextKey = subsection ? `${section}-${subsection}` : section;
    this.currentContext = contextKey;
    
    // 如果这个上下文还没有对话历史，初始化一个
    if (!this.conversationHistory.has(contextKey)) {
      this.conversationHistory.set(contextKey, []);
    }
  }

  // 获取当前上下文的对话历史
  getCurrentHistory() {
    return this.conversationHistory.get(this.currentContext) || [];
  }

  // 添加消息到历史记录
  addToHistory(message, sender) {
    if (!this.currentContext) return;
    
    const history = this.getCurrentHistory();
    history.push({ text: message, sender, timestamp: new Date().toISOString() });
    this.conversationHistory.set(this.currentContext, history);
  }

  // 构建发送给 AI 的提示词
  buildPrompt(userInput, section, selectedContent = null) {
    let basePrompt = '';
    const history = this.getCurrentHistory();
    const isFirstMessage = history.filter(msg => msg.sender === 'ai').length === 0;
    
    // 检查是否是简单的确认回复
    const isSimpleAcknowledgment = /^(sure|ok|yes|yeah|got it|okay|alright|fine)$/i.test(userInput.trim());
    
    // 检查是否提到了业务计划书的具体部分
    const bpSections = {
      'painpoint': 'pain point analysis',
      'market': 'market analysis',
      'product': 'product introduction',
      'competitive': 'competitive analysis',
      'feasibility': 'feasibility analysis',
      'financial': 'financial analysis',
      'team': 'team introduction'
    };

    const mentionedSection = Object.entries(bpSections).find(([key, desc]) => 
      userInput.toLowerCase().includes(key) || userInput.toLowerCase().includes(desc)
    );

    // 根据不同部分构建基础提示词
    switch (section) {
      case 'idea':
        if (mentionedSection) {
          return `Respond exactly with: "Great! Let's proceed to the ${bpSections[mentionedSection[0]]} section to explore this further."`;
        } else if (isFirstMessage) {
          basePrompt = `You are a friendly discussion partner. Keep responses under 50 words. Have a natural conversation as if chatting with a friend about their business idea. Respond to what interests you about their idea.`;
        } else if (isSimpleAcknowledgment) {
          basePrompt = `Continue the conversation naturally, showing interest in their thoughts and ideas.`;
        } else {
          basePrompt = `You are a friendly discussion partner. Keep responses under 50 words. Engage in the conversation naturally, focusing on aspects of their idea that spark your interest.`;
        }
        break;
        
      case 'painpoint':
      case 'market':
      case 'product':
      case 'competitive':
      case 'feasibility':
      case 'financial':
      case 'team':
        basePrompt = `You are having a casual chat about the ${section} aspect. Keep responses under 50 words. Respond naturally as if discussing with a friend, focusing on what interests you about their plans.`;
        break;
        
      case 'pitching':
        basePrompt = `You are having a friendly discussion about their pitch. Keep responses under 50 words. Chat naturally about their ideas and plans, focusing on aspects that interest you.`;
        break;
    }

    basePrompt += `\n\nImportant: Keep the conversation flowing naturally. Avoid formulaic responses or repetitive patterns. Respond as if you're genuinely interested in learning more about their business.`;

    // Add conversation history context
    const recentHistory = this.getCurrentHistory().slice(-3);
    if (recentHistory.length > 0) {
      basePrompt += '\n\nRecent Discussion Context:';
      recentHistory.forEach(msg => {
        basePrompt += `\n${msg.sender === 'user' ? 'You' : 'I'}: ${msg.text}`;
      });
    }

    // Add current input and selected content
    basePrompt += `\n\nCurrent Input: ${userInput}`;
    if (selectedContent) {
      basePrompt += `\n\nSelected Content: ${selectedContent}`;
    }

    return basePrompt;
  }

  // 处理 AI 的响应
  processResponse(response) {
    // 清理响应文本
    let cleanedResponse = response
      .replace(/[*#•\-]/g, '')  // 移除特殊字符
      .replace(/^\s*[\d.]+\s*/gm, '')  // 移除编号
      .replace(/\\r\\n|\\n|\\r/g, '\n')  // 统一换行符
      .replace(/\\/g, '')  // 移除反斜杠
      .trim();

    // 检查是否包含鼓励消息
    const encouragementMsg = "Feel free to continue discussing and refining your idea now, or you can move forward with other sections and modify your idea later in the reflection phase.";
    
    if (cleanedResponse.includes(encouragementMsg)) {
      // 分割主要内容和鼓励消息
      const parts = cleanedResponse.split(encouragementMsg);
      const mainContent = parts[0].trim();
      
      // 返回格式化后的完整消息，只使用一个换行符
      return `${mainContent}\n<div class="encouragement">${encouragementMsg}</div>`;
    }
    
    // 如果没有鼓励消息，返回原始内容
    return cleanedResponse;
  }

  // 分析对话进展
  analyzeProgress() {
    const history = this.getCurrentHistory();
    if (history.length === 0) return 'initial';

    const lastUserMessage = history.filter(msg => msg.sender === 'user').pop();
    const lastAIMessage = history.filter(msg => msg.sender === 'ai').pop();

    if (!lastAIMessage) return 'waiting_response';
    if (!lastUserMessage || lastUserMessage.timestamp < lastAIMessage.timestamp) return 'waiting_user';

    return 'ongoing';
  }

  // 生成下一步建议
  generateNextStepSuggestion() {
    const progress = this.analyzeProgress();
    const history = this.getCurrentHistory();

    switch (progress) {
      case 'initial':
        return ""; // 返回空字符串，不显示任何提示
      case 'waiting_response':
        return "I'm thinking about your input...";
      case 'waiting_user':
        const lastAIMessage = history.filter(msg => msg.sender === 'ai').pop();
        if (lastAIMessage && lastAIMessage.text.includes('?')) {
          return "Consider responding to my question to deepen our discussion.";
        }
        return ""; // 返回空字符串，不显示任何提示
      default:
        return ""; // 返回空字符串，不显示任何提示
    }
  }

  // 检查是否需要总结对话
  shouldSummarizeConversation() {
    const history = this.getCurrentHistory();
    return history.length >= 10; // 当对话超过10条时建议总结
  }

  // 总结当前对话
  summarizeConversation() {
    const history = this.getCurrentHistory();
    let summary = "Key points from our discussion:\n";
    
    // 提取 AI 的主要观点
    const aiPoints = history
      .filter(msg => msg.sender === 'ai')
      .map(msg => msg.text)
      .join('\n');

    // 提取用户的主要关注点
    const userPoints = history
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.text)
      .join('\n');

    summary += `\nMain feedback provided:\n${aiPoints}`;
    summary += `\n\nYour key concerns:\n${userPoints}`;
    
    return summary;
  }
}

export default ChatAgent; 