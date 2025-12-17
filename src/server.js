const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'bptutor';
let db;
let chatRecordsCollection;
let userStatsCollection;
let ideasCollection;

// 初始化MongoDB连接
async function initDatabase() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ MongoDB连接成功');
        
        db = client.db(DB_NAME);
        chatRecordsCollection = db.collection('chat_records');
        userStatsCollection = db.collection('user_stats');
        ideasCollection = db.collection('ideas');
        
        // 创建索引
        await chatRecordsCollection.createIndex({ user_id: 1, timestamp: -1 });
        await chatRecordsCollection.createIndex({ task_type: 1 });
        await userStatsCollection.createIndex({ user_id: 1 }, { unique: true });
        await ideasCollection.createIndex({ user_id: 1 }, { unique: true });
        
        console.log('✅ 数据库集合和索引创建成功');
    } catch (error) {
        console.error('❌ MongoDB连接失败:', error.message);
        process.exit(1);
    }
}

// 启动时初始化数据库
initDatabase();

// 中间件
app.use(cors());
app.use(express.json());

// GPT API 配置
const GPT_API_URL = "https://www.chataiapi.com/v1";
const GPT_API_KEY = "sk-dFBayXlPXhpYCJ0OtxjYqxE2CSwrfC9XtUxARh8Rte3OsaFc";

// 策略代理实现
class StrategyAgent {
    constructor() {
        this.apiUrl = GPT_API_URL;
        this.apiKey = GPT_API_KEY;
    }

    async generateResponse(messages) {
        try {
            // 系统级instruction - 创业反思教练
            const systemInstruction = {
                role: "system",
                content: `你是一位"创业反思教练"，负责通过多轮对话帮助用户深入思考创业问题。

你的核心职责：
1. 每次回答要简洁、聚焦，控制在200-300字左右
2. 先给出当前问题的核心答案或建议
3. 每次回答后提出1个开放式问题，引导用户继续思考
4. 通过多轮对话逐步深入，帮助用户从表面思考到深层反思
5. 避免一次性输出过多信息

回答风格：
- 简洁有力，直接回答用户的问题
- 每次只讨论1-2个核心点，不要列太多要点
- 用温和、鼓励的语气进行引导
- 每个回答的结尾必须包含一个引导性问题

记住：保持对话的节奏感，让用户有时间消化每次的回答。分多轮进行，不要一次说完所有内容。`
            };

            // 将系统instruction添加到消息列表的开头
            const messagesWithSystem = [systemInstruction, ...messages];

            const response = await axios.post(`${this.apiUrl}/chat/completions`, {
                model: "deepseek-chat", // 使用普通模型，响应更快。如需推理模式，使用 "deepseek-r1"
                messages: messagesWithSystem,
                temperature: 0.7,
                max_tokens: 400
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
            // 详细的错误信息
            if (error.code === 'ENOTFOUND') {
                console.error('GPT API 域名解析失败:', error.message);
                throw new Error('AI 服务域名无法访问，请检查网络连接');
            } else if (error.code === 'ECONNREFUSED') {
                console.error('GPT API 连接被拒绝:', error.message);
                throw new Error('AI 服务连接被拒绝，服务可能已停止');
            } else if (error.code === 'ETIMEDOUT') {
                console.error('GPT API 请求超时:', error.message);
                throw new Error('AI 服务响应超时，请稍后重试');
            } else {
                console.error('GPT API 调用错误:', error.response?.data || error.message);
                throw new Error('AI 服务暂时不可用');
            }
        }
    }

    getSectionPrompt(section, context = {}) {
        const { ideaText, currentSectionContent, allWritings } = context;
        
        const baseContext = `
当前想法：${ideaText || '未命名'}
当前板块内容：${currentSectionContent || '暂无'}`;

        const prompts = {
            '用户痛点': `你是一个用户研究专家。按照朋友之间的交流形式，帮助分析和识别目标用户的核心痛点。

${baseContext}

重点关注：
1. 目标用户群体的精准定位（人群特征、场景、行为）
2. 痛点的严重程度和紧迫性
3. 用户当前的解决方案及其不足
4. 痛点背后的深层需求
5. 用户为解决痛点的付费意愿

回答要客观、具体、基于真实场景。

**格式要求**：请将回答分成多个独立的段落：
- 每个要点用单独的段落表达
- 段落之间用空行分隔
- 每个段落聚焦一个核心要点
- 直接输出文本内容，不需要特殊格式`,

            '市场分析': `你是一个市场分析专家。通过对话的形式，帮助分析市场规模、趋势和机会。

${baseContext}

重点关注：
1. 目标市场的规模（TAM/SAM/SOM）
2. 市场增长趋势和驱动因素
3. 市场细分和目标细分市场选择
4. 行业发展阶段和成熟度
5. 政策、技术等外部环境影响

提供数据支持和逻辑推理，保持客观分析。

**格式要求**：请将回答分成多个独立的段落：
- 每个要点用单独的段落表达
- 段落之间用空行分隔
- 每个段落聚焦一个核心要点
- 直接输出文本内容，不需要特殊格式`,

            '产品介绍': `你是一个产品策略专家。通过对话的形式，帮助定义和完善产品方案。

${baseContext}

重点关注：
1. 产品的核心功能和价值主张
2. 产品如何解决用户痛点
3. 产品的差异化特点和创新点
4. 使用场景和用户体验
5. MVP规划和产品迭代路线

建议要具体可落地，关注用户价值。

**格式要求**：请将回答分成多个独立的段落：
- 每个要点用单独的段落表达
- 段落之间用空行分隔
- 每个段落聚焦一个核心要点
- 直接输出文本内容，不需要特殊格式`,

            '竞争分析': `你是一个竞争战略专家。通过对话的形式，帮助分析竞争格局和差异化策略。

${baseContext}

重点关注：
1. 主要竞争对手的产品、定价、市场策略
2. 各竞争对手的优劣势分析
3. 替代方案和潜在竞争者
4. 差异化竞争优势的建立
5. 竞争壁垒和护城河构建

分析要客观全面，策略要可执行。

**格式要求**：请将回答分成多个独立的段落：
- 每个要点用单独的段落表达
- 段落之间用空行分隔
- 每个段落聚焦一个核心要点
- 直接输出文本内容，不需要特殊格式`,

            '可行性分析': `你是一个商业可行性分析专家。通过对话的形式，帮助评估项目的实施可行性。

${baseContext}

重点关注：
1. 技术可行性（技术难点、实现方案、团队能力）
2. 运营可行性（资源需求、供应链、运营模式）
3. 财务可行性（成本结构、收入模型、盈利周期）
4. 风险识别与应对策略
5. 关键里程碑和时间规划

评估要理性、全面，风险要充分暴露。

**格式要求**：请将回答分成多个独立的段落：
- 每个要点用单独的段落表达
- 段落之间用空行分隔
- 每个段落聚焦一个核心要点
- 直接输出文本内容，不需要特殊格式`,

            '融资计划': `你是一个融资策略专家。通过对话的形式，帮助制定融资策略和投资人沟通方案。

${baseContext}

重点关注：
1. 融资需求（金额、轮次、时间）
2. 资金用途和使用计划
3. 估值逻辑和投资回报预期
4. 投资人画像和选择策略
5. 退出机制和路径规划

建议要符合资本市场规律，务实可行。

**格式要求**：请将回答分成多个独立的段落：
- 每个要点用单独的段落表达
- 段落之间用空行分隔
- 每个段落聚焦一个核心要点
- 直接输出文本内容，不需要特殊格式`,

            '团队介绍': `你是一个团队建设和组织发展专家。通过对话的形式，帮助构建和展示团队优势。

${baseContext}

重点关注：
1. 核心团队成员的背景和能力匹配度
2. 团队在该领域的独特优势和资源
3. 团队分工和协作机制
4. 关键岗位的招聘规划
5. 激励机制和企业文化建设

展示要真实可信，突出团队执行力。

**格式要求**：请使用markdown格式输出，包括：
- 使用有序列表(1. 2. 3.)组织要点
- 使用**加粗**标记重点内容`
        };

        return prompts[section] || `你是一个商业计划顾问。针对"${section}"板块通过对话的形式，提供专业建议。

${baseContext}

请提供详细、实用的策略建议。`;
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

        return await this.generateResponse(messages);
    }


    async analyzeWritingChanges(context = {}) {
        const { ideaText, previousIdeaText, parentChainText, parentChain, previousWritings, currentWritings, currentSection, connectionType } = context;
        
        // 合并分析：既分析idea变化，也分析writing内容变化
        const writingComparison = this.buildWritingComparison(previousWritings, currentWritings);
        
        // 根据连接类型设置不同的分析重点
        let systemPrompt = '';
        let analysisFocus = '';
        
        if (connectionType === 'refine') {
            // 细化：分析用户细化了什么
            systemPrompt = `你是一个创业认知分析专家。分析用户如何细化创业想法，用简洁自然的语言说明用户细化了什么方面或维度，不要使用固定的格式或结构。每次分析都采用不同的表达方式。

**重要要求**：只返回第一段总结性分析（1-2句话），说明用户细化了什么，不要展开详细分析，不要列举特征，不要提问。保持简洁，只说明核心细化内容。`;
            analysisFocus = '请用1-2句话简洁地总结用户细化了什么方面或维度，不要展开详细分析。';
        } else if (connectionType === 'branch') {
            // 分支：对比分析新想法与父节点链
            systemPrompt = `你是一个创业认知分析专家。分析用户创建的新分支创业想法，需要对比新想法与整个父节点链（所有之前的想法）的差异。用简洁自然的语言说明新想法与之前想法的对比，突出新想法的不同之处或改进点，不要使用固定的格式或结构。每次分析都采用不同的表达方式。

**重要要求**：
1. 必须考虑整个父节点链的所有信息（从根节点到直接父节点）
2. 对比新想法与父节点链的差异，说明新想法的特点
3. 只返回第一段总结性分析（1-2句话），不要展开详细分析，不要列举特征，不要提问
4. 保持简洁，只说明核心对比内容`;
            analysisFocus = '请用1-2句话简洁地对比新想法与父节点链的差异，说明新想法的特点，不要展开详细分析。';
        } else {
            // 默认：通用分析
            systemPrompt = `你是一个创业认知分析专家。分析用户的创业想法变化，用简洁自然的语言说明变化原因，不要使用固定的格式或结构。每次分析都采用不同的表达方式。避免使用"从未知到..."这样的表述，如果前一个想法为空，直接分析新想法的特点。

**重要要求**：只返回第一段总结性分析（1-2句话），不要展开详细分析，不要列举特征，不要提问。保持简洁，只说明核心变化或特点。`;
            analysisFocus = '请用1-2句话简洁地总结这个想法的特点或变化原因，不要展开详细分析。';
        }

        // 构建用户消息内容
        let userContent = '';
        
        if (connectionType === 'branch' && parentChain && parentChain.length > 0) {
            // 分支：需要展示整个父节点链
            const chainDescription = parentChain.map((node, index) => {
                return `${index + 1}. ${node.text || '未命名'}`;
            }).join('\n');
            
            userContent = `用户${currentSection || '创建了新分支想法'}：

父节点链（从根节点到直接父节点）：
${chainDescription}

新想法：${ideaText || '未命名'}`;
            
            // 如果有父节点链的文本描述，也加入
            if (parentChainText && parentChainText.trim()) {
                userContent += `\n\n父节点链路径：${parentChainText}`;
            }
        } else if (previousIdeaText && previousIdeaText.trim()) {
            // 如果有前一个想法，分析变化
            userContent = `用户${currentSection || '创建了新想法'}：

前一个想法：${previousIdeaText}
新想法：${ideaText || '未命名'}`;
        } else {
            // 如果没有前一个想法，直接分析新想法
            userContent = `用户${currentSection || '创建了新想法'}：

新想法：${ideaText || '未命名'}`;
        }
        
        if (writingComparison && writingComparison !== '暂无内容变化') {
            userContent += `\n\n同时写作内容也有变化：\n${writingComparison}`;
        }
        
        userContent += `\n\n${analysisFocus}`;

        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: userContent
            }
        ];

        return await this.generateResponse(messages);
    }

    buildWritingComparison(previousWritings, currentWritings) {
        const sections = [
            { key: 'userPainPoints', name: '用户痛点' },
            { key: 'marketAnalysis', name: '市场分析' },
            { key: 'productIntro', name: '产品介绍' },
            { key: 'competitiveAnalysis', name: '竞争分析' },
            { key: 'feasibilityAnalysis', name: '可行性分析' },
            { key: 'fundingPlan', name: '融资计划' },
            { key: 'teamIntro', name: '团队介绍' }
        ];

        let comparison = '';
        
        sections.forEach(section => {
            const previous = previousWritings?.[section.key] || '';
            const current = currentWritings?.[section.key] || '';
            
            if (current !== previous && current.trim()) {
                comparison += `\n**${section.name}：**\n`;
                if (previous.trim()) {
                    comparison += `之前：${previous}\n`;
                }
                comparison += `现在：${current}\n`;
            }
        });

        return comparison || '暂无内容变化';
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
                error: '查询内容不能为空',
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
            error: error.message || '服务器内部错误',
            status: 'error'
        });
    }
});


// 写作内容分析API
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
            error: error.message || '服务器内部错误',
            status: 'error'
        });
    }
});

// 保存聊天记录API
app.post('/api/save-chat', async (req, res) => {
    try {
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
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取用户聊天历史API
app.get('/api/chat-history', async (req, res) => {
    try {
        const { user_id, task_type } = req.query;
        
        if (!user_id || !task_type) {
            return res.status(400).json({ 
                error: '缺少必要参数',
                status: 'error'
            });
        }
        
        // 构建查询条件
        const query = {
            user_id: user_id,
            task_type: task_type
        };
        
        // 获取记录，按时间正序排列（最早的在前）
        const records = await chatRecordsCollection
            .find(query)
            .sort({ timestamp: 1 })
            .toArray();
        
        console.log(`📊 返回用户 ${user_id} 的 ${records.length} 条聊天记录`);
        res.json({
            status: 'success',
            data: records
        });
        
    } catch (error) {
        console.error('获取聊天历史错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取聊天记录API (管理员用)
app.get('/api/admin/chat-records', async (req, res) => {
    try {
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
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取用户统计API (管理员用)
app.get('/api/admin/user-stats', async (req, res) => {
    try {
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
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 删除聊天记录API (管理员用)
app.delete('/api/admin/delete-chat-records', async (req, res) => {
    try {
        const { record_ids } = req.body;
        
        if (!record_ids || !Array.isArray(record_ids) || record_ids.length === 0) {
            return res.status(400).json({ error: '请提供要删除的记录ID列表' });
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
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 删除用户统计API (管理员用)
app.delete('/api/admin/delete-user-stats', async (req, res) => {
    try {
        const { stat_ids } = req.body;
        
        if (!stat_ids || !Array.isArray(stat_ids) || stat_ids.length === 0) {
            return res.status(400).json({ error: '请提供要删除的统计ID列表' });
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
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 更新用户统计
async function updateUserStats(userId, taskType) {
    try {
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

// 保存用户ideas数据API
app.post('/api/save-ideas', async (req, res) => {
    try {
        const { user_id, ideas, ideaWritings, ideaChats, generatedIdeas, previousWritings, canvasState } = req.body;
        
        if (!user_id) {
            return res.status(400).json({ error: '缺少user_id参数' });
        }
        
        const userData = {
            user_id,
            ideas: ideas || [],
            ideaWritings: ideaWritings || {},
            ideaChats: ideaChats || {},
            generatedIdeas: generatedIdeas || {},
            previousWritings: previousWritings || {},
            canvasState: canvasState || { zoomLevel: 1, canvasOffset: { x: 0, y: 0 } },
            updated_at: new Date()
        };
        
        const result = await ideasCollection.updateOne(
            { user_id },
            { $set: userData },
            { upsert: true }
        );
        
        console.log(`✅ 用户 ${user_id} 的ideas数据已保存到MongoDB`);
        res.json({
            status: 'success',
            message: 'ideas数据已保存'
        });
        
    } catch (error) {
        console.error('保存ideas数据错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取用户ideas数据API
app.get('/api/load-ideas', async (req, res) => {
    try {
        const { user_id } = req.query;
        
        if (!user_id) {
            return res.status(400).json({ error: '缺少user_id参数' });
        }
        
        const userData = await ideasCollection.findOne({ user_id });
        
        if (!userData) {
            return res.json({
                status: 'success',
                data: {
                    ideas: [],
                    ideaWritings: {},
                    ideaChats: {},
                    generatedIdeas: {},
                    previousWritings: {},
                    canvasState: { zoomLevel: 1, canvasOffset: { x: 0, y: 0 } }
                }
            });
        }
        
        console.log(`📊 从MongoDB返回用户 ${user_id} 的ideas数据`);
        res.json({
            status: 'success',
            data: {
                ideas: userData.ideas || [],
                ideaWritings: userData.ideaWritings || {},
                ideaChats: userData.ideaChats || {},
                generatedIdeas: userData.generatedIdeas || {},
                previousWritings: userData.previousWritings || {},
                canvasState: userData.canvasState || { zoomLevel: 1, canvasOffset: { x: 0, y: 0 } }
            }
        });
        
    } catch (error) {
        console.error('获取ideas数据错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
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
        error: '服务器内部错误',
        status: 'error'
    });
});

// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: '接口不存在',
        status: 'error'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 策略代理后端服务启动成功！`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🔗 API 文档:`);
    console.log(`   GET  / - 服务状态`);
    console.log(`   POST /api/strategy - 策略咨询`);
    console.log(`   POST /api/analyze-writing - 用户影响因素分析`);
    console.log(`   GET  /api/health - 健康检查`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = app;


