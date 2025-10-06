const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// GPT API 配置
const GPT_API_URL = "https://aigc-api.hkust-gz.edu.cn/v1/chat/completions";
const GPT_API_KEY = "77f41932a23a429cb68b84e3cd7c8321914531b95d8d48b8a21dc1f983ec51ea";

// 策略代理实现
class StrategyAgent {
    constructor() {
        this.apiUrl = GPT_API_URL;
        this.apiKey = GPT_API_KEY;
    }

    async generateResponse(messages) {
        try {
            const response = await axios.post(this.apiUrl, {
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('GPT API 调用错误:', error.response?.data || error.message);
            throw new Error('AI 服务暂时不可用');
        }
    }

    getSectionPrompt(section, context = {}) {
        const { ideaText, currentSectionContent, allWritings } = context;
        
        const baseContext = `
当前想法：${ideaText || '未命名'}
当前板块内容：${currentSectionContent || '暂无'}`;

        const prompts = {
            '用户痛点': `你是一个用户研究专家。帮助分析和识别目标用户的核心痛点。

${baseContext}

重点关注：
1. 目标用户群体的精准定位（人群特征、场景、行为）
2. 痛点的严重程度和紧迫性
3. 用户当前的解决方案及其不足
4. 痛点背后的深层需求
5. 用户为解决痛点的付费意愿

回答要客观、具体、基于真实场景。

**格式要求**：请使用markdown格式输出，包括：
- 使用有序列表(1. 2. 3.)组织要点
- 使用**加粗**标记重点内容
- 段落之间留空行`,

            '市场分析': `你是一个市场分析专家。帮助分析市场规模、趋势和机会。

${baseContext}

重点关注：
1. 目标市场的规模（TAM/SAM/SOM）
2. 市场增长趋势和驱动因素
3. 市场细分和目标细分市场选择
4. 行业发展阶段和成熟度
5. 政策、技术等外部环境影响

提供数据支持和逻辑推理，保持客观分析。

**格式要求**：请使用markdown格式输出，包括：
- 使用有序列表(1. 2. 3.)组织要点
- 使用**加粗**标记重点内容
- 段落之间留空行`,

            '产品介绍': `你是一个产品策略专家。帮助定义和完善产品方案。

${baseContext}

重点关注：
1. 产品的核心功能和价值主张
2. 产品如何解决用户痛点
3. 产品的差异化特点和创新点
4. 使用场景和用户体验
5. MVP规划和产品迭代路线

建议要具体可落地，关注用户价值。

**格式要求**：请使用markdown格式输出，包括：
- 使用有序列表(1. 2. 3.)组织要点
- 使用**加粗**标记重点内容
- 段落之间留空行`,

            '竞争分析': `你是一个竞争战略专家。帮助分析竞争格局和差异化策略。

${baseContext}

重点关注：
1. 主要竞争对手的产品、定价、市场策略
2. 各竞争对手的优劣势分析
3. 替代方案和潜在竞争者
4. 差异化竞争优势的建立
5. 竞争壁垒和护城河构建

分析要客观全面，策略要可执行。

**格式要求**：请使用markdown格式输出，包括：
- 使用有序列表(1. 2. 3.)组织要点
- 使用**加粗**标记重点内容
- 段落之间留空行`,

            '可行性分析': `你是一个商业可行性分析专家。帮助评估项目的实施可行性。

${baseContext}

重点关注：
1. 技术可行性（技术难点、实现方案、团队能力）
2. 运营可行性（资源需求、供应链、运营模式）
3. 财务可行性（成本结构、收入模型、盈利周期）
4. 风险识别与应对策略
5. 关键里程碑和时间规划

评估要理性、全面，风险要充分暴露。

**格式要求**：请使用markdown格式输出，包括：
- 使用有序列表(1. 2. 3.)组织要点
- 使用**加粗**标记重点内容
- 段落之间留空行`,

            '融资计划': `你是一个融资策略专家。帮助制定融资策略和投资人沟通方案。

${baseContext}

重点关注：
1. 融资需求（金额、轮次、时间）
2. 资金用途和使用计划
3. 估值逻辑和投资回报预期
4. 投资人画像和选择策略
5. 退出机制和路径规划

建议要符合资本市场规律，务实可行。

**格式要求**：请使用markdown格式输出，包括：
- 使用有序列表(1. 2. 3.)组织要点
- 使用**加粗**标记重点内容
- 段落之间留空行`,

            '团队介绍': `你是一个团队建设和组织发展专家。帮助构建和展示团队优势。

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
- 使用**加粗**标记重点内容
- 段落之间留空行`
        };

        return prompts[section] || `你是一个商业计划顾问。针对"${section}"板块提供专业建议。

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

    async generateFollowUpQuestions(context = {}) {
        const { ideaText, currentSection, currentSectionContent, chatHistory, userQuestion } = context;
        
        // 构建聊天历史文本
        const chatHistoryText = chatHistory && chatHistory.length > 0
            ? chatHistory.map(msg => `${msg.type === 'user' ? '用户' : 'AI'}：${msg.content}`).join('\n')
            : '暂无对话历史';
        
        // 如果有用户问题，进行反思式回答
        if (userQuestion) {
            const systemPrompt = `你是一个商业计划反思专家。用户向你提出了一个问题，请结合对话历史和上下文，进行深入的反思性回答。

当前想法：${ideaText || '未命名'}
当前板块：${currentSection || '未知'}
当前板块内容：${currentSectionContent || '暂无'}

对话历史：
${chatHistoryText}

用户的问题：${userQuestion}

要求：
1. 深入分析用户的问题，提供有洞察力的回答
2. 结合对话历史和当前内容，给出具体建议
3. 指出可能存在的风险和机会
4. 提供可执行的行动建议
5. 使用markdown格式输出，包括有序列表和加粗重点`;

            const messages = [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userQuestion
                }
            ];

            return await this.generateResponse(messages);
        } else {
            // 没有用户问题，生成推荐问题
            const systemPrompt = `你是一个商业计划分析工具。根据对话历史和上下文，生成3个客观的后续提问，帮助深化思考。

当前想法：${ideaText || '未命名'}
当前板块：${currentSection || '未知'}
当前板块内容：${currentSectionContent || '暂无'}

对话历史：
${chatHistoryText}

要求：
1. 基于已讨论内容，提出更深层次的问题
2. 发现潜在盲点和未考虑的方面
3. 问题要客观、直接、简洁
4. 使用"可以...怎么样"、"如何..."、"是否..."等客观表达
5. 不使用"您"、"我"等主观称呼，保持工具式的客观提问风格

示例风格：
- "可以从哪些渠道获取目标用户？"
- "如何验证这个市场需求的真实性？"
- "竞争对手的定价策略是什么？"

请只返回3个问题，每行一个问题，不要编号、不要解释。`;

            const messages = [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: "请生成推荐的后续问题"
                }
            ];

            return await this.generateResponse(messages);
        }
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

        console.log('收到策略查询:', query);
        
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

// 反思推荐问题API
app.post('/api/reflect', async (req, res) => {
    try {
        const { context } = req.body;
        
        console.log('收到推荐问题生成请求');
        
        const result = await strategyAgent.generateFollowUpQuestions(context);
        
        res.json({
            status: 'success',
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('推荐问题生成错误:', error);
        res.status(500).json({
            error: error.message || '服务器内部错误',
            status: 'error'
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
    console.log(`   POST /api/reflect - 生成推荐问题`);
    console.log(`   GET  /api/health - 健康检查`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = app;


