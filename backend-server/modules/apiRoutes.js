const express = require('express');
const { handleSinglePlayerWin } = require('./rewardHandler');

function createApiRoutes(clients, User) { 
    const router = express.Router();

    router.post('/single-player/win', async (req, res) => {
        const { username } = req.user;
        const { gameName, difficulty } = req.body;
    
        if (!gameName || !difficulty) {
            return res.status(400).json({ message: 'Tên game và độ khó là bắt buộc.' });
        }
    
        try {
            
            await handleSinglePlayerWin(username, difficulty, { clients, User }); 
            res.status(200).json({ message: 'Phần thưởng đã được cập nhật.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi cập nhật phần thưởng.' });
        }
    });

    return router;
}

module.exports = { createApiRoutes };