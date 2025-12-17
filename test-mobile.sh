#!/bin/bash

echo "📱 ========================================"
echo "   移动端测试助手"
echo "=========================================="
echo ""

# 获取本机IP地址
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null)
fi

if [ -z "$IP" ]; then
    echo "❌ 无法获取IP地址，请手动查找："
    echo "   Mac: 系统设置 > 网络 > WiFi > IP地址"
    echo "   Windows: ipconfig"
    exit 1
fi

echo "✅ 检测到你的IP地址: $IP"
echo ""
echo "📋 测试步骤："
echo ""
echo "1️⃣  确保手机和电脑连接同一个WiFi"
echo ""
echo "2️⃣  启动开发服务器："
echo "   npm run dev"
echo ""
echo "3️⃣  在手机浏览器中访问："
echo "   http://$IP:3000"
echo ""
echo "4️⃣  或者使用浏览器开发者工具模拟移动设备："
echo "   - Chrome: 按 F12 > 点击设备图标 (📱)"
echo "   - Safari: Cmd+Option+I > 响应式设计模式"
echo ""
echo "=========================================="
echo "💡 提示：如果无法访问，检查防火墙设置"
echo "=========================================="



