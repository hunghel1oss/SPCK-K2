// server.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

// Import logic handlers
const { handleBattleship } = require('./game-logic/battleship');
const { handleCaro } = require('./game-logic/caro');
const { handleChatMessage } = require('./game-logic/chatHandler');
const { handleDisconnect } = require('./game-logic/disconnectHandler');
const { handleFriendAction } = require('./game-logic/friendActions');
const { handleGameSession } = require('./game-logic/gameSessionHandler');
const { handleMatchmaking } = require('./game-logic/matchmakingHandler');
const { handlePostGameAction } = require('./game-logic/postGameActionHandler');
const apiRoutes = require('./modules/apiRoutes');
const { saveGameHistory } = require('./game-logic/historySaver');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// GHI CHÚ: SỬA LỖI Ở ĐÂY
// Vấn đề cũ: app.use(staticPath, express.static(staticPath)) -> Gây lỗi "Missing parameter name"
// Cách sửa: Cung cấp một tiền tố URL ('/uploads') để phục vụ các file tĩnh trong thư mục uploads.
const uploadPath = path.join(__dirname, 'public/uploads');
app.use('/uploads', express.static(uploadPath));

// Game state registries
const gameRegistry = new Map();
const clientData = new Map();

// WebSocket connection handling
wss.on('connection', async (ws, request, user) => {
    try {
        const { username, roomID } = await apiRoutes(ws, request, clientData, gameRegistry, wss);

        ws.on('message', async (message) => {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'chatMessage':
                    handleChatMessage(data, ws, clientData, roomID, wss, username);
                    break;
                case 'friendAction':
                    handleFriendAction(data, ws, username);
                    break;
                case 'gameSession':
                    handleGameSession(data, ws, clientData, roomID, wss, username, gameRegistry);
                    break;
                case 'matchmaking':
                    handleMatchmaking(data, ws, username, wss);
                    break;
                case 'postGameAction':
                    handlePostGameAction(data, ws, clientData, roomID, gameRegistry, wss, username, saveGameHistory);
                    break;
                case 'caro':
                    handleCaro(data, ws, clientData, roomID, wss, gameRegistry);
                    break;
                case 'battleship':
                    handleBattleship(data, ws, clientData, roomID, wss, gameRegistry);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        });

        ws.on('close', async () => {
            handleDisconnect(username, roomID, { gameRegistry, clientData, wss });
        });

    } catch (error) {
        console.error('Error during WebSocket connection setup:', error);
        ws.close();
    }
});

// GHI CHÚ: THÊM CODE PHỤC VỤ FRONTEND KHI DEPLOY
// Đoạn code này rất quan trọng để Render.com có thể hiển thị trang web React/Vite của bạn.
// Nó sẽ phục vụ các file trong thư mục build của frontend
// và trả về index.html cho mọi request không phải API, để React Router hoạt động.
if (process.env.NODE_ENV === "production") {
    // Đường dẫn chính xác đến thư mục build của frontend
    const frontendBuildPath = path.join(__dirname, '../SP-CK/dist');

    // Phục vụ các file tĩnh của frontend (như css, js, images)
    app.use(express.static(frontendBuildPath));

    // Trả về file index.html cho tất cả các đường dẫn khác
    app.get("*", (req, res) => {
        res.sendFile(path.join(frontendBuildPath, "index.html"));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('Successfully connected to MongoDB.'))
        .catch(err => console.error('MongoDB connection error:', err));
    console.log(`🚀 Server (HTTP & WebSocket) is running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});