const express = require('express');
const cors = require('cors');
const http = require('http');
const url = require('url');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');

const { handleCaroEvents, caroGames, createCaroGame, resetGame: resetCaroGame } = require('./game-logic/caro.js');
const { handleBattleshipEvents, battleshipGames, createBattleshipGame, resetGame: resetBattleshipGame } = require('./game-logic/battleship.js');
const { handleLobbyEvent } = require('./game-logic/matchmakingHandler.js');
const { handlePostGameAction } = require('./game-logic/postGameActionHandler.js');

const { handleLeaveGame: originalHandleLeaveGame } = require('./game-logic/gameSessionHandler.js');
const { handleDisconnect: originalHandleDisconnect } = require('./game-logic/disconnectHandler.js');

const { createHistorySavingHandler } = require('./game-logic/historySaver.js');

const handleLeaveGame = createHistorySavingHandler(originalHandleLeaveGame);
const handleDisconnect = createHistorySavingHandler(originalHandleDisconnect);

const gameRegistry = {
    caro: { create: createCaroGame, games: caroGames, handler: handleCaroEvents, reset: resetCaroGame, gameName: 'Cờ Caro', imageSrc: '/img/caro.jpg' },
    battleship: { create: createBattleshipGame, games: battleshipGames, handler: handleBattleshipEvents, reset: resetBattleshipGame, gameName: 'Bắn Tàu', imageSrc: '/img/battleship.jpg' }
};

const DB_FILE = path.join(__dirname, 'database.json');

async function readDatabase() {
    try {
        await fs.access(DB_FILE);
        const data = await fs.readFile(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function writeDatabase(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public', 'uploads');
        fs.mkdir(uploadPath, { recursive: true }).then(() => cb(null, uploadPath));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
const clients = new Map();

async function authenticateUser(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ message: 'API Key is required' });
    const database = await readDatabase();
    const username = Object.keys(database).find(u => database[u].credentials.apiKey === apiKey);
    if (!username) return res.status(403).json({ message: 'Invalid API Key' });
    req.user = { username, ...database[username] };
    next();
}

function normalizeToString(value) {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    return String(value).trim();
}

app.post('/api/register', async (req, res) => {
    const username = normalizeToString(req.body.username);
    const password = normalizeToString(req.body.password);
    if (!username || !password) {
        return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }
    const database = await readDatabase();
    
    const existingUserKey = Object.keys(database).find(key => normalizeToString(key).toLowerCase() === username.toLowerCase());
    if (existingUserKey) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const apiKey = uuidv4();
    database[username] = { 
        credentials: { password: password, apiKey: apiKey }, 
        profile: { createdAt: new Date().toISOString() }, 
        history: [], 
        friends: [] 
    };
    await writeDatabase(database);
    res.status(201).json({ username, apiKey });
});
app.post('/api/login', async (req, res) => {
    const loginUsername = normalizeToString(req.body.username);
    const loginPassword = normalizeToString(req.body.password);

    if (!loginUsername || !loginPassword) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    const database = await readDatabase();
    
    const userKey = Object.keys(database).find(
        dbKey => normalizeToString(dbKey).toLowerCase() === loginUsername.toLowerCase()
    );

    const userAccount = userKey ? database[userKey] : null;

    if (!userAccount || normalizeToString(userAccount.credentials.password) !== loginPassword) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    res.status(200).json({ username: userKey, apiKey: userAccount.credentials.apiKey });
});
app.get('/api/me', authenticateUser, (req, res) => {
    res.status(200).json({ 
        username: req.user.username,
    });
});
app.get('/api/history', authenticateUser, (req, res) => res.status(200).json(req.user.history || []));
app.post('/api/history', authenticateUser, async (req, res) => {
    const { body: gameData, user: { username } } = req;
    if (!gameData || !gameData.gameName) return res.status(400).json({ message: 'Game data is required.' });
    const database = await readDatabase();
    const newRecord = { id: uuidv4(), date: new Date().toISOString(), ...gameData };
    if (!database[username].history) database[username].history = [];
    database[username].history.unshift(newRecord);
    if (database[username].history.length > 20) database[username].history.pop();
    await writeDatabase(database);
    res.status(201).json(database[username].history);
});
app.delete('/api/history', authenticateUser, async (req, res) => {
    const { username } = req.user;
    const database = await readDatabase();
    if (database[username]) {
        database[username].history = [];
        await writeDatabase(database);
        res.status(200).json({ message: 'Lịch sử đã được xóa thành công.' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
});
app.get('/api/friends', authenticateUser, (req, res) => res.status(200).json(req.user.friends || []));
app.post('/api/friends/request', authenticateUser, async(req, res)=>{
    const { user: { username: senderUsername }, body: { targetUsername } } = req;
    if(!targetUsername) return res.status(400).json({ message: 'Tên người nhận là bắt buộc.' });
    if(senderUsername === targetUsername) return res.status(400).json({ message: 'Bạn không thể tự kết bạn với chính mình.'});
    const database = await readDatabase();
    if(!database[targetUsername]) return res.status(404).json({ message: 'Người dùng không tồn tại.'});
    const sender = database[senderUsername];
    const target = database[targetUsername];
    if(!sender.friends) sender.friends = [];
    if(!target.friends) target.friends = [];
    if(sender.friends.some(f => f.username === targetUsername)) return res.status(400).json({ message: 'Đã gửi lời mời hoặc đã là bạn bè.'});
    const timestamp = new Date().toISOString();
    sender.friends.unshift({ username: targetUsername, status: 'pending_sent', since: timestamp });
    target.friends.unshift({ username: senderUsername, status: 'pending_received', since: timestamp });
    await writeDatabase(database);
    const targetClient = clients.get(targetUsername);
    if(targetClient && targetClient.readyState === 1) targetClient.send(JSON.stringify({ type: 'friend:request_received', payload: { from: senderUsername, since: timestamp } }));
    res.status(200).json({ message:'Đã gửi lời mời kết bạn.'});
});
app.post('/api/friends/respond', authenticateUser, async(req, res)=>{
    const { user: { username: responderUsername }, body: { requesterUsername, action } } = req;
    if (!requesterUsername || !['accept', 'decline'].includes(action)) return res.status(400).json({ message: 'Yêu cầu không hợp lệ.' });
    const database = await readDatabase();
    const responder = database[responderUsername];
    const requester = database[requesterUsername];
    if (!requester) return res.status(404).json({ message: 'Người gửi yêu cầu không tồn tại.' });
    const requestInResponder = responder.friends.find(f => f.username === requesterUsername && f.status === 'pending_received');
    if (!requestInResponder) return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn.' });
    if (action === 'accept') {
        const requestInRequester = requester.friends.find(f => f.username === responderUsername && f.status === 'pending_sent');
        const timestamp = new Date().toISOString();
        requestInResponder.status = 'friends';
        requestInResponder.since = timestamp;
        if(requestInRequester) { requestInRequester.status = 'friends'; requestInRequester.since = timestamp; }
        const requesterClient = clients.get(requesterUsername);
        if (requesterClient && requesterClient.readyState === 1) requesterClient.send(JSON.stringify({ type: 'friend:request_accepted', payload: { by: responderUsername, since: timestamp } }));
        res.status(200).json({ message: `Bạn và ${requesterUsername} đã trở thành bạn bè.` });
    } else {
        responder.friends = responder.friends.filter(f => f.username !== requesterUsername);
        requester.friends = requester.friends.filter(f => f.username !== responderUsername);
        const requesterClient = clients.get(requesterUsername);
        if (requesterClient && requesterClient.readyState === 1) requesterClient.send(JSON.stringify({ type: 'friend:request_declined', payload: { by: responderUsername } }));
        res.status(200).json({ message: `Bạn đã từ chối lời mời kết bạn từ ${requesterUsername}.` });
    }
    await writeDatabase(database);
});
app.get('/api/users/search', authenticateUser, async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '') return res.status(400).json({ message: 'Cần có từ khóa tìm kiếm hợp lệ.' });
    try {
        const database = await readDatabase();
        const results = Object.keys(database).filter(username => username.toLowerCase().includes(q.toLowerCase().trim()) && username !== req.user.username).map(username => ({ username }));
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi tìm kiếm.' });
    }
});
app.post('/api/upload/puzzle-image', upload.single('puzzleImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có file nào được tải lên.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
        message: 'Tải ảnh lên thành công!',
        imageUrl: imageUrl
    });
});

server.on('upgrade', async (request, socket, head) => {
    const { query } = url.parse(request.url, true);
    const apiKey = query.apiKey;
    if (!apiKey) return socket.destroy();
    const database = await readDatabase();
    const user = Object.keys(database).find(username => database[username].credentials.apiKey === apiKey);
    if (!user) return socket.destroy();
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, user);
    });
});

wss.on('connection', async (ws, request, user) => {
    ws.username = user;
    clients.set(user, ws);
    console.log(`[CONNECTION] Client ${user} connected. Total clients: ${clients.size}`);

    try {
        const database = await readDatabase();
        const userAccount = database[user];
        if (userAccount && userAccount.friends) {
            const myFriendsUsernames = userAccount.friends.filter(f => f.status === 'friends').map(f => f.username);
            const myOnlineFriends = [];
            myFriendsUsernames.forEach(friendUsername => {
                const friendClient = clients.get(friendUsername);
                if (friendClient && friendClient.readyState === 1) {
                    friendClient.send(JSON.stringify({ type: 'friend:online', payload: { username: user } }));
                    myOnlineFriends.push(friendUsername);
                }
            });
            ws.send(JSON.stringify({ type: 'friend:list_online', payload: myOnlineFriends }));
        }
    } catch (error) {
        console.error(`[CONNECTION_HANDLER_ERROR] for ${user}:`, error);
    }

    ws.on('message', (message) => {
        try {
            const { type, payload } = JSON.parse(message);
            
            if (ws.roomId) {
                const gameType = ws.roomId.split('_')[0];
                const gameModule = gameRegistry[gameType];
                if (!gameModule || !gameModule.games[ws.roomId]) {
                    ws.roomId = null; 
                    return;
                }
    
                const game = gameModule.games[ws.roomId];
                const isFinished = game.status === 'finished' || game.gameState === 'finished';
    
                if (isFinished) {
                    handlePostGameAction(ws, type, payload, { gameRegistry, clients });
                } else {
                    if (type === 'game:leave') {
                        handleLeaveGame(ws, payload, { gameRegistry, clients });
                    } else if (gameModule.handler) {
                        gameModule.handler(ws, type, payload, { clients });
                    }
                }
            } else {
                if (type.endsWith(':find_match') || type.endsWith(':leave')) {
                    const result = handleLobbyEvent(ws, type, payload, { clients });
                    if (result && result.player1 && result.player2) {
                        const gameType = result.gameType;
                        if (gameRegistry[gameType] && gameRegistry[gameType].create) {
                            gameRegistry[gameType].create(result.player1, result.player2);
                        }
                    }
                } else if (type === 'game:leave') {
                    handleLeaveGame(ws, payload, { gameRegistry, clients });
                }
            }
        } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
        }
    });

    ws.on('close', () => {
        const username = ws.username || 'Unknown';
        const roomId = ws.roomId;
        clients.delete(username);
        console.log(`[DISCONNECT] Client ${username} disconnected. Total clients: ${clients.size}`);
        
        readDatabase().then(database => {
            if (database[username] && database[username].friends) {
                database[username].friends.filter(f => f.status === 'friends').forEach(friend => {
                    const friendClient = clients.get(friend.username);
                    if (friendClient && friendClient.readyState === 1) {
                        friendClient.send(JSON.stringify({ type: 'friend:offline', payload: { username } }));
                    }
                });
            }
        });

        handleDisconnect(username, roomId, { gameRegistry, clients });
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server (HTTP & WebSocket) is running on port ${PORT}`);
});