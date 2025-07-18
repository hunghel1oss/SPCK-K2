require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const url = require('url');
const path = require('path');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// --- TẤT CẢ CÁC FILE LOGIC CỦA BẠN ĐÃ BỊ VÔ HIỆU HÓA ---
// const { handleCaroEvents, caroGames, createCaroGame, resetGame: resetCaroGame } = require('./game-logic/caro.js');
// const { handleBattleshipEvents, battleshipGames, createBattleshipGame, resetGame: resetBattleshipGame } = require('./game-logic/battleship.js');
// const { handleDisconnect: originalDisconnectHandler } = require('./game-logic/disconnectHandler.js');
// const { handleLobbyEvent } = require('./game-logic/matchmakingHandler.js');
// const { handleLeaveGame: originalLeaveHandler } = require('./game-logic/gameSessionHandler.js');
// const { handlePostGameAction } = require('./game-logic/postGameActionHandler.js');
// const { handleFriendRequest, handleFriendResponse, handleRemoveFriend } = require('./game-logic/friendActions.js');
// const { handleDirectMessage, getChatHistory } = require('./game-logic/chatHandler.js');
// const { createHistorySavingHandler } = require('./game-logic/historySaver.js');
// const { createApiRoutes } = require('./modules/apiRoutes.js');
// const { ELO_STARTING_POINT } = require('./modules/rewardHandler.js');


// --- MongoDB Connection & Models ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('>>> MongoDB connected successfully!'))
  .catch(err => console.error('>>> MongoDB connection error:', err));

const ELO_STARTING_POINT = 1000; // Định nghĩa tạm thời vì file require đã bị comment

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    credentials: {
        password: { type: String, required: true },
        apiKey: { type: String, required: true, unique: true }
    },
    profile: { createdAt: { type: Date, default: Date.now } },
    elo: { type: Number, default: ELO_STARTING_POINT },
    gachaTickets: { type: Number, default: 0 },
    claimedFirstMilestone: { type: Boolean, default: false },
    history: { type: Array, default: [] },
    friends: { type: Array, default: [] }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);


// --- Express App Setup ---
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'SP-CK', 'dist')));


// --- Middleware ---
async function authenticateUser(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ message: 'API Key is required' });
    try {
        const user = await User.findOne({ 'credentials.apiKey': apiKey }).lean();
        if (!user) return res.status(403).json({ message: 'Invalid API Key' });
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error during authentication.' });
    }
}

function normalizeToString(value) {
    if (value === null || typeof value === 'undefined') return '';
    return String(value).trim();
}

// --- API Routes (Chỉ giữ lại các route cơ bản nhất) ---
app.post('/api/register', async (req, res) => {
    const username = normalizeToString(req.body.username);
    const password = normalizeToString(req.body.password);
    if (!username || !password) return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });

    try {
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        
        const apiKey = uuidv4();
        const newUser = new User({ username, credentials: { password, apiKey } });
        await newUser.save();
        res.status(201).json({ username, apiKey });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server khi đăng ký." });
    }
});

app.post('/api/login', async (req, res) => {
    const loginUsername = normalizeToString(req.body.username);
    const loginPassword = normalizeToString(req.body.password);
    if (!loginUsername || !loginPassword) return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });

    try {
        const userAccount = await User.findOne({ username: loginUsername.toLowerCase() });
        if (!userAccount || userAccount.credentials.password !== loginPassword) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
        res.status(200).json({ username: userAccount.username, apiKey: userAccount.credentials.apiKey });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
});

app.get('/api/me', authenticateUser, (req, res) => {
    res.status(200).json({ username: req.user.username });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'SP-CK', 'dist', 'index.html'));
});

// --- WebSocket Server Setup (Logic đơn giản) ---
const wss = new WebSocketServer({ noServer: true });
const clients = new Map();

server.on('upgrade', async (request, socket, head) => {
    const { query } = url.parse(request.url, true);
    const apiKey = query.apiKey;
    if (!apiKey) return socket.destroy();
    
    try {
        const user = await User.findOne({ 'credentials.apiKey': apiKey }).select('username').lean();
        if (!user) return socket.destroy();
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request, user);
        });
    } catch (error) {
        socket.destroy();
    }
});

wss.on('connection', (ws, request, user) => {
    ws.username = user.username;
    clients.set(user.username, ws);
    console.log(`[CONNECTION] Client ${ws.username} connected. Total: ${clients.size}`);
    
    ws.on('message', (message) => {
        console.log(`Received message from ${ws.username}: ${message}`);
        ws.send('Server received your message.');
    });

    ws.on('close', () => {
        clients.delete(ws.username);
        console.log(`[DISCONNECT] Client ${ws.username} disconnected. Total: ${clients.size}`);
    });
});

// --- Server Listen ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`>>> Barebone server is running on port ${PORT}`);
});