const express = require('express');
const cors = require('cors');
const http = require('http');
const url = require('url');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

// SỬA ĐỔI: Thêm đuôi .js vào cuối đường dẫn require
const { handleCaroEvents, handleCaroDisconnect } = require('./game-logic/caro.js');
const { handleBattleshipEvents, handleBattleshipDisconnect } = require('./game-logic/battleship.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(cors());
app.use(express.json());

const users = {};
const clients = new Map();

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    if (users[username]) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    const apiKey = uuidv4();
    users[username] = { password, apiKey };
    console.log('Người dùng đã đăng ký:', username);
    res.status(201).json({ username, apiKey });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (!user || user.password !== password) return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    console.log('Người dùng đã đăng nhập:', username);
    res.status(200).json({ username, apiKey: user.apiKey });
});

server.on('upgrade', (request, socket, head) => {
    const { query } = url.parse(request.url, true);
    const apiKey = query.apiKey;
    const user = Object.keys(users).find(username => users[username].apiKey === apiKey);

    if (!user) {
        socket.destroy();
        return;
    }
    
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, user);
    });
});

wss.on('connection', (ws, request, user) => {
    ws.username = user;
    clients.set(user, ws);
    console.log(`[CONNECTION] Client ${user} connected.`);

    ws.on('message', (message) => {
        try {
            const { type, payload } = JSON.parse(message);
            
            if (type.startsWith('caro:')) {
                handleCaroEvents(ws, type, payload, { clients });
            } else if (type.startsWith('battleship:')) {
                handleBattleshipEvents(ws, type, payload, { clients });
            }

        } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
        }
    });

    ws.on('close', () => {
        const username = ws.username || 'Unknown';
        console.log(`[DISCONNECT] Client ${username} disconnected.`);
        
        handleCaroDisconnect(ws, { clients });
        handleBattleshipDisconnect(ws, { clients });

        clients.delete(username);
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server (HTTP & WebSocket) is running on port ${PORT}`);
});