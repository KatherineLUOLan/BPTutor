# 快速部署到 43.138.178.98

## 🚀 一键部署命令（在服务器上执行）

```bash
# 1. 进入项目目录（假设代码已上传到 /var/www/bptutor）
cd /var/www/bptutor

# 2. 创建 .env 文件
cat > .env << 'EOF'
PORT=5050
MONGODB_URI=mongodb://localhost:27017
DEEPSEEK_BASE_URL=https://tbnx.plus7.plus/v1/
DEEPSEEK_API_KEY=sk-y40II04gqELjrfF1s6jOVORdDu0atmbQ13MCrMQmm4q1bDMm
DEEPSEEK_MODEL=deepseek-chat
REACT_APP_API_URL=http://43.138.178.98:5050
NODE_ENV=production
EOF

# 3. 安装依赖并构建
npm install --production
npm run build

# 4. 启动服务
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save

# 5. 检查状态
pm2 status
```

## 📤 从本地 Mac 上传代码

在**本地终端**执行：

```bash
# 上传代码
scp -r /Users/katherine/Documents/bptutor root@43.138.178.98:/var/www/

# 然后 SSH 连接服务器
ssh root@43.138.178.98
```

## ⚙️ 配置 Nginx（如果需要通过 80 端口访问）

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/bptutor
```

粘贴以下内容：

```nginx
server {
    listen 80;
    server_name 43.138.178.98;

    location / {
        root /var/www/bptutor/build;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/bptutor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## ✅ 验证

访问：`http://43.138.178.98` 或 `http://43.138.178.98:5050`
