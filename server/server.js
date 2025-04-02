const express = require('express');
const cors = require('cors');
const chatRouter = require('./routes/chat');
const reflectionsRouter = require('./routes/reflections');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/reflections', reflectionsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 