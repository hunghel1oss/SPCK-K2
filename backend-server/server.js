require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const mongoose = require('mongoose');

const { handleCaroEvents, caroGames, createCaroGame, resetGame: resetCaroGame } = require('./game-logic/caro.js');
const { handleBattleshipEvents, battleshipGames, createBattleshipGame, resetGame: resetBattleshipGame } = require('./game-logic/battleship.js');
const { handleDisconnect: originalDisconnectHandler } = require('./game-logic/disconnectHandler.js');
const { handleLobbyEvent } = require('./game-logic/matchmakingHandler.js');
const { handleLeaveGame: originalLeaveHandler } = require('./game-logic/gameSessionHandler.js');
const { handlePostGameAction } = require('./game-logic/postGameActionHandler.js');
const { handleFriendRequest, handleFriendResponse, handleRemoveFriend } = require('./game-logic/friendActions.js');
const { handleDirectMessage, getChatHistory } = require('./game-logic/chatHandler.js');
const { createHistorySavingHandler } = require('./game-logic/historySaver.js');
const { createApiRoutes } = require('./modules/apiRoutes.js');
const { ELO_STARTING_POINT } = require('./modules/rewardHandler.js');

// Kiểm tra environment variables
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is not set');
    process.exit(1);
}

// Kết nối MongoDB với error handling tốt hơn
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB connected successfully!'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Schemas
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

const conversationSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, unique: true },
    participants: [String],
    messages: [Object]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

// Game setup
const clients = new Map();
const apiHandlerContext = { User, Conversation, clients };

const handleDisconnect = createHistorySavingHandler(originalDisconnectHandler);
const handleLeaveGame = createHistorySavingHandler(originalLeaveHandler);

const gameRegistry = {
    caro: { create: createCaroGame, games: caroGames, handler: handleCaroEvents, reset: resetCaroGame, gameName: 'Cờ Caro', imageSrc: '/img/caro.jpg' },
    battleship: { create: createBattleshipGame, games: battleshipGames, handler: handleBattleshipEvents, reset: resetBattleshipGame, gameName: 'Bắn Tàu', imageSrc: '/img/battleship.jpg' }
};

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Xác định đường dẫn tới static files
const frontendPath = path.join(__dirname, '..', 'SP-CK', 'dist');
const alternativePath = path.join(__dirname, 'dist');
const uploadsPath = path.join(__dirname, 'public', 'uploads');

// Kiểm tra và serve static files
let staticPath = frontendPath;
if (!fs.existsSync(frontendPath)) {
    if (fs.existsSync(alternativePath)) {
        staticPath = alternativePath;
        console.log('📁 Using alternative path for static files:', alternativePath);
    } else {
        console.warn('⚠️ Frontend build not found, creating placeholder');
        // Tạo thư mục tạm thời
        fs.mkdirSync(alternativePath, { recursive: true });
        fs.writeFileSync(path.join(alternativePath, 'index.html'), `
            <!DOCTYPE html>
            <html>
            <head><title>Game Portal</title></head>
            <body>
                <h1>Game Portal API</h1>
                <p>Frontend is being built...</p>
            </body>
            </html>
        `);
        staticPath = alternativePath;
    }
}

console.log('📁 Static files path:', staticPath);
app.use(express.static(staticPath));

// Tạo thư mục uploads nếu chưa có
fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// Authentication middleware
async function authenticateUser(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ message: 'API Key is required' });
    try {
        const user = await User.findOne({ 'credentials.apiKey': apiKey }).lean();
        if (!user) return res.status(403).json({ message: 'Invalid API Key' });
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
}

// Utility function
function normalizeToString(value) {
    if (value === null || typeof value === 'undefined') return '';
    return String(value).trim();
}

// API Routes
app.post('/api/register', async (req, res) => {
    const username = normalizeToString(req.body.username);
    const password = normalizeToString(req.body.password);
    if (!username || !password) {
        return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }
    try {
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }
        const apiKey = uuidv4();
        const newUser = new User({ username, credentials: { password, apiKey } });
        await newUser.save();
        res.status(201).json({ username, apiKey });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Lỗi server khi đăng ký." });
    }
});

app.post('/api/login', async (req, res) => {
    const loginUsername = normalizeToString(req.body.username);
    const loginPassword = normalizeToString(req.body.password);
    if (!loginUsername || !loginPassword) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    try {
        const userAccount = await User.findOne({ username: loginUsername.toLowerCase() });
        if (!userAccount || userAccount.credentials.password !== loginPassword) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
        res.status(200).json({ username: userAccount.username, apiKey: userAccount.credentials.apiKey });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
});

app.get('/api/me', authenticateUser, (req, res) => {
    res.status(200).json({
        username: req.user.username,
        elo: req.user.elo,
        gachaTickets: req.user.gachaTickets
    });
});

app.get('/api/history', authenticateUser, (req, res) => {
    res.status(200).json(req.user.history || []);
});

app.post('/api/history', authenticateUser, async (req, res) => {
    const { body: gameData, user: { _id } } = req;
    if (!gameData) return res.status(400).json({ message: 'Game data is required.' });
    try {
        const newRecord = { id: uuidv4(), date: new Date().toISOString(), ...gameData };
        const result = await User.updateOne(
            { _id },
            { $push: { history: { $each: [newRecord], $slice: -20 } } }
        );
        if (result.modifiedCount > 0) {
            const updatedUser = await User.findById(_id).lean();
            res.status(201).json(updatedUser.history);
        } else {
            res.status(404).json({ message: "Không tìm thấy người dùng." });
        }
    } catch (error) {
        console.error('History save error:', error);
        res.status(500).json({ message: "Lỗi server khi lưu lịch sử." });
    }
});

app.delete('/api/history', authenticateUser, async (req, res) => {
    try {
        await User.updateOne({ _id: req.user._id }, { $set: { history: [] } });
        res.status(200).json({ message: 'Lịch sử đã được xóa thành công.' });
    } catch (error) {
        console.error('History delete error:', error);
        res.status(500).json({ message: "Lỗi server khi xóa lịch sử." });
    }
});

app.get('/api/users/search', authenticateUser, async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '') {
        return res.status(400).json({ message: 'Cần có từ khóa tìm kiếm hợp lệ.' });
    }
    try {
        const results = await User.find({
            username: { $regex: q.trim(), $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('username').limit(10).lean();
        res.status(200).json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi tìm kiếm.' });
    }
});

// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdir(uploadsPath, { recursive: true }, (err) => {
            if (err) console.error('Upload directory creation error:', err);
            cb(null, uploadsPath);
        });
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

app.post('/api/upload/puzzle-image', multer({ storage }).single('puzzleImage'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Không có file nào được tải lên.' });
    res.status(200).json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Friend and chat routes
app.get('/api/friends', authenticateUser, (req, res) => {
    res.status(200).json(req.user.friends || []);
});

app.post('/api/friends/request', authenticateUser, (req, res) => {
    handleFriendRequest(req, res, apiHandlerContext);
});

app.post('/api/friends/respond', authenticateUser, (req, res) => {
    handleFriendResponse(req, res, apiHandlerContext);
});

app.delete('/api/friends/:friendUsername', authenticateUser, (req, res) => {
    handleRemoveFriend(req, res, apiHandlerContext);
});

app.get('/api/chat/:friendUsername', authenticateUser, (req, res) => {
    getChatHistory(req, res, apiHandlerContext);
});

// API v2 routes
const apiRoutes = createApiRoutes(clients, User);
app.use('/api/v2', authenticateUser, apiRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// SPA fallback route - FIX CHÍNH CHO LỖI PATH-TO-REGEXP
app.get('/*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend not found');
    }
});

// WebSocket setup
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (request, socket, head) => {
    const { query } = url.parse(request.url, true);
    const apiKey = query.apiKey;
    if (!apiKey) {
        socket.destroy();
        return;
    }
    try {
        const user = await User.findOne({ 'credentials.apiKey': apiKey }).select('username').lean();
        if (!user) {
            socket.destroy();
            return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request, user);
        });
    } catch (error) {
        console.error('WebSocket upgrade error:', error);
        socket.destroy();
    }
});

wss.on('connection', async (ws, request, user) => {
    ws.username = user.username;
    clients.set(user.username, ws);
    console.log(`[CONNECTION] Client ${user.username} connected. Total clients: ${clients.size}`);
    
    try {
        const userAccount = await User.findOne({ username: user.username }).select('friends').lean();
        if (userAccount && userAccount.friends) {
            const myFriendsUsernames = userAccount.friends.filter(f => f.status === 'friends').map(f => f.username);
            const myOnlineFriends = myFriendsUsernames.filter(friendUsername => clients.has(friendUsername));
            
            myOnlineFriends.forEach(friendUsername => {
                const friendClient = clients.get(friendUsername);
                if (friendClient) {
                    friendClient.send(JSON.stringify({ 
                        type: 'friend:online', 
                        payload: { username: user.username } 
                    }));
                }
            });
            
            ws.send(JSON.stringify({ 
                type: 'friend:list_online', 
                payload: myOnlineFriends 
            }));
        }
    } catch (error) {
        console.error(`[CONNECTION_HANDLER_ERROR] for ${user.username}:`, error);
    }
    
    ws.on('message', (message) => {
        try {
            const { type, payload } = JSON.parse(message);
            const context = { clients, gameRegistry, User, Conversation };
            
            if (ws.roomId) {
                const gameType = ws.roomId.split('_')[0];
                const gameModule = gameRegistry[gameType];
                if (!gameModule || !gameModule.games[ws.roomId]) {
                    ws.roomId = null; 
                    return;
                }
                
                const game = gameModule.games[ws.roomId];
                const isFinished = game.status === 'finished' || game.gameState === 'finished';
                
                if (type === 'chat:room_message' && payload.message) {
                    const messageData = { 
                        sender: ws.username, 
                        message: payload.message, 
                        timestamp: new Date().toISOString() 
                    };
                    game.players.forEach(p => {
                        const playerWs = clients.get(p.username);
                        if (playerWs) {
                            playerWs.send(JSON.stringify({ 
                                type: 'chat:new_room_message', 
                                payload: messageData 
                            }));
                        }
                    });
                    return;
                }
                
                if (isFinished) {
                    handlePostGameAction(ws, type, payload, context);
                } else {
                    if (type === 'game:leave') {
                        handleLeaveGame(ws, payload, context);
                    } else if (gameModule.handler) {
                        gameModule.handler(ws, type, payload, context);
                    }
                }
            } else {
                if (type === 'chat:dm') {
                    handleDirectMessage(ws, payload, context);
                } else if (type.endsWith(':find_match') || type.endsWith(':leave')) {
                    const result = handleLobbyEvent(ws, type, payload, context);
                    if (result && result.player1 && result.player2) {
                        const gameType = result.gameType;
                        if (gameRegistry[gameType] && gameRegistry[gameType].create) {
                            gameRegistry[gameType].create(result.player1, result.player2);
                        }
                    }
                } else if (type === 'game:leave') {
                    handleLeaveGame(ws, payload, context);
                }
            }
        } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
        }
    });

    ws.on('close', async () => {
        const username = ws.username || 'Unknown';
        const roomId = ws.roomId;
        clients.delete(username);
        console.log(`[DISCONNECT] Client ${username} disconnected. Total clients: ${clients.size}`);
        
        try {
            const userAccount = await User.findOne({ username }).select('friends').lean();
            if (userAccount && userAccount.friends) {
                userAccount.friends.filter(f => f.status === 'friends').forEach(friend => {
                    const friendClient = clients.get(friend.username);
                    if (friendClient) {
                        friendClient.send(JSON.stringify({ 
                            type: 'friend:offline', 
                            payload: { username } 
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Error handling friend offline notification:', error);
        }
        
        handleDisconnect(username, roomId, { gameRegistry, clients, User });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`🚀 Server (HTTP & WebSocket) is running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Static files: ${staticPath}`);
});