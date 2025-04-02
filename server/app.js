const express = require('express');
const cors = require('cors');
const app = express();

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000',  // 允许前端应用的域名
  methods: ['GET', 'POST'],         // 允许的 HTTP 方法
  allowedHeaders: ['Content-Type', 'Accept'],  // 允许的请求头
  credentials: true                 // 允许发送凭证
};

// 启用 CORS
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// ... rest of your server code ...

app.post('/api/reflections', async (req, res) => {
  try {
    // Your reflection handling logic here
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving reflection:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ... rest of your routes ...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 