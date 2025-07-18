const { v4: uuidv4 } = require('uuid');

async function saveSingleRecord(username, gameData, { User }) {
    if (!username || !gameData) return false;
    try {
        const newRecord = { id: uuidv4(), date: new Date().toISOString(), ...gameData };
        await User.updateOne(
            { username },
            {
                $push: {
                    history: {
                        $each: [newRecord],
                        $slice: -20
                    }
                }
            }
        );
        return true;
    } catch (error) {
        console.error(`[HISTORY_SAVER] Failed to save game for ${username}`, error);
        return false;
    }
}

function createHistorySavingHandler(originalHandler) {
    return async (leaver, roomIdOrPayload, context) => {
        const { gameRegistry, clients, User } = context; // Thêm User

        const isDisconnect = typeof leaver === 'string';
        const leaverUsername = isDisconnect ? leaver : leaver.username;
        const roomId = isDisconnect ? roomIdOrPayload : (roomIdOrPayload ? roomIdOrPayload.roomId : leaver.roomId);
        
        if (roomId && gameRegistry) {
            const gameType = roomId.split('_')[0];
            const gameModule = gameRegistry[gameType];

            if (gameModule && gameModule.games[roomId]) {
                const game = gameModule.games[roomId];
                const isGameInProgress = game.status !== 'finished' && game.gameState !== 'finished';

                if (isGameInProgress) {
                    const opponent = game.players.find(p => p.username !== leaverUsername);
                    if (opponent) {
                        const gameInfo = gameRegistry[gameType];
                        const contextWithUser = { User };

                        await saveSingleRecord(opponent.username, {
                            gameName: gameInfo.gameName,
                            difficulty: `Online vs ${leaverUsername}`,
                            result: 'Thắng',
                            imageSrc: gameInfo.imageSrc
                        }, contextWithUser);
                        
                        await saveSingleRecord(leaverUsername, {
                            gameName: gameInfo.gameName,
                            difficulty: `Online vs ${opponent.username}`,
                            result: 'Thua',
                            imageSrc: gameInfo.imageSrc
                        }, contextWithUser);
                        
                        [leaverUsername, opponent.username].forEach(u => {
                            const ws = clients.get(u);
                            if(ws) ws.send(JSON.stringify({ type: 'history:updated' }));
                        });
                    }
                }
            }
        }
        originalHandler(leaver, roomIdOrPayload, context);
    };
}

async function saveNormalGameEndHistory(game, gameInfo, winnerUsername, loserUsername, { User }) {
    if (!game || !gameInfo || !winnerUsername || !loserUsername) return;
    const contextWithUser = { User };

    await saveSingleRecord(winnerUsername, {
        gameName: gameInfo.gameName,
        difficulty: `Online vs ${loserUsername}`,
        result: 'Thắng',
        imageSrc: gameInfo.imageSrc
    }, contextWithUser);

    await saveSingleRecord(loserUsername, {
        gameName: gameInfo.gameName,
        difficulty: `Online vs ${winnerUsername}`,
        result: 'Thua',
        imageSrc: gameInfo.imageSrc
    }, contextWithUser);
}

module.exports = { createHistorySavingHandler, saveNormalGameEndHistory };