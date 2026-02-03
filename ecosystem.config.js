// PM2 进程管理配置文件
module.exports = {
  apps: [{
    name: 'bptutor-backend',
    script: './src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://admin:123456@localhost:27017',
      DEEPSEEK_BASE_URL: 'https://tbnx.plus7.plus/v1/',
      DEEPSEEK_API_KEY: 'sk-y40II04gqELjrfF1s6jOVORdDu0atmbQ13MCrMQmm4q1bDMm',
      DEEPSEEK_MODEL: 'deepseek-chat'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
