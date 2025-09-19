const express = require('express');
const cors = require('cors');
require('dotenv').config();

const functionRoutes = require('./routes/functions');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/functions', functionRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Lambda Serverless Backend is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
