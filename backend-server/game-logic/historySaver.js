const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'database.json');

async function readDatabase() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        console.error("Error reading database for history saver:", error);
        return {};
    }
}

async function writeDatabase(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function saveSingleRecord(username, gameData) {
    if (!username || !gameData) return false;
    try {
        const database = await readDatabase();
        if (!database[username]) return false;

        if (!database[username].history) database[username].history = [];
        const newRecord = { id: uuidv4(), date: new Date().toISOString(), ...gameData };
        database[username].history.unshift(newRecord);
        if (database[username].history.length > 20) database[username].history.pop();
        await writeDatabase(database);
        return true;
    } catch (error) {
        console.error(`[HISTORY_SAVER] Failed to save game for ${username}`, error);
        return false;
    }
}

function createHistorySavingHandler(originalHandler) {
    return async (leaver, roomIdOrPayload, context) => {
        const { gameRegistry, clients } = context;

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
                        
                        await saveSingleRecord(opponent.username, {
                            gameName: gameInfo.gameName,
                            difficulty: `Online vs ${leaverUsername}`,
                            result: 'Thắng',
                            imageSrc: gameInfo.imageSrc
                        });
                        
                        await saveSingleRecord(leaverUsername, {
                            gameName: gameInfo.gameName,
                            difficulty: `Online vs ${opponent.username}`,
                            result: 'Thua',
                            imageSrc: gameInfo.imageSrc
                        });
                        
                        const opponentWs = clients.get(opponent.username);
                        if (opponentWs && opponentWs.readyState === 1) {
                            opponentWs.send(JSON.stringify({ type: 'history:updated' }));
                        }
                        const leaverWs = clients.get(leaverUsername);
                        if (leaverWs && leaverWs.readyState === 1) {
                            leaverWs.send(JSON.stringify({ type: 'history:updated' }));
                        }
                    }
                }
            }
        }
        originalHandler(leaver, roomIdOrPayload, context);
    };
}

async function saveNormalGameEndHistory(game, gameInfo, winnerUsername, loserUsername) {
    if (!game || !gameInfo || !winnerUsername || !loserUsername) return;
    
    await saveSingleRecord(winnerUsername, {
        gameName: gameInfo.gameName,
        difficulty: `Online vs ${loserUsername}`,
        result: 'Thắng',
        imageSrc: gameInfo.imageSrc
    });

    await saveSingleRecord(loserUsername, {
        gameName: gameInfo.gameName,
        difficulty: `Online vs ${winnerUsername}`,
        result: 'Thua',
        imageSrc: gameInfo.imageSrc
    });
}

module.exports = { createHistorySavingHandler, saveNormalGameEndHistory };