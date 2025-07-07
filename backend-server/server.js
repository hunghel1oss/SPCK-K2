// file: backend-server/server.js

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors()); // Cho phép tất cả các request từ domain khác (ví dụ: từ app Vite)
app.use(express.json()); // Đọc body của request dưới dạng JSON

// Cơ sở dữ liệu "trong bộ nhớ" đơn giản
const users = {}; // Lưu trữ: { username: { password, apiKey } }

// API Endpoint: /api/register
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }
    if (users[username]) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const apiKey = uuidv4();
    users[username] = { password, apiKey };

    console.log('Người dùng đã đăng ký:', username);
    res.status(201).json({ username, apiKey });
});

// API Endpoint: /api/login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    console.log('Người dùng đã đăng nhập:', username);
    res.status(200).json({ username, apiKey: user.apiKey });
});

// Xử lý kết nối WebSocket
wss.on('connection', (ws, req) => {
    // Lấy apiKey từ URL query
    const urlParams = new URLSearchParams(req.url.slice(1));
    const apiKey = urlParams.get('apiKey');

    const user = Object.values(users).find(u => u.apiKey === apiKey);

    if (!user) {
        console.log('[WebSocket] Kết nối bị từ chối: apiKey không hợp lệ.');
        ws.close();
        return;
    }

    console.log('[WebSocket] Một client đã kết nối thành công.');

    ws.on('message', (message) => {
        console.log(`[WebSocket] Nhận được message: ${message}`);
        // Gửi lại message cho client để test
        ws.send(`Server đã nhận: ${message}`);
    });

    ws.on('close', () => {
        console.log('[WebSocket] Một client đã ngắt kết nối.');
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Backend server đang chạy trên cổng ${PORT}`);
    console.log('Các user hiện tại (chỉ để debug):', users);
});