const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'bptutor';
let db;
let chatRecordsCollection;
let userStatsCollection;
let userStatesCollection;

// 初始化MongoDB连接
let mongoClient;
async function initDatabase() {
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        console.log('✅ MongoDB连接成功');
        
        db = mongoClient.db(DB_NAME);
        chatRecordsCollection = db.collection('chat_records');
        userStatsCollection = db.collection('user_stats');
        userStatesCollection = db.collection('user_states');
        
        // 创建索引
        await chatRecordsCollection.createIndex({ user_id: 1, timestamp: -1 });
        await chatRecordsCollection.createIndex({ task_type: 1 });
        await userStatsCollection.createIndex({ user_id: 1 }, { unique: true });
        await userStatesCollection.createIndex({ user_id: 1 }, { unique: true });
        
        console.log('✅ 数据库集合和索引创建成功');
    } catch (error) {
        console.error('❌ MongoDB连接失败:', error.message);
        // 不立即退出，允许服务器启动但数据库操作会失败
        console.warn('⚠️  服务器将在无数据库连接的情况下运行，数据库相关功能将不可用');
    }
}

// 检查数据库连接状态
function checkDatabaseConnection() {
    if (!db || !chatRecordsCollection || !userStatsCollection || !userStatesCollection) {
        return false;
    }
    return true;
}

// 启动时初始化数据库
initDatabase();

// 中间件
app.use(cors());
app.use(express.json());

// 提供前端静态文件（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// GPT API 配置（必须从环境变量读取）
const GPT_API_URL = process.env.DEEPSEEK_BASE_URL;
const GPT_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!GPT_API_URL || !GPT_API_KEY) {
    console.error('❌ Missing required environment variables: DEEPSEEK_BASE_URL and DEEPSEEK_API_KEY must be set');
    process.exit(1);
}

// 策略代理实现
class StrategyAgent {
    constructor() {
        this.apiUrl = GPT_API_URL;
        this.apiKey = GPT_API_KEY;
    }

    async generateResponse(messages, options = {}) {
        try {
            // 系统级instruction - 创业反思教练
            const systemInstruction = {
                role: "system",
                content: `You are a "startup reflection coach" who helps users think deeply about startup questions through multi-turn dialogue.

Your core responsibilities:
1. Keep each reply concise and focused, about 200–300 words.
2. Give the core answer or suggestion to the current question first.
3. End each reply with one open-ended question to encourage further thinking.
4. Go deeper over multiple turns, from surface to reflection.
5. Avoid dumping too much information in one go.

Style:
- Be clear and direct; answer the user’s question.
- Discuss only 1–2 main points per reply; avoid long lists.
- Use a warm, encouraging tone.
- Every reply must end with one guiding question.

Remember: Keep a good rhythm so the user can digest each reply. Proceed in multiple turns; do not say everything at once.`
            };

            // 初始化 messagesWithSystem
            let messagesWithSystem = messages;
            
            // 如果强制使用默认系统指令（策略咨询需要问问题）
            if (options.forceDefaultSystem) {
                messagesWithSystem = [systemInstruction, ...messages];
            }
            // 如果不需要跳过默认系统指令，且消息中没有系统消息，则添加对话教练指令
            else if (!options.skipDefaultSystem) {
                const hasSystemMessage = messages.some(msg => msg.role === 'system');
                if (!hasSystemMessage) {
                    messagesWithSystem = [systemInstruction, ...messages];
                }
            }

            // 如果是认知分析，限制token数量以生成合适长度的内容
            const maxTokens = options.skipDefaultSystem ? 250 : 400;
            
            const response = await axios.post(`${this.apiUrl}chat/completions`, {
                model: "deepseek-chat", // 使用 deepseek-chat 模型
                messages: messagesWithSystem,
                temperature: 0.7,
                max_tokens: maxTokens
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60秒超时（deepseek-r1模型需要更长时间）
            });

            // 打印AI响应到终端
            const aiResponse = response.data.choices[0].message.content;
            console.log('\n🤖 AI响应:');
            console.log('═'.repeat(50));
            console.log(aiResponse);
            console.log('═'.repeat(50));
            
            return response.data;
        } catch (error) {
            // 详细错误信息（本地可用、服务器不可用时多为出网/防火墙问题）
            if (error.code === 'ENOTFOUND') {
                console.error('GPT API DNS failed:', error.message, '| API URL:', this.apiUrl);
                throw new Error('AI service unreachable. If it works locally but not on server, check server outbound access and firewall for the API URL.');
            } else if (error.code === 'ECONNREFUSED') {
                console.error('GPT API connection refused:', error.message, '| API URL:', this.apiUrl);
                throw new Error('AI service connection refused. If it works locally but not on server, check server firewall/security group for outbound HTTPS.');
            } else if (error.code === 'ETIMEDOUT') {
                console.error('GPT API request timeout:', error.message);
                throw new Error('AI service timeout. Please try again later.');
            } else {
                const apiStatus = error.response?.status;
                const apiData = error.response?.data;
                console.error('GPT API error:', apiStatus, apiData || error.message);
                const hint = apiStatus === 401 ? ' (check DEEPSEEK_API_KEY)' : (apiStatus ? ` (API returned ${apiStatus})` : '');
                throw new Error('AI service temporarily unavailable' + hint);
            }
        }
    }

    getSectionPrompt(section, context = {}) {
        const { ideaText, currentSectionContent, allWritings } = context;
        
        const baseContext = `
Current idea: ${ideaText || 'Untitled'}
Current section content: ${currentSectionContent || 'None'}`;

        const prompts = {
            'User Pain Points': `You are a user research expert. In a conversational style, help analyze and identify the target users' core pain points.

${baseContext}

Focus on:
1. Precise targeting of the user group (demographics, context, behavior)
2. Severity and urgency of the pains
3. Users' current solutions and their gaps
4. Deeper needs behind the pains
5. Willingness to pay to solve the pains

Be objective, specific, and grounded in real scenarios. Reply in English.

**Format**: Split your answer into separate paragraphs; one main point per paragraph; no special formatting.`,

            'Market Analysis': `You are a market analysis expert. In a conversational style, help analyze market size, trends, and opportunities.

${baseContext}

Focus on:
1. Market size (TAM/SAM/SOM)
2. Growth trends and drivers
3. Segmentation and target segment choice
4. Industry stage and maturity
5. External factors (policy, technology)

Support with data and logic; stay objective. Reply in English.

**Format**: Split your answer into separate paragraphs; one main point per paragraph; no special formatting.`,

            'Product Overview': `You are a product strategy expert. In a conversational style, help define and refine the product plan.

${baseContext}

Focus on:
1. Core features and value proposition
2. How the product addresses user pains
3. Differentiation and innovation
4. Use cases and user experience
5. MVP and product roadmap

Be concrete and actionable; focus on user value. Reply in English.

**Format**: Split your answer into separate paragraphs; one main point per paragraph; no special formatting.`,

            'Competitive Analysis': `You are a competitive strategy expert. In a conversational style, help analyze the competitive landscape and differentiation.

${baseContext}

Focus on:
1. Main competitors' product, pricing, go-to-market
2. Competitors' strengths and weaknesses
3. Substitutes and potential entrants
4. Building a differentiated advantage
5. Moats and defensibility

Be objective and comprehensive; strategies should be actionable. Reply in English.

**Format**: Split your answer into separate paragraphs; one main point per paragraph; no special formatting.`,

            'Feasibility Analysis': `You are a business feasibility expert. In a conversational style, help assess whether the project is feasible to execute.

${baseContext}

Focus on:
1. Technical feasibility (challenges, approach, team)
2. Operational feasibility (resources, supply chain, model)
3. Financial feasibility (cost, revenue model, payback)
4. Risks and mitigation
5. Key milestones and timeline

Be rational and thorough; surface risks clearly. Reply in English.

**Format**: Split your answer into separate paragraphs; one main point per paragraph; no special formatting.`,

            'Funding Plan': `You are a fundraising strategy expert. In a conversational style, help design the funding strategy and investor narrative.

${baseContext}

Focus on:
1. Funding need (amount, stage, timing)
2. Use of funds and plan
3. Valuation logic and return expectations
4. Investor profile and targeting
5. Exit options and path

Be aligned with capital market practice and realistic. Reply in English.

**Format**: Split your answer into separate paragraphs; one main point per paragraph; no special formatting.`,

            'Team': `You are a team and organization expert. In a conversational style, help articulate and present the team's strengths.

${baseContext}

Focus on:
1. Core members' background and fit
2. Team's unique advantages and resources in this space
3. Roles and collaboration
4. Key hires and hiring plan
5. Incentives and culture

Be credible and highlight execution. Reply in English.

**Format**: Use markdown: numbered lists (1. 2. 3.) and **bold** for emphasis.`
        };

        return prompts[section] || `You are a business plan advisor. For the section "${section}", provide professional advice in a conversational style. Reply in English.

${baseContext}

Give detailed, practical strategic advice.`;
    }

    async processStrategyQuery(query, context = {}) {
        const { currentSection } = context;
        const systemPrompt = this.getSectionPrompt(currentSection, context);

        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: query
            }
        ];

        // 策略咨询：需要问问题，所以不跳过默认的对话教练指令
        // 即使有系统消息，也会在 generateResponse 中添加对话教练指令
        return await this.generateResponse(messages, { forceDefaultSystem: true });
    }


    async analyzeWritingChanges(context = {}) {
        const { ideaText, previousIdeaText, previousWritings, currentWritings, currentSection, connectionType, isRefine, allParentIdeas } = context;
        
        // 合并分析：既分析idea变化，也分析writing内容变化
        const writingComparison = this.buildWritingComparison(previousWritings, currentWritings);
        
        const systemPrompt = `You are a meta-reflection and cognitive analysis expert. From a business plan writing perspective, analyze the user's idea changes in concise, natural language.

Requirements:
1. Write only one short paragraph, about 25–50 words.
2. No bullet points or lists.
3. Provide analysis only; do not ask questions.
4. Do not end with a question.
5. Do not use leading phrases like "Do you think", "Why", etc.
6. State the analysis directly; do not ask for the user's opinion.
7. Keep it concise and natural; summarize the core cognitive shift. Reply in English only.`;

        let analysisPrompt = '';
        
        // 细化或分支（替换）类型：都需要对比上一个节点和上上一个节点
        if ((isRefine || connectionType === 'branch') && (previousIdeaText || (allParentIdeas && allParentIdeas.length > 0))) {
            // 细化类型：对比当前节点、上一个节点、上上一个节点
            let previousNodeText = '';
            let previousNodeWritings = '';
            let previousPreviousNodeText = '';
            let previousPreviousNodeWritings = '';
            
            if (allParentIdeas && allParentIdeas.length > 0) {
                // 上一个节点（直接父节点）
                const previousNode = allParentIdeas[0];
                previousNodeText = previousNode.text || '';
                previousNodeWritings = this.formatWritingsForAnalysis(previousNode.writings || {});
                
                // 上上一个节点（如果有的话）
                if (allParentIdeas.length > 1) {
                    const previousPreviousNode = allParentIdeas[1];
                    previousPreviousNodeText = previousPreviousNode.text || '';
                    previousPreviousNodeWritings = this.formatWritingsForAnalysis(previousPreviousNode.writings || {});
                } else {
                    previousPreviousNodeText = '(empty)';
                    previousPreviousNodeWritings = '(empty)';
                }
            } else if (previousIdeaText) {
                previousNodeText = previousIdeaText;
                previousNodeWritings = this.formatWritingsForAnalysis(previousWritings || {});
                previousPreviousNodeText = '(empty)';
                previousPreviousNodeWritings = '(empty)';
            }
            
            const actionType = connectionType === 'branch' ? 'Replace' : 'Refine';
            analysisPrompt = `The user created a new idea via "${actionType}". Compare and analyze:

Node before previous:
Title: ${previousPreviousNodeText}
Content: ${previousPreviousNodeWritings}

Previous node:
Title: ${previousNodeText}
Content: ${previousNodeWritings}

Current node:
Title: ${ideaText || 'Untitled'}
Content: ${this.formatWritingsForAnalysis(currentWritings)}

In one short paragraph (25–50 words), synthesize: what cognitive shift and evolution do the content change (previous→current) and the title change (previous→current) together reflect? If the node before previous is empty, this is the second node; analyze the first node's content and the overall evolution from first to second node. One coherent paragraph only; no lists, no questions. Combine content change and title change in one analysis. Reply in English.`;
        } else {
            // 普通分析
            analysisPrompt = `The user changed the idea:

Previous idea: ${previousIdeaText || 'Unknown'}
New idea: ${ideaText || 'Untitled'}
Section: ${currentSection || 'Unknown'}

Writing content also changed:
${writingComparison}

In one short paragraph (30–50 words), analyze why these changes happened. One coherent paragraph only; no lists, no questions. Reply in English.`;
        }

        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: analysisPrompt
            }
        ];

        // 分析模式：不使用默认的对话教练指令，避免添加问题
        return await this.generateResponse(messages, { skipDefaultSystem: true });
    }
    
    formatWritingsForAnalysis(writings) {
        if (!writings || Object.keys(writings).length === 0) {
            return 'No writing content yet';
        }
        
        const sections = [
            { key: 'userPainPoints', name: 'User Pain Points' },
            { key: 'marketAnalysis', name: 'Market Analysis' },
            { key: 'productIntro', name: 'Product Overview' },
            { key: 'competitiveAnalysis', name: 'Competitive Analysis' },
            { key: 'feasibilityAnalysis', name: 'Feasibility Analysis' },
            { key: 'fundingPlan', name: 'Funding Plan' },
            { key: 'teamIntro', name: 'Team' }
        ];
        
        let formatted = '';
        sections.forEach(section => {
            const content = writings[section.key] || '';
            if (content.trim()) {
                formatted += `\n${section.name}:\n${content}\n`;
            }
        });
        
        return formatted || 'No writing content yet';
    }

    buildWritingComparison(previousWritings, currentWritings) {
        const sections = [
            { key: 'userPainPoints', name: 'User Pain Points' },
            { key: 'marketAnalysis', name: 'Market Analysis' },
            { key: 'productIntro', name: 'Product Overview' },
            { key: 'competitiveAnalysis', name: 'Competitive Analysis' },
            { key: 'feasibilityAnalysis', name: 'Feasibility Analysis' },
            { key: 'fundingPlan', name: 'Funding Plan' },
            { key: 'teamIntro', name: 'Team' }
        ];

        let comparison = '';
        
        sections.forEach(section => {
            const previous = previousWritings?.[section.key] || '';
            const current = currentWritings?.[section.key] || '';
            
            if (current !== previous && current.trim()) {
                comparison += `\n**${section.name}:**\n`;
                if (previous.trim()) {
                    comparison += `Before: ${previous}\n`;
                }
                comparison += `Now: ${current}\n`;
            }
        });

        return comparison || 'No content change';
    }
}

// 创建策略代理实例
const strategyAgent = new StrategyAgent();

// API 路由
app.get('/', (req, res) => {
    res.json({ 
        message: '策略代理后端服务运行中',
        status: 'success',
        timestamp: new Date().toISOString()
    });
});

// 策略咨询API
app.post('/api/strategy', async (req, res) => {
    try {
        const { query, context } = req.body;
        
        if (!query) {
            return res.status(400).json({
                error: 'Query content cannot be empty',
                status: 'error'
            });
        }

        console.log('\n💬 策略查询:');
        console.log('─'.repeat(40));
        console.log('问题:', query);
        console.log('板块:', context.currentSection || '未知');
        console.log('─'.repeat(40));
        
        const result = await strategyAgent.processStrategyQuery(query, context);
        
        res.json({
            status: 'success',
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('策略查询处理错误:', error);
        res.status(500).json({
            error: error.message || 'Internal server error',
            status: 'error'
        });
    }
});


// Writing analysis API
app.post('/api/analyze-writing', async (req, res) => {
    try {
        const { context } = req.body;
        
        console.log('\n📝 写作分析:');
        console.log('─'.repeat(40));
        console.log('前想法:', context.previousIdeaText || '未知');
        console.log('当前想法:', context.ideaText || '未命名');
        console.log('板块:', context.currentSection || '未知');
        console.log('─'.repeat(40));
        
        const result = await strategyAgent.analyzeWritingChanges(context);
        
        res.json({
            status: 'success',
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('用户影响因素分析错误:', error);
        res.status(500).json({
            error: error.message || 'Internal server error',
            status: 'error'
        });
    }
});

// Save chat record API
app.post('/api/save-chat', async (req, res) => {
    try {
        if (!checkDatabaseConnection()) {
            return res.status(503).json({
                error: 'Database not connected; cannot save chat record',
                status: 'error'
            });
        }
        
        const { user_id, task_type, idea_id, idea_name, section_id, section_name, message_type, content, timestamp } = req.body;
        
        const chatRecord = {
            user_id,
            task_type,
            idea_id: idea_id || null,
            idea_name: idea_name || null,
            section_id: section_id || null,
            section_name: section_name || null,
            message_type,
            content,
            timestamp: new Date(timestamp),
            created_at: new Date()
        };
        
        const result = await chatRecordsCollection.insertOne(chatRecord);
        
        console.log(`✅ 聊天记录已保存: 用户${user_id} - ${message_type}消息`);
        
        // 更新用户统计
        await updateUserStats(user_id, task_type);
        
        res.json({ 
            status: 'success', 
            message: '聊天记录已保存',
            id: result.insertedId 
        });
        
    } catch (error) {
        console.error('保存聊天记录错误:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取聊天记录API (管理员用)
app.get('/api/admin/chat-records', async (req, res) => {
    try {
        if (!checkDatabaseConnection()) {
            return res.status(503).json({
                error: 'Database not connected; cannot load chat records',
                status: 'error'
            });
        }
        
        const { user_id, task_type, limit = 100, offset = 0 } = req.query;
        
        // 构建查询条件
        const query = {};
        if (user_id) {
            query.user_id = user_id;
        }
        if (task_type) {
            query.task_type = task_type;
        }
        
        // 获取总数
        const total = await chatRecordsCollection.countDocuments(query);
        
        // 获取记录
        const records = await chatRecordsCollection
            .find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .toArray();
        
        console.log(`📊 返回 ${records.length} 条聊天记录，总计 ${total} 条`);
        res.json({
            status: 'success',
            data: records,
            total: total
        });
        
    } catch (error) {
        console.error('获取聊天记录错误:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取用户统计API (管理员用)
app.get('/api/admin/user-stats', async (req, res) => {
    try {
        if (!checkDatabaseConnection()) {
            return res.status(503).json({
                error: 'Database not connected; cannot load user stats',
                status: 'error'
            });
        }
        
        const stats = await userStatsCollection
            .find({})
            .sort({ last_active: -1 })
            .toArray();
        
        res.json({
            status: 'success',
            data: stats
        });
        
    } catch (error) {
        console.error('获取用户统计错误:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 删除聊天记录API (管理员用)
app.delete('/api/admin/delete-chat-records', async (req, res) => {
    try {
        if (!checkDatabaseConnection()) {
            return res.status(503).json({
                error: 'Database not connected; cannot delete chat records',
                status: 'error'
            });
        }
        
        const { record_ids } = req.body;
        
        if (!record_ids || !Array.isArray(record_ids) || record_ids.length === 0) {
            return res.status(400).json({ error: 'Please provide record IDs to delete' });
        }
        
        // 将字符串ID转换为ObjectId
        const { ObjectId } = require('mongodb');
        const objectIds = record_ids.map(id => new ObjectId(id));
        
        const result = await chatRecordsCollection.deleteMany({
            _id: { $in: objectIds }
        });
        
        console.log(`🗑️ 成功删除 ${result.deletedCount} 条聊天记录`);
        res.json({
            status: 'success',
            message: '聊天记录删除成功',
            deleted_count: result.deletedCount
        });
        
    } catch (error) {
        console.error('删除聊天记录错误:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 删除用户统计API (管理员用)
app.delete('/api/admin/delete-user-stats', async (req, res) => {
    try {
        if (!checkDatabaseConnection()) {
            return res.status(503).json({
                error: 'Database not connected; cannot delete user stats',
                status: 'error'
            });
        }
        
        const { stat_ids } = req.body;
        
        if (!stat_ids || !Array.isArray(stat_ids) || stat_ids.length === 0) {
            return res.status(400).json({ error: 'Please provide stat IDs to delete' });
        }
        
        // 将字符串ID转换为ObjectId
        const { ObjectId } = require('mongodb');
        const objectIds = stat_ids.map(id => new ObjectId(id));
        
        const result = await userStatsCollection.deleteMany({
            _id: { $in: objectIds }
        });
        
        console.log(`🗑️ 成功删除 ${result.deletedCount} 条用户统计记录`);
        res.json({
            status: 'success',
            message: '用户统计删除成功',
            deleted_count: result.deletedCount
        });
        
    } catch (error) {
        console.error('删除用户统计错误:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 更新用户统计
async function updateUserStats(userId, taskType) {
    try {
        if (!checkDatabaseConnection()) {
            console.warn('⚠️  数据库未连接，跳过更新用户统计');
            return;
        }
        
        await userStatsCollection.updateOne(
            { user_id: userId },
            {
                $inc: { total_messages: 1 },
                $set: { 
                    last_active: new Date(),
                    task_type: taskType
                },
                $setOnInsert: {
                    user_id: userId,
                    total_ideas: 0,
                    created_at: new Date()
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('更新用户统计失败:', error);
    }
}

// 保存用户界面状态API
app.post('/api/save-state', async (req, res) => {
    try {
        if (!checkDatabaseConnection()) {
            return res.status(503).json({
                error: 'Database not connected; cannot save UI state',
                status: 'error'
            });
        }
        
        const { user_id, task_type, state } = req.body;
        
        if (!user_id || !task_type || !state) {
            return res.status(400).json({
                error: 'Missing required parameters',
                status: 'error'
            });
        }
        
        const userState = {
            user_id,
            task_type,
            state: {
                ideas: state.ideas || [],
                ideaWritings: state.ideaWritings || {},
                ideaChats: state.ideaChats || {},
                selectedIdeaId: state.selectedIdeaId || null,
                selectedFrameworkId: state.selectedFrameworkId || 1,
                documentViewIdeaId: state.documentViewIdeaId || null,
                generatedIdeas: state.generatedIdeas || {},
                ...state
            },
            updated_at: new Date()
        };
        
        const result = await userStatesCollection.updateOne(
            { user_id, task_type },
            { $set: userState },
            { upsert: true }
        );
        
        console.log(`✅ 用户界面状态已保存: 用户${user_id} - ${task_type}`);
        
        res.json({
            status: 'success',
            message: '界面状态已保存',
            id: result.upsertedId || result.modifiedCount
        });
        
    } catch (error) {
        console.error('保存界面状态错误:', error);
        res.status(500).json({
            error: 'Internal server error',
            status: 'error'
        });
    }
});

// Load UI state API
app.get('/api/load-state', async (req, res) => {
    try {
        if (!checkDatabaseConnection()) {
            return res.status(503).json({
                error: 'Database not connected; cannot load UI state',
                status: 'error'
            });
        }
        
        const { user_id, task_type } = req.query;
        
        if (!user_id || !task_type) {
            return res.status(400).json({
                error: 'Missing required parameters',
                status: 'error'
            });
        }
        
        const userState = await userStatesCollection.findOne({
            user_id,
            task_type
        });
        
        if (!userState) {
            return res.json({
                status: 'success',
                data: null,
                message: '未找到保存的状态'
            });
        }
        
        console.log(`✅ 用户界面状态已加载: 用户${user_id} - ${task_type}`);
        
        res.json({
            status: 'success',
            data: userState.state,
            updated_at: userState.updated_at
        });
        
    } catch (error) {
        console.error('加载界面状态错误:', error);
        res.status(500).json({
            error: '服务器内部错误',
            status: 'error'
        });
    }
});

// GPT 连通性检测（排查「GPT 无法使用」时可在浏览器访问此接口）
app.get('/api/gpt-status', async (req, res) => {
    try {
        await strategyAgent.generateResponse([{ role: 'user', content: 'ping' }], { forceDefaultSystem: true, skipDefaultSystem: true });
        res.json({ ok: true, message: 'GPT service available' });
    } catch (err) {
        console.error('GPT 状态检测失败:', err.message);
        res.status(503).json({
            ok: false,
            error: err.message || 'GPT service unavailable',
            hint: 'Check: 1) Server can reach DEEPSEEK_BASE_URL  2) DEEPSEEK_API_KEY is valid'
        });
    }
});

// 健康检查API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('未处理的错误:', err);
    res.status(500).json({
        error: 'Internal server error',
        status: 'error'
    });
});

// 404 处理
app.use('*', (req, res) => {
    // 如果是生产环境且不是 API 请求，返回前端应用
    if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../build/index.html'));
    } else {
        res.status(404).json({
        error: 'Not found',
        status: 'error'
        });
    }
});

// 启动服务器 - 监听所有网络接口（0.0.0.0）以便外网访问
const PUBLIC_URL = process.env.SERVER_PUBLIC_URL || `http://43.138.178.98:${PORT}`;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 策略代理后端服务启动成功！`);
    console.log(`📡 服务地址: ${PUBLIC_URL}`);
    console.log(`🤖 GPT API configured: ${GPT_API_URL ? 'Yes' : 'No'} (URL from DEEPSEEK_BASE_URL)`);
    console.log(`🔗 API 文档:`);
    console.log(`   GET  / - 服务状态`);
    console.log(`   POST /api/strategy - 策略咨询`);
    console.log(`   POST /api/analyze-writing - 用户影响因素分析`);
    console.log(`   GET  /api/health - 健康检查`);
    console.log(`   GET  /api/gpt-status - GPT 连通性检测（排查 GPT 不可用时访问）`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = app;


