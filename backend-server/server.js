require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const url = require('url');
const path = require('path');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const mongoose = require('mongoose');

// --- Game Logic & Handlers (TẠM THỜI VÔ HIỆU HÓA) ---
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

const ELO_STARTING_POINT = 1000; // Định nghĩa tạm thời

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

const conversationSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, unique: true },
    participants: [String],
    messages: [Object]
}, { timestamps: true });
const Conversation = mongoose.model('Conversation', conversationSchema);

// --- Context & Handlers Setup (TẠM THỜI VÔ HIỆU HÓA) ---
const clients = new Map();
const apiHandlerContext = { User, Conversation, clients };
// const handleDisconnect = createHistorySavingHandler(originalDisconnectHandler);
// const handleLeaveGame = createHistorySavingHandler(originalLeaveHandler);

// --- Express App Setup ---
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', 'SP-CK', 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

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

// --- API Routes (CHỈ GIỮ LẠI CÁC ROUTE CƠ BẢN) ---
app.post('/api/register', async (req, res) => {
    // ... code register giữ nguyên ...
});

app.post('/api/login', async (req, res) => {
    // ... code login giữ nguyên ...
});

app.get('/api/me', authenticateUser, (req, res) => {
    // ... code me giữ nguyên ...
});


// --- CÁC ROUTE PHỨC TẠP BỊ VÔ HIỆU HÓA ---
// app.get('/api/history', authenticateUser, ...);
// app.post('/api/history', authenticateUser, ...);
// app.delete('/api/history', authenticateUser, ...);
// app.get('/api/users/search', authenticateUser, ...);
// app.post('/api/upload/puzzle-image', ...);
// app.get('/api/friends', authenticateUser, ...);
// app.post('/api/friends/request', ...);
// app.post('/api/friends/respond', ...);
// app.delete('/api/friends/:friendUsername', ...);
// app.get('/api/chat/:friendUsername', ...);
// const apiRoutes = createApiRoutes(clients, User);
// app.use('/api/v2', authenticateUser, apiRoutes);


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'SP-CK', 'dist', 'index.html'));
});

// --- WebSocket Server Setup (TẠM THỜI VÔ HIỆU HÓA LOGIC BÊN TRONG) ---
const wss = new WebSocketServer({ noServer: true });

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

wss.on('connection', async (ws, request, user) => {
    ws.username = user.username;
    clients.set(user.username, ws);
    console.log(`[CONNECTION] Client ${user.username} connected. Total clients: ${clients.size}`);
    
    // Logic phức tạp bên trong on 'message' và on 'close' tạm thời bỏ qua để test
    ws.on('message', (message) => {
        console.log(`Received message from ${ws.username}: ${message}`);
        ws.send('Server received your message.');
    });

    ws.on('close', async () => {
        const username = ws.username || 'Unknown';
        clients.delete(username);
        console.log(`[DISCONNECT] Client ${username} disconnected. Total clients: ${clients.size}`);
    });
});

// --- Server Listen ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});