#!/bin/bash

# 部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署 BPTutor..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB 未安装，请先安装 MongoDB"
fi

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，正在创建..."
    cat > .env << EOF
PORT=3000
MONGODB_URI=mongodb://localhost:27017
DEEPSEEK_BASE_URL=https://tbnx.plus7.plus/v1/
DEEPSEEK_API_KEY=sk-y40II04gqELjrfF1s6jOVORdDu0atmbQ13MCrMQmm4q1bDMm
DEEPSEEK_MODEL=deepseek-chat
REACT_APP_API_URL=http://localhost:3000
NODE_ENV=production
EOF
    echo "✅ 已创建 .env 文件，请根据实际情况修改配置"
fi

# 构建前端
echo "🔨 构建前端..."
npm run build

# 创建日志目录
mkdir -p logs

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 停止旧服务（如果存在）
pm2 stop bptutor-backend 2>/dev/null || true
pm2 delete bptutor-backend 2>/dev/null || true

# 启动服务
echo "🚀 启动服务..."
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 服务状态:"
pm2 status
echo ""
echo "📝 查看日志: pm2 logs bptutor-backend"
echo "🔄 重启服务: pm2 restart bptutor-backend"
echo "🛑 停止服务: pm2 stop bptutor-backend"
echo ""
echo "🌐 访问地址: http://localhost:3000"
