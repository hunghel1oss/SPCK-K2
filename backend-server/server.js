const express = require('express');
const cors = require('cors');
const http = require('http');
const url = require('url');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');

const { handleCaroEvents, handleCaroDisconnect, caroGames } = require('./game-logic/caro.js');
const { handleBattleshipEvents, handleBattleshipDisconnect, battleshipGames } = require('./game-logic/battleship.js');

const DB_FILE = path.join(__dirname, 'database.json');

async function readDatabase() {
    try {
        await fs.access(DB_FILE);
        const data = await fs.readFile(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Database file not found or empty, creating a new one.');
        return {};
    }
}

async function writeDatabase(data) {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing to database:', error);
    }
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
        fs.mkdir(uploadPath, { recursive: true }).then(() => {
             cb(null, uploadPath);
        });
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const clients = new Map();

app.post('/api/upload/puzzle-image', upload.single('puzzleImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'Please upload a file.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl: imageUrl });
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }
    const database = await readDatabase();
    if (database[username]) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    const apiKey = uuidv4();
    database[username] = {
        credentials: { password, apiKey },
        profile: { createdAt: new Date().toISOString() },
        history: [],
        friends: []
    };
    await writeDatabase(database);
    console.log('Người dùng đã đăng ký:', username);
    res.status(201).json({ username, apiKey });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const database = await readDatabase();
    const userAccount = database[username];
    if (!userAccount || userAccount.credentials.password !== password) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    console.log('Người dùng đã đăng nhập:', username);
    res.status(200).json({ username, apiKey: userAccount.credentials.apiKey });
});

async function authenticateUser(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ message: 'API Key is required' });
    }
    const database = await readDatabase();
    const username = Object.keys(database).find(u => database[u].credentials.apiKey === apiKey);
    if (!username) {
        return res.status(403).json({ message: 'Invalid API Key' });
    }
    req.user = { username, ...database[username] };
    next();
}

app.get('/api/history', authenticateUser, (req, res) => {
    res.status(200).json(req.user.history || []);
});

app.post('/api/history', authenticateUser, async (req, res) => {
    const gameData = req.body;
    const username = req.user.username;
    if (!gameData || !gameData.gameName) {
        return res.status(400).json({ message: 'Game data is required.' });
    }
    const database = await readDatabase();
    const newRecord = { id: uuidv4(), date: new Date().toISOString(), ...gameData };
    database[username].history.unshift(newRecord);
    if (database[username].history.length > 20) {
        database[username].history.pop();
    }
    await writeDatabase(database);
    res.status(201).json(database[username].history);
});

app.delete('/api/history', authenticateUser, async (req, res) => {
    const username = req.user.username;
    const database = await readDatabase();

    if (database[username]) {
        database[username].history = [];
        await writeDatabase(database);
        res.status(200).json({ message: 'Lịch sử đã được xóa thành công.' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
});

app.get('/api/users/search', authenticateUser, async (req, res) => {
    const { q } = req.query;
    const currentUser = req.user.username;

    if (!q || typeof q !== 'string' || q.trim() === '') {
        return res.status(400).json({ message: 'Cần có từ khóa tìm kiếm hợp lệ.' });
    }

    try {
        const database = await readDatabase();
        const allUsernames = Object.keys(database);

        const results = allUsernames
            .filter(username => 
                username.toLowerCase().includes(q.toLowerCase().trim()) && username !== currentUser
            )
            .map(username => ({ username }));

        res.status(200).json(results);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm người dùng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi tìm kiếm.' });
    }
});

app.get('/api/friends', authenticateUser, (req, res) => {
    res.status(200).json(req.user.friends || []);
});

app.post('/api/friends/request', authenticateUser, async(req, res)=>{
    const senderUsername = req.user.username;
    const { targetUsername } = req.body;
    if(!targetUsername) return res.status(400).json({ message: 'Tên người nhận là bắt buộc.' });
    if(senderUsername === targetUsername) return res.status(400).json({ message: 'Bạn không thể tự kết bạn với chính mình.'});
    const database = await readDatabase();
    if(!database[targetUsername]) return res.status(404).json({ message: 'Người dùng không tồn tại.'});
    const sender = database[senderUsername];
    const target = database[targetUsername];
    if(!sender.friends) sender.friends = [];
    if(!target.friends) target.friends = [];
    const existingRelation = sender.friends.find(f => f.username === targetUsername);
    if(existingRelation){
        if(existingRelation.status === 'friends') return res.status(400).json({ message: 'Đã là bạn bè.'});
        return res.status(400).json({ message: 'Đã gửi lời mời kết bạn trước đó.'});
    }
    const timestamp = new Date().toISOString();
    sender.friends.unshift({ username: targetUsername, status: 'pending_sent', since: timestamp });
    target.friends.unshift({ username: senderUsername, status: 'pending_received', since: timestamp });
    await writeDatabase(database);
    const targetClient = clients.get(targetUsername);
    if( targetClient && targetClient.readyState === 1){
        targetClient.send(JSON.stringify({ type: 'friend:request_received', payload: { from: senderUsername, since: timestamp } }));
    }
    res.status(200).json({ message:'Đã gửi lời mời kết bạn.'});
});

app.post('/api/friends/respond', authenticateUser, async(req, res)=>{
    const responderUsername = req.user.username;
    const { requesterUsername, action } = req.body;
    if (!requesterUsername || !action) return res.status(400).json({ message: 'Tên người gửi và hành động là bắt buộc.' });
    if (!['accept', 'decline'].includes(action)) return res.status(400).json({ message: 'Hành động không hợp lệ.' });
    const database = await readDatabase();
    const responder = database[responderUsername];
    const requester = database[requesterUsername];
    if (!requester) return res.status(404).json({ message: 'Người gửi yêu cầu không tồn tại.' });
    const requestInResponder = responder.friends.find(f => f.username === requesterUsername && f.status === 'pending_received');
    const requestInRequester = requester.friends.find(f => f.username === responderUsername && f.status === 'pending_sent');
    if (!requestInResponder || !requestInRequester) return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn.' });

    if (action === 'accept') {
        const timestamp = new Date().toISOString();
        requestInResponder.status = 'friends';
        requestInResponder.since = timestamp;
        requestInRequester.status = 'friends';
        requestInRequester.since = timestamp;
        await writeDatabase(database);
        const requesterClient = clients.get(requesterUsername);
        if (requesterClient && requesterClient.readyState === 1) {
            requesterClient.send(JSON.stringify({ type: 'friend:request_accepted', payload: { by: responderUsername, since: timestamp } }));
        }
        res.status(200).json({ message: `Bạn và ${requesterUsername} đã trở thành bạn bè.` });
    } else {
        responder.friends = responder.friends.filter(f => f.username !== requesterUsername);
        requester.friends = requester.friends.filter(f => f.username !== responderUsername);
        await writeDatabase(database);
        const requesterClient = clients.get(requesterUsername);
        if (requesterClient && requesterClient.readyState === 1) {
            requesterClient.send(JSON.stringify({ type: 'friend:request_declined', payload: { by: responderUsername } }));
        }
        res.status(200).json({ message: `Bạn đã từ chối lời mời kết bạn từ ${requesterUsername}.` });
    }
});

server.on('upgrade', async (request, socket, head) => {
    const { query } = url.parse(request.url, true);
    const apiKey = query.apiKey;
    const database = await readDatabase();
    const user = Object.keys(database).find(username => database[username].credentials.apiKey === apiKey);
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
    console.log(`[CONNECTION] Client ${user} connected. Total clients: ${clients.size}`);

    const databasePromise = readDatabase();
    databasePromise.then(database => {
        const userAccount = database[user];
        if (userAccount && userAccount.friends) {
            const friends = userAccount.friends.filter(f => f.status === 'friends');
            friends.forEach(friend => {
                const friendClient = clients.get(friend.username);
                if (friendClient && friendClient.readyState === 1) {
                    friendClient.send(JSON.stringify({ type: 'friend:online', payload: { username: user } }));
                }
            });
            const onlineFriends = friends.filter(f => clients.has(f.username)).map(f => f.username);
            ws.send(JSON.stringify({ type: 'friend:list_online', payload: onlineFriends }));
        }
    });

    ws.on('message', (message) => {
        try {
            const { type, payload } = JSON.parse(message);
            if (type.startsWith('caro:')) handleCaroEvents(ws, type, payload, { clients });
            else if (type.startsWith('battleship:')) handleBattleshipEvents(ws, type, payload, { clients });
            else if (type === 'game:chat') handleGameChat(ws, payload, { clients });
        } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
        }
    });

    ws.on('close', () => {
        const username = ws.username || 'Unknown';
        console.log(`[DISCONNECT] Client ${username} disconnected.`);
        const dbPromise = readDatabase();
        dbPromise.then(database => {
            if(database[username] && database[username].friends) {
                database[username].friends.filter(f => f.status === 'friends').forEach(friend => {
                    const friendClient = clients.get(friend.username);
                    if(friendClient && friendClient.readyState === 1) {
                        friendClient.send(JSON.stringify({ type: 'friend:offline', payload: { username } }));
                    }
                });
            }
        });
        handleCaroDisconnect(ws, { clients });
        handleBattleshipDisconnect(ws, { clients });
        clients.delete(username);
    });
});

function handleGameChat(ws, payload, { clients }){
    const senderUsername = ws.username;
    const roomId = ws.roomId; 
    if(!senderUsername || !roomId || !payload || !payload.message) return;
    let playersInRoom =[];
    if(roomId.startsWith('caro_')) {
        const game = caroGames[roomId];
        if(game) playersInRoom = game.players.map(p => p.username);
    } else if (roomId.startsWith('battleship_')) {
        const game = battleshipGames[roomId];
        if(game) playersInRoom = game.players.map(p => p.username);
    }
    if(playersInRoom.length === 0) {
        for(const [username, clientWs] of clients.entries()) {
            if(clientWs.roomId === roomId) playersInRoom.push(username);
        }
    }
    const chatMessage = {
        type: 'game:chat_update',
        payload:{ sender: senderUsername, message: payload.message, timestamp: new Date().toISOString() }
    };
    playersInRoom.forEach(username => {
        const clientWs = clients.get(username);
        if(clientWs && clientWs.readyState === 1) clientWs.send(JSON.stringify(chatMessage));
    });
}

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server (HTTP & WebSocket) is running on port ${PORT}`);
});