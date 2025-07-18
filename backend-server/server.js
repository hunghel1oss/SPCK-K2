const express = require('express');
const app = express();

// Dùng cổng mà Render cung cấp
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Hello from the simplest server!');
});

app.listen(PORT, () => {
  console.log(`>>> Minimal server is running on port ${PORT}`);
});