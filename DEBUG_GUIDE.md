# 聊天记录数据库调试指南

## 问题排查步骤

### 1. 检查服务器是否运行
```bash
# 启动服务器
cd /Users/katherine/Documents/bptutor
npm run server
```

确保看到以下输出：
```
✅ 数据库连接成功
✅ 聊天记录表创建成功
✅ 用户统计表创建成功
服务器运行在端口 5000
```

### 2. 检查数据库文件
```bash
# 检查数据库文件是否存在
ls -la src/chat_records.db
```

### 3. 测试数据库功能
```bash
# 运行测试脚本
node test-database.js
```

### 4. 检查浏览器控制台
在Task B界面发送消息后，打开浏览器开发者工具（F12），查看Console标签页，应该看到：
```
保存聊天记录到数据库: {user_id: "123", task_type: "taskB", ...}
✅ 聊天记录保存成功: {status: "success", ...}
```

### 5. 检查服务器日志
在服务器终端中，发送消息后应该看到：
```
✅ 聊天记录已保存: 用户123 - user消息
✅ 聊天记录已保存: 用户123 - ai消息
```

### 6. 检查管理员后台
1. 使用"admin"登录
2. 切换到"聊天记录"标签页
3. 点击"刷新"按钮
4. 查看浏览器控制台，应该看到：
```
获取聊天记录URL: http://localhost:5000/api/admin/chat-records?limit=20&offset=0
聊天记录API响应: {status: "success", data: [...], total: X}
✅ 获取到 X 条聊天记录
```

## 常见问题及解决方案

### 问题1: 服务器无法启动
**原因**: 缺少sqlite3依赖
**解决**: 
```bash
npm install sqlite3
```

### 问题2: 数据库连接失败
**原因**: 数据库文件路径问题
**解决**: 检查`src/server.js`中的数据库路径设置

### 问题3: 聊天记录保存失败
**原因**: API调用失败
**解决**: 
1. 检查服务器是否运行在端口5000
2. 检查网络连接
3. 查看浏览器控制台错误信息

### 问题4: 管理员后台看不到数据
**原因**: API响应问题
**解决**:
1. 检查服务器日志
2. 检查浏览器控制台
3. 确认数据库中有数据

### 问题5: 分页功能不正常
**原因**: 总数计算错误
**解决**: 已修复，确保使用最新代码

## 调试命令

### 查看数据库内容
```bash
# 安装sqlite3命令行工具（如果未安装）
brew install sqlite3

# 查看数据库内容
sqlite3 src/chat_records.db "SELECT * FROM chat_records ORDER BY timestamp DESC LIMIT 10;"
```

### 查看用户统计
```bash
sqlite3 src/chat_records.db "SELECT * FROM user_stats;"
```

### 清空测试数据
```bash
sqlite3 src/chat_records.db "DELETE FROM chat_records WHERE user_id = 'test123';"
```

## 测试流程

1. **启动服务器**: `npm run server`
2. **启动前端**: `npm start`
3. **普通用户登录**: 输入数字，选择Task B
4. **发送消息**: 在Task B界面发送几条消息
5. **检查日志**: 确认服务器和浏览器控制台都有成功日志
6. **管理员登录**: 使用"admin"登录
7. **查看记录**: 在管理员后台查看聊天记录
8. **验证数据**: 确认能看到刚才发送的消息

## 如果仍然有问题

请提供以下信息：
1. 服务器启动日志
2. 浏览器控制台错误信息
3. 数据库文件是否存在
4. 测试脚本运行结果

这样我可以进一步帮助你排查问题。
