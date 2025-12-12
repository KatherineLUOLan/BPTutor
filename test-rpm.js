const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:5050';
const CONCURRENT_USERS = 100; // 并发用户数
const TEST_DURATION = 60; // 测试持续时间（秒）
const ENDPOINTS = [
    {
        method: 'GET',
        path: '/api/health',
        name: '健康检查'
    },
    {
        method: 'POST',
        path: '/api/strategy',
        name: '策略咨询',
        data: {
            query: '如何分析目标用户痛点？',
            context: {
                currentSection: '用户痛点',
                ideaText: '测试想法'
            }
        }
    }
];

// 统计信息
let stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [],
    errors: [],
    startTime: null,
    endTime: null
};

// 发送单个请求
async function sendRequest(endpoint) {
    const startTime = Date.now();
    
    try {
        const config = {
            method: endpoint.method,
            url: `${BASE_URL}${endpoint.path}`,
            timeout: 30000 // 30秒超时
        };
        
        if (endpoint.data) {
            config.data = endpoint.data;
        }
        
        const response = await axios(config);
        const responseTime = Date.now() - startTime;
        
        stats.totalRequests++;
        stats.successfulRequests++;
        stats.responseTimes.push(responseTime);
        
        return {
            success: true,
            status: response.status,
            responseTime,
            endpoint: endpoint.name
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        stats.totalRequests++;
        stats.failedRequests++;
        stats.responseTimes.push(responseTime);
        stats.errors.push({
            endpoint: endpoint.name,
            error: error.message,
            status: error.response?.status || 'N/A',
            responseTime
        });
        
        return {
            success: false,
            error: error.message,
            status: error.response?.status || 'N/A',
            responseTime,
            endpoint: endpoint.name
        };
    }
}

// 模拟单个用户持续发送请求
async function simulateUser(userId) {
    const userStartTime = Date.now();
    let requestCount = 0;
    
    while (Date.now() - userStartTime < TEST_DURATION * 1000) {
        // 随机选择一个端点
        const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
        
        await sendRequest(endpoint);
        requestCount++;
        
        // 随机延迟，模拟真实用户行为（0-2秒）
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
    }
    
    return requestCount;
}

// 计算统计数据
function calculateStats() {
    const responseTimes = stats.responseTimes;
    
    if (responseTimes.length === 0) {
        return {
            avgResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            p50: 0,
            p95: 0,
            p99: 0
        };
    }
    
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
        avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / len,
        minResponseTime: sorted[0],
        maxResponseTime: sorted[len - 1],
        p50: sorted[Math.floor(len * 0.5)],
        p95: sorted[Math.floor(len * 0.95)],
        p99: sorted[Math.floor(len * 0.99)]
    };
}

// 打印统计报告
function printReport() {
    const duration = (stats.endTime - stats.startTime) / 1000; // 秒
    const rpm = (stats.totalRequests / duration) * 60; // 每分钟请求数
    const rps = stats.totalRequests / duration; // 每秒请求数
    const successRate = (stats.successfulRequests / stats.totalRequests) * 100;
    
    const timingStats = calculateStats();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 并发压力测试报告');
    console.log('='.repeat(60));
    console.log(`\n⏱️  测试配置:`);
    console.log(`   并发用户数: ${CONCURRENT_USERS}`);
    console.log(`   测试时长: ${TEST_DURATION} 秒`);
    console.log(`   测试端点: ${ENDPOINTS.map(e => e.name).join(', ')}`);
    
    console.log(`\n📈 请求统计:`);
    console.log(`   总请求数: ${stats.totalRequests}`);
    console.log(`   成功请求: ${stats.successfulRequests} (${successRate.toFixed(2)}%)`);
    console.log(`   失败请求: ${stats.failedRequests} (${(100 - successRate).toFixed(2)}%)`);
    
    console.log(`\n⚡ 性能指标:`);
    console.log(`   RPM (每分钟请求数): ${rpm.toFixed(2)}`);
    console.log(`   RPS (每秒请求数): ${rps.toFixed(2)}`);
    
    console.log(`\n⏱️  响应时间统计 (毫秒):`);
    console.log(`   平均响应时间: ${timingStats.avgResponseTime.toFixed(2)}ms`);
    console.log(`   最小响应时间: ${timingStats.minResponseTime}ms`);
    console.log(`   最大响应时间: ${timingStats.maxResponseTime}ms`);
    console.log(`   P50 (中位数): ${timingStats.p50}ms`);
    console.log(`   P95: ${timingStats.p95}ms`);
    console.log(`   P99: ${timingStats.p99}ms`);
    
    if (stats.errors.length > 0) {
        console.log(`\n❌ 错误统计 (前10个):`);
        const errorGroups = {};
        stats.errors.forEach(err => {
            const key = `${err.endpoint} - ${err.error}`;
            errorGroups[key] = (errorGroups[key] || 0) + 1;
        });
        
        Object.entries(errorGroups)
            .slice(0, 10)
            .forEach(([error, count]) => {
                console.log(`   ${error}: ${count} 次`);
            });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
}

// 主测试函数
async function runTest() {
    console.log('🚀 开始并发压力测试...');
    console.log(`📋 配置: ${CONCURRENT_USERS} 个并发用户, 持续 ${TEST_DURATION} 秒\n`);
    
    stats.startTime = Date.now();
    
    // 创建所有并发用户
    const userPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) => 
        simulateUser(i + 1)
    );
    
    // 等待所有用户完成
    const userResults = await Promise.all(userPromises);
    
    stats.endTime = Date.now();
    
    // 打印报告
    printReport();
}

// 运行测试
runTest().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
});


