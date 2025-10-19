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
const GPT_API_URL = "https://tbnx.plus7.plus/v1/chat/completions";
const GPT_API_KEY = "sk-Jc6pIOYsdGyPfrFXKQX4WnTISwUmKUKtaofbS3LnExgkPwT7";

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
                content: `你是一位"创业反思教练"，负责为用户提供全面、深入的分析和建议时，既回答问题又引导用户思考。

你的核心职责：
1. 首先回答用户的具体问题，提供专业建议和分析
2. 在回答的基础上，适当提出1-2个开放式问题引导用户深入思考
3. 帮助用户经历从记忆 → 理解 → 应用 → 分析 → 评价 → 创造的思维过程
4. 在单次回答中包含所有相关信息，避免分多轮回答


回答风格：
- 先给出专业、具体的答案和建议，提供数据支撑和逻辑推理
- 然后根据用户的思考阶段，选择合适层级提出引导性问题，如"你觉得这个方案如何？""还有什么其他考虑吗？"
- 语气温和、鼓励、探究，帮助用户觉察自己的思维方式和决策依据

记住：要先回答问题，再引导思考，而不是只提问不回答，不要分成多轮对话。`
            };

            // 将系统instruction添加到消息列表的开头
            const messagesWithSystem = [systemInstruction, ...messages];

            const response = await axios.post(this.apiUrl, {
                model: "deepseek-chat",
                messages: messagesWithSystem,
                temperature: 0.7,
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30秒超时
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
        const { ideaText, previousIdeaText, previousWritings, currentWritings, currentSection } = context;
        
        // 合并分析：既分析idea变化，也分析writing内容变化
        const writingComparison = this.buildWritingComparison(previousWritings, currentWritings);
        
        const systemPrompt = `你是一个认知分析专家。请根据分析用户的想法变化和写作内容变化的，简略分析用户为什么会改变想法，只写一段变化的原因，不用后续的引导思考的问题。

前一个想法：${previousIdeaText || '未知'}
当前板块想法：${ideaText || '未命名'}
当前板块：${currentSection || '未知'}

写作内容变化：
${writingComparison}`;

        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: "请分析用户的想法变化和影响因素"
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


